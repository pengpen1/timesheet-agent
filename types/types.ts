// 核心数据类型定义

export interface Task {
  id: string
  name: string
  totalHours: number
  priority: 'high' | 'medium' | 'low'
  description?: string
}

export interface WorkDay {
  date: string
  isWorkday: boolean
  isHoliday: boolean
  plannedHours: number
}

export interface TimesheetEntry {
  id: string
  date: string
  workContent: string
  hoursSpent: number
  remainingHours: number
  taskId?: string
  isEditable: boolean
}

export interface ProjectConfig {
  tasks: Task[]
  workContent?: string
  dateRange: {
    startDate: string
    endDate: string
  }
  workingHours: {
    dailyHours: number
    excludeWeekends: boolean
    excludeHolidays: boolean
  }
  distributionMode: 'daily' | 'feature' | 'priority'
  autoSave: boolean
}

export interface TimesheetResult {
  entries: TimesheetEntry[]
  summary: {
    totalHours: number
    totalDays: number
    averageHoursPerDay: number
  }
  generatedAt: string
}

export interface StorageData {
  configs: ProjectConfig[]
  results: TimesheetResult[]
  lastUsedConfig?: ProjectConfig
}

// Agent 相关类型
export interface TaskAgentInput {
  tasks: Task[]
  workDays: WorkDay[]
  distributionMode: ProjectConfig['distributionMode']
}

export interface TaskAgentOutput {
  dailyAssignments: {
    date: string
    tasks: Array<{
      taskId: string
      taskName: string
      allocatedHours: number
      workDescription: string
    }>
    totalHours: number
  }[]
}

export interface TimesheetAgentInput {
  taskAssignments: TaskAgentOutput['dailyAssignments']
  workContent?: string
}

export interface TimesheetAgentOutput {
  timesheet: TimesheetEntry[]
}

// 模型配置类型
export interface ModelProvider {
  id: string
  name: string
  displayName: string
  baseURL: string
  requiresAuth: boolean
  models: string[]
}

export interface ModelConfig {
  provider: string
  baseURL: string
  apiKey: string
  model: string
  temperature?: number
  maxTokens?: number
  top_p?: number
  presence_penalty?: number
  frequency_penalty?: number
  rules?: string
}

export interface ModelConfigStore {
  configs: Record<string, ModelConfig>
  activeProvider: string
  lastTestResult?: {
    provider: string
    success: boolean
    message: string
    timestamp: string
  }
}