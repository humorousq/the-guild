# Book Crafter Skill

name: book-crafter
description: AI 驱动的技术书籍创建工具，支持从参考源创建书籍并自动部署到 GitHub Pages

---

## 概览

Book Crafter 帮助您从 GitHub 仓库或本地项目创建技术书籍，自动生成 VitePress 项目骨架，AI 辅助生成内容，并一键部署到 GitHub Pages。

## 何时使用

- 从 GitHub 仓库或本地项目创建技术书籍
- 自动生成 VitePress 项目骨架
- AI 辅助生成书籍内容
- 部署书籍到 GitHub Pages
- 生成 PDF 版本
- 确保开发环境和 CI 环境一致性

## 核心功能

### 🔄 有状态工作流引擎

6 个阶段的完整工作流，支持中断恢复：

1. **项目初始化** - 创建项目目录结构
2. **分析与规划** - 分析参考源，生成 BOOK_CONTEXT.md
3. **框架生成** - 生成 VitePress 项目骨架
4. **环境配置** - 安装依赖，验证环境一致性
5. **内容创作** - AI 辅助生成章节内容
6. **部署发布** - Git/GitHub 自动化部署

**特性**：
- ✅ 状态持久化（`.book-crafter/state.json`）
- ✅ 支持中断后恢复执行
- ✅ 阶段依赖验证

### 📦 框架生成器

自动生成 VitePress 项目骨架：

- ✅ 模板复制（vitepress-flat）
- ✅ 配置文件生成（package.json, VitePress config）
- ✅ 章节文件自动创建
- ✅ 支持中英文标题

### 🤖 AI 内容协作

AI 辅助内容创作，采用建议-确认模式：

- ✅ 自动解析 BOOK_CONTEXT.md
- ✅ 生成章节内容建议
- ✅ 用户确认后写入文件
- ✅ 自动修复章节编号

### 🚀 部署管理器

Git/GitHub 自动化集成：

- ✅ Git 仓库初始化
- ✅ GitHub CLI 集成（认证简化）
- ✅ 自动创建 GitHub 仓库
- ✅ 配置 GitHub Pages
- ✅ 自动推送和发布

## 快速开始

### 安装依赖

```bash
cd skills/book-crafter
npm install
```

### 完整工作流

```bash
# 1. 初始化工作流
node scripts/workflow-engine.mjs init --path /path/to/my-book

# 2. 执行下一阶段
node scripts/workflow-engine.mjs next

# 3. 恢复中断的工作流
node scripts/workflow-engine.mjs resume
```

### 独立使用模块

```bash
# 仅生成框架
node scripts/framework-generator.mjs --context BOOK_CONTEXT.md

# 内容创作
node scripts/content-collaborator.mjs suggest --chapter 1
node scripts/content-collaborator.mjs apply --chapter 1

# Git 部署
node scripts/deploy-manager.mjs init
node scripts/deploy-manager.mjs create-repo my-book
```

## API 参考

### WorkflowEngine

```javascript
import { WorkflowEngine } from './scripts/workflow-engine.mjs'

const engine = new WorkflowEngine(projectPath)

// 初始化工作流
await engine.init()

// 执行指定阶段
await engine.executeStage(stageNumber, input)

// 完成当前阶段
await engine.completeStage(stageNumber, output)

// 执行下一阶段
await engine.nextStage(input)

// 恢复执行
await engine.resume()

// 获取当前状态
const state = await engine.getState()
```

### FrameworkGenerator

```javascript
import { FrameworkGenerator } from './scripts/framework-generator.mjs'

const generator = new FrameworkGenerator(projectPath, analysis)
await generator.generate()
```

**analysis 结构**：
```javascript
{
  title: 'My Book',
  description: 'Book description',
  chapters: [
    { number: 1, title: 'Chapter 1', description: 'Introduction', file: 'chapter-01.md' }
  ]
}
```

### ContentCollaborator

```javascript
import { ContentCollaborator } from './scripts/content-collaborator.mjs'

const collaborator = new ContentCollaborator(projectPath)

// 加载上下文
const context = collaborator.loadContext()

// 生成章节建议
const suggestion = await collaborator.suggestChapterContent(1)

// 应用建议
await collaborator.applySuggestion(1, suggestion.content)
```

