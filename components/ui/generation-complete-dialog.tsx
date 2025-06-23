import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { Progress } from "./progress";
import { CheckCircle, Clock } from "lucide-react";

interface GenerationCompleteDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  autoRedirectSeconds?: number;
}

export const GenerationCompleteDialog: React.FC<GenerationCompleteDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  autoRedirectSeconds = 3,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(autoRedirectSeconds);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(false);

  useEffect(() => {
    if (!open) {
      setRemainingSeconds(autoRedirectSeconds);
      setIsAutoRedirecting(false);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsAutoRedirecting(true);
          clearInterval(timer);
          // 延迟一点时间让用户看到自动跳转状态
          setTimeout(() => {
            onConfirm();
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, autoRedirectSeconds, onConfirm]);

  const progressValue = ((autoRedirectSeconds - remainingSeconds) / autoRedirectSeconds) * 100;

  return (
    <Dialog open={open} onOpenChange={() => !isAutoRedirecting && onCancel()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-6 w-6" />
            工时表生成完成
          </DialogTitle>
          <DialogDescription>
            您的智能工时表已经成功生成！是否立即前往查看结果？
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* 自动跳转进度 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-600">
                <Clock className="h-4 w-4" />
                <span>
                  {isAutoRedirecting 
                    ? "正在跳转..." 
                    : `${remainingSeconds}秒后自动前往结果页面`
                  }
                </span>
              </div>
              <span className="text-gray-500">{Math.round(progressValue)}%</span>
            </div>
            <Progress 
              value={progressValue} 
              className="h-2 transition-all duration-1000 ease-linear"
            />
          </div>

          {/* 提示信息 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              🎉 恭喜！您的工时表已经智能生成完成。您可以在结果页面中查看详细内容、编辑条目或导出到Excel等格式。
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isAutoRedirecting}
          >
            稍后查看
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isAutoRedirecting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isAutoRedirecting ? "跳转中..." : "立即前往"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 