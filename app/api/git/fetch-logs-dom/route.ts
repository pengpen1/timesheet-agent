import { NextRequest, NextResponse } from 'next/server';

// 注意：在生产环境部署时需要考虑以下几点：
// 1. Vercel等serverless平台可能不支持playwright
// 2. 需要在Docker或VPS上部署才能使用浏览器自动化
// 3. 建议优先使用GitHub API方案（方案1）

// 动态导入playwright（避免在不支持的环境中报错）
async function getBrowser() {
  try {
    const { chromium } = await import('playwright');
    return await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
  } catch (error) {
    console.error('Playwright不可用:', error);
    throw new Error('浏览器自动化不可用，请使用方案1或手动粘贴日志');
  }
}

export async function POST(request: NextRequest) {
  // 检查环境变量，允许在某些环境中禁用此功能
  if (process.env.DISABLE_BROWSER_AUTOMATION === 'true') {
    return NextResponse.json(
      { error: '当前部署环境不支持浏览器自动化，请使用方案1或手动粘贴日志' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { repoUrl, username, branch = 'main' } = body;

    if (!repoUrl || !username) {
      return NextResponse.json(
        { error: '请提供仓库URL和用户名' },
        { status: 400 }
      );
    }

    // 解析GitHub仓库URL
    const repoMatch = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (!repoMatch) {
      return NextResponse.json(
        { error: '仅支持GitHub仓库URL' },
        { status: 400 }
      );
    }

    const [, owner, repo] = repoMatch;
    const commitsUrl = `https://github.com/${owner}/${repo}/commits/${branch}?author=${encodeURIComponent(username)}`;

    console.log('正在访问URL:', commitsUrl);

    // 启动浏览器
    const browser = await getBrowser();
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    const page = await context.newPage();

    try {
      // 访问commits页面
      await page.goto(commitsUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // 等待commits列表加载
      await page.waitForSelector('[data-testid="commits-list"], .commit-group, .commit-item, .Box-row', { 
        timeout: 10000 
      });

      // 抓取提交记录
      const commits = await page.evaluate(() => {
        const commitElements = document.querySelectorAll('[data-testid="commits-list"] .Box-row, .commit-group .commit-item, .commit-item');
        const results: any[] = [];

        commitElements.forEach((element, index) => {
          if (index >= 50) return; // 限制数量

          try {
            // 尝试多种选择器来获取信息
            const messageElement = element.querySelector('.commit-message, .markdown-title, [data-testid="commit-message"], .commit-title a, .js-navigation-open');
            const hashElement = element.querySelector('.commit-sha, [data-testid="commit-sha"], .commit-links-cell code, code');
            const authorElement = element.querySelector('.commit-author, [data-testid="commit-author"], .commit-meta .Link--muted, .author');
            const dateElement = element.querySelector('relative-time, .commit-meta time, time, [datetime]');

            // 获取提交信息
            const message = messageElement?.textContent?.trim() || '';
            const hash = hashElement?.textContent?.trim() || '';
            const author = authorElement?.textContent?.trim() || '';
            const dateAttr = dateElement?.getAttribute('datetime') || dateElement?.getAttribute('title') || '';
            const date = dateAttr || new Date().toISOString();

            if (message && hash) {
              results.push({
                hash: hash.substring(0, 7),
                message: message.replace(/\s+/g, ' ').trim(),
                author: author || '未知',
                date: date,
                files: [],
                additions: 0,
                deletions: 0
              });
            }
          } catch (err) {
            console.warn('解析commit元素失败:', err);
          }
        });

        return results;
      });

      await browser.close();

      if (commits.length === 0) {
        return NextResponse.json(
          { error: '未找到该用户的提交记录，请检查用户名或仓库权限' },
          { status: 404 }
        );
      }

      // 转换为日志格式
      const logLines = commits.map(commit => 
        `${commit.hash} ${commit.message}`
      ).join('\n');

      console.log(`成功抓取 ${commits.length} 个提交记录`);

      return NextResponse.json({
        logs: logLines,
        commits: commits,
        count: commits.length
      });

    } catch (pageError) {
      console.error('页面抓取错误:', pageError);
      await browser.close();
      return NextResponse.json(
        { error: '页面加载失败，可能是网络问题或仓库不存在' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('DOM抓取失败:', error);
    return NextResponse.json(
      { error: `抓取失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
} 