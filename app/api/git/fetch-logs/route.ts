import { NextRequest, NextResponse } from 'next/server';
import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, username, branch = 'main', accessToken } = await request.json();

    if (!repoUrl || !username) {
      return NextResponse.json(
        { error: '仓库地址和用户名为必填项' },
        { status: 400 }
      );
    }

    // 创建临时目录
    const tempDir = path.join(os.tmpdir(), `git-temp-${Date.now()}`);
    
    try {
      // 初始化Git客户端
      const git = simpleGit();
      
      // 构建带认证的仓库URL
      let authRepoUrl = repoUrl;
      if (accessToken && repoUrl.includes('github.com')) {
        authRepoUrl = repoUrl.replace('https://', `https://${accessToken}@`);
      }

      // 克隆仓库到临时目录
      await git.clone(authRepoUrl, tempDir);
      
      // 切换到临时目录
      const repoGit = simpleGit(tempDir);
      
      // 获取指定用户的提交记录 (最近30天，最多100条)
      const since = new Date();
      since.setDate(since.getDate() - 30);
      
      const logs = await repoGit.log({
        '--author': username,
        '--since': since.toISOString().split('T')[0],
        '--max-count': '100',
        '--pretty': 'format:%H|%an|%ad|%s',
        '--date': 'iso',
      });

      // 格式化日志输出
      const formattedLogs = logs.all.map(log => {
        const [hash, author, date, message] = log.hash.split('|');
        return `${hash.substring(0, 7)} - ${author}, ${date} : ${message}`;
      }).join('\n');

      // 清理临时目录
      await fs.rmdir(tempDir, { recursive: true });

      return NextResponse.json({
        logs: formattedLogs,
        count: logs.all.length,
      });

    } catch (gitError) {
      // 清理临时目录
      try {
        await fs.rmdir(tempDir, { recursive: true });
      } catch (cleanupError) {
        console.error('清理临时目录失败:', cleanupError);
      }
      
      console.error('Git操作失败:', gitError);
      return NextResponse.json(
        { error: 'Git仓库访问失败，请检查仓库地址、权限或网络连接' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API处理失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 