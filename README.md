## 🧠 项目名称（Project Name）

**TimesheetAgent：智能工时填报器**

一个基于 Next.js 15 + Tailwind v4.1 的智能工时填报工具，通过双 Agent 架构自动生成标准化工时表。

## ✨ 主要特性

- 🤖 **真正的 AI 驱动**: 集成 OpenAI、Moonshot、智谱 AI 等多种模型，生成专业工作描述
- 🎯 **双 Agent 智能架构**: TaskAgent 任务分配 + TimesheetAgent 工时生成
- 📊 **多种分配策略**: 按天平均/按优先级/按功能模块分配
- 📁 **多格式导出**: 支持 Excel(.xlsx)、CSV(.csv)、文本(.txt)格式
- 💾 **本地存储**: 自动保存配置和历史记录
- ✏️ **实时编辑**: 工时表支持在线编辑和实时更新
- 📋 **一键复制**: 快速复制工时表到剪贴板
- 🎨 **现代 UI 设计**: 基于 shadcn/ui 组件库，Material Design 风格
- 🌗 **深色模式**: 支持明暗主题切换
- ⚡ **高性能**: 基于 Next.js 15 + Tailwind v4，极速响应

## TODO

- [x] 拆分page.tsx 为多个组件
- [x] 支持自定义模型配置
- [x] 支持第三方的大模型供应商
- [x] 任务输入支持粘贴图片，文件，文本
- [ ] 支持自动拉取git日志
- [ ] 支持基于puppeteer OR playwright 的自动化填报

## 🚀 快速开始

### 环境要求

- Node.js 18.17+
- npm/yarn/pnpm

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

### 启动开发服务器

```bash
# 开发模式
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 [http://localhost:3001](http://localhost:3001) 开始使用。

### 构建生产版本

```bash
# 构建
npm run build

# 启动生产服务器
npm run start
```

## 📖 使用指南

### 1. 配置任务

- 点击"添加任务"按钮添加新任务
- 设置任务名称、总工时、优先级和描述
- 支持添加多个任务

### 2. 配置工作参数

- **日期范围**: 设置工作开始和结束日期
- **工作时间**: 配置每日工时（默认 8 小时）
- **排除选项**: 可选择排除双休日和法定节假日
- **分配模式**: 选择任务分配策略

### 3. 配置 AI 模型（必需）

- 切换到"模型配置"标签页
- 选择模型提供商（OpenAI、Moonshot、智谱 AI 等）
- 填写 baseURL、API Key 和模型名称
- 点击"测试连通性"验证配置
- 保存配置后即可使用 AI 功能

### 4. 生成工时表

- 返回"任务配置"页面，点击"生成智能工时表"
- 系统自动运行双 Agent 算法，AI 实时生成专业描述
- 切换到"工时表结果"标签页查看结果

### 5. 编辑和导出

- 直接点击表格内容进行编辑
- 使用导出按钮下载 Excel、CSV 或文本格式
- 使用复制按钮快速复制到剪贴板

## ⚙️ 系统架构

### 双 Agent 架构

```
用户输入 → TaskAgent(任务分配) → TimesheetAgent(工时生成) → 格式化输出
```

1. **TaskAgent（任务分解 Agent）**

   - 输入：任务列表、日期范围、工作模式
   - 处理：智能分配任务到各个工作日
   - 输出：每日任务分配方案

2. **TimesheetAgent（工时生成 Agent）**
   - 输入：TaskAgent 的分配结果
   - 处理：生成标准化工时表格式
   - 输出：完整的工时表数据

### 技术栈

| 类型       | 技术         | 版本   |
| ---------- | ------------ | ------ |
| 前端框架   | Next.js      | 15.0+  |
| 样式系统   | Tailwind CSS | 4.1+   |
| 状态管理   | Zustand      | 4.4+   |
| 类型检查   | TypeScript   | 5.0+   |
| 日期处理   | date-fns     | 2.30+  |
| 图标库     | Lucide React | 0.294+ |
| Excel 导出 | xlsx         | 0.18+  |

### 分配策略

- **按天平均分配**: 将所有任务均匀分配到工作日
- **按优先级分配**: 优先完成高优先级任务
- **按功能分配**: 专注完成单个功能后再开始下一个

### 数据存储

- 使用 localStorage 进行本地数据持久化
- 自动保存用户配置和生成的工时表
- 支持配置的保存、加载和删除

## 📁 项目结构

```
timesheetagent/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── lib/                   # 核心逻辑库
│   ├── agents/           # Agent算法
│   │   ├── taskAgent.ts  # 任务分配Agent
│   │   └── timesheetAgent.ts # 工时生成Agent
│   ├── types.ts          # TypeScript类型定义
│   ├── utils.ts          # 通用工具函数
│   ├── store.ts          # Zustand状态管理
│   └── export.ts         # 导出功能模块
├── project_document/      # 项目文档（开发过程记录）
├── package.json          # 项目配置
├── tailwind.config.js    # Tailwind配置
├── tsconfig.json         # TypeScript配置
└── README.md             # 项目说明
```

## 🎯 核心功能

### 输入字段

| 字段     | 必填 | 描述                              |
| -------- | ---- | --------------------------------- |
| 任务列表 | ✅   | 任务名称 + 总工时 + 优先级 + 描述 |
| 日期范围 | ✅   | 工作开始和结束日期                |
| 工作时间 | ✅   | 每日工时、排除选项                |
| 分配模式 | ✅   | 任务分配策略选择                  |
| 工作内容 | 可选 | 自定义工作内容模板                |

### 输出格式

| 列名     | 描述           |
| -------- | -------------- |
| 日期     | 工作日期       |
| 工作内容 | 具体工作描述   |
| 消耗工时 | 当日工作小时数 |
| 剩余工时 | 当日剩余工时   |

### 导出选项

- **Excel 格式**: 包含格式化和统计信息
- **CSV 格式**: 适合数据分析和导入其他系统
- **文本格式**: 纯文本报告，便于查看和打印
- **剪贴板**: 快速复制表格数据

## 🔧 开发说明

### 开发环境设置

1. 克隆项目

```bash
git clone <repository-url>
cd timesheetagent
```

2. 安装依赖

```bash
npm install
```

3. 启动开发服务器

```bash
npm run dev
```

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 使用 Prettier 进行代码格式化
- 组件采用函数式组件 + Hooks

### 构建部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

## 📝 更新日志

### v1.0.0 (2025-06-16)

**🎉 首次发布**

- ✅ 实现双 Agent 核心算法
- ✅ 完成前端界面和交互
- ✅ 支持多种导出格式
- ✅ 实现本地数据存储
- ✅ 添加实时编辑功能
- ✅ 优化用户体验和界面设计

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 ISC 许可证。


---

**TimesheetAgent** - 让工时填报变得智能而高效 🚀
