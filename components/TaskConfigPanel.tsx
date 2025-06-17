import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Plus, Trash2, Calendar, Loader2, Sparkles } from "lucide-react";
import type { ProjectConfig } from "@/lib/types";

interface TaskConfigPanelProps {
  currentConfig: ProjectConfig;
  isGenerating: boolean;
  processingStep: string;
  progress: number;
  updateConfig: (config: Partial<ProjectConfig>) => void;
  addTask: (task: Omit<import("@/lib/types").Task, "id">) => void;
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
  return (
    <div className="space-y-6">
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
              <Label>工作日期</Label>
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="excludeWeekends"
                  checked={currentConfig.workingHours.excludeWeekends}
                  onChange={e =>
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
            {/* 工作内容模板 */}
            <div className="space-y-2">
              <Label>工作内容模板（可选）</Label>
              <Input
                value={currentConfig.workContent}
                onChange={e => updateConfig({ workContent: e.target.value })}
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
    </div>
  );
}; 