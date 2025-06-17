// {{CHENGQI:
// Action: Added; Timestamp: 2025-06-16 11:20:34 +08:00; Reason: P3-UI-001 主页面实现; Principle_Applied: 用户中心设计;
// }}

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  FileText,
  Download,
  Copy,
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Brain,
  Zap,
  Sparkles,
  BarChart3,
  User,
  Save,
  Edit3,
  Table,
  Loader2
} from "lucide-react";
import { useTimesheetStore } from "@/store/store";
import { TaskAgent } from "@/lib/agents/taskAgent";
import { TimesheetAgent } from "@/lib/agents/timesheetAgent";
import { ExportService } from "@/lib/export";
import { generateWorkDays } from "@/lib/utils";
import { TimesheetEntry } from "@/types/types";
import { TaskConfigPanel } from "@/components/TaskConfigPanel";
import { TimesheetResultPanel } from "@/components/TimesheetResultPanel";
import { ModelConfigPanel } from "@/components/ModelConfigPanel";
import Image from "next/image";

export default function TimesheetAgentPage() {
  const {
    currentConfig,
    currentResult,
    isGenerating,
    errors,
    warnings,
    updateConfig,
    addTask,
    deleteTask,
    setCurrentResult,
    setIsGenerating,
    clearMessages,
    exportAsText,
    exportAsCSV,
    updateTimesheetEntry,
  } = useTimesheetStore();

  const [activeTab, setActiveTab] = useState<"config" | "result" | "model">("config");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  // 显示通知
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 生成工时表
  const handleGenerateTimesheet = async () => {
    try {
      clearMessages();
      setIsGenerating(true);
      setProgress(0);

      // 验证输入
      if (currentConfig.tasks.length === 0) {
        throw new Error("请至少添加一个任务");
      }

      setProcessingStep("正在分析任务和工作日...");
      setProgress(20);

      // 生成工作日
      const workDays = generateWorkDays(
        currentConfig.dateRange.startDate,
        currentConfig.dateRange.endDate,
        currentConfig.workingHours.dailyHours,
        currentConfig.workingHours.scheduleType,
        currentConfig.workingHours.excludeHolidays,
        currentConfig.workingHours.singleRestDay,
        currentConfig.workingHours.isCurrentWeekBig
      );

      setProcessingStep("TaskAgent正在智能分配任务...");
      setProgress(40);

      // TaskAgent 处理
      const taskAgentOutput = await TaskAgent.process({
        tasks: [...currentConfig.tasks],
        workDays,
        distributionMode: currentConfig.distributionMode,
      });

      setProcessingStep("TimesheetAgent正在生成工时表...");
      setProgress(80);

      // TimesheetAgent 处理
      const timesheetAgentOutput = TimesheetAgent.process({
        taskAssignments: taskAgentOutput.dailyAssignments,
        workContent: currentConfig.workContent,
      });

      // 计算统计信息
      const totalHours = timesheetAgentOutput.timesheet.reduce(
        (sum, entry) => sum + entry.hoursSpent,
        0
      );
      const totalDays = timesheetAgentOutput.timesheet.length;
      const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;

      setCurrentResult({
        entries: timesheetAgentOutput.timesheet,
        summary: {
          totalHours,
          totalDays,
          averageHoursPerDay,
        },
        generatedAt: new Date().toISOString(),
      });

      setProcessingStep("完成生成...");
      setProgress(100);

      setActiveTab("result");
      showNotification("success", "工时表生成成功！");
    } catch (error) {
      console.error("生成工时表失败:", error);
      showNotification("error", "生成工时表失败，请检查配置");
    } finally {
      setIsGenerating(false);
      setProcessingStep("");
      setProgress(0);
    }
  };

  // 添加任务
  const handleAddTask = () => {
    addTask({
      name: "新任务",
      totalHours: 8,
      priority: "medium",
      description: "",
    });
    showNotification("success", "任务已添加");
  };

  // 复制工时表
  const handleCopyTimesheet = async () => {
    if (!currentResult) return;

    try {
      const success = await ExportService.copyToClipboard(currentResult.entries);
      if (success) {
        showNotification("success", "工时表已复制到剪贴板");
      } else {
        showNotification("error", "复制失败，请重试");
      }
    } catch (error) {
      showNotification("error", "复制失败");
    }
  };

  // 导出Excel
  const handleExportExcel = () => {
    if (!currentResult) return;
    try {
      ExportService.exportToExcel(currentResult.entries);
      showNotification("success", "Excel文件已导出");
    } catch (error) {
      showNotification("error", "导出Excel失败");
    }
  };

  // 导出CSV
  const handleExportCSV = () => {
    if (!currentResult) return;
    try {
      ExportService.exportToCSV(currentResult.entries);
      showNotification("success", "CSV文件已导出");
    } catch (error) {
      showNotification("error", "导出CSV失败");
    }
  };

  // 导出文本
  const handleExportText = () => {
    if (!currentResult) return;
    try {
      ExportService.exportToText(currentResult.entries);
      showNotification("success", "文本文件已导出");
    } catch (error) {
      showNotification("error", "导出文本失败");
    }
  };

  // 编辑工时表条目
  const handleEditEntry = (
    entry: TimesheetEntry,
    field: string,
    value: string | number
  ) => {
    updateTimesheetEntry(entry.id, { [field]: value });
    showNotification("success", "已更新");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 通知 */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <Alert variant={notification.type === "error" ? "destructive" : "default"}>
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/avatar.png"
                alt="Avatar"
                width={32}
                height={32}
                className="rounded-full object-cover"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              TimesheetAgent <small className="text-2xl text-gray-500 font-normal">v1.1.0</small>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-6">
            智能工时填报器 - 双Agent架构自动生成标准化工时表
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span>AI驱动</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span>智能分配</span>
            </div>
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4 text-green-500" />
              <span>多格式导出</span>
            </div>
          </div>
        </div>

        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              任务配置
            </TabsTrigger>
            <TabsTrigger value="result" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              工时表结果
            </TabsTrigger>
            <TabsTrigger value="model" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              模型配置
            </TabsTrigger>
          </TabsList>

          {/* 任务配置页面 */}
          <TabsContent value="config" className="space-y-6">
            <TaskConfigPanel
              currentConfig={currentConfig}
              isGenerating={isGenerating}
              processingStep={processingStep}
              progress={progress}
              updateConfig={updateConfig}
              addTask={addTask}
              deleteTask={deleteTask}
              handleGenerateTimesheet={handleGenerateTimesheet}
            />
          </TabsContent>

          {/* 工时表结果页面 */}
          <TabsContent value="result" className="space-y-6">
            <TimesheetResultPanel
              currentResult={currentResult}
              editingEntryId={editingEntryId}
              setEditingEntryId={setEditingEntryId}
              handleEditEntry={handleEditEntry}
              handleExportExcel={handleExportExcel}
              handleExportCSV={handleExportCSV}
              handleExportText={handleExportText}
              handleCopyTimesheet={handleCopyTimesheet}
              setActiveTab={(tab) => setActiveTab(tab as "config" | "result" | "model")}
            />
          </TabsContent>

          {/* 模型配置页面 */}
          <TabsContent value="model">
            <ModelConfigPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
