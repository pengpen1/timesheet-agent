import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FileText, Download, Copy, Table, Clock, Calendar, BarChart3, Sparkles } from "lucide-react";
import type { TimesheetResult, TimesheetEntry } from "@/lib/types";

interface TimesheetResultPanelProps {
  currentResult: TimesheetResult | null;
  editingEntryId: string | null;
  setEditingEntryId: (id: string | null) => void;
  handleEditEntry: (entry: TimesheetEntry, field: string, value: string | number) => void;
  handleExportExcel: () => void;
  handleExportCSV: () => void;
  handleExportText: () => void;
  handleCopyTimesheet: () => void;
  setActiveTab: (tab: "config" | "result" | "model") => void;
}

export const TimesheetResultPanel: React.FC<TimesheetResultPanelProps> = ({
  currentResult,
  editingEntryId,
  setEditingEntryId,
  handleEditEntry,
  handleExportExcel,
  handleExportCSV,
  handleExportText,
  handleCopyTimesheet,
  setActiveTab,
}) => {
  if (!currentResult) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无工时表数据</h3>
            <p className="text-muted-foreground mb-4">
              请先在"任务配置"页面设置任务并生成工时表
            </p>
            <Button onClick={() => setActiveTab("config")}>去配置任务</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总工时</p>
                <p className="text-2xl font-bold">{currentResult.summary.totalHours}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">工作天数</p>
                <p className="text-2xl font-bold">{currentResult.summary.totalDays}天</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">日均工时</p>
                <p className="text-2xl font-bold">{currentResult.summary.averageHoursPerDay.toFixed(1)}h</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 导出操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            导出选项
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />导出Excel
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />导出CSV
            </Button>
            <Button onClick={handleExportText} variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />导出文本
            </Button>
            <Button onClick={handleCopyTimesheet} variant="outline" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />复制到剪贴板
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* 工时表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />工时表详情
          </CardTitle>
          <CardDescription>点击单元格可以编辑内容</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">日期</th>
                  <th className="text-left p-3 font-medium">工作内容</th>
                  <th className="text-left p-3 font-medium">消耗工时</th>
                  <th className="text-left p-3 font-medium">剩余工时</th>
                </tr>
              </thead>
              <tbody>
                {currentResult.entries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{entry.date}</td>
                    <td className="p-3">
                      {editingEntryId === entry.id ? (
                        <Input
                          value={entry.workContent}
                          onChange={e => handleEditEntry(entry, "workContent", e.target.value)}
                          onBlur={() => setEditingEntryId(null)}
                          onKeyDown={e => {
                            if (e.key === "Enter") setEditingEntryId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => setEditingEntryId(entry.id)}
                          className="cursor-pointer hover:bg-accent rounded p-1 min-h-[24px]"
                        >
                          {entry.workContent}
                        </div>
                      )}
                    </td>
                    <td className="p-3">{entry.hoursSpent}h</td>
                    <td className="p-3">{entry.remainingHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 