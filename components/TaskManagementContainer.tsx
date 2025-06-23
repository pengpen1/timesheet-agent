import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { 
  Plus, 
  GitBranch, 
  Paperclip, 
  Calendar, 
  Loader2, 
  Sparkles,
  Trash2,
  Users,
  Eye,
  GitCommit,
  FileText,
  User2,
  Clock
} from "lucide-react";
import { NewTaskModule } from "./NewTaskModule";
import { GitLogModule } from "./GitLogModule";
import { AttachmentModule } from "./AttachmentModule";
import type { Task, ProjectConfig } from "@/types/types";
import { generateWorkDays } from "@/lib/utils";

interface TaskManagementContainerProps {
  currentConfig: ProjectConfig;
  isGenerating: boolean;
  processingStep: string;
  progress: number;
  updateConfig: (config: Partial<ProjectConfig>) => void;
  handleGenerateTimesheet: () => void;
}

export const TaskManagementContainer: React.FC<TaskManagementContainerProps> = ({
  currentConfig,
  isGenerating,
  processingStep,
  progress,
  updateConfig,
  handleGenerateTimesheet,
}) => {
  const [activeTab, setActiveTab] = useState("new-task");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  // 计算工作日统计
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

  // 任务统计
  const manualTasks = currentConfig.tasks.filter(t => t.source === 'manual').length;
  const gitLogTasks = currentConfig.tasks.filter(t => t.source === 'gitlog').length;
  const attachmentTasks = currentConfig.tasks.filter(t => t.source === 'attachment').length;

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // 任务操作
  const addTask = (task: Omit<Task, "id">) => {
    const newTask = { ...task, id: generateId() };
    updateConfig({ tasks: [...currentConfig.tasks, newTask] });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = currentConfig.tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    updateConfig({ tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = currentConfig.tasks.filter(task => task.id !== taskId);
    updateConfig({ tasks: updatedTasks });
  };

  const addTasksFromGitLog = (tasks: Omit<Task, "id">[]) => {
    const newTasks = tasks.map(task => ({ ...task, id: generateId() }));
    updateConfig({ tasks: [...currentConfig.tasks, ...newTasks] });
  };

  const addTasksFromAttachment = (tasks: Omit<Task, "id">[]) => {
    const newTasks = tasks.map(task => ({ ...task, id: generateId() }));
    updateConfig({ tasks: [...currentConfig.tasks, ...newTasks] });
  };

  const clearTasksBySource = (source: Task['source']) => {
    const filteredTasks = currentConfig.tasks.filter(task => task.source !== source);
    updateConfig({ tasks: filteredTasks });
  };

  // 查看任务详情
  const viewTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  // 渲染任务详情内容
  const renderTaskDetail = () => {
    if (!selectedTask) return null;

    return (
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-lg">{selectedTask.name}</h4>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                selectedTask.source === 'manual' ? 'bg-blue-50 text-blue-700' :
                selectedTask.source === 'gitlog' ? 'bg-green-50 text-green-700' :
                'bg-purple-50 text-purple-700'
              }`}
            >
              {selectedTask.source === 'manual' ? '手动任务' : 
               selectedTask.source === 'gitlog' ? 'Git日志任务' : '附件任务'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>工时: {selectedTask.totalHours} 小时</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={selectedTask.priority === 'high' ? 'destructive' : 
                        selectedTask.priority === 'medium' ? 'default' : 'secondary'}
                className="text-xs"
              >
                优先级: {selectedTask.priority === 'high' ? '高' : 
                         selectedTask.priority === 'medium' ? '中' : '低'}
              </Badge>
            </div>
          </div>

          {selectedTask.description && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-700">{selectedTask.description}</p>
            </div>
          )}
        </div>

        {/* Git日志详情 */}
        {selectedTask.source === 'gitlog' && selectedTask.sourceData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-green-600" />
              <h5 className="font-medium text-green-800">Git提交记录</h5>
            </div>
            
            {selectedTask.sourceData.gitCommits && selectedTask.sourceData.gitCommits.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded-md text-sm">
                  <div className="grid grid-cols-2 gap-4 text-green-700">
                    <span>提交数量: {selectedTask.sourceData.gitCommits.length}个</span>
                    <span>工作日分布: {Array.from(new Set(selectedTask.sourceData.gitCommits.map(c => new Date(c.date).toDateString()))).length}天</span>
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {selectedTask.sourceData.gitCommits.map((commit, index) => (
                    <div key={index} className="bg-white border border-green-200 p-3 rounded-md">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-1 rounded">
                          <GitCommit className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-mono">{commit.hash.substring(0, 7)}</span>
                            <span>{new Date(commit.date).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <User2 className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{commit.author}</span>
                          </div>
                          <p className="text-sm text-gray-800 break-words">{commit.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedTask.sourceData.rawContent ? (
              <div className="bg-green-50 p-3 rounded-md">
                <pre className="text-xs text-green-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedTask.sourceData.rawContent}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-gray-500">无Git日志内容</p>
            )}
          </div>
        )}

        {/* 附件详情 */}
        {selectedTask.source === 'attachment' && selectedTask.sourceData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <h5 className="font-medium text-purple-800">附件内容</h5>
            </div>
            
            {selectedTask.sourceData.rawContent ? (
              <div className="bg-purple-50 p-3 rounded-md">
                {selectedTask.sourceData.rawContent.startsWith('data:image/') ? (
                  <div className="text-center space-y-2">
                    <img 
                      src={selectedTask.sourceData.rawContent} 
                      alt="附件图片" 
                      className="max-w-full max-h-40 mx-auto rounded border"
                    />
                    <p className="text-xs text-purple-600">图片附件</p>
                  </div>
                ) : (
                  <pre className="text-xs text-purple-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedTask.sourceData.rawContent}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">无附件内容</p>
            )}
          </div>
        )}

        {/* 手动任务说明 */}
        {selectedTask.source === 'manual' && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">这是手动创建的任务，AI将根据任务名称和描述生成工时内容。</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 工时统计总览 */}
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

      {/* 任务管理模块 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            任务管理
          </CardTitle>
          <CardDescription className="flex items-center gap-4">
            <span>任务获取与附件管理</span>
            <div className="flex gap-2">
              {manualTasks > 0 && (
                <Badge variant="outline" className="text-xs">
                  手动: {manualTasks}
                </Badge>
              )}
              {gitLogTasks > 0 && (
                <Badge variant="outline" className="text-xs">
                  Git: {gitLogTasks}
                </Badge>
              )}
              {attachmentTasks > 0 && (
                <Badge variant="outline" className="text-xs">
                  附件: {attachmentTasks}
                </Badge>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new-task" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                新任务
                {manualTasks > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-5">
                    {manualTasks}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="git-log" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Git日志
                {gitLogTasks > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-5">
                    {gitLogTasks}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="attachment" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                附件补充
                {attachmentTasks > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-5">
                    {attachmentTasks}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="new-task" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">手动添加任务</h3>
                    <p className="text-sm text-gray-600">直接创建和编辑工作任务</p>
                  </div>
                  {manualTasks > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearTasksBySource('manual')}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      清空手动任务
                    </Button>
                  )}
                </div>
                <NewTaskModule
                  tasks={currentConfig.tasks}
                  onTaskAdd={addTask}
                  onTaskUpdate={updateTask}
                  onTaskDelete={deleteTask}
                />
              </TabsContent>

              <TabsContent value="git-log" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Git日志补充</h3>
                    <p className="text-sm text-gray-600">获取Git提交记录作为AI参考内容</p>
                  </div>
                  {gitLogTasks > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearTasksBySource('gitlog')}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      清空Git任务
                    </Button>
                  )}
                </div>
                <GitLogModule
                  tasks={currentConfig.tasks}
                  onTasksFromGitLog={addTasksFromGitLog}
                />
              </TabsContent>

              <TabsContent value="attachment" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">附件补充</h3>
                    <p className="text-sm text-gray-600">粘贴文档、图片等文件作为AI参考内容</p>
                  </div>
                  {attachmentTasks > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearTasksBySource('attachment')}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      清空附件任务
                    </Button>
                  )}
                </div>
                <AttachmentModule
                  tasks={currentConfig.tasks}
                  onTasksFromAttachment={addTasksFromAttachment}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* 全部任务列表 */}
      {currentConfig.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              全部任务列表 s({currentConfig.tasks.length})
            </CardTitle>
            <CardDescription>所有来源的任务汇总</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {currentConfig.tasks.map((task) => (
                <Card key={task.id} className="p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{task.name}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            task.source === 'manual' ? 'bg-blue-50 text-blue-700' :
                            task.source === 'gitlog' ? 'bg-green-50 text-green-700' :
                            'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {task.source === 'manual' ? '手动' : 
                           task.source === 'gitlog' ? 'Git' : '附件'}
                        </Badge>
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : 
                                  task.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {task.priority === 'high' ? '高' : 
                           task.priority === 'medium' ? '中' : '低'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{task.totalHours} 小时</span>
                        {task.description && (
                          <span className="truncate">{task.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewTaskDetail(task)}
                        title="查看详情"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                        title="删除任务"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

             {/* 任务详情对话框 */}
       <Dialog open={showTaskDetail} onOpenChange={setShowTaskDetail}>
         <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>任务详情</DialogTitle>
             <DialogDescription>查看任务的详细信息和AI参考内容</DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             {renderTaskDetail()}
           </div>
           <DialogFooter>
             <Button onClick={() => setShowTaskDetail(false)}>
               关闭
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </div>
  );
}; 