# TimesheetAgent 部署指南

## 部署选项对比

| 平台 | Git方案1 (API) | Git方案2 (DOM) | 推荐程度 |
|------|---------------|---------------|----------|
| Vercel | ✅ 支持 | ❌ 不支持* | ⭐⭐⭐ |
| Netlify | ✅ 支持 | ❌ 不支持* | ⭐⭐⭐ |
| Railway | ✅ 支持 | ✅ 支持 | ⭐⭐⭐⭐ |
| VPS/Docker | ✅ 支持 | ✅ 支持 | ⭐⭐⭐⭐⭐ |

*注：可通过设置环境变量 `DISABLE_BROWSER_AUTOMATION=true` 禁用方案2

## 1. Vercel 部署（推荐）

### 步骤
```bash
npm run build
vercel --prod
```

### 环境变量设置
```bash
DISABLE_BROWSER_AUTOMATION=true
```

### 特点
- ✅ 完全支持Git方案1（API方式）
- ✅ 所有其他功能正常
- ❌ 不支持Git方案2（DOM抓取）
- ✅ 免费额度充足

## 2. Railway 部署

### 步骤
1. 连接GitHub仓库
2. 自动检测Next.js项目
3. 部署

### 特点
- ✅ 支持所有功能
- ✅ 包括DOM抓取功能
- ✅ 自动安装playwright

## 3. Docker 部署

### Dockerfile
```dockerfile
FROM node:18-alpine

# 安装playwright依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# 设置playwright使用系统chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### 构建和运行
```bash
docker build -t timesheet-agent .
docker run -p 3000:3000 timesheet-agent
```

## 4. VPS 部署

### 安装依赖
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm

# 安装项目依赖
npm ci
npx playwright install chromium

# 构建项目
npm run build

# 使用PM2管理进程
npm install -g pm2
pm2 start ecosystem.config.js
```

### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'timesheet-agent',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## 功能可用性

### Git日志获取方案对比

**方案1 (推荐)**：
- ✅ 所有平台都支持
- ✅ 更稳定可靠
- ✅ 访问私有仓库
- ❌ 需要配置GitHub Token

**方案2**：
- ✅ 无需Token
- ❌ 仅部分平台支持
- ❌ 依赖页面结构
- ✅ 适合公开仓库

## 推荐部署策略

1. **快速试用**：Vercel部署，使用方案1
2. **完整功能**：Railway或VPS部署
3. **企业级**：Docker + VPS/云服务器

## 故障排除

### DOM抓取失败
如果遇到以下错误：
```
浏览器自动化不可用，请使用方案1或手动粘贴日志
```

**解决方案**：
1. 设置环境变量禁用方案2
2. 使用方案1（API方式）
3. 手动粘贴Git日志

### 内存不足
如果部署时遇到内存不足：
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
``` 