// {{CHENGQI:
// Action: Added; Timestamp: 2025-06-16 11:28:32 +08:00; Reason: P4-FEATURE-001 导出功能实现; Principle_Applied: SOLID-S(单一职责原则);
// }}

import * as XLSX from 'xlsx'
import { TimesheetEntry } from './types'
import { format } from 'date-fns'

/**
 * 导出功能模块
 */
export class ExportService {
  /**
   * 导出为Excel文件
   */
  static exportToExcel(entries: TimesheetEntry[], filename?: string): void {
    try {
      // 准备数据
      const data = entries.map(entry => ({
        '日期': format(new Date(entry.date), 'yyyy-MM-dd'),
        '工作内容': entry.workContent,
        '消耗工时': entry.hoursSpent,
        '剩余工时': entry.remainingHours
      }))

      // 添加统计信息
      const totalHours = entries.reduce((sum, entry) => sum + entry.hoursSpent, 0)
      const totalDays = entries.length
      const avgHours = totalDays > 0 ? totalHours / totalDays : 0

      data.push({} as any) // 空行
      data.push({
        '日期': '统计信息',
        '工作内容': '',
        '消耗工时': '',
        '剩余工时': ''
      } as any)
      data.push({
        '日期': '总工时',
        '工作内容': `${totalHours}小时`,
        '消耗工时': '',
        '剩余工时': ''
      } as any)
      data.push({
        '日期': '工作天数',
        '工作内容': `${totalDays}天`,
        '消耗工时': '',
        '剩余工时': ''
      } as any)
      data.push({
        '日期': '平均每日工时',
        '工作内容': `${Math.round(avgHours * 100) / 100}小时`,
        '消耗工时': '',
        '剩余工时': ''
      } as any)

      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      
      // 设置列宽
      const colWidths = [
        { wch: 12 }, // 日期
        { wch: 40 }, // 工作内容  
        { wch: 12 }, // 消耗工时
        { wch: 12 }  // 剩余工时
      ]
      ws['!cols'] = colWidths

      // 添加样式（如果支持）
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      
      // 设置标题行样式
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E3F2FD' } }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, '工时表')
      
      // 生成文件名
      const finalFilename = filename || `工时表_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
      
      // 下载文件
      XLSX.writeFile(wb, finalFilename)
    } catch (error) {
      console.error('Excel导出失败:', error)
      throw new Error('导出Excel文件失败')
    }
  }

  /**
   * 导出为CSV文件
   */
  static exportToCSV(entries: TimesheetEntry[], filename?: string): void {
    try {
      const headers = ['日期', '工作内容', '消耗工时', '剩余工时']
      let csv = headers.join(',') + '\n'
      
      entries.forEach(entry => {
        const row = [
          format(new Date(entry.date), 'yyyy-MM-dd'),
          `"${entry.workContent.replace(/"/g, '""')}"`, // 转义引号
          entry.hoursSpent,
          entry.remainingHours
        ]
        csv += row.join(',') + '\n'
      })
      
      // 添加统计信息
      const totalHours = entries.reduce((sum, entry) => sum + entry.hoursSpent, 0)
      const totalDays = entries.length
      const avgHours = totalDays > 0 ? totalHours / totalDays : 0
      
      csv += '\n'
      csv += `"统计信息","","",""\n`
      csv += `"总工时","${totalHours}小时","",""\n`
      csv += `"工作天数","${totalDays}天","",""\n`
      csv += `"平均每日工时","${Math.round(avgHours * 100) / 100}小时","",""\n`
      
      // 生成文件名
      const finalFilename = filename || `工时表_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
      
      // 下载文件
      this.downloadFile(csv, finalFilename, 'text/csv;charset=utf-8-bom')
    } catch (error) {
      console.error('CSV导出失败:', error)
      throw new Error('导出CSV文件失败')
    }
  }

  /**
   * 导出为文本文件
   */
  static exportToText(entries: TimesheetEntry[], filename?: string): void {
    try {
      const headers = ['日期', '工作内容', '消耗工时', '剩余工时']
      const separator = '-'.repeat(100)
      
      let result = `工时表报告\n${separator}\n`
      result += `生成时间: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`
      result += separator + '\n'
      
      // 表头
      result += headers.join('\t\t') + '\n'
      result += separator + '\n'
      
      // 数据行
      entries.forEach(entry => {
        const row = [
          format(new Date(entry.date), 'yyyy-MM-dd'),
          entry.workContent,
          `${entry.hoursSpent}h`,
          `${entry.remainingHours}h`
        ]
        result += row.join('\t\t') + '\n'
      })
      
      result += separator + '\n'
      
      // 统计信息
      const totalHours = entries.reduce((sum, entry) => sum + entry.hoursSpent, 0)
      const totalDays = entries.length
      const avgHours = totalDays > 0 ? totalHours / totalDays : 0
      
      result += `\n统计信息：\n`
      result += `总工时: ${totalHours}小时\n`
      result += `工作天数: ${totalDays}天\n`
      result += `平均每日工时: ${Math.round(avgHours * 100) / 100}小时\n`
      result += `\n${separator}\n`
      result += `TimesheetAgent - 智能工时填报器\n`
      
      // 生成文件名
      const finalFilename = filename || `工时表_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`
      
      // 下载文件
      this.downloadFile(result, finalFilename, 'text/plain')
    } catch (error) {
      console.error('文本导出失败:', error)
      throw new Error('导出文本文件失败')
    }
  }

  /**
   * 复制工时表到剪贴板
   */
  static async copyToClipboard(entries: TimesheetEntry[]): Promise<boolean> {
    try {
      const headers = ['日期', '工作内容', '消耗工时', '剩余工时']
      let content = headers.join('\t') + '\n'
      
      entries.forEach(entry => {
        const row = [
          format(new Date(entry.date), 'yyyy-MM-dd'),
          entry.workContent,
          `${entry.hoursSpent}h`,
          `${entry.remainingHours}h`
        ]
        content += row.join('\t') + '\n'
      })
      
      // 添加统计信息
      const totalHours = entries.reduce((sum, entry) => sum + entry.hoursSpent, 0)
      const totalDays = entries.length
      const avgHours = totalDays > 0 ? totalHours / totalDays : 0
      
      content += `\n统计信息:\n`
      content += `总工时: ${totalHours}小时\n`
      content += `工作天数: ${totalDays}天\n`
      content += `平均每日工时: ${Math.round(avgHours * 100) / 100}小时\n`
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content)
        return true
      } else {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = content
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
   * 下载文件辅助方法
   */
  private static downloadFile(content: string, filename: string, contentType: string = 'text/plain'): void {
    // 添加BOM for UTF-8 (特别是为了Excel正确显示中文)
    let bom = ''
    if (contentType.includes('csv') || contentType.includes('excel')) {
      bom = '\uFEFF'
    }
    
    const blob = new Blob([bom + content], { type: contentType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  /**
   * 验证导出数据
   */
  static validateExportData(entries: TimesheetEntry[]): { isValid: boolean; message?: string } {
    if (!entries || entries.length === 0) {
      return { isValid: false, message: '没有可导出的数据' }
    }
    
    // 检查必要字段
    for (const entry of entries) {
      if (!entry.date || !entry.workContent) {
        return { isValid: false, message: '数据不完整，请检查日期和工作内容' }
      }
      
      if (typeof entry.hoursSpent !== 'number' || entry.hoursSpent < 0) {
        return { isValid: false, message: '工时数据格式错误' }
      }
    }
    
    return { isValid: true }
  }

  /**
   * 生成导出预览
   */
  static generatePreview(entries: TimesheetEntry[], maxRows: number = 5): string {
    const previewEntries = entries.slice(0, maxRows)
    const headers = ['日期', '工作内容', '消耗工时', '剩余工时']
    
    let preview = headers.join(' | ') + '\n'
    preview += '-'.repeat(50) + '\n'
    
    previewEntries.forEach(entry => {
      const row = [
        format(new Date(entry.date), 'MM-dd'),
        entry.workContent.substring(0, 20) + (entry.workContent.length > 20 ? '...' : ''),
        `${entry.hoursSpent}h`,
        `${entry.remainingHours}h`
      ]
      preview += row.join(' | ') + '\n'
    })
    
    if (entries.length > maxRows) {
      preview += `... 还有 ${entries.length - maxRows} 行数据`
    }
    
    return preview
  }
} 