### DeployManager

```javascript
import { DeployManager } from './scripts/deploy-manager.mjs'

const deployer = new DeployManager(projectPath)

// Git 操作
await deployer.initGit()
await deployer.commit('Initial commit')

// GitHub 操作
await deployer.createGitHubRepo('my-book', { private: false })
await deployer.push()
```

## 环境要求

- **Node.js**: >= 22.0.0
- **npm**: >= 10.0.0
- **Git**: >= 2.30.0
- **GitHub CLI**: >= 2.40.0（可选，用于部署功能）

## 模板

| 模板名称 | 描述 | 适用场景 |
|---------|------|---------|
| `vitepress-flat` | 扁平结构的 VitePress 项目 | 单部分书籍、教程 |

## 测试

```bash
cd skills/book-crafter

# 运行所有测试
npm test

# 运行端到端测试
npm test tests/e2e/

# 运行特定模块测试
npm test tests/workflow-engine.test.mjs
```

## 文件结构

```
skills/book-crafter/
├── scripts/
│   ├── workflow-engine.mjs       # 工作流引擎
│   ├── framework-generator.mjs   # 框架生成器
│   ├── content-collaborator.mjs  # 内容协作
│   ├── deploy-manager.mjs        # 部署管理
│   ├── input-detector.mjs        # 输入检测
│   ├── reference-analyzer.mjs    # 参考分析
│   ├── environment-manager.mjs   # 环境管理
│   └── consistency-checker.mjs   # 一致性检查
├── tests/
│   ├── workflow-engine.test.mjs
│   ├── framework-generator.test.mjs
│   ├── content-collaborator.test.mjs
│   ├── deploy-manager.test.mjs
│   └── e2e/
│       └── full-workflow.test.mjs
├── templates/
│   └── vitepress-flat/           # VitePress 模板
├── utils/
│   └── logger.mjs                # 日志工具
└── knowledge/
    └── troubleshooting/          # 故障排除知识库
```

## 环境一致性

为确保本地开发和 CI 环境一致：

1. **固定 Node.js 版本**

   在 GitHub Actions workflow 中指定：
   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '22.13.0'
   ```

2. **提交 lock 文件**

   始终提交 `package-lock.json` 以确保依赖版本一致。

3. **平台依赖**

   如果使用原生依赖，确保在 package.json 中正确配置 optionalDependencies。

## 常见问题

### Q: 如何恢复中断的工作流？

A: 工作流状态保存在 `.book-crafter/state.json` 中，运行：
```bash
node scripts/workflow-engine.mjs resume
```

### Q: 为什么本地构建成功但 CI 失败？

A: 通常是环境不一致导致，请检查：
1. Node.js 版本是否一致
2. 是否提交了 package-lock.json
3. 平台特定依赖是否正确配置

### Q: 如何修复 Node.js 版本不匹配？

A: 更新 GitHub Actions workflow：
```yaml
node-version: '22.13.0'  # 与本地版本一致
```

### Q: PDF 生成失败怎么办？

A: 请检查：
1. 是否安装了所有必需依赖
2. 构建过程是否成功
3. 查看 `scripts/generate-pdf.mjs` 脚本配置

### Q: 如何使用 AI 内容生成功能？

A: 内容生成采用建议-确认模式：
```bash
# 1. 生成建议
node scripts/content-collaborator.mjs suggest --chapter 1

# 2. 审查建议内容

# 3. 确认后应用
node scripts/content-collaborator.mjs apply --chapter 1
```

### Q: GitHub CLI 认证失败怎么办？

A: 确保：
1. 已安装 GitHub CLI: `gh --version`
2. 已登录: `gh auth login`
3. 有仓库创建权限

## 相关文档

- [设计文档](./docs/superpowers/specs/2026-03-25-book-crafter-phase2-design.md)
- [实施计划](./docs/superpowers/plans/2026-03-25-book-crafter-phase2-implementation.md)
