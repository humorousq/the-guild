# Book Crafter Skill 第二阶段设计文档

**版本**: 2.0.0
**创建日期**: 2026-03-25
**作者**: Claude & User
**状态**: 设计中

---

## 目录

1. [概览](#1-概览)
2. [架构设计](#2-架构设计)
3. [WorkflowEngine 设计](#3-workflowengine-设计)
4. [FrameworkGenerator 设计](#4-frameworkgenerator-设计)
5. [ContentCollaborator 设计](#5-contentcollaborator-设计)
6. [DeployManager 设计](#6-deploymanager-设计)
7. [数据流设计](#7-数据流设计)
8. [测试策略](#8-测试策略)
9. [实施优先级](#9-实施优先级)

---

## 1. 概览

### 1.1 第二阶段目标

在第一阶段完成基础工具层的基础上，第二阶段实现核心业务逻辑层，提供完整的书籍创建工作流。

**第二阶段范围**：
- ✅ WorkflowEngine - 5阶段工作流编排
- ✅ FrameworkGenerator - VitePress 项目骨架生成
- ✅ ContentCollaborator - AI 辅助内容创作
- ✅ DeployManager - Git/GitHub 部署自动化

**预期完成度**：从40%提升到100%，达到生产就绪

### 1.2 核心创新

1. **有状态工作流** - 保存每个阶段状态，支持中断恢复
2. **BOOK_CONTEXT.md** - AI的项目理解文档，类似CLAUDE.md
3. **建议-确认模式** - AI提供内容建议，用户确认后写入
4. **GitHub CLI 集成** - 简化认证和仓库管理

---

## 2. 架构设计

### 2.1 整体架构

```
第一阶段（基础层）              第二阶段（业务层）

┌──────────────────────┐      ┌───────────────────────────┐
│ Logger              │      │ WorkflowEngine            │
│ InputDetector       │─────→│  - 状态管理                │
│ EnvironmentManager  │      │  - 阶段编排                │
│ ConsistencyChecker  │      │  - 恢复执行                │
│ ReferenceAnalyzer   │      └───────────────────────────┘
└──────────────────────┘                ↓
                                 ┌───────────────────────────┐
                                 │ FrameworkGenerator        │
                                 │  - 模板复制                │
                                 │  - 配置生成                │
                                 │  - 项目初始化              │
                                 └───────────────────────────┘
                                           ↓
                                 ┌───────────────────────────┐
                                 │ ContentCollaborator        │
                                 │  - 内容建议                │
                                 │  - 编号修复                │
                                 │  - 质量检查                │
                                 └───────────────────────────┘
                                           ↓
                                 ┌───────────────────────────┐
                                 │ DeployManager             │
                                 │  - Git 操作                │
                                 │  - GitHub API              │
                                 │  - Pages 配置              │
                                 └───────────────────────────┘
```

### 2.2 模块依赖关系

```
WorkflowEngine
  ├─→ InputDetector (阶段1)
  ├─→ ReferenceAnalyzer (阶段2)
  ├─→ FrameworkGenerator (阶段3)
  ├─→ EnvironmentManager (阶段4)
  ├─→ ConsistencyChecker (阶段4)
  ├─→ ContentCollaborator (阶段5)
  └─→ DeployManager (阶段6)

FrameworkGenerator
  └─→ Logger

ContentCollaborator
  ├─→ Logger
  └─→ ReferenceAnalyzer (读取BOOK_CONTEXT.md)

DeployManager
  ├─→ Logger
  └─→ EnvironmentManager
```

---

## 3. WorkflowEngine 设计

### 3.1 核心职责

**WorkflowEngine** 负责编排整个书籍创建流程，管理6个阶段的执行顺序和状态。

### 3.2 阶段定义

| 阶段 | 名称 | 输入 | 输出 | 验证点 |
|------|------|------|------|--------|
| 1 | 项目初始化 | 项目路径 | 项目目录 | ✓ 路径有效 |
| 2 | 分析与规划 | 参考源 | BOOK_CONTEXT.md | ✓ 规划确认 |
| 3 | 框架生成 | BOOK_CONTEXT.md | 项目骨架 | ✓ 构建测试 |
| 4 | 环境配置 | 项目骨架 | 环境就绪 | ✓ 一致性验证 |
| 5 | 内容创作 | BOOK_CONTEXT.md | 书籍内容 | ✓ 质量检查 |
| 6 | 部署发布 | 完整项目 | GitHub Release | ✓ 部署成功 |

### 3.3 状态管理

**状态文件**: `.book-crafter/state.json`

```json
{
  "version": "1.0.0",
  "currentStage": 3,
  "stages": {
    "1": {
      "name": "项目初始化",
      "status": "completed",
      "timestamp": "2026-03-25T10:30:00Z",
      "output": {
        "projectPath": "/path/to/project"
      }
    },
    "2": {
      "name": "分析与规划",
      "status": "completed",
      "timestamp": "2026-03-25T10:35:00Z",
      "output": {
        "contextFile": "BOOK_CONTEXT.md"
      }
    },
    "3": {
      "name": "框架生成",
      "status": "in_progress",
      "timestamp": "2026-03-25T10:40:00Z"
    }
  },
  "metadata": {
    "createdAt": "2026-03-25T10:30:00Z",
    "updatedAt": "2026-03-25T10:40:00Z"
  }
}
```

### 3.4 API 设计

```javascript
class WorkflowEngine {
  constructor(projectPath, options = {})

  // 初始化工作流
  async init()

  // 执行下一阶段
  async nextStage()

  // 执行指定阶段
  async executeStage(stageNumber)

  // 获取当前状态
  getState()

  // 恢复执行
  async resume()

  // 回退到指定阶段
  async rollback(stageNumber)

  // 验证当前阶段
  async validateStage(stageNumber)

  // 私有方法
  #saveState()
  #loadState()
  #validateTransition(fromStage, toStage)
}
```

### 3.5 错误处理

- **阶段失败**: 记录错误到状态文件，保留已完成阶段的输出
- **恢复执行**: 从失败阶段重新开始
- **状态损坏**: 提供 `--reset` 选项清空状态

---

## 4. FrameworkGenerator 设计

### 4.1 核心职责

**FrameworkGenerator** 根据 BOOK_CONTEXT.md 分析结果生成 VitePress 项目骨架。

### 4.2 模板策略

**仅支持**: VitePress 扁平结构

**模板位置**: `templates/vitepress-flat/`

**模板内容**:
```
templates/vitepress-flat/
├── package.json
├── docs/
│   ├── .vitepress/
│   │   └── config.mts
│   └── index.md
├── scripts/
│   └── generate-pdf.mjs
└── workflows/
    ├── deploy.yml
    └── release.yml
```

### 4.3 生成流程

```
1. 读取 BOOK_CONTEXT.md
   ↓
2. 复制模板文件到目标目录
   ↓
3. 替换占位符
   - {{BOOK_TITLE}} → 书籍标题
   - {{BOOK_DESCRIPTION}} → 书籍描述
   - {{GITHUB_USER}} → GitHub 用户名
   - {{REPO_NAME}} → 仓库名
   ↓
4. 生成基础章节文件
   - 根据 BOOK_CONTEXT.md 中的章节列表
   - 创建空的章节文件（chapter-01.md, chapter-02.md...）
   ↓
5. 配置 VitePress
   - 设置标题、描述、base URL
   - 配置导航栏和侧边栏
   - 启用搜索和 Markdown 增强
   ↓
6. 验证项目
   - npm install
   - npm run build (测试构建)
```

### 4.4 API 设计

```javascript
class FrameworkGenerator {
  constructor(projectPath, analysisResult)

  // 生成项目框架
  async generate()

  // 私有方法
  #copyTemplate()
  #replacePlaceholders(content, data)
  #generateChapterFiles()
  #configureVitePress()
  #validateProject()
}
```

### 4.5 配置生成

**package.json 替换**:
```json
{
  "name": "{{REPO_NAME}}",
  "version": "1.0.0",
  "scripts": {
    "dev": "vitepress dev docs",
    "build": "vitepress build docs",
    "preview": "vitepress preview docs"
  }
}
```

**VitePress config.mts 替换**:
```typescript
export default defineConfig({
  title: '{{BOOK_TITLE}}',
  description: '{{BOOK_DESCRIPTION}}',
  base: '/{{REPO_NAME}}/',
  // ...
})
```

---

## 5. ContentCollaborator 设计

### 5.1 核心职责

**ContentCollaborator** 提供AI辅助的内容创作，采用建议-确认模式。

### 5.2 交互模式

**建议-确认模式流程**:
```
1. AI 分析章节需求
   ↓
2. AI 生成内容建议（不写入文件）
   ↓
3. 展示给用户审查
   ↓
4. 用户确认/修改/拒绝
   ↓
5. 确认后写入文件
```

### 5.3 核心功能

#### 5.3.1 章节内容建议

```javascript
// 生成章节内容建议（不写入文件）
async generateChapterSuggestion(chapterNumber, context) {
  // 基于 BOOK_CONTEXT.md
  // 参考参考源的类似章节
  // 考虑书籍风格和目标读者
  // 返回建议内容（markdown格式）
}
```

#### 5.3.2 章节编号修复

```javascript
// 修复章节编号（从1开始连续编号）
async fixChapterNumbering() {
  // 扫描所有章节文件
  // 检测编号不连续
  // 重命名文件和内部引用
  // 更新 VitePress 配置
}
```

#### 5.3.3 格式检查

```javascript
// 检查章节格式
async checkFormat(chapterFile) {
  // 检查标题层级
  // 检查代码块语法
  // 检查链接有效性
  // 返回问题列表
}
```

### 5.4 API 设计

```javascript
class ContentCollaborator {
  constructor(projectPath)

  // 生成章节建议（不写入）
  async suggestChapterContent(chapterNumber)

  // 应用建议（写入文件）
  async applySuggestion(chapterNumber, content)

  // 修复章节编号
  async fixChapterNumbers()

  // 检查格式
  async checkFormat(chapterFile)

  // 批量质量检查
  async qualityCheck()

  // 私有方法
  #loadContext()
  #analyzeReference(chapterNumber)
  #generateSuggestion(context, reference)
}
```

### 5.5 BOOK_CONTEXT.md 结构

```markdown
# 书籍项目上下文

## 项目信息
- **书名**: [书籍标题]
- **描述**: [书籍描述]
- **目标读者**: [读者定位]
- **技术栈**: [主要技术]

## 结构规划
- **类型**: 扁平结构
- **章节数**: [X] 章
- **语言**: 中文

## 章节大纲
1. 第一章：[标题] - [简介]
2. 第二章：[标题] - [简介]
...

## 风格指南
- **语调**: [正式/轻松/实用]
- **代码风格**: [示例代码规范]
- **术语表**: [关键术语定义]

## 参考源信息
- **来源**: [GitHub URL/本地路径]
- **技术栈**: VitePress
- **章节数**: [X] 章
```

---

## 6. DeployManager 设计

### 6.1 核心职责

**DeployManager** 处理 Git 操作和 GitHub 集成。

### 6.2 认证方式

**使用 GitHub CLI (gh)**

优势:
- 统一认证流程
- 无需管理 token
- 跨平台兼容
- 支持双因素认证

前置条件:
- 用户已安装 gh CLI
- 用户已登录 (`gh auth login`)

### 6.3 部署流程

```
1. 初始化 Git 仓库
   - git init
   - git add .
   - git commit -m "Initial commit"

2. 创建 GitHub 仓库
   - gh repo create <name> --public --source=.
   - 推送到远程

3. 配置 GitHub Pages
   - 启用 Pages
   - 设置分支为 main
   - 设置目录为 docs

4. 创建初始发布
   - 创建 tag (v1.0.0)
   - 生成 Release Notes
   - 发布 Release

5. 验证部署
   - 检查 Actions 状态
   - 验证 Pages 访问
```

### 6.4 API 设计

```javascript
class DeployManager {
  constructor(projectPath, options = {})

  // 初始化 Git 仓库
  async initGit()

  // 创建 GitHub 仓库
  async createGitHubRepo(repoName, options)

  // 配置 GitHub Pages
  async configurePages()

  // 创建 Release
  async createRelease(version, options)

  // 推送更改
  async push()

  // 验证部署
  async verifyDeployment()

  // 私有方法
  #checkGitHubCLI()
  #getCurrentUser()
  #getRemoteURL()
}
```

### 6.5 GitHub CLI 命令映射

```javascript
// 创建仓库
gh repo create <name> --public --source=. --remote=origin

// 配置 Pages (通过 API)
gh api repos/{owner}/{repo}/pages -X POST -f source='{"branch":"main","path":"/docs"}'

// 创建 Release
gh release create <tag> --title "<title>" --notes "<notes>"

// 推送
git push -u origin main
```

---

## 7. 数据流设计

### 7.1 完整工作流数据流

```
用户输入: 项目路径 + 参考源
           ↓
    ┌──────────────────┐
    │ 阶段1: 项目初始化  │
    │  InputDetector    │
    │  检测输入类型      │
    └──────────────────┘
           ↓
    ┌──────────────────┐
    │ 阶段2: 分析规划    │
    │  ReferenceAnalyzer│
    │  生成BOOK_CONTEXT │
    └──────────────────┘
           ↓
    ┌──────────────────┐
    │ 阶段3: 框架生成    │
    │  FrameworkGenerator│
    │  创建项目骨架      │
    └──────────────────┘
           ↓
    ┌──────────────────┐
    │ 阶段4: 环境配置    │
    │  EnvironmentMgr   │
    │  ConsistencyChk   │
    │  安装依赖+验证     │
    └──────────────────┘
           ↓
    ┌──────────────────┐
    │ 阶段5: 内容创作    │
    │  ContentCollaborator│
    │  AI建议+用户确认   │
    └──────────────────┘
           ↓
    ┌──────────────────┐
    │ 阶段6: 部署发布    │
    │  DeployManager    │
    │  Git+GitHub+Pages│
    └──────────────────┘
           ↓
输出: 完整的书籍项目，已部署到 GitHub Pages
```

### 7.2 状态持久化

**阶段输出文件**:
```
.book-crafter/
├── state.json              # 工作流状态
├── BOOK_CONTEXT.md         # 阶段2输出
└── logs/
    ├── stage-1.log
    ├── stage-2.log
    └── ...
```

---

## 8. 测试策略

### 8.1 测试层级

**单元测试** (每个模块独立测试):
- WorkflowEngine 状态管理
- FrameworkGenerator 模板替换
- ContentCollaborator 内容生成
- DeployManager Git 操作（mock）

**集成测试** (模块协作测试):
- 完整工作流执行
- 阶段切换和恢复
- 错误处理和回退

**端到端测试** (真实场景测试):
- 从参考源到部署完整流程
- 本地项目创建流程
- GitHub Pages 部署验证

### 8.2 测试固件

```
tests/
├── fixtures/
│   ├── sample-book/          # 现有示例书籍
│   ├── sample-context.md     # BOOK_CONTEXT 示例
│   └── expected-output/      # 预期输出
├── integration/
│   ├── workflow.test.mjs     # 现有集成测试
│   ├── framework-gen.test.mjs # 新增
│   ├── content-collab.test.mjs # 新增
│   └── deploy.test.mjs        # 新增
└── e2e/
    └── full-workflow.test.mjs # 端到端测试
```

### 8.3 Mock 策略

**GitHub API Mock**:
```javascript
// 使用 nock 或 gh 的 dry-run 模式
jest.mock('child_process', () => ({
  execSync: jest.fn((cmd) => {
    if (cmd.includes('gh ')) {
      return mockGitHubResponse(cmd)
    }
    return actualExecSync(cmd)
  })
}))
```

**Git 操作 Mock**:
```javascript
// 使用 simple-git 的测试工具
import { SimpleGit } from 'simple-git'
jest.mock('simple-git')
```

---

## 9. 实施优先级

### 9.1 模块优先级

**优先级排序**（从高到低）:
1. **WorkflowEngine** - 核心编排器，其他模块依赖
2. **FrameworkGenerator** - 基础功能，早期验证
3. **DeployManager** - 独立模块，可与内容创作并行
4. **ContentCollaborator** - 复杂度最高，最后实现

### 9.2 迭代计划

**迭代1: 工作流基础** (2-3天)
- WorkflowEngine 核心框架
- 状态管理
- 阶段定义

**迭代2: 框架生成** (2-3天)
- FrameworkGenerator
- 模板系统
- 配置生成

**迭代3: 部署自动化** (2-3天)
- DeployManager
- Git 操作
- GitHub CLI 集成

**迭代4: 内容协作** (3-4天)
- ContentCollaborator
- AI 建议生成
- 编号修复

**迭代5: 集成和测试** (2-3天)
- 端到端测试
- 文档完善
- Bug 修复

**总预估**: 11-16天

---

## 10. 文件结构

### 10.1 新增文件

```
skills/book-crafter/
├── scripts/
│   ├── workflow-engine.mjs       # 新增
│   ├── framework-generator.mjs   # 新增
│   ├── content-collaborator.mjs  # 新增
│   └── deploy-manager.mjs        # 新增
├── tests/
│   ├── workflow-engine.test.mjs       # 新增
│   ├── framework-generator.test.mjs   # 新增
│   ├── content-collaborator.test.mjs  # 新增
│   ├── deploy-manager.test.mjs        # 新增
│   └── e2e/
│       └── full-workflow.test.mjs     # 新增
└── templates/
    └── vitepress-flat/
        ├── package.json           # 已存在，需更新
        ├── docs/
        │   ├── .vitepress/
        │   │   └── config.mts     # 已存在，需更新
        │   └── index.md            # 已存在，需更新
        └── workflows/             # 已存在
```

### 10.2 状态文件

```
.book-crafter/
├── state.json
├── BOOK_CONTEXT.md
└── logs/
    └── *.log
```

---

## 11. 风险和缓解

### 11.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| GitHub CLI 不可用 | 部署失败 | 提供详细安装指南，支持降级到手动模式 |
| 状态文件损坏 | 恢复失败 | 提供重置选项，备份关键状态 |
| 模板不兼容 | 构建失败 | 严格测试模板，版本锁定依赖 |
| AI 建议质量低 | 用户体验差 | 提供修改选项，允许跳过建议 |

### 11.2 用户体验风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 学习曲线陡峭 | 采用率低 | 提供清晰的 SKILL.md 和示例 |
| 网络问题 | 部署失败 | 重试机制，离线模式支持 |
| 认证复杂 | 设置困难 | 简化流程，提供诊断命令 |

---

## 12. 成功指标

### 12.1 功能完整性

- ✅ 所有6个阶段完整实现
- ✅ 支持中断恢复
- ✅ 端到端测试通过
- ✅ 文档完善（SKILL.md + 代码注释）

### 12.2 质量指标

- **测试覆盖率**: > 85%
- **代码审查**: 无关键问题
- **性能**: 完整流程 < 10分钟（不包括内容创作）
- **可用性**: 新用户从零到部署 < 30分钟

### 12.3 生产就绪标准

- ✅ 所有测试通过
- ✅ 错误处理完善
- ✅ 日志清晰
- ✅ 文档齐全
- ✅ 示例项目验证

---

## 附录

### A. 示例用法

```bash
# 完整工作流
cd ~/Github/the-guild/skills/book-crafter
node scripts/workflow-engine.mjs init --path ~/my-book --source https://github.com/user/ref-book

# 恢复执行
node scripts/workflow-engine.mjs resume

# 仅生成框架
node scripts/framework-generator.mjs --context BOOK_CONTEXT.md

# 内容创作
node scripts/content-collaborator.mjs suggest --chapter 1
node scripts/content-collaborator.mjs fix-numbers

# 部署
node scripts/deploy-manager.mjs init --repo my-book
```

### B. 环境要求

**必需**:
- Node.js >= 22.0.0
- npm >= 10.0.0
- Git >= 2.30.0
- GitHub CLI >= 2.40.0

**可选**:
- Puppeteer (PDF 生成)
- pandoc (格式转换)

### C. 相关文档

- [第一阶段设计文档](./2026-03-24-book-crafter-design.md)
- [第一阶段实施计划](../plans/2026-03-24-book-crafter-implementation.md)
- [SKILL.md](../../skills/book-crafter/SKILL.md)
