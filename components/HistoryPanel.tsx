import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  History, 
  Calendar, 
  Clock, 
  FileText, 
  Eye, 
  Trash2, 
  Download,
  ChevronRight,
  BarChart3,
  User,
  Archive
} from "lucide-react";
import type { TimesheetResult } from "@/types/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface HistoryPanelProps {
  savedResults: TimesheetResult[];
  onViewResult: (result: TimesheetResult) => void;
  onDeleteResult: (index: number) => void;
  onExportResult: (result: TimesheetResult) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  savedResults,
  onViewResult,
  onDeleteResult,
  onExportResult,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 按日期分组历史记录
  const groupedResults = savedResults.reduce((groups, result, index) => {
    const date = new Date(result.archivedAt || result.generatedAt);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push({ result, index });
    return groups;
  }, {} as Record<string, Array<{ result: TimesheetResult; index: number }>>);

  const sortedDates = Object.keys(groupedResults).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (savedResults.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无历史记录</h3>
            <p className="text-muted-foreground">
              生成的工时表归档后将在这里显示
            </p>
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
                <p className="text-sm text-muted-foreground">总归档数</p>
                <p className="text-2xl font-bold">{savedResults.length}</p>
              </div>
              <Archive className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总工时</p>
                <p className="text-2xl font-bold">
                  {savedResults.reduce((sum, r) => sum + r.summary.totalHours, 0)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均每日工时</p>
                <p className="text-2xl font-bold">
                  {(savedResults.reduce((sum, r) => sum + r.summary.averageHoursPerDay, 0) / savedResults.length).toFixed(1)}h
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 时间线历史记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            历史记录时间线
          </CardTitle>
          <CardDescription>
            点击查看详细工时表内容
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* 时间线 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {/* 历史记录列表 */}
            <div className="space-y-8">
              {sortedDates.map((dateKey) => (
                <div key={dateKey} className="relative">
                  {/* 日期标签 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="absolute left-0 w-8 h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="ml-12">
                      <h3 className="font-medium text-lg">
                        {format(new Date(dateKey), 'yyyy年MM月dd日', { locale: zhCN })}
                      </h3>
                    </div>
                  </div>
                  
                  {/* 当天的记录 */}
                  <div className="ml-12 space-y-3">
                    {groupedResults[dateKey].map(({ result, index }) => (
                      <Card 
                        key={result.id || index}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onViewResult(result)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">
                                  {result.name || `工时表_${index + 1}`}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {format(new Date(result.archivedAt || result.generatedAt), 'HH:mm')}
                                </Badge>
                              </div>
                              
                              {/* 任务摘要 */}
                              {result.projectConfig && (
                                <div className="text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      {result.projectConfig.tasks.length} 个任务
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {result.summary.totalHours}h
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {result.summary.totalDays} 天
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* 展开查看详情 */}
                              {expandedId === result.id && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">主要任务：</p>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {result.projectConfig?.tasks.slice(0, 3).map((task, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                          <ChevronRight className="h-3 w-3" />
                                          {task.name} ({task.totalHours}h)
                                        </li>
                                      ))}
                                      {result.projectConfig && result.projectConfig.tasks.length > 3 && (
                                        <li className="text-xs">
                                          ...还有 {result.projectConfig.tasks.length - 3} 个任务
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* 操作按钮 */}
                            <div className="flex items-center gap-1 ml-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedId(expandedId === result.id ? null : result.id!);
                                }}
                                title="展开/收起"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExportResult(result);
                                }}
                                title="导出"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteResult(index);
                                }}
                                title="删除"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 