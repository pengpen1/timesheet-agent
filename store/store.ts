// {{CHENGQI:
// Action: Added; Timestamp: 2025-06-16 11:20:34 +08:00; Reason: P4-FEATURE-002 实现状态管理和本地存储; Principle_Applied: SOLID-S(单一职责原则);
// }}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ProjectConfig, TimesheetResult, TimesheetEntry, Task } from '../types/types'
import { getCurrentMonthRange } from '../lib/utils'

interface TimesheetStore {
  // 项目配置状态
  currentConfig: ProjectConfig
  savedConfigs: ProjectConfig[]
  
  // 工时表结果状态  
  currentResult: TimesheetResult | null
  savedResults: TimesheetResult[]
  
  // UI状态
  isGenerating: boolean
  isLoading: boolean
  errors: string[]
  warnings: string[]
  
  // Actions
  updateConfig: (config: Partial<ProjectConfig>) => void
  saveConfig: (name?: string) => void
  loadConfig: (config: ProjectConfig) => void
  deleteConfig: (index: number) => void
  
  setCurrentResult: (result: TimesheetResult) => void
  saveResult: (name?: string) => void
  deleteResult: (index: number) => void
  updateTimesheetEntry: (entryId: string, updates: Partial<TimesheetEntry>) => void
  
  setIsGenerating: (generating: boolean) => void
  setIsLoading: (loading: boolean) => void
  addError: (error: string) => void
  addWarning: (warning: string) => void
  clearMessages: () => void
  
  // 任务管理
  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  
  // 导出功能
  exportAsText: () => string | null
  exportAsCSV: () => string | null
  
  // 重置功能
  resetConfig: () => void
  resetAll: () => void
}

const defaultConfig: ProjectConfig = {
  tasks: [],
  workContent: '',
  dateRange: getCurrentMonthRange(),
  workingHours: {
    dailyHours: 8,
    excludeHolidays: true,
    scheduleType: 'double'
  },
  distributionMode: 'daily',
  autoSave: true
}

