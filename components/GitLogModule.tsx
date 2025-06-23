import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { Task, GitConfig, GitLogEntry } from "@/types/types";
import {
  GitBranch,
  Download,
  Settings,
  Clipboard,
  FileText,
  RefreshCw,
  Calendar,
  User,
  Hash,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import React, { useState } from "react";

interface GitLogModuleProps {
  tasks: Task[];
  onTasksFromGitLog: (tasks: Omit<Task, "id">[]) => void;
}

export const GitLogModule: React.FC<GitLogModuleProps> = ({
  tasks,
  onTasksFromGitLog,
}) => {
  const [gitLogText, setGitLogText] = useState("");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedLogs, setParsedLogs] = useState<GitLogEntry[]>([]);
  const [gitConfig, setGitConfig] = useState<GitConfig>({
    repoUrl: "",
    username: "",
    branch: "main",
    accessToken: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // 解析Git日志文本
  const parseGitLog = (logText: string): GitLogEntry[] => {
    if (!logText.trim()) return [];

    try {
      // 支持多种Git日志格式解析
      const lines = logText.split("\n").filter((line) => line.trim());
      const logs: GitLogEntry[] = [];
      let currentLog: Partial<GitLogEntry> = {};

      for (const line of lines) {
        // 匹配oneline格式: "<hash> <message>"
        // 例如: "3e9c4e8 fix: 修复窄距代码块未自适应bug #3633"
        const onelineMatch = line.match(/^([a-f0-9]{7,40})\s+(.+)$/);
        if (onelineMatch) {
          logs.push({
            hash: onelineMatch[1],
            message: onelineMatch[2],
            author: "未知", // oneline格式不包含作者信息
            date: new Date().toISOString(), // oneline格式不包含日期
            files: [],
            additions: 0,
            deletions: 0,
          });
          continue;
        }

        // 匹配commit hash
        if (line.startsWith("commit ") || line.match(/^[a-f0-9]{7,40}$/)) {
          if (currentLog.hash) {
            logs.push(currentLog as GitLogEntry);
          }
          currentLog = {
            hash: line.replace("commit ", "").trim(),
            files: [],
            additions: 0,
            deletions: 0,
          };
        }
        // 匹配作者
        else if (line.startsWith("Author:")) {
          currentLog.author = line.replace("Author:", "").trim();
        }
        // 匹配日期
        else if (line.startsWith("Date:")) {
          currentLog.date = line.replace("Date:", "").trim();
        }
        // 匹配提交信息
        else if (
          line.trim() &&
          !line.startsWith(" ") &&
          currentLog.hash &&
          !currentLog.message
        ) {
          currentLog.message = line.trim();
        }
        // 简单的提交信息格式（一行格式）
        else if (line.includes("|") && line.includes(" - ")) {
          const parts = line.split(" - ");
          if (parts.length >= 2) {
            const [dateAuthor, message] = parts;
            const [date, author] = dateAuthor.split(" | ");
            currentLog = {
              hash: Math.random().toString(36).substr(2, 9),
              date: date?.trim() || new Date().toISOString(),
              author: author?.trim() || "未知",
              message: message?.trim() || "",
              files: [],
              additions: 0,
              deletions: 0,
            };
            logs.push(currentLog as GitLogEntry);
            currentLog = {};
          }
        }
      }

      if (currentLog.hash) {
        logs.push(currentLog as GitLogEntry);
      }

      return logs;
    } catch (error) {
      console.error("解析Git日志失败:", error);
      return [];
    }
  };

  // 格式化Git日志文本
  const formatGitLog = () => {
    if (!gitLogText.trim()) return;

    try {
      const formatted = gitLogText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)
        .join("\n");
      setGitLogText(formatted);
    } catch (error) {
      console.error("格式化失败:", error);
    }
  };

  // 处理Git日志
  const handleProcessGitLog = () => {
    const logs = parseGitLog(gitLogText);
    setParsedLogs(logs);

    if (logs.length === 0) {
      alert("未能解析到有效的Git日志，请检查格式");
      return;
    }

    // 将Git日志作为AI参考内容，不生成实际任务
    const gitReferenceTask: Omit<Task, "id"> = {
      name: `Git日志参考 - ${new Date().toLocaleString()}`,
      totalHours: 0, // 参考内容不占用工时
      priority: "medium" as const,
      description: `此项为Git日志参考内容，供AI生成工时表时参考使用\n包含 ${logs.length} 个提交记录`,
      source: "gitlog" as const,
      sourceData: {
        gitCommits: logs,
        rawContent: gitLogText,
      },
    };

    onTasksFromGitLog([gitReferenceTask]);
  };

  // 自动爬取Git日志
  const handleAutoFetch = async () => {
    if (!gitConfig.repoUrl || !gitConfig.username) {
      alert("请先配置Git仓库信息");
      setIsConfigOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      // 调用API爬取Git日志
      const response = await fetch("/api/git/fetch-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gitConfig),
      });

      if (!response.ok) {
        throw new Error("爬取失败");
      }

      const { logs } = await response.json();
      setGitLogText(logs);
      setParsedLogs(parseGitLog(logs));
    } catch (error) {
      console.error("自动爬取失败:", error);
      alert("自动爬取失败，请检查配置或手动粘贴日志");
    } finally {
      setIsLoading(false);
    }
  };

  // DOM抓取Git日志（无需令牌）
  const handleDOMFetch = async () => {
    if (!gitConfig.repoUrl || !gitConfig.username) {
      alert("请先配置Git仓库信息（仓库地址和用户名即可）");
      setIsConfigOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      // 调用DOM抓取API
      const response = await fetch("/api/git/fetch-logs-dom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: gitConfig.repoUrl,
          username: gitConfig.username,
          branch: gitConfig.branch,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "DOM抓取失败");
      }

      const { logs, count } = result;
      setGitLogText(logs);
      setParsedLogs(parseGitLog(logs));
      alert(`成功抓取 ${count} 个提交记录！`);
    } catch (error) {
      console.error("DOM抓取失败:", error);
      alert(
        `DOM抓取失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const gitLogTaskCount = tasks.filter((t) => t.source === "gitlog").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Git日志
        </CardTitle>
        <CardDescription>
          支持两种自动抓取方案，也可手动复制日志：git log --author="用户名" --since="30 days ago" --oneline
          {gitLogTaskCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              已添加 {gitLogTaskCount} 个参考
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 工具栏 */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={formatGitLog}
            variant="outline"
            size="sm"
            disabled={!gitLogText.trim()}
            title="整理和格式化Git日志文本，去除多余空行和空格"
          >
            <FileText className="h-4 w-4 mr-1" />
            格式化
          </Button>
                    <Button
            onClick={handleAutoFetch}
            variant="outline"
            size="sm"
            disabled={isLoading}
            title="方案1：API抓取 - 需要访问令牌，支持私有仓库，所有部署平台可用，更稳定可靠"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            API抓取
          </Button>
          <Button
            onClick={handleDOMFetch}
            variant="outline"
            size="sm"
            disabled={isLoading}
            title="方案2：DOM抓取 - 无需访问令牌，仅支持公开仓库，部分部署平台可用（如Vercel不支持）"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            DOM抓取
          </Button>
          <Button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            variant="outline"
            size="sm"
            title="配置Git仓库信息：仓库地址、用户名、分支、访问令牌等"
          >
            <Settings className="h-4 w-4 mr-1" />
            设置
          </Button>
          <Button
            onClick={() => navigator.clipboard?.readText().then(setGitLogText)}
            variant="outline"
            size="sm"
            title="从剪贴板粘贴Git日志内容，支持多种格式"
          >
            <Clipboard className="h-4 w-4 mr-1" />
            粘贴
          </Button>
        </div>

        {/* Git配置面板 */}
        {isConfigOpen && (
          <Card className="p-4 bg-gray-50">
            <div className="space-y-3">
              <Label className="font-medium">Git仓库配置</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    仓库地址
                  </Label>
                  <Input
                    value={gitConfig.repoUrl}
                    onChange={(e) =>
                      setGitConfig({ ...gitConfig, repoUrl: e.target.value })
                    }
                    placeholder="https://github.com/user/repo.git"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    用户名
                  </Label>
                  <Input
                    value={gitConfig.username}
                    onChange={(e) =>
                      setGitConfig({ ...gitConfig, username: e.target.value })
                    }
                    placeholder="git config user.name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">分支</Label>
                  <Input
                    value={gitConfig.branch}
                    onChange={(e) =>
                      setGitConfig({ ...gitConfig, branch: e.target.value })
                    }
                    placeholder="main"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    访问令牌
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={gitConfig.accessToken}
                      onChange={(e) =>
                        setGitConfig({
                          ...gitConfig,
                          accessToken: e.target.value,
                        })
                      }
                      placeholder="GitHub Personal Access Token"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Git日志文本框 */}
        <div className="space-y-2">
          <Label>Git日志内容</Label>
          <textarea
            value={gitLogText}
            onChange={(e) => setGitLogText(e.target.value)}
            placeholder="粘贴Git日志内容，支持多种格式：&#10;&#10;格式1: git log --oneline&#10;格式2: git log --pretty=format:'%h - %an, %ar : %s'&#10;格式3: 完整的git log输出&#10;&#10;或点击'自动爬取'按钮从远程仓库获取"
            className="w-full h-64 p-3 border rounded-md resize-none text-sm font-mono"
          />
        </div>

        {/* 解析结果预览 */}
        {parsedLogs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              解析结果预览 ({parsedLogs.length} 条记录)
            </Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
              {parsedLogs.slice(0, 5).map((log, index) => (
                <div
                  key={index}
                  className="text-xs py-1 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    <code className="bg-gray-200 px-1 rounded">
                      {log.hash.substring(0, 7)}
                    </code>
                    <User className="h-3 w-3" />
                    <span>{log.author}</span>
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                  <p className="ml-4 text-gray-600 truncate">{log.message}</p>
                </div>
              ))}
              {parsedLogs.length > 5 && (
                <p className="text-xs text-gray-500 pt-1">
                  ...还有 {parsedLogs.length - 5} 条记录
                </p>
              )}
            </div>
          </div>
        )}

        {/* 处理按钮 */}
        <Button
          onClick={handleProcessGitLog}
          disabled={!gitLogText.trim()}
          className="w-full"
          title="将Git日志解析并添加为AI生成工时表时的参考内容，不占用实际工时"
        >
          <GitBranch className="h-4 w-4 mr-2" />
          添加为AI参考内容 ({parsedLogs.length} 条日志)
        </Button>

        {/* 已添加的参考统计 */}
        {gitLogTaskCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-4 w-4" />
              <span className="font-medium">已添加Git日志参考内容</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
