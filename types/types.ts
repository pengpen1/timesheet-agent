// 核心数据类型定义

export interface Task {
  id: string
  name: string
  totalHours: number
  priority: 'high' | 'medium' | 'low'
  description?: string
  source?: TaskSource
  sourceData?: {
    gitCommits?: GitLogEntry[]
    attachmentId?: string
    rawContent?: string
    fileName?: string
    fileType?: string
  }
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

// 工作制度类型
export type WorkScheduleType = 'single' | 'double' | 'alternate'

export interface WorkingHours {
  dailyHours: number
  excludeHolidays: boolean
  scheduleType: WorkScheduleType
  // 单休配置
  singleRestDay?: 'saturday' | 'sunday'
  // 大小周配置
  isCurrentWeekBig?: boolean
}

export interface ProjectConfig {
  tasks: Task[]
  workContent?: string
  dateRange: {
    startDate: string
    endDate: string
  }
  workingHours: WorkingHours
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
  // 归档相关字段
  id?: string
  name?: string
  projectConfig?: ProjectConfig
  archivedAt?: string
}

export interface StorageData {
  configs: ProjectConfig[]
  results: TimesheetResult[]
  lastUsedConfig?: ProjectConfig
}

// 流式回调类型
export type StreamCallback = (stepId: string, content: string) => void

// Agent 相关类型
export interface TaskAgentInput {
  tasks: Task[]
  workDays: WorkDay[]
  distributionMode: ProjectConfig['distributionMode']
  onStreamContent?: StreamCallback
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
  onStreamContent?: StreamCallback
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

// Git配置类型
export interface GitConfig {
  id?: string
  name?: string
  repoUrl: string
  username: string
  branch?: string
  privateKey?: string
  accessToken?: string
  savedAt?: string
}

// Git日志条目
export interface GitLogEntry {
  hash: string
  date: string
  author: string
  message: string
  files: string[]
  additions: number
  deletions: number
}

// 附件类型
export interface Attachment {
  id: string
  name: string
  type: 'text' | 'image' | 'excel' | 'word' | 'pdf' | 'other'
  size: number
  content?: string // 文本内容或base64编码
  uploadedAt: string
}

// 任务来源类型
export type TaskSource = 'manual' | 'gitlog' | 'attachment'

// 处理步骤和进度类型
export interface ProcessingStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  startTime?: string
  endTime?: string
  details?: string
  streamContent?: string
}

export interface ProcessingState {
  currentStep: string
  steps: ProcessingStep[]
  overallProgress: number
  isProcessing: boolean
  showStreamDialog: boolean
}

// 生成完成确认弹框状态
export interface GenerationCompleteState {
  isVisible: boolean
  autoRedirectTimer?: number
  onConfirm: () => void
  onCancel: () => void
}