export const useTimesheetStore = create<TimesheetStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentConfig: defaultConfig,
      savedConfigs: [],
      currentResult: null,
      savedResults: [],
      isGenerating: false,
      isLoading: false,
      errors: [],
      warnings: [],

      // 配置管理
      updateConfig: (updates) => {
        set((state) => ({
          currentConfig: { ...state.currentConfig, ...updates }
        }))
      },

      saveConfig: (name) => {
        const { currentConfig, savedConfigs } = get()
        const configToSave = {
          ...currentConfig,
          id: Date.now().toString(),
          name: name || `配置_${new Date().toLocaleDateString()}`
        }
        
        set({
          savedConfigs: [...savedConfigs, configToSave]
        })
      },

      loadConfig: (config) => {
        set({ currentConfig: config })
      },

      deleteConfig: (index) => {
        set((state) => ({
          savedConfigs: state.savedConfigs.filter((_, i) => i !== index)
        }))
      },

      // 结果管理
      setCurrentResult: (result) => {
        set({ currentResult: result })
        
        // 自动保存
        const { currentConfig } = get()
        if (currentConfig.autoSave) {
          get().saveResult()
        }
      },

      saveResult: (name?: string) => {
        const { currentResult, savedResults, currentConfig } = get()
        if (currentResult) {
          const archivedResult: TimesheetResult = {
            ...currentResult,
            id: Date.now().toString(),
            name: name || `工时表_${new Date().toLocaleDateString()}`,
            projectConfig: { ...currentConfig },
            archivedAt: new Date().toISOString()
          }
          set({
            savedResults: [...savedResults, archivedResult]
          })
        }
      },

      deleteResult: (index) => {
        set((state) => ({
          savedResults: state.savedResults.filter((_, i) => i !== index)
        }))
      },

      updateTimesheetEntry: (entryId, updates) => {
        set((state) => {
          if (!state.currentResult) return state
          
          const updatedEntries = state.currentResult.entries.map(entry =>
            entry.id === entryId ? { ...entry, ...updates } : entry
          )
          
          // 重新计算统计信息
          const totalHours = updatedEntries.reduce((sum, entry) => sum + entry.hoursSpent, 0)
          const totalDays = updatedEntries.length
          const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0
          
          return {
            currentResult: {
              ...state.currentResult,
              entries: updatedEntries,
              summary: {
                totalHours,
                totalDays,
                averageHoursPerDay
              }
            }
          }
        })
      },

      // UI状态管理
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      addError: (error) => {
        set((state) => ({
          errors: [...state.errors, error]
        }))
      },
      
      addWarning: (warning) => {
        set((state) => ({
          warnings: [...state.warnings, warning]
        }))
      },
      
      clearMessages: () => set({ errors: [], warnings: [] }),

      // 任务管理
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: Date.now().toString()
        }
        
        set((state) => ({
          currentConfig: {
            ...state.currentConfig,
            tasks: [...state.currentConfig.tasks, newTask]
          }
        }))
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          currentConfig: {
            ...state.currentConfig,
            tasks: state.currentConfig.tasks.map(task =>
              task.id === taskId ? { ...task, ...updates } : task
            )
          }
        }))
      },

      deleteTask: (taskId) => {
        set((state) => ({
          currentConfig: {
            ...state.currentConfig,
            tasks: state.currentConfig.tasks.filter(task => task.id !== taskId)
          }
        }))
      },

      // 导出功能
      exportAsText: () => {
        const { currentResult } = get()
        if (!currentResult) return null
        
        return formatTimesheetAsText(currentResult.entries)
      },

      exportAsCSV: () => {
        const { currentResult } = get()
        if (!currentResult) return null
        
        return formatTimesheetAsCSV(currentResult.entries)
      },

      // 重置功能
      resetConfig: () => {
        set({ currentConfig: defaultConfig })
      },

      resetAll: () => {
        set({
          currentConfig: defaultConfig,
          currentResult: null,
          errors: [],
          warnings: [],
          isGenerating: false,
          isLoading: false
        })
      }
    }),
    {
      name: 'timesheet-storage',
      partialize: (state) => ({
        savedConfigs: state.savedConfigs,
        savedResults: state.savedResults,
        currentConfig: state.currentConfig
      })
    }
  )
)

// 导出辅助函数
function formatTimesheetAsText(entries: TimesheetEntry[]): string {
  const headers = ['日期', '工作内容', '消耗工时', '剩余工时']
  const separator = '-'.repeat(80)
  
  let result = `工时表报告\n${separator}\n`
  result += headers.join('\t\t') + '\n'
  result += separator + '\n'
  
  entries.forEach(entry => {
    const row = [
      entry.date,
      entry.workContent,
      `${entry.hoursSpent}h`,
      `${entry.remainingHours}h`
    ]
    result += row.join('\t\t') + '\n'
  })
  
  result += separator + '\n'
  
  const totalHours = entries.reduce((sum, entry) => sum + entry.hoursSpent, 0)
  const totalDays = entries.length
  const avgHours = totalDays > 0 ? totalHours / totalDays : 0
  
  result += `统计信息：\n`
  result += `总工时: ${totalHours}小时\n`
  result += `工作天数: ${totalDays}天\n`
  result += `平均每日工时: ${Math.round(avgHours * 100) / 100}小时\n`
  
  return result
}

function formatTimesheetAsCSV(entries: TimesheetEntry[]): string {
  const headers = ['日期', '工作内容', '消耗工时', '剩余工时']
  let csv = headers.join(',') + '\n'
  
  entries.forEach(entry => {
    const row = [
      entry.date,
      `"${entry.workContent.replace(/"/g, '""')}"`,
      entry.hoursSpent,
      entry.remainingHours
    ]
    csv += row.join(',') + '\n'
  })
  
  return csv
} 