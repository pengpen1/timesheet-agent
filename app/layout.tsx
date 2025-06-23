import type { Metadata } from "next";
import "../styles/globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "TimesheetAgent - 智能工时填报器",
  description: "高效自动化的工时填报工具，通过AI算法快速生成标准化工时表",
  keywords: ["工时填报", "时间管理", "AI工具", "效率工具"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
