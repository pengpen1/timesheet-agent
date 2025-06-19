import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import Image from "next/image";
import { 
  Paperclip, 
  Check,
  AlertTriangle,
  Loader2,
  Eye,
  Trash2,
  X
} from "lucide-react";
import type { Task } from "@/types/types";

interface AttachmentItem {
  id: string;
  type: 'text' | 'image' | 'excel' | 'word' | 'pdf' | 'file';
  name: string;
  content: string;
  size?: number;
  addedAt: string;
}

interface AttachmentModuleProps {
  tasks: Task[];
  onTasksFromAttachment: (tasks: Omit<Task, "id">[]) => void;
}

export const AttachmentModule: React.FC<AttachmentModuleProps> = ({
  tasks,
  onTasksFromAttachment,
}) => {
  const [attachmentContent, setAttachmentContent] = useState("");
  const [attachmentItems, setAttachmentItems] = useState<AttachmentItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 获取文件类型图标
  const getFileIcon = (type: string) => {
    const iconMap = {
      'excel': '/svgs/file_excel.svg',
      'word': '/svgs/file_word.svg', 
      'pdf': '/svgs/file_pdf.svg',
      'file': '/svgs/file_file.svg'
    };
    
    return iconMap[type as keyof typeof iconMap] || '/svgs/file_file.svg';
  };

  // 检测文件类型
  const detectFileType = (fileName: string, mimeType: string): AttachmentItem['type'] => {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    
    if (['xlsx', 'xls', 'csv'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
    if (['docx', 'doc', 'rtf'].includes(ext) || mimeType.includes('word') || mimeType.includes('document')) return 'word';
    if (['pdf'].includes(ext) || mimeType.includes('pdf')) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mimeType.startsWith('image/')) return 'image';
    if (['txt', 'md', 'json', 'log'].includes(ext) || mimeType.startsWith('text/')) return 'text';
    
    return 'file';
  };

  // 处理粘贴事件
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          await processFile(file);
        }
      } else if (item.kind === 'string' && item.type === 'text/plain') {
        item.getAsString((text) => {
          if (text.trim()) {
            const textItem: AttachmentItem = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'text',
              name: `文本内容 - ${new Date().toLocaleTimeString()}`,
              content: text,
              addedAt: new Date().toISOString(),
            };
            setAttachmentItems(prev => [...prev, textItem]);
          }
        });
      }
    }
  };

  // 处理文件
  const processFile = async (file: File) => {
    const fileType = detectFileType(file.name, file.type);
    let content = '';

    try {
      if (fileType === 'image') {
        // 图片转base64
        content = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      } else if (fileType === 'text') {
        // 文本文件直接读取
        content = await file.text();
      } else {
        // 其他文件类型记录基本信息
        content = `文件名: ${file.name}\n类型: ${file.type}\n大小: ${(file.size / 1024).toFixed(2)}KB\n上传时间: ${new Date().toLocaleString()}`;
      }

      const attachmentItem: AttachmentItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: fileType,
        name: file.name,
        content,
        size: file.size,
        addedAt: new Date().toISOString(),
      };

      setAttachmentItems(prev => [...prev, attachmentItem]);
    } catch (error) {
      console.error('处理文件失败:', error);
      alert(`处理文件 ${file.name} 失败`);
    }
  };

  // 删除附件项
  const removeAttachmentItem = (id: string) => {
    setAttachmentItems(prev => prev.filter(item => item.id !== id));
  };

  // 预览附件
  const previewAttachment = (item: AttachmentItem) => {
    if (item.type === 'image') {
      const win = window.open('', '_blank');
      win?.document.write(`
        <html>
          <head><title>${item.name}</title></head>
          <body style="margin:0;padding:20px;background:#f5f5f5;">
            <img src="${item.content}" style="max-width:100%;max-height:100vh;display:block;margin:0 auto;" />
          </body>
        </html>
      `);
    } else {
      const win = window.open('', '_blank');
      win?.document.write(`
        <html>
          <head><title>${item.name}</title></head>
          <body style="margin:0;padding:20px;font-family:monospace;">
            <pre style="white-space: pre-wrap; word-wrap: break-word;">${item.content}</pre>
          </body>
        </html>
      `);
    }
  };

  // 处理附件内容作为AI参考
  const handleAddAttachmentReference = () => {
    if (!attachmentContent.trim() && attachmentItems.length === 0) {
      alert('请先添加内容或粘贴文件');
      return;
    }

    setIsProcessing(true);
    
    try {
      const attachmentTasks: Omit<Task, "id">[] = [];

      // 如果有文本输入，创建一个文本参考任务
      if (attachmentContent.trim()) {
        attachmentTasks.push({
          name: `文本参考 - ${new Date().toLocaleString()}`,
          totalHours: 0, // 附件参考不占用工时
          priority: "medium" as const,
          description: "此项为文本参考内容，供AI生成工时表时参考使用",
          source: "attachment" as const,
          sourceData: {
            rawContent: attachmentContent.trim(),
          },
        });
      }

      // 为每个附件项创建单独的参考任务
      attachmentItems.forEach((item, index) => {
        attachmentTasks.push({
          name: `${item.name} - 附件参考`,
          totalHours: 0, // 附件参考不占用工时
          priority: "medium" as const,
          description: `此项为附件参考内容，供AI生成工时表时参考使用\n文件类型: ${item.type.toUpperCase()}\n添加时间: ${new Date(item.addedAt).toLocaleString()}`,
          source: "attachment" as const,
          sourceData: {
            rawContent: `[${item.name}]\n类型: ${item.type}\n${item.content}`,
            attachmentId: item.id,
          },
        });
      });

      onTasksFromAttachment(attachmentTasks);
      
      // 清空输入框和附件列表
      setAttachmentContent("");
      setAttachmentItems([]);
      
    } catch (error) {
      console.error('添加附件参考失败:', error);
      alert('添加失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const attachmentTaskCount = tasks.filter(t => t.source === 'attachment').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          附件模块
        </CardTitle>
        <CardDescription>
          从文档、图片等文件智能提取任务
          {attachmentTaskCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              已添加 {attachmentTaskCount} 个参考
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 附件内容输入区域 */}
        <div className="space-y-2">
          <Label>补充内容（支持直接粘贴文件/图片）</Label>
          <textarea
            value={attachmentContent}
            onChange={(e) => setAttachmentContent(e.target.value)}
            onPaste={handlePaste}
            placeholder="在此粘贴或输入补充内容：&#10;&#10;• 项目需求文档&#10;• 工作安排清单&#10;• 会议纪要&#10;• 技术规范&#10;• 图片内容描述&#10;• Excel表格文件&#10;• 其他工作相关内容&#10;&#10;支持直接Ctrl+V粘贴文件和图片"
            className="w-full h-48 p-3 border rounded-md resize-none text-sm"
          />
        </div>

        {/* 已粘贴内容回显区域 */}
        {attachmentItems.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              已粘贴内容 ({attachmentItems.length})
            </Label>
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2 bg-gray-50">
              {attachmentItems.map((item) => (
                <Card key={item.id} className="p-3 bg-white">
                  <div className="flex items-center gap-3">
                    {/* 图标或缩略图 */}
                    <div className="flex-shrink-0">
                      {item.type === 'image' ? (
                        <div className="w-12 h-12 border rounded overflow-hidden">
                          <img 
                            src={item.content} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center">
                          <img 
                            src={getFileIcon(item.type)} 
                            alt={item.type}
                            className="w-8 h-8"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.type.toUpperCase()}</span>
                        {item.size && <span>{(item.size / 1024).toFixed(1)}KB</span>}
                        <span>{new Date(item.addedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewAttachment(item)}
                        title="预览"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachmentItem(item.id)}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 添加按钮 */}
        <Button
          onClick={handleAddAttachmentReference}
          disabled={isProcessing || (!attachmentContent.trim() && attachmentItems.length === 0)}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              正在添加参考内容...
            </>
          ) : (
            <>
              <Paperclip className="h-4 w-4 mr-2" />
              添加为AI参考内容
            </>
          )}
        </Button>

        {/* 已添加的参考统计 */}
        {attachmentTaskCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-4 w-4" />
              <span className="font-medium">
                已添加 {attachmentTaskCount} 个参考内容
              </span>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2 text-blue-700">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium mb-1">使用说明：</p>
              <ul className="space-y-1 text-blue-600">
                <li>• 直接粘贴文本内容、文档片段或图片</li>
                <li>• 数据不会保存，仅作为AI生成工时表的参考信息</li>
                <li>• 参考内容不会占用实际工时分配</li>
                <li>• AI会根据参考内容优化工时描述</li>
                <li>• 支持Excel、Word、PDF、图片等多种格式</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 