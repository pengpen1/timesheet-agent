import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Plus, Trash2, Calendar, Loader2, Sparkles, CalendarDays, CalendarRange } from "lucide-react";
import type { ProjectConfig } from "@/types/types";
import { generateWorkDays, getCurrentWeekRange, getCurrentMonthRange } from "@/lib/utils";

interface TaskConfigPanelProps {
  currentConfig: ProjectConfig;
  isGenerating: boolean;
  processingStep: string;
  progress: number;
  updateConfig: (config: Partial<ProjectConfig>) => void;
  addTask: (task: Omit<import("@/types/types").Task, "id">) => void;
  deleteTask: (taskId: string) => void;
  handleGenerateTimesheet: () => void;
}

export const TaskConfigPanel: React.FC<TaskConfigPanelProps> = ({
  currentConfig,
  isGenerating,
  processingStep,
  progress,
  updateConfig,
  addTask,
  deleteTask,
  handleGenerateTimesheet,
}) => {
  // 计算工作日天数和总目标工时
  const workDays = generateWorkDays(
    currentConfig.dateRange.startDate,
    currentConfig.dateRange.endDate,
    currentConfig.workingHours.dailyHours,
    currentConfig.workingHours.scheduleType,
    currentConfig.workingHours.excludeHolidays,
    currentConfig.workingHours.singleRestDay,
    currentConfig.workingHours.isCurrentWeekBig
  );
  const workdayCount = workDays.filter((d) => d.isWorkday).length;
  const dailyHours = currentConfig.workingHours.dailyHours;
  const totalTargetHours = workdayCount * dailyHours;
  const assignedHours = currentConfig.tasks.reduce((sum, t) => sum + Number(t.totalHours), 0);
  const remainingHours = Math.max(0, totalTargetHours - assignedHours);
  const isOver = assignedHours > totalTargetHours;
  const canGenerate = assignedHours >= totalTargetHours;

  return (
    <div className="space-y-6">
      {/* 工时统计总览 - 更显眼的位置 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">目标工时</p>
                <p className="text-xl font-bold text-blue-700">
                  {workdayCount} 天 × {dailyHours} 小时 = {totalTargetHours} 小时
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm">
                已分配：{assignedHours} / {totalTargetHours} 小时
              </Badge>
              {isOver ? (
                <Badge variant="default">超出目标工时</Badge>
              ) : remainingHours === 0 ? (
                <Badge variant="default" className="bg-green-600">工时已填满</Badge>
              ) : (
                <Badge variant="secondary">剩余：{remainingHours} 小时</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 任务管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              任务管理
            </CardTitle>
            <CardDescription>添加和配置您的工作任务</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => addTask({ name: "新任务", totalHours: 8, priority: "medium", description: "" })}
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
                        onChange={e => {
                          const newTasks = [...currentConfig.tasks];
                          newTasks[index].name = e.target.value;
                          updateConfig({ tasks: newTasks });
                        }}
                        placeholder="任务名称"
                        className="font-medium"
                      />
                      <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">总工时</Label>
                        <Input
                          type="number"
                          value={task.totalHours}
                          onChange={e => {
                            const newTasks = [...currentConfig.tasks];
                            newTasks[index].totalHours = Number(e.target.value);
                            updateConfig({ tasks: newTasks });
                          }}
                          min="0.5"
                          step="0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">优先级</Label>
                        <Select
                          value={task.priority}
                          onValueChange={value => {
                            const newTasks = [...currentConfig.tasks];
                            newTasks[index].priority = value as "high" | "medium" | "low";
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
                      <Label className="text-xs text-muted-foreground">任务描述</Label>
                      <Input
                        value={task.description}
                        onChange={e => {
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
            <CardDescription>配置工作时间和分配策略</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 日期范围 */}
            <div className="space-y-3">
              <Label>日期范围</Label>
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const weekRange = getCurrentWeekRange()
                    updateConfig({ dateRange: weekRange })
                  }}
                  className="flex items-center gap-1"
                >
                  <CalendarDays className="h-3 w-3" />
                  当前周
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const monthRange = getCurrentMonthRange()
                    updateConfig({ dateRange: monthRange })
                  }}
                  className="flex items-center gap-1"
                >
                  <CalendarRange className="h-3 w-3" />
                  当前月
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">开始日期</Label>
                  <Input
                    type="date"
                    value={currentConfig.dateRange.startDate}
                    onChange={e =>
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
                    onChange={e =>
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
                  onChange={e =>
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
              
              {/* 工作制度选择 */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">工作制度</Label>
                <Select
                  value={currentConfig.workingHours.scheduleType}
                  onValueChange={(value: 'single' | 'double' | 'alternate') => {
                    updateConfig({
                      workingHours: {
                        ...currentConfig.workingHours,
                        scheduleType: value,
                        // 重置相关配置
                        singleRestDay: value === 'single' ? 'sunday' : undefined,
                        isCurrentWeekBig: value === 'alternate' ? true : undefined,
                      },
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="double">双休（周六周日休息）</SelectItem>
                    <SelectItem value="single">单休（一天休息）</SelectItem>
                    <SelectItem value="alternate">大小周（轮换休息）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 单休配置 */}
              {currentConfig.workingHours.scheduleType === 'single' && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">休息日</Label>
                  <Select
                    value={currentConfig.workingHours.singleRestDay || 'sunday'}
                    onValueChange={(value: 'saturday' | 'sunday') => {
                      updateConfig({
                        workingHours: {
                          ...currentConfig.workingHours,
                          singleRestDay: value,
                        },
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">周日</SelectItem>
                      <SelectItem value="saturday">周六</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 大小周配置 */}
              {currentConfig.workingHours.scheduleType === 'alternate' && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">本周是否为大周</Label>
                  <Select
                    value={currentConfig.workingHours.isCurrentWeekBig ? 'true' : 'false'}
                    onValueChange={(value: string) => {
                      updateConfig({
                        workingHours: {
                          ...currentConfig.workingHours,
                          isCurrentWeekBig: value === 'true',
                        },
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">大周（只休周日）</SelectItem>
                      <SelectItem value="false">小周（休周六周日）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 法定节假日设置 */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="excludeHolidays"
                  checked={currentConfig.workingHours.excludeHolidays}
                  onChange={e =>
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
                onValueChange={value => updateConfig({ distributionMode: value as "priority" | "daily" | "feature" })}
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
          </CardContent>
        </Card>
      </div>
      {/* 生成按钮 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Button
              onClick={handleGenerateTimesheet}
              disabled={isGenerating || currentConfig.tasks.length === 0 || !canGenerate}
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
            {!canGenerate && currentConfig.tasks.length > 0 && (
              <p className="text-sm text-amber-600 text-center">
                请继续添加任务，还需分配 {remainingHours} 小时工时
              </p>
            )}
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
    </div>
  );
}; 