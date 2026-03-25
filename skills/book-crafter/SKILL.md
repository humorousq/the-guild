# Book Crafter Skill

name: book-crafter
description: 创建技术书籍并部署到 GitHub Pages

---

## 概览

Book Crafter 是一个 AI 驱动的技能，帮助您从各种来源创建技术书籍，并自动部署到 GitHub Pages。它支持分析现有书籍项目、创建新的书籍结构、AI 辅助内容创作、生成 PDF 文件，并确保本地和 CI 环境的一致性。

## 完成度

**当前版本**: 2.0.0
**完成度**: 100% ✅

- ✅ 基础工具层（Logger, InputDetector, EnvironmentManager, ConsistencyChecker, ReferenceAnalyzer）
- ✅ 业务逻辑层（WorkflowEngine, FrameworkGenerator, ContentCollaborator, DeployManager）
- ✅ 有状态工作流（支持中断恢复）
- ✅ AI 辅助内容创作
- ✅ Git/GitHub 集成
- ✅ 完整测试覆盖（70 个测试）

## 何时使用

使用此技能当您需要：

- 从 GitHub 仓库创建技术书籍
- 从本地 Markdown 文件创建书籍
- 分析现有书籍项目结构
- AI 辅助生成书籍内容
- 部署书籍到 GitHub Pages
- 生成 PDF 版本的书籍
- 确保开发环境和 CI 环境一致性

## 核心模块

### WorkflowEngine（工作流引擎）

有状态的工作流编排系统，支持 6 个阶段：

1. **项目初始化** - 创建项目目录
2. **分析与规划** - 分析参考源，生成 BOOK_CONTEXT.md
3. **框架生成** - 生成 VitePress 项目骨架
4. **环境配置** - 安装依赖，验证一致性
5. **内容创作** - AI 辅助生成章节内容
6. **部署发布** - Git/GitHub 自动化部署

**关键特性**：
- ✅ 状态持久化到 `.book-crafter/state.json`
- ✅ 支持中断恢复执行
- ✅ 阶段验证和依赖检查

### FrameworkGenerator（框架生成器）

自动生成 VitePress 项目骨架：

- ✅ 模板复制（vitepress-flat）
- ✅ 配置文件生成（package.json, VitePress config）
- ✅ 章节文件创建
- ✅ 中英文标题处理

### ContentCollaborator（内容协作）

AI 辅助内容创作：

- ✅ BOOK_CONTEXT.md 解析
- ✅ 章节内容建议生成
- ✅ 建议应用到文件
- ✅ 章节编号修复

### DeployManager（部署管理）

Git/GitHub 自动化：

- ✅ Git 仓库初始化
- ✅ GitHub CLI 集成
- ✅ GitHub 仓库创建
- ✅ GitHub Pages 配置
- ✅ 远程推送

## 工作流程

### 完整工作流

```bash
# 1. 创建新项目
cd /path/to/your/workspace
node skills/book-crafter/scripts/workflow-engine.mjs init --path ./my-book

# 2. 执行完整工作流（阶段1-6）
node skills/book-crafter/scripts/workflow-engine.mjs run-all

# 或分步执行
node skills/book-crafter/scripts/workflow-engine.mjs next
```

### 独立使用模块

```bash
# 仅生成框架
node skills/book-crafter/scripts/framework-generator.mjs --context BOOK_CONTEXT.md

# 内容创作
node skills/book-crafter/scripts/content-collaborator.mjs suggest --chapter 1
node skills/book-crafter/scripts/content-collaborator.mjs apply --chapter 1

# Git 部署
node skills/book-crafter/scripts/deploy-manager.mjs init
node skills/book-crafter/scripts/deploy-manager.mjs create-repo my-book
```

## 快速参考

### 命令格式

```bash
# 完整工作流
node scripts/workflow-engine.mjs init --path /path/to/project
node scripts/workflow-engine.mjs next
node scripts/workflow-engine.mjs resume

# 独立命令
/book-crafter https://github.com/{owner}/{repo}
/book-crafter /path/to/project
```

### 可用模板

| 模板名称 | 描述 |
|---------|------|
| `vitepress-flat` | 扁平结构的 VitePress 项目 |

### 环境要求

- Node.js >= 22.0.0
- npm >= 10.0.0
- Git >= 2.30.0
- GitHub CLI >= 2.40.0（可选，用于部署）

## 关键特性

### 有状态工作流

