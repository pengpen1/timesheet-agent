import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FileText, Download, Copy, Table, Clock, Calendar, BarChart3, Sparkles, Archive, ListTodo, User, CalendarDays } from "lucide-react";
import type { TimesheetResult, TimesheetEntry } from "@/types/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface TimesheetResultPanelProps {
  currentResult: TimesheetResult | null;
  editingEntryId: string | null;
  setEditingEntryId: (id: string | null) => void;
  handleEditEntry: (entry: TimesheetEntry, field: string, value: string | number) => void;
  handleExportExcel: () => void;
  handleExportCSV: () => void;
  handleExportText: () => void;
  handleCopyTimesheet: () => void;
  handleArchive?: (name: string) => void;
  setActiveTab: (tab: "config" | "result" | "model" | "history") => void;
  showNotification?: (type: "success" | "error", message: string) => void;
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
  handleArchive,
  setActiveTab,
  showNotification,
}) => {
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archiveName, setArchiveName] = useState("");

  // 当打开归档对话框时，设置默认名称
  const openArchiveDialog = () => {
    if (currentResult) {
      const defaultName = `工时表_${format(new Date(), 'yyyy/MM/dd', { locale: zhCN })}`;
      setArchiveName(defaultName);
      setIsArchiveDialogOpen(true);
    }
  };

  // 处理归档确认
  const handleArchiveConfirm = () => {
    if (handleArchive && archiveName.trim()) {
      handleArchive(archiveName.trim());
      setIsArchiveDialogOpen(false);
    }
  };

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
      {/* 工时表信息卡片 */}
      {currentResult.name && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5" />
              {currentResult.name}
            </CardTitle>
            <CardDescription>
              <div className="flex flex-wrap gap-4 mt-2">
                {currentResult.projectConfig && (
                  <>
                    <div className="flex items-center gap-2">
                      <ListTodo className="h-4 w-4" />
                      <span>任务数：{currentResult.projectConfig.tasks.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {format(new Date(currentResult.projectConfig.dateRange.startDate), 'MM/dd')} - 
                        {format(new Date(currentResult.projectConfig.dateRange.endDate), 'MM/dd')}
                      </span>
                    </div>
                  </>
                )}
                {currentResult.archivedAt && (
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    <span>归档于：{format(new Date(currentResult.archivedAt), 'yyyy/MM/dd HH:mm')}</span>
                  </div>
                )}
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />工时表详情
              </CardTitle>
              <CardDescription>点击单元格可以编辑内容</CardDescription>
            </div>
            {handleArchive && !currentResult.archivedAt && (
              <Button onClick={openArchiveDialog} size="sm" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                归档保存
              </Button>
            )}
          </div>
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
                  <th className="text-left p-3 font-medium">操作</th>
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
                          onClick={() => !currentResult.archivedAt && setEditingEntryId(entry.id)}
                          className={`${!currentResult.archivedAt ? 'cursor-pointer hover:bg-accent' : ''} rounded p-1 min-h-[24px]`}
                        >
                          {entry.workContent}
                        </div>
                      )}
                    </td>
                    <td className="p-3">{entry.hoursSpent}h</td>
                    <td className="p-3">{entry.remainingHours}h</td>
                    <td className="p-3">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(entry.workContent);
                          showNotification?.("success", "工作内容已复制到剪贴板");
                        }}
                        variant="ghost"
                        size="icon"
                        title="复制工作内容"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 归档确认对话框 */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>归档工时表</DialogTitle>
            <DialogDescription>
              请确认以下信息并设置归档名称
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 不可编辑的信息 */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">工时表信息</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">总工时</div>
                <div>{currentResult.summary.totalHours}h</div>
                <div className="text-muted-foreground">工作天数</div>
                <div>{currentResult.summary.totalDays}天</div>
                <div className="text-muted-foreground">日均工时</div>
                <div>{currentResult.summary.averageHoursPerDay.toFixed(1)}h</div>
                {currentResult.projectConfig && (
                  <>
                    <div className="text-muted-foreground">任务数量</div>
                    <div>{currentResult.projectConfig.tasks.length}个</div>
                    <div className="text-muted-foreground">时间范围</div>
                    <div>
                      {format(new Date(currentResult.projectConfig.dateRange.startDate), 'MM/dd')} - 
                      {format(new Date(currentResult.projectConfig.dateRange.endDate), 'MM/dd')}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* 可编辑的归档名称 */}
            <div className="space-y-2">
              <label htmlFor="archiveName" className="text-sm font-medium">
                归档名称
              </label>
              <Input
                id="archiveName"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="请输入归档名称"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleArchiveConfirm} disabled={!archiveName.trim()}>
              确认归档
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 