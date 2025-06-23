// {{CHENGQI:
// Action: Added; Timestamp: 2025-06-16 11:20:34 +08:00; Reason: P2-AGENT-002 实现TimesheetAgent核心逻辑; Principle_Applied: SOLID-S(单一职责原则);
// }}

import { TimesheetAgentInput, TimesheetAgentOutput, TimesheetEntry } from '../../types/types'
import { format } from 'date-fns'
import { generateId } from '../utils'

/**
 * TimesheetAgent - 工时表生成智能代理  
 * 职责：将TaskAgent的分配结果转换为标准化的工时表格式
 */
export class TimesheetAgent {
  /**
   * 主要处理方法：生成工时表
   */
  static process(input: TimesheetAgentInput): TimesheetAgentOutput {
    const { taskAssignments, workContent, onStreamContent } = input
    
    // 验证输入
    this.validateInput(input)
    
    onStreamContent?.('generate', '📋 开始转换任务分配为工时表条目...\n')
    
    // 转换为工时表条目
    const timesheet = taskAssignments.map((assignment, index) => {
      onStreamContent?.('generate', `⚡ 处理第${index + 1}天的任务分配 (${assignment.date})...\n`)
      return this.convertAssignmentToTimesheet(assignment, workContent)
    }).flat()
    
    onStreamContent?.('generate', '🧮 计算剩余工时...\n')
    
    // 计算剩余工时
    this.calculateRemainingHours(timesheet)
    
    onStreamContent?.('generate', `✅ 工时表生成完成，共${timesheet.length}条记录\n`)
    
    return { timesheet }
  }

  /**
   * 输入验证
   */
  private static validateInput(input: TimesheetAgentInput): void {
    if (!input.taskAssignments || input.taskAssignments.length === 0) {
      throw new Error('任务分配结果不能为空')
    }
    
    // 检查每日分配的数据完整性
    for (const assignment of input.taskAssignments) {
      if (!assignment.date) {
        throw new Error('日期信息不能为空')
      }
      
      if (!assignment.tasks || assignment.tasks.length === 0) {
        console.warn(`日期 ${assignment.date} 没有分配任务`)
      }
    }
  }

  /**
   * 将单日任务分配转换为工时表条目
   */
  private static convertAssignmentToTimesheet(
    assignment: any, 
    customWorkContent?: string
  ): TimesheetEntry {
    const workContent = this.generateWorkContent(assignment, customWorkContent)
    const totalHours = assignment.totalHours || 0
    
    return {
      id: generateId(),
      date: assignment.date,
      workContent,
      hoursSpent: Math.round(totalHours * 100) / 100,
      remainingHours: 0, // 将在后续计算
      taskId: assignment.tasks?.[0]?.taskId, // 主要任务ID
      isEditable: true
    }
  }

  /**
   * 生成工作内容描述
   */
  private static generateWorkContent(
    assignment: any,
    customWorkContent?: string
  ): string {
    if (customWorkContent) {
      return customWorkContent
    }

    if (!assignment.tasks || assignment.tasks.length === 0) {
      return '其他工作内容'
    }

    // 单个任务的情况
    if (assignment.tasks.length === 1) {
      const task = assignment.tasks[0]
      return task.workDescription || `${task.taskName}相关工作`
    }

    // 多个任务的情况 - 组合描述
    const taskNames = assignment.tasks.map((t: any) => t.taskName).slice(0, 2) // 最多显示2个任务名
    const descriptions = assignment.tasks
      .map((t: any) => t.workDescription)
      .filter(Boolean)
      .slice(0, 2)

    if (descriptions.length > 0) {
      const mainDescription = descriptions.join('；')
      if (assignment.tasks.length > 2) {
        return `${mainDescription}等${assignment.tasks.length}项工作`
      }
      return mainDescription
    }

    // 后备方案
    const mainTasks = taskNames.join('、')
    if (assignment.tasks.length > 2) {
      return `${mainTasks}等${assignment.tasks.length}个功能模块开发`
    }
    return `${mainTasks}功能开发`
  }

  /**
   * 计算剩余工时
   * 这里可以实现更复杂的剩余工时计算逻辑
   */
  private static calculateRemainingHours(timesheet: TimesheetEntry[]): void {
    // 简单实现：假设每天8小时工作制，剩余工时 = 8 - 消耗工时
    const standardDailyHours = 8
    
    timesheet.forEach(entry => {
      entry.remainingHours = Math.max(0, standardDailyHours - entry.hoursSpent)
      entry.remainingHours = Math.round(entry.remainingHours * 100) / 100
    })
  }

  /**
   * 格式化工时表为可读文本
   */
  static formatAsText(timesheet: TimesheetEntry[]): string {
    const headers = ['日期', '工作内容', '消耗工时', '剩余工时']
    const separator = '-'.repeat(80)
    
    let result = `工时表报告\n${separator}\n`
    result += headers.join('\t\t') + '\n'
    result += separator + '\n'
    
    timesheet.forEach(entry => {
      const row = [
        format(new Date(entry.date), 'yyyy-MM-dd'),
        entry.workContent,
        `${entry.hoursSpent}h`,
        `${entry.remainingHours}h`
      ]
      result += row.join('\t\t') + '\n'
    })
    
    result += separator + '\n'
    
    // 添加统计信息
    const totalHours = timesheet.reduce((sum, entry) => sum + entry.hoursSpent, 0)
    const totalDays = timesheet.length
    const avgHours = totalDays > 0 ? totalHours / totalDays : 0
    
    result += `统计信息：\n`
    result += `总工时: ${totalHours}小时\n`
    result += `工作天数: ${totalDays}天\n`
    result += `平均每日工时: ${Math.round(avgHours * 100) / 100}小时\n`
    
    return result
  }

  /**
   * 格式化工时表为CSV格式（用于Excel导出）
   */
  static formatAsCSV(timesheet: TimesheetEntry[]): string {
    const headers = ['日期', '工作内容', '消耗工时', '剩余工时']
    let csv = headers.join(',') + '\n'
    
    timesheet.forEach(entry => {
      const row = [
        format(new Date(entry.date), 'yyyy-MM-dd'),
        `"${entry.workContent.replace(/"/g, '""')}"`, // 转义引号
        entry.hoursSpent,
        entry.remainingHours
      ]
      csv += row.join(',') + '\n'
    })
    
    return csv
  }

  /**
   * 验证工时表数据合理性
   */
  static validateTimesheet(timesheet: TimesheetEntry[]): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    
    timesheet.forEach((entry, index) => {
      // 检查必填字段
      if (!entry.date) {
        errors.push(`第${index + 1}行：日期不能为空`)
      }
      
      if (!entry.workContent) {
        errors.push(`第${index + 1}行：工作内容不能为空`)
      }
      
      // 检查工时合理性
      if (entry.hoursSpent < 0) {
        errors.push(`第${index + 1}行：消耗工时不能为负数`)
      }
      
      if (entry.hoursSpent > 24) {
        warnings.push(`第${index + 1}行：单日工时超过24小时，请检查`)
      }
      
      if (entry.hoursSpent > 12) {
        warnings.push(`第${index + 1}行：单日工时超过12小时，可能需要确认`)
      }
      
      if (entry.remainingHours < 0) {
        warnings.push(`第${index + 1}行：剩余工时为负数，可能表示超时工作`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
} 