- ✅ 状态持久化到 `.book-crafter/state.json`
- ✅ 支持中断恢复
- ✅ 阶段依赖验证
- ✅ 错误处理和回退

### AI 辅助内容创作

- ✅ 建议生成：AI 生成章节内容建议
- ✅ 用户确认：展示建议，等待用户确认
- ✅ 应用更改：确认后写入文件
- ✅ 编号修复：自动修复章节编号

### 环境一致性检查

自动检测并提示以下问题：
- 本地与 CI 环境的 Node.js 版本不匹配
- 缺少 lock 文件
- 平台特定依赖问题

### Git/GitHub 集成

- ✅ 自动初始化 Git 仓库
- ✅ 使用 GitHub CLI 创建仓库
- ✅ 配置 GitHub Pages
- ✅ 创建初始提交和发布

## 测试

**总测试数**: 70 个
**测试覆盖率**: 完整覆盖所有核心功能

测试分类：
- 基础模块测试：10 个
- WorkflowEngine 测试：16 个
- FrameworkGenerator 测试：6 个
- DeployManager 测试：4 个
- ContentCollaborator 测试：5 个
- 端到端测试：2 个
- 其他集成测试：27 个

运行测试：
```bash
cd skills/book-crafter
npm test                    # 运行所有测试
npm test tests/e2e/         # 运行端到端测试
```

## API 参考

### WorkflowEngine

```javascript
const engine = new WorkflowEngine(projectPath)

// 初始化
await engine.init()

// 执行阶段
await engine.executeStage(stageNumber, input)
await engine.completeStage(stageNumber, output)

// 流程控制
await engine.nextStage(input)
await engine.resume()

// 状态管理
const state = await engine.getState()
```

### FrameworkGenerator

```javascript
const generator = new FrameworkGenerator(projectPath, analysis)
await generator.generate()
```

### ContentCollaborator

```javascript
const collaborator = new ContentCollaborator(projectPath)

// 加载上下文
const context = collaborator.loadContext()

// 生成建议
const suggestion = await collaborator.suggestChapterContent(chapterNumber)

// 应用建议
await collaborator.applySuggestion(chapterNumber, suggestion.content)
```

### DeployManager

```javascript
const deployer = new DeployManager(projectPath)

// Git 操作
await deployer.initGit()
await deployer.commit(message)

// GitHub 操作
await deployer.createGitHubRepo(repoName, options)
await deployer.push()
```

## 环境一致性

为确保本地开发和 CI 环境一致，建议：

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
│   └── vitepress-flat/           # VitePress 扁平模板
├── utils/
│   └── logger.mjs                # 日志工具
└── knowledge/
    └── troubleshooting/          # 故障排除知识库
```

## 常见问题

### Q: 如何恢复中断的工作流？

A: 工作流状态保存在 `.book-crafter/state.json` 中。重新运行：
```bash
node scripts/workflow-engine.mjs resume
```

### Q: 为什么本地构建成功但 CI 失败？

A: 通常是环境不一致导致。请检查：
1. Node.js 版本是否一致
2. 是否提交了 package-lock.json
3. 平台特定依赖是否正确配置

### Q: 如何修复 Node.js 版本不匹配？

A: 更新 GitHub Actions workflow 中的 `node-version` 配置：
```yaml
node-version: '22.13.0'  # 与本地版本一致
```

### Q: PDF 生成失败怎么办？

A: PDF 生成依赖于正确安装的依赖。请检查：
1. 是否安装了所有必需依赖
2. 构建过程是否成功
3. 查看 `scripts/generate-pdf.mjs` 脚本配置

### Q: 如何使用 AI 内容生成功能？

A: 内容生成采用建议-确认模式：
1. AI 生成章节内容建议
2. 展示给用户审查
3. 用户确认后写入文件

```bash
# 生成建议
node scripts/content-collaborator.mjs suggest --chapter 1

# 应用建议
node scripts/content-collaborator.mjs apply --chapter 1
```

## 更新日志

### v2.0.0 (2026-03-25)

**第二阶段完成**
- ✅ 实现完整的工作流引擎
- ✅ 实现 VitePress 框架生成器
- ✅ 实现 AI 辅助内容创作
- ✅ 实现 Git/GitHub 部署自动化
- ✅ 添加端到端测试
- ✅ 完成度从 40% 提升到 100%

### v1.0.0 (2026-03-24)

**第一阶段完成**
- ✅ 实现基础工具层
- ✅ 环境一致性检查
- ✅ 参考源分析
- ✅ 完成度 40%

