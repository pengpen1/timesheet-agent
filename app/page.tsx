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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  FileText,
  Download,
  Copy,
  Settings,
  Plus,
  Trash2,
  Brain,
  Zap,
  Sparkles,
  BarChart3,
  User,
  Save,
  Edit3,
  Table,
  Loader2,
  History
} from "lucide-react";
import { useTimesheetStore } from "@/store/store";
import { TaskAgent } from "@/lib/agents/taskAgent";
import { TimesheetAgent } from "@/lib/agents/timesheetAgent";
import { ExportService } from "@/lib/export";
import { generateWorkDays } from "@/lib/utils";
import { TimesheetEntry, TimesheetResult, ProcessingState, ProcessingStep } from "@/types/types";
import { TaskConfigPanel } from "@/components/TaskConfigPanel";
import { TimesheetResultPanel } from "@/components/TimesheetResultPanel";
import { ModelConfigPanel } from "@/components/ModelConfigPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { GenerationCompleteDialog } from "@/components/ui/generation-complete-dialog";
import Image from "next/image";

export default function TimesheetAgentPage() {
  const {
    currentConfig,
    currentResult,
    savedResults,
    isGenerating,
    errors,
    warnings,
    updateConfig,
    addTask,
    deleteTask,
    setCurrentResult,
    viewHistoryResult,
    setIsGenerating,
    clearMessages,
    exportAsText,
    exportAsCSV,
    updateTimesheetEntry,
    saveResult,
    deleteResult,
  } = useTimesheetStore();

  const [activeTab, setActiveTab] = useState<"config" | "result" | "model" | "history">("config");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  
  // 处理状态管理
  const [processingState, setProcessingState] = useState<ProcessingState>({
    currentStep: '',
    steps: [],
    overallProgress: 0,
    isProcessing: false,
    showStreamDialog: false
  });
  
  // 生成完成确认弹框状态
  const [showGenerationCompleteDialog, setShowGenerationCompleteDialog] = useState(false);

  // 更新处理状态
  const updateProcessingState = (updates: Partial<ProcessingState>) => {
    setProcessingState(prev => ({ ...prev, ...updates }));
  };

  // 更新步骤状态
  const updateStep = (stepId: string, updates: Partial<ProcessingStep>) => {
    setProcessingState(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  };

  // 添加流式内容
  const appendStreamContent = (stepId: string, content: string) => {
    updateStep(stepId, {
      streamContent: (processingState.steps.find(s => s.id === stepId)?.streamContent || '') + content
    });
  };

  // 生成工时表
  const handleGenerateTimesheet = async () => {
    try {
      clearMessages();
      setIsGenerating(true);

      // 验证输入
      if (currentConfig.tasks.length === 0) {
        throw new Error("请至少添加一个任务");
      }

      // 初始化处理步骤
      const steps: ProcessingStep[] = [
        {
          id: 'validate',
          name: '输入验证',
          description: '验证任务配置和工作日设置',
          status: 'pending',
          progress: 0
        },
        {
          id: 'analyze',
          name: '分析任务',
          description: '分析任务类型和工作日历，生成工作日列表',
          status: 'pending',
          progress: 0
        },
        {
          id: 'distribute',
          name: '智能分配',
          description: 'TaskAgent正在智能分配工时到每个工作日',
          status: 'pending',
          progress: 0
        },
        {
          id: 'generate',
          name: '生成工时表',
          description: 'TimesheetAgent正在生成最终的工时表条目',
          status: 'pending',
          progress: 0
        },
        {
          id: 'finalize',
          name: '完成处理',
          description: '计算统计信息并保存结果',
          status: 'pending',
          progress: 0
        }
      ];

      setProcessingState({
        currentStep: 'validate',
        steps,
        overallProgress: 0,
        isProcessing: true,
        showStreamDialog: false
      });

      // 步骤1：输入验证
      updateStep('validate', { 
        status: 'processing', 
        startTime: new Date().toISOString(),
        streamContent: '🔍 开始验证输入配置...\n'
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟处理时间
      
      appendStreamContent('validate', `✅ 找到 ${currentConfig.tasks.length} 个任务\n`);
      appendStreamContent('validate', `📅 日期范围: ${currentConfig.dateRange.startDate} 到 ${currentConfig.dateRange.endDate}\n`);
      
      updateStep('validate', { 
        status: 'completed', 
        progress: 100,
        endTime: new Date().toISOString()
      });
      setProcessingState(prev => ({ ...prev, currentStep: 'analyze', overallProgress: 20 }));

      // 步骤2：分析任务
      updateStep('analyze', { 
        status: 'processing', 
        startTime: new Date().toISOString(),
        streamContent: '📊 正在分析任务和生成工作日...\n'
      });

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

      const workingDays = workDays.filter(d => d.isWorkday && !d.isHoliday);
      appendStreamContent('analyze', `📋 生成了 ${workDays.length} 天日历，其中 ${workingDays.length} 个工作日\n`);
      appendStreamContent('analyze', `⏰ 每日工作时长: ${currentConfig.workingHours.dailyHours} 小时\n`);
      
      updateStep('analyze', { 
        status: 'completed', 
        progress: 100,
        endTime: new Date().toISOString()
      });
      setProcessingState(prev => ({ ...prev, currentStep: 'distribute', overallProgress: 40 }));

      // 步骤3：智能分配
      updateStep('distribute', { 
        status: 'processing', 
        startTime: new Date().toISOString(),
        streamContent: '🤖 TaskAgent开始智能分配工时...\n'
      });

      appendStreamContent('distribute', `📋 分配策略: ${currentConfig.distributionMode === 'daily' ? '按天平均分配' : currentConfig.distributionMode === 'priority' ? '按优先级分配' : '按功能分配'}\n`);
      
      updateStep('distribute', { progress: 30 });
      
      // TaskAgent 处理 - 使用真正的流式回调
      const taskAgentOutput = await TaskAgent.process({
        tasks: [...currentConfig.tasks],
        workDays,
        distributionMode: currentConfig.distributionMode,
        onStreamContent: (stepId: string, content: string) => {
          // 将AI流式内容添加到当前步骤
          appendStreamContent('distribute', content);
          
          // 根据内容更新进度
          if (content.includes('连接AI模型')) {
            updateStep('distribute', { progress: 40 });
          } else if (content.includes('AI智能分配完成')) {
            updateStep('distribute', { progress: 90 });
          }
        }
      });

      appendStreamContent('distribute', `✅ 成功分配到 ${taskAgentOutput.dailyAssignments.length} 个工作日\n`);
      
      updateStep('distribute', { 
        status: 'completed', 
        progress: 100,
        endTime: new Date().toISOString()
      });
      setProcessingState(prev => ({ ...prev, currentStep: 'generate', overallProgress: 70 }));

      // 步骤4：生成工时表
      updateStep('generate', { 
        status: 'processing', 
        startTime: new Date().toISOString(),
        streamContent: '📝 TimesheetAgent开始生成工时表...\n'
      });

      updateStep('generate', { progress: 30 });
      
      // TimesheetAgent 处理 - 使用真正的流式回调
      const timesheetAgentOutput = TimesheetAgent.process({
        taskAssignments: taskAgentOutput.dailyAssignments,
        workContent: currentConfig.workContent,
        onStreamContent: (stepId: string, content: string) => {
          // 将流式内容添加到生成步骤
          appendStreamContent('generate', content);
          
          // 根据内容更新进度
          if (content.includes('转换任务分配')) {
            updateStep('generate', { progress: 50 });
          } else if (content.includes('计算剩余工时')) {
            updateStep('generate', { progress: 80 });
          } else if (content.includes('工时表生成完成')) {
            updateStep('generate', { progress: 95 });
          }
        }
      });

      appendStreamContent('generate', `✅ 生成了 ${timesheetAgentOutput.timesheet.length} 条工时记录\n`);
      
      updateStep('generate', { 
        status: 'completed', 
        progress: 100,
        endTime: new Date().toISOString()
      });
      setProcessingState(prev => ({ ...prev, currentStep: 'finalize', overallProgress: 90 }));

      // 步骤5：完成处理
      updateStep('finalize', { 
        status: 'processing', 
        startTime: new Date().toISOString(),
        streamContent: '🔧 正在计算统计信息...\n'
      });

      // 计算统计信息
      const totalHours = timesheetAgentOutput.timesheet.reduce(
        (sum, entry) => sum + entry.hoursSpent,
        0
      );
      const totalDays = timesheetAgentOutput.timesheet.length;
      const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;

      appendStreamContent('finalize', `📈 统计信息:\n`);
      appendStreamContent('finalize', `   - 总工时: ${totalHours} 小时\n`);
      appendStreamContent('finalize', `   - 工作天数: ${totalDays} 天\n`);
      appendStreamContent('finalize', `   - 平均每日工时: ${averageHoursPerDay.toFixed(1)} 小时\n`);

      setCurrentResult({
        entries: timesheetAgentOutput.timesheet,
        summary: {
          totalHours,
          totalDays,
          averageHoursPerDay,
        },
        generatedAt: new Date().toISOString(),
      }, true);

      updateStep('finalize', { 
        status: 'completed', 
        progress: 100,
        endTime: new Date().toISOString()
      });
      setProcessingState(prev => ({ ...prev, overallProgress: 100 }));

      appendStreamContent('finalize', '🎉 工时表生成完成！\n');

      // 显示生成完成确认弹框，而不是直接跳转
      setShowGenerationCompleteDialog(true);
      toast.success("工时表生成成功！");
      
      // 1秒后自动结束处理状态
      setTimeout(() => {
        setProcessingState(prev => ({ ...prev, isProcessing: false }));
      }, 1000);

    } catch (error) {
      console.error("生成工时表失败:", error);
      
      // 更新当前步骤为错误状态
      if (processingState.currentStep) {
        updateStep(processingState.currentStep, { 
          status: 'error',
          endTime: new Date().toISOString()
        });
        appendStreamContent(processingState.currentStep, `❌ 错误: ${error instanceof Error ? error.message : '未知错误'}\n`);
      }
      
      toast.error("生成工时表失败，请检查配置");
      setProcessingState(prev => ({ ...prev, isProcessing: false }));
    } finally {
      setIsGenerating(false);
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
    toast.success("任务已添加");
  };

  // 复制工时表
  const handleCopyTimesheet = async () => {
    if (!currentResult) return;

    try {
      const success = await ExportService.copyToClipboard(currentResult.entries);
      if (success) {
        toast.success("工时表已复制到剪贴板");
      } else {
        toast.error("复制失败，请重试");
      }
    } catch (error) {
      toast.error("复制失败");
    }
  };

  // 导出Excel
  const handleExportExcel = () => {
    if (!currentResult) return;
    try {
      ExportService.exportToExcel(currentResult.entries);
      toast.success("Excel文件已导出");
    } catch (error) {
      toast.error("导出Excel失败");
    }
  };

  // 导出CSV
  const handleExportCSV = () => {
    if (!currentResult) return;
    try {
      ExportService.exportToCSV(currentResult.entries);
      toast.success("CSV文件已导出");
    } catch (error) {
      toast.error("导出CSV失败");
    }
  };

  // 导出文本
  const handleExportText = () => {
    if (!currentResult) return;
    try {
      ExportService.exportToText(currentResult.entries);
      toast.success("文本文件已导出");
    } catch (error) {
      toast.error("导出文本失败");
    }
  };

  // 编辑工时表条目
  const handleEditEntry = (
    entry: TimesheetEntry,
    field: string,
    value: string | number
  ) => {
    updateTimesheetEntry(entry.id, { [field]: value });
    toast.success("已更新");
  };

  // 归档工时表
  const handleArchive = (name: string) => {
    if (!currentResult) return;
    try {
      saveResult(name);
      toast.success("工时表已归档保存");
    } catch (error) {
      toast.error("归档失败");
    }
  };

  // 查看历史记录
  const handleViewHistoryResult = (result: TimesheetResult) => {
    viewHistoryResult(result);
    setActiveTab("result");
    toast.success("已加载历史记录");
  };

  // 导出历史记录
  const handleExportHistoryResult = (result: TimesheetResult) => {
    try {
      ExportService.exportToExcel(result.entries);
      toast.success("历史记录已导出");
    } catch (error) {
      toast.error("导出失败");
    }
  };

  // 处理生成完成确认
  const handleGenerationComplete = () => {
    setShowGenerationCompleteDialog(false);
    setActiveTab("result");
  };

  // 处理生成完成取消
  const handleGenerationCancel = () => {
    setShowGenerationCompleteDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent pb-1">
              TimesheetAgent <small className="text-lg text-gray-500 font-normal">v1.2.0</small>
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
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              任务配置
            </TabsTrigger>
            <TabsTrigger value="result" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              工时表结果
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              历史记录
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
              processingState={processingState}
              updateConfig={updateConfig}
              addTask={addTask}
              deleteTask={deleteTask}
              handleGenerateTimesheet={handleGenerateTimesheet}
              updateProcessingState={updateProcessingState}
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
              handleArchive={handleArchive}
              setActiveTab={(tab) => setActiveTab(tab as "config" | "result" | "model" | "history")}
            />
          </TabsContent>

          {/* 模型配置页面 */}
          <TabsContent value="model">
            <ModelConfigPanel />
          </TabsContent>

          {/* 历史记录页面 */}
          <TabsContent value="history">
            <HistoryPanel
              savedResults={savedResults}
              onViewResult={handleViewHistoryResult}
              onDeleteResult={deleteResult}
              onExportResult={handleExportHistoryResult}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* 生成完成确认弹框 */}
      <GenerationCompleteDialog
        open={showGenerationCompleteDialog}
        onConfirm={handleGenerationComplete}
        onCancel={handleGenerationCancel}
        autoRedirectSeconds={3}
      />
    </div>
  );
}
