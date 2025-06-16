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
import { useTimesheetStore } from "@/lib/store";
import { TaskAgent } from "@/lib/agents/taskAgent";
import { TimesheetAgent } from "@/lib/agents/timesheetAgent";
import { ExportService } from "@/lib/export";
import { generateWorkDays } from "@/lib/utils";
import { TimesheetEntry } from "@/lib/types";
import { ModelConfigPage } from "@/components/model-config";

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
        currentConfig.workingHours.excludeWeekends,
        currentConfig.workingHours.excludeHolidays
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
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              TimesheetAgent
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 任务管理 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    任务管理
                  </CardTitle>
                  <CardDescription>
                    添加和配置您的工作任务
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleAddTask}
                    className="w-full flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    添加新任务
                  </Button>

                  <div className="space-y-3">
                    {currentConfig.tasks.map((task, index) => (
                      <Card key={task.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Input
                              value={task.name}
                              onChange={(e) => {
                                const newTasks = [...currentConfig.tasks];
                                newTasks[index].name = e.target.value;
                                updateConfig({ tasks: newTasks });
                              }}
                              placeholder="任务名称"
                              className="font-medium"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                总工时
                              </Label>
                              <Input
                                type="number"
                                value={task.totalHours}
                                onChange={(e) => {
                                  const newTasks = [...currentConfig.tasks];
                                  newTasks[index].totalHours = Number(e.target.value);
                                  updateConfig({ tasks: newTasks });
                                }}
                                min="0.5"
                                step="0.5"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                优先级
                              </Label>
                              <Select
                                value={task.priority}
                                onValueChange={(value: any) => {
                                  const newTasks = [...currentConfig.tasks];
                                  newTasks[index].priority = value;
                                  updateConfig({ tasks: newTasks });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">
                                    <Badge variant="destructive">高</Badge>
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    <Badge variant="default">中</Badge>
                                  </SelectItem>
                                  <SelectItem value="low">
                                    <Badge variant="secondary">低</Badge>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">
                              任务描述
                            </Label>
                            <Input
                              value={task.description}
                              onChange={(e) => {
                                const newTasks = [...currentConfig.tasks];
                                newTasks[index].description = e.target.value;
                                updateConfig({ tasks: newTasks });
                              }}
                              placeholder="任务描述（可选）"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 工作参数 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    工作参数
                  </CardTitle>
                  <CardDescription>
                    配置工作时间和分配策略
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 日期范围 */}
                  <div className="space-y-3">
                    <Label>工作日期</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">开始日期</Label>
                        <Input
                          type="date"
                          value={currentConfig.dateRange.startDate}
                          onChange={(e) =>
                            updateConfig({
                              dateRange: {
                                ...currentConfig.dateRange,
                                startDate: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">结束日期</Label>
                        <Input
                          type="date"
                          value={currentConfig.dateRange.endDate}
                          onChange={(e) =>
                            updateConfig({
                              dateRange: {
                                ...currentConfig.dateRange,
                                endDate: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* 工作时间设置 */}
                  <div className="space-y-3">
                    <Label>工作时间设置</Label>
                    <div>
                      <Label className="text-xs text-muted-foreground">每日工时</Label>
                      <Input
                        type="number"
                        value={currentConfig.workingHours.dailyHours}
                        onChange={(e) =>
                          updateConfig({
                            workingHours: {
                              ...currentConfig.workingHours,
                              dailyHours: Number(e.target.value),
                            },
                          })
                        }
                        min="1"
                        max="24"
                        step="0.5"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="excludeWeekends"
                        checked={currentConfig.workingHours.excludeWeekends}
                        onChange={(e) =>
                          updateConfig({
                            workingHours: {
                              ...currentConfig.workingHours,
                              excludeWeekends: e.target.checked,
                            },
                          })
                        }
                        className="rounded"
                      />
                      <Label htmlFor="excludeWeekends">排除双休日</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="excludeHolidays"
                        checked={currentConfig.workingHours.excludeHolidays}
                        onChange={(e) =>
                          updateConfig({
                            workingHours: {
                              ...currentConfig.workingHours,
                              excludeHolidays: e.target.checked,
                            },
                          })
                        }
                        className="rounded"
                      />
                      <Label htmlFor="excludeHolidays">排除法定节假日</Label>
                    </div>
                  </div>

                  {/* 分配模式 */}
                  <div className="space-y-2">
                    <Label>分配模式</Label>
                    <Select
                      value={currentConfig.distributionMode}
                      onValueChange={(value: any) =>
                        updateConfig({ distributionMode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">按天平均分配</SelectItem>
                        <SelectItem value="priority">按优先级分配</SelectItem>
                        <SelectItem value="feature">按功能分配</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 工作内容模板 */}
                  <div className="space-y-2">
                    <Label>工作内容模板（可选）</Label>
                    <Input
                      value={currentConfig.workContent}
                      onChange={(e) => updateConfig({ workContent: e.target.value })}
                      placeholder="自定义工作内容描述模板"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 生成按钮 */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button
                    onClick={handleGenerateTimesheet}
                    disabled={isGenerating || currentConfig.tasks.length === 0}
                    className="w-full h-12 text-lg flex items-center gap-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        AI正在生成工时表...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        生成智能工时表
                      </>
                    )}
                  </Button>
                  
                  {isGenerating && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{processingStep}</span>
                        <span className="text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 工时表结果页面 */}
          <TabsContent value="result" className="space-y-6">
            {currentResult ? (
              <>
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
                          <p className="text-2xl font-bold">
                            {currentResult.summary.averageHoursPerDay.toFixed(1)}h
                          </p>
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
                      <Button
                        onClick={handleExportExcel}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        导出Excel
                      </Button>
                      <Button
                        onClick={handleExportCSV}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        导出CSV
                      </Button>
                      <Button
                        onClick={handleExportText}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        导出文本
                      </Button>
                      <Button
                        onClick={handleCopyTimesheet}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        复制到剪贴板
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 工时表 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      工时表详情
                    </CardTitle>
                    <CardDescription>
                      点击单元格可以编辑内容
                    </CardDescription>
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
                                    onChange={(e) =>
                                      handleEditEntry(entry, "workContent", e.target.value)
                                    }
                                    onBlur={() => setEditingEntryId(null)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        setEditingEntryId(null)
                                      }
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
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">暂无工时表数据</h3>
                    <p className="text-muted-foreground mb-4">
                      请先在"任务配置"页面设置任务并生成工时表
                    </p>
                    <Button onClick={() => setActiveTab("config")}>
                      去配置任务
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 模型配置页面 */}
          <TabsContent value="model">
            <ModelConfigPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
