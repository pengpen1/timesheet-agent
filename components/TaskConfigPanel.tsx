import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Calendar, CalendarDays, CalendarRange } from "lucide-react";
import type { ProjectConfig, ProcessingState } from "@/types/types";
import { getCurrentWeekRange, getCurrentMonthRange } from "@/lib/utils";
import { TaskManagementContainer } from "./TaskManagementContainer";

interface TaskConfigPanelProps {
  currentConfig: ProjectConfig;
  processingState: ProcessingState;
  updateConfig: (config: Partial<ProjectConfig>) => void;
  addTask: (task: Omit<import("@/types/types").Task, "id">) => void;
  deleteTask: (taskId: string) => void;
  handleGenerateTimesheet: () => void;
  updateProcessingState: (updates: Partial<ProcessingState>) => void;
}

export const TaskConfigPanel: React.FC<TaskConfigPanelProps> = ({
  currentConfig,
  processingState,
  updateConfig,
  addTask,
  deleteTask,
  handleGenerateTimesheet,
  updateProcessingState,
}) => {
  return (
    <div className="space-y-6">
      {/* 任务管理容器 */}
      <TaskManagementContainer
        currentConfig={currentConfig}
        processingState={processingState}
        updateConfig={updateConfig}
        handleGenerateTimesheet={handleGenerateTimesheet}
        updateProcessingState={updateProcessingState}
      />
      
      {/* 工作参数 */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              工作参数配置
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
  );
}; 