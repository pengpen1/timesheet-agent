import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Plus, Trash2, Edit3 } from "lucide-react";
import type { Task } from "@/types/types";

interface NewTaskModuleProps {
  tasks: Task[];
  onTaskAdd: (task: Omit<Task, "id">) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
}

export const NewTaskModule: React.FC<NewTaskModuleProps> = ({
  tasks,
  onTaskAdd,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [newTask, setNewTask] = useState<{
    name: string;
    totalHours: number;
    priority: "high" | "medium" | "low";
    description: string;
  }>({
    name: "",
    totalHours: 8,
    priority: "medium",
    description: "",
  });

  const handleAddTask = () => {
    if (newTask.name.trim()) {
      onTaskAdd({
        ...newTask,
        source: "manual",
      });
      setNewTask({
        name: "",
        totalHours: 8,
        priority: "medium",
        description: "",
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">高</Badge>;
      case "medium":
        return <Badge variant="default">中</Badge>;
      case "low":
        return <Badge variant="secondary">低</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          新任务
        </CardTitle>
        <CardDescription>手动添加和管理工作任务</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 添加新任务表单 */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">任务名称</Label>
              <Input
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                placeholder="输入任务名称"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">总工时</Label>
              <Input
                type="number"
                value={newTask.totalHours}
                onChange={(e) => setNewTask({ ...newTask, totalHours: Number(e.target.value) })}
                min="0.5"
                step="0.5"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">优先级</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value: "high" | "medium" | "low") =>
                  setNewTask({ ...newTask, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">高优先级</SelectItem>
                  <SelectItem value="medium">中优先级</SelectItem>
                  <SelectItem value="low">低优先级</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">任务描述</Label>
              <Input
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="任务描述（可选）"
              />
            </div>
          </div>
          <Button onClick={handleAddTask} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            添加任务
          </Button>
        </div>

        {/* 已添加的任务列表 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">已添加任务 ({tasks.filter(t => t.source === 'manual').length})</Label>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {tasks
              .filter((task) => task.source === "manual")
              .map((task) => (
                <Card key={task.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit3 className="h-4 w-4 text-gray-400" />
                        <Input
                          value={task.name}
                          onChange={(e) =>
                            onTaskUpdate(task.id, { name: e.target.value })
                          }
                          className="font-medium border-none p-0 h-auto focus-visible:ring-0"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTaskDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">工时:</span>
                        <Input
                          type="number"
                          value={task.totalHours}
                          onChange={(e) =>
                            onTaskUpdate(task.id, { totalHours: Number(e.target.value) })
                          }
                          min="0.5"
                          step="0.5"
                          className="w-16 h-6 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">优先级:</span>
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                    {task.description && (
                      <Input
                        value={task.description}
                        onChange={(e) =>
                          onTaskUpdate(task.id, { description: e.target.value })
                        }
                        placeholder="任务描述"
                        className="text-xs border-none p-0 h-auto focus-visible:ring-0"
                      />
                    )}
                  </div>
                </Card>
              ))}
          </div>
          {tasks.filter((t) => t.source === "manual").length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>暂无手动添加的任务</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 