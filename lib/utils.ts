// 通用工具函数库

import { WorkDay, WorkScheduleType } from '../types/types'
import { format, addDays, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * 生成工作日列表
 */
export function generateWorkDays(
  startDate: string,
  endDate: string,
  dailyHours: number = 8,
  scheduleType: WorkScheduleType = 'double',
  excludeHolidays: boolean = true,
  singleRestDay?: 'saturday' | 'sunday',
  isCurrentWeekBig?: boolean
): WorkDay[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const days = eachDayOfInterval({ start, end })
  
  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const isHolidayDay = isChineseHoliday(date)
    
    let isWorkday = true
    
    // 法定节假日处理
    if (excludeHolidays && isHolidayDay) {
      isWorkday = false
    } else {
      // 工作制度处理
      isWorkday = isWorkingDay(date, scheduleType, singleRestDay, isCurrentWeekBig, start)
    }
    
    return {
      date: dateStr,
      isWorkday,
      isHoliday: isHolidayDay,
      plannedHours: isWorkday ? dailyHours : 0
    }
  })
}

/**
 * 判断是否为工作日
 */
function isWorkingDay(
  date: Date,
  scheduleType: WorkScheduleType,
  singleRestDay?: 'saturday' | 'sunday',
  isCurrentWeekBig?: boolean,
  startDate?: Date
): boolean {
  const dayOfWeek = date.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
  
  switch (scheduleType) {
    case 'double':
      // 双休：周六周日不工作
      return dayOfWeek !== 0 && dayOfWeek !== 6
      
    case 'single':
      // 单休：只有一天不工作
      if (singleRestDay === 'saturday') {
        return dayOfWeek !== 6
      } else if (singleRestDay === 'sunday') {
        return dayOfWeek !== 0
      }
      return true
      
    case 'alternate':
      // 大小周：需要计算当前是第几周
      if (isCurrentWeekBig === undefined || !startDate) {
        return dayOfWeek !== 0 && dayOfWeek !== 6 // 默认双休
      }
      
      // 计算从开始日期到当前日期的周数差异
      const startOfStartWeek = startOfWeek(startDate, { weekStartsOn: 1 })
      const startOfCurrentWeek = startOfWeek(date, { weekStartsOn: 1 })
      const weekDiff = Math.floor((startOfCurrentWeek.getTime() - startOfStartWeek.getTime()) / (7 * 24 * 60 * 60 * 1000))
      
      // 判断当前周是大周还是小周
      const isBigWeek = isCurrentWeekBig ? (weekDiff % 2 === 0) : (weekDiff % 2 === 1)
      
      if (isBigWeek) {
        // 大周：只休周日
        return dayOfWeek !== 0
      } else {
        // 小周：休周六周日
        return dayOfWeek !== 0 && dayOfWeek !== 6
      }
      
    default:
      return true
  }
}

/**
 * 检查是否为中国法定节假日
 */
function isChineseHoliday(date: Date): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  const fixedHolidays = [
    { month: 1, day: 1 },
    { month: 5, day: 1 },
    { month: 10, day: 1 },
    { month: 10, day: 2 },
    { month: 10, day: 3 },
  ]
  
  return fixedHolidays.some(holiday => 
    holiday.month === month && holiday.day === day
  )
}

/**
 * 获取当月日期范围
 */
export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date()
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd')
  }
}

/**
 * 获取当周日期范围
 */
export function getCurrentWeekRange(): { startDate: string; endDate: string } {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 }) // 周一开始
  const end = endOfWeek(now, { weekStartsOn: 1 })
  
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd')
  }
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, contentType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 