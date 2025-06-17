// 通用工具函数库

import { WorkDay } from '../types/types'
import { format, addDays, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
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
  excludeWeekends: boolean = true,
  excludeHolidays: boolean = true
): WorkDay[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const days = eachDayOfInterval({ start, end })
  
  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const isWeekendDay = isWeekend(date)
    const isHolidayDay = isChineseHoliday(date)
    
    let isWorkday = true
    if (excludeWeekends && isWeekendDay) {
      isWorkday = false
    }
    if (excludeHolidays && isHolidayDay) {
      isWorkday = false
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