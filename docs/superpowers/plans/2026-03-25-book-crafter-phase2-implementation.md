# Book Crafter Skill 第二阶段实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Book Crafter Skill 的核心业务逻辑层，包括工作流引擎、框架生成器、内容协作器和部署管理器，达到生产就绪状态。

**Architecture:** 6层架构（交互层 → 工作流引擎 → 智能层 → 环境层 → 内容层 → 部署层）。第二阶段实现工作流引擎、框架生成、内容协作和部署自动化，完成从基础工具到完整工作流的跨越。

**Tech Stack:** Node.js 22+, VitePress, GitHub CLI (gh), simple-git, @octokit/rest, fast-glob, markdown-it, chalk

**第一阶段范围**（已完成）：
- ✅ 项目结构和工具配置
- ✅ 核心工具（日志器、输入检测）
- ✅ 环境管理和一致性检查
- ✅ 参考源分析
- ✅ 文档和模板

**第二阶段范围**（当前计划）：
- ⏸ WorkflowEngine - 5阶段工作流编排
- ⏸ FrameworkGenerator - VitePress 项目骨架生成
- ⏸ ContentCollaborator - AI 辅助内容创作
- ⏸ DeployManager - Git/GitHub 部署自动化

**预期完成度**：从40%提升到100%，达到生产就绪

---

## 文件结构概览

```
~/Github/the-guild/skills/book-crafter/
├── scripts/
│   ├── workflow-engine.mjs           # 新增：工作流引擎
│   ├── framework-generator.mjs       # 新增：框架生成器
│   ├── content-collaborator.mjs      # 新增：内容协作器
│   └── deploy-manager.mjs            # 新增：部署管理器
├── tests/
│   ├── workflow-engine.test.mjs      # 新增
│   ├── framework-generator.test.mjs   # 新增
│   ├── content-collaborator.test.mjs # 新增
│   ├── deploy-manager.test.mjs       # 新增
│   └── e2e/
│       └── full-workflow.test.mjs     # 新增：端到端测试
└── templates/
    └── vitepress-flat/               # 已存在，需更新
```

---

## 任务 1：WorkflowEngine - 状态管理

**文件：**
- 创建：`scripts/workflow-engine.mjs`
- 创建：`tests/workflow-engine.test.mjs`

- [ ] **步骤 1：编写状态管理的失败测试**

创建 `tests/workflow-engine.test.mjs`：

```javascript
import { WorkflowEngine } from '../scripts/workflow-engine.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('WorkflowEngine - 状态管理', () => {
  let engine
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    engine = new WorkflowEngine(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该初始化工作流状态', async () => {
    await engine.init()

    const stateFile = path.join(tempDir, '.book-crafter', 'state.json')
    expect(fs.existsSync(stateFile)).toBe(true)

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'))
    expect(state.currentStage).toBe(1)
    expect(state.stages).toHaveProperty('1')
  })

  test('应该保存当前阶段状态', async () => {
    await engine.init()
    await engine.completeStage(1, { projectPath: tempDir })

    const state = engine.getState()
    expect(state.stages['1'].status).toBe('completed')
    expect(state.stages['1'].output.projectPath).toBe(tempDir)
  })

  test('应该加载现有状态', async () => {
    await engine.init()
    await engine.completeStage(1, { projectPath: tempDir })

    const newEngine = new WorkflowEngine(tempDir)
    const state = newEngine.getState()
    expect(state.currentStage).toBe(2)
  })

  test('应该验证阶段转换', () => {
    expect(() => engine.#validateTransition(1, 3)).toThrow()
    expect(() => engine.#validateTransition(1, 2)).not.toThrow()
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
npm test tests/workflow-engine.test.mjs
```

预期：失败，提示 "Cannot find module '../scripts/workflow-engine.mjs'"

- [ ] **步骤 3：实现 WorkflowEngine 状态管理**

创建 `scripts/workflow-engine.mjs`：

```javascript
import fs from 'fs'
import path from 'path'
import { Logger } from '../utils/logger.mjs'

export class WorkflowEngine {
  #projectPath
  #statePath
  #logger
  #state

  constructor(projectPath) {
    this.#projectPath = projectPath
    this.#statePath = path.join(projectPath, '.book-crafter', 'state.json')
    this.#logger = new Logger()
    this.#state = null
  }

  /**
   * 初始化工作流
   */
  async init() {
    // 创建状态目录
    const stateDir = path.dirname(this.#statePath)
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true })
    }

    // 初始化状态
    this.#state = {
      version: '1.0.0',
      currentStage: 1,
      stages: {
        '1': { name: '项目初始化', status: 'pending' },
        '2': { name: '分析与规划', status: 'pending' },
        '3': { name: '框架生成', status: 'pending' },
        '4': { name: '环境配置', status: 'pending' },
        '5': { name: '内容创作', status: 'pending' },
        '6': { name: '部署发布', status: 'pending' }
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    this.#saveState()
    this.#logger.success('工作流初始化完成')
  }

  /**
   * 获取当前状态
   */
  getState() {
    if (!this.#state) {
      this.#loadState()
    }
    return this.#state
  }

  /**
   * 完成当前阶段
   */
  async completeStage(stageNumber, output = {}) {
    const state = this.getState()

    if (!state.stages[stageNumber]) {
      throw new Error(`无效的阶段编号: ${stageNumber}`)
    }

    state.stages[stageNumber] = {
      ...state.stages[stageNumber],
      status: 'completed',
      timestamp: new Date().toISOString(),
      output
    }

    state.currentStage = stageNumber + 1
    state.metadata.updatedAt = new Date().toISOString()

    this.#saveState()
    this.#logger.success(`阶段 ${stageNumber} 完成: ${state.stages[stageNumber].name}`)
  }

  /**
   * 保存状态到文件
   */
  #saveState() {
    fs.writeFileSync(
      this.#statePath,
      JSON.stringify(this.#state, null, 2),
      'utf-8'
    )
  }

  /**
   * 从文件加载状态
   */
  #loadState() {
    if (!fs.existsSync(this.#statePath)) {
      throw new Error('工作流未初始化，请先运行 init()')
    }

    this.#state = JSON.parse(
      fs.readFileSync(this.#statePath, 'utf-8')
    )
  }

  /**
   * 验证阶段转换
   */
  #validateTransition(fromStage, toStage) {
    if (toStage !== fromStage + 1) {
      throw new Error(`只能顺序执行阶段，当前阶段 ${fromStage}，不能跳到 ${toStage}`)
    }
  }
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
npm test tests/workflow-engine.test.mjs
```

预期：通过

- [ ] **步骤 5：提交 WorkflowEngine 状态管理**

```bash
git add scripts/workflow-engine.mjs tests/workflow-engine.test.mjs
git commit -m "feat: 实现 WorkflowEngine 状态管理"
```

---

## 任务 2：WorkflowEngine - 阶段执行

**文件：**
- 修改：`scripts/workflow-engine.mjs`
- 修改：`tests/workflow-engine.test.mjs`

- [ ] **步骤 1：编写阶段执行的测试**

在 `tests/workflow-engine.test.mjs` 中添加：

```javascript
describe('WorkflowEngine - 阶段执行', () => {
  let engine
  let tempDir

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    engine = new WorkflowEngine(tempDir)
    await engine.init()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该执行阶段1', async () => {
    const result = await engine.executeStage(1, {
      projectPath: tempDir
    })

    expect(result.success).toBe(true)
    expect(result.output.projectPath).toBe(tempDir)

    const state = engine.getState()
    expect(state.stages['1'].status).toBe('completed')
  })

  test('应该执行下一阶段', async () => {
    await engine.executeStage(1, { projectPath: tempDir })
    await engine.nextStage()

    const state = engine.getState()
    expect(state.currentStage).toBe(3)
  })

  test('应该拒绝跳过阶段', async () => {
    await expect(
      engine.executeStage(3, {})
    ).rejects.toThrow()
  })

  test('应该恢复执行', async () => {
    await engine.executeStage(1, { projectPath: tempDir })
    await engine.completeStage(1, { projectPath: tempDir })

    const newEngine = new WorkflowEngine(tempDir)
    await newEngine.resume()

    const state = newEngine.getState()
    expect(state.currentStage).toBe(2)
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
npm test tests/workflow-engine.test.mjs
```

预期：失败，缺少 `executeStage` 方法

- [ ] **步骤 3：实现阶段执行逻辑**

在 `scripts/workflow-engine.mjs` 中添加：

```javascript
/**
 * 执行指定阶段
 */
async executeStage(stageNumber, input = {}) {
  const state = this.getState()

  // 验证阶段编号
  if (stageNumber < 1 || stageNumber > 6) {
    throw new Error(`无效的阶段编号: ${stageNumber}`)
  }

  // 验证是否可以执行该阶段
  if (stageNumber > 1) {
    const prevStage = state.stages[stageNumber - 1]
    if (prevStage.status !== 'completed') {
      throw new Error(`必须先完成阶段 ${stageNumber - 1}`)
    }
  }

  this.#logger.section(`执行阶段 ${stageNumber}: ${state.stages[stageNumber].name}`)

  // 根据阶段编号执行相应的处理
  const handlers = {
    1: this.#executeStage1.bind(this),
    2: this.#executeStage2.bind(this),
    3: this.#executeStage3.bind(this),
    4: this.#executeStage4.bind(this),
    5: this.#executeStage5.bind(this),
    6: this.#executeStage6.bind(this)
  }

  const result = await handlers[stageNumber](input)

  return result
}

/**
 * 执行下一阶段
 */
async nextStage(input = {}) {
  const state = this.getState()
  const nextStage = state.currentStage

  const result = await this.executeStage(nextStage, input)
  await this.completeStage(nextStage, result.output)

  return result
}

/**
 * 恢复执行
 */
async resume() {
  const state = this.getState()
  this.#logger.info(`恢复执行，当前阶段: ${state.currentStage}`)

  return await this.nextStage()
}

/**
 * 阶段1: 项目初始化
 */
async #executeStage1(input) {
  return {
    success: true,
    output: {
      projectPath: input.projectPath || this.#projectPath
    }
  }
}

/**
 * 阶段2-6: 占位实现
 */
async #executeStage2(input) {
  return { success: true, output: {} }
}

async #executeStage3(input) {
  return { success: true, output: {} }
}

async #executeStage4(input) {
  return { success: true, output: {} }
}

async #executeStage5(input) {
  return { success: true, output: {} }
}

async #executeStage6(input) {
  return { success: true, output: {} }
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
npm test tests/workflow-engine.test.mjs
```

预期：通过

- [ ] **步骤 5：提交阶段执行逻辑**

```bash
git add scripts/workflow-engine.mjs tests/workflow-engine.test.mjs
git commit -m "feat: 实现 WorkflowEngine 阶段执行逻辑"
```

---

## 任务 3：FrameworkGenerator - 模板复制

**文件：**
- 创建：`scripts/framework-generator.mjs`
- 创建：`tests/framework-generator.test.mjs`

- [ ] **步骤 1：编写模板复制的测试**

创建 `tests/framework-generator.test.mjs`：

```javascript
import { FrameworkGenerator } from '../scripts/framework-generator.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('FrameworkGenerator', () => {
  let generator
  let tempDir
  let mockAnalysis

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    mockAnalysis = {
      title: '测试书籍',
      description: '这是一本测试书籍',
      chapters: [
        { number: 1, title: '第一章', file: 'chapter-01.md' },
        { number: 2, title: '第二章', file: 'chapter-02.md' }
      ]
    }
    generator = new FrameworkGenerator(tempDir, mockAnalysis)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该复制模板文件', async () => {
    await generator.generate()

    // 检查基础文件存在
    expect(fs.existsSync(path.join(tempDir, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs', '.vitepress', 'config.mts'))).toBe(true)
  })

  test('应该替换占位符', async () => {
    await generator.generate()

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(tempDir, 'package.json'), 'utf-8')
    )
    expect(packageJson.name).toBe('test-book')
  })

  test('应该生成章节文件', async () => {
    await generator.generate()

    expect(fs.existsSync(path.join(tempDir, 'docs', 'chapter-01.md'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs', 'chapter-02.md'))).toBe(true)
  })

  test('应该配置 VitePress', async () => {
    await generator.generate()

    const configPath = path.join(tempDir, 'docs', '.vitepress', 'config.mts')
    const config = fs.readFileSync(configPath, 'utf-8')
    expect(config).toContain('测试书籍')
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
npm test tests/framework-generator.test.mjs
```

预期：失败

- [ ] **步骤 3：实现 FrameworkGenerator**

创建 `scripts/framework-generator.mjs`：

```javascript
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Logger } from '../utils/logger.mjs'

export class FrameworkGenerator {
  #projectPath
  #analysis
  #logger
  #templatePath

  constructor(projectPath, analysis) {
    this.#projectPath = projectPath
    this.#analysis = analysis
    this.#logger = new Logger()

    // 获取模板路径
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    this.#templatePath = path.join(currentDir, '..', 'templates', 'vitepress-flat')
  }

  /**
   * 生成项目框架
   */
  async generate() {
    this.#logger.section('生成项目框架')

    // 1. 复制模板文件
    this.#logger.step(1, 5, '复制模板文件')
    await this.#copyTemplate()

    // 2. 替换占位符
    this.#logger.step(2, 5, '替换配置占位符')
    this.#replacePlaceholders()

    // 3. 生成章节文件
    this.#logger.step(3, 5, '生成章节文件')
    this.#generateChapterFiles()

    // 4. 配置 VitePress
    this.#logger.step(4, 5, '配置 VitePress')
    this.#configureVitePress()

    // 5. 验证项目
    this.#logger.step(5, 5, '验证项目结构')
    await this.#validateProject()

    this.#logger.success('项目框架生成完成')
  }

  /**
   * 复制模板文件
   */
  async #copyTemplate() {
    const copyDir = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
      }

      const entries = fs.readdirSync(src, { withFileTypes: true })

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)

        if (entry.isDirectory()) {
          copyDir(srcPath, destPath)
        } else {
          fs.copyFileSync(srcPath, destPath)
        }
      }
    }

    copyDir(this.#templatePath, this.#projectPath)
  }

  /**
   * 替换占位符
   */
  #replacePlaceholders() {
    const replacements = {
      '{{BOOK_TITLE}}': this.#analysis.title,
      '{{BOOK_DESCRIPTION}}': this.#analysis.description,
      '{{REPO_NAME}}': this.#generateRepoName(),
      'my-book': this.#generateRepoName()
    }

    // 替换 package.json
    const packagePath = path.join(this.#projectPath, 'package.json')
    if (fs.existsSync(packagePath)) {
      let content = fs.readFileSync(packagePath, 'utf-8')
      for (const [placeholder, value] of Object.entries(replacements)) {
        content = content.replace(new RegExp(placeholder, 'g'), value)
      }
      fs.writeFileSync(packagePath, content, 'utf-8')
    }
  }

  /**
   * 生成章节文件
   */
  #generateChapterFiles() {
    const docsPath = path.join(this.#projectPath, 'docs')

    for (const chapter of this.#analysis.chapters) {
      const chapterPath = path.join(docsPath, chapter.file)
      const content = `# ${chapter.title}\n\n内容待补充...\n`
      fs.writeFileSync(chapterPath, content, 'utf-8')
    }
  }

  /**
   * 配置 VitePress
   */
  #configureVitePress() {
    const configPath = path.join(this.#projectPath, 'docs', '.vitepress', 'config.mts')

    if (fs.existsSync(configPath)) {
      let config = fs.readFileSync(configPath, 'utf-8')

      // 替换标题和描述
      config = config.replace(/title: '.*'/, `title: '${this.#analysis.title}'`)
      config = config.replace(/description: '.*'/, `description: '${this.#analysis.description}'`)

      fs.writeFileSync(configPath, config, 'utf-8')
    }
  }

  /**
   * 验证项目结构
   */
  async #validateProject() {
    const requiredFiles = [
      'package.json',
      'docs/.vitepress/config.mts',
      'docs/index.md'
    ]

    for (const file of requiredFiles) {
      const filePath = path.join(this.#projectPath, file)
      if (!fs.existsSync(filePath)) {
        throw new Error(`缺少必需文件: ${file}`)
      }
    }
  }

  /**
   * 生成仓库名
   */
  #generateRepoName() {
    return this.#analysis.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
npm test tests/framework-generator.test.mjs
```

预期：通过

- [ ] **步骤 5：提交 FrameworkGenerator**

```bash
git add scripts/framework-generator.mjs tests/framework-generator.test.mjs
git commit -m "feat: 实现 FrameworkGenerator 模板复制和配置生成"
```

---

## 任务 4：DeployManager - Git 初始化

**文件：**
- 创建：`scripts/deploy-manager.mjs`
- 创建：`tests/deploy-manager.test.mjs`

- [ ] **步骤 1：编写 Git 初始化的测试**

创建 `tests/deploy-manager.test.mjs`：

```javascript
import { DeployManager } from '../scripts/deploy-manager.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

describe('DeployManager - Git 操作', () => {
  let manager
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    manager = new DeployManager(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该初始化 Git 仓库', async () => {
    await manager.initGit()

    const gitDir = path.join(tempDir, '.git')
    expect(fs.existsSync(gitDir)).toBe(true)
  })

  test('应该创建初始提交', async () => {
    await manager.initGit()

    // 创建测试文件
    fs.writeFileSync(path.join(tempDir, 'test.md'), '# Test')

    const result = await manager.commit('Initial commit')
    expect(result.success).toBe(true)

    const log = execSync('git log --oneline', { cwd: tempDir, encoding: 'utf-8' })
    expect(log).toContain('Initial commit')
  })

  test('应该检查 GitHub CLI 可用性', async () => {
    const isAvailable = await manager.checkGitHubCLI()
    // 根据实际环境，这里可能是 true 或 false
    expect(typeof isAvailable).toBe('boolean')
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
npm test tests/deploy-manager.test.mjs
```

预期：失败

- [ ] **步骤 3：实现 DeployManager Git 操作**

创建 `scripts/deploy-manager.mjs`：

```javascript
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { Logger } from '../utils/logger.mjs'
import simpleGit from 'simple-git'

export class DeployManager {
  #projectPath
  #logger
  #git

  constructor(projectPath) {
    this.#projectPath = projectPath
    this.#logger = new Logger()
    this.#git = simpleGit(projectPath)
  }

  /**
   * 初始化 Git 仓库
   */
  async initGit() {
    this.#logger.section('初始化 Git 仓库')

    // 检查是否已经是 Git 仓库
    const isRepo = await this.#git.checkIsRepo()

    if (!isRepo) {
      await this.#git.init()
      this.#logger.success('Git 仓库初始化完成')
    } else {
      this.#logger.info('Git 仓库已存在')
    }
  }

  /**
   * 提交更改
   */
  async commit(message) {
    try {
      await this.#git.add('.')
      await this.#git.commit(message)

      this.#logger.success(`提交成功: ${message}`)

      return { success: true }
    } catch (error) {
      this.#logger.error(`提交失败: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  /**
   * 检查 GitHub CLI 可用性
   */
  async checkGitHubCLI() {
    try {
      execSync('gh --version', { encoding: 'utf-8' })
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser() {
    try {
      const result = execSync('gh api user --jq .login', { encoding: 'utf-8' })
      return result.trim()
    } catch (error) {
      this.#logger.error('无法获取 GitHub 用户信息')
      throw new Error('请确保已安装并登录 GitHub CLI: gh auth login')
    }
  }

  /**
   * 创建 GitHub 仓库
   */
  async createGitHubRepo(repoName, options = {}) {
    this.#logger.section('创建 GitHub 仓库')

    // 检查 CLI
    const cliAvailable = await this.checkGitHubCLI()
    if (!cliAvailable) {
      throw new Error('GitHub CLI 未安装或不可用')
    }

    // 获取当前用户
    const user = await this.getCurrentUser()

    // 创建仓库
    const visibility = options.private ? '--private' : '--public'
    const cmd = `gh repo create ${repoName} ${visibility} --source=. --remote=origin`

    try {
      execSync(cmd, { cwd: this.#projectPath, encoding: 'utf-8', stdio: 'pipe' })
      this.#logger.success(`仓库创建成功: ${user}/${repoName}`)

      return {
        success: true,
        url: `https://github.com/${user}/${repoName}`
      }
    } catch (error) {
      this.#logger.error(`仓库创建失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 推送到远程
   */
  async push() {
    try {
      await this.#git.push('origin', 'main', { '-u': null })
      this.#logger.success('推送成功')

      return { success: true }
    } catch (error) {
      this.#logger.error(`推送失败: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  /**
   * 配置 GitHub Pages
   */
  async configurePages() {
    this.#logger.section('配置 GitHub Pages')

    try {
      // 获取远程 URL
      const remotes = await this.#git.getRemotes(true)
      const originUrl = remotes.find(r => r.name === 'origin')?.refs?.fetch

      if (!originUrl) {
        throw new Error('未找到 origin 远程仓库')
      }

      // 提取 owner 和 repo
      const match = originUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/)
      if (!match) {
        throw new Error('无法解析仓库信息')
      }

      const [, owner, repo] = match

      // 启用 Pages
      const cmd = `gh api repos/${owner}/${repo}/pages -X POST -f source='{"branch":"main","path":"/docs"}'`

      execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' })
      this.#logger.success('GitHub Pages 配置成功')

      return { success: true }
    } catch (error) {
      this.#logger.error(`Pages 配置失败: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  /**
   * 创建 Release
   */
  async createRelease(version, options = {}) {
    this.#logger.section(`创建 Release ${version}`)

    try {
      // 创建标签
      await this.#git.addTag(version)

      // 推送标签
      await this.#git.pushTags('origin')

      // 创建 Release
      const title = options.title || `Release ${version}`
      const notes = options.notes || ''

      const cmd = `gh release create ${version} --title "${title}" --notes "${notes}"`
      execSync(cmd, { cwd: this.#projectPath, encoding: 'utf-8', stdio: 'pipe' })

      this.#logger.success(`Release ${version} 创建成功`)

      return { success: true }
    } catch (error) {
      this.#logger.error(`Release 创建失败: ${error.message}`)
      return { success: false, error: error.message }
    }
  }
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
npm test tests/deploy-manager.test.mjs
```

预期：通过

- [ ] **步骤 5：提交 DeployManager**

```bash
git add scripts/deploy-manager.mjs tests/deploy-manager.test.mjs
git commit -m "feat: 实现 DeployManager Git 操作和 GitHub CLI 集成"
```

---

## 任务 5：ContentCollaborator - 内容建议

**文件：**
- 创建：`scripts/content-collaborator.mjs`
- 创建：`tests/content-collaborator.test.mjs`

- [ ] **步骤 1：编写内容建议的测试**

创建 `tests/content-collaborator.test.mjs`：

```javascript
import { ContentCollaborator } from '../scripts/content-collaborator.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('ContentCollaborator', () => {
  let collaborator
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))

    // 创建模拟的 BOOK_CONTEXT.md
    const contextContent = `# 书籍项目上下文

## 项目信息
- **书名**: 测试书籍
- **描述**: 这是一本测试书籍
- **目标读者**: 开发者

## 章节大纲
1. 第一章：基础概念 - 介绍基础概念
2. 第二章：进阶内容 - 深入探讨
`
    fs.writeFileSync(
      path.join(tempDir, 'BOOK_CONTEXT.md'),
      contextContent,
      'utf-8'
    )

    collaborator = new ContentCollaborator(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该加载 BOOK_CONTEXT', async () => {
    const context = collaborator.#loadContext()

    expect(context.title).toBe('测试书籍')
    expect(context.chapters).toHaveLength(2)
  })

  test('应该生成章节建议', async () => {
    const suggestion = await collaborator.suggestChapterContent(1)

    expect(suggestion).toBeDefined()
    expect(suggestion.chapterNumber).toBe(1)
    expect(suggestion.content).toContain('# 第一章')
  })

  test('应该应用建议到文件', async () => {
    const suggestion = await collaborator.suggestChapterContent(1)
    await collaborator.applySuggestion(1, suggestion.content)

    const chapterPath = path.join(tempDir, 'docs', 'chapter-01.md')
    expect(fs.existsSync(chapterPath)).toBe(true)

    const content = fs.readFileSync(chapterPath, 'utf-8')
    expect(content).toContain('# 第一章')
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
npm test tests/content-collaborator.test.mjs
```

预期：失败

- [ ] **步骤 3：实现 ContentCollaborator**

创建 `scripts/content-collaborator.mjs`：

```javascript
import fs from 'fs'
import path from 'path'
import { Logger } from '../utils/logger.mjs'

export class ContentCollaborator {
  #projectPath
  #logger
  #context

  constructor(projectPath) {
    this.#projectPath = projectPath
    this.#logger = new Logger()
    this.#context = null
  }

  /**
   * 加载 BOOK_CONTEXT.md
   */
  #loadContext() {
    if (this.#context) {
      return this.#context
    }

    const contextPath = path.join(this.#projectPath, 'BOOK_CONTEXT.md')

    if (!fs.existsSync(contextPath)) {
      throw new Error('未找到 BOOK_CONTEXT.md，请先运行分析阶段')
    }

    const content = fs.readFileSync(contextPath, 'utf-8')

    // 解析上下文（简化版，实际应该用更健壮的解析）
    this.#context = {
      title: this.#extractField(content, '书名'),
      description: this.#extractField(content, '描述'),
      targetReader: this.#extractField(content, '目标读者'),
      chapters: this.#extractChapters(content)
    }

    return this.#context
  }

  /**
   * 提取字段值
   */
  #extractField(content, fieldName) {
    const regex = new RegExp(`\\*\\*${fieldName}\\*\\*:\\s*(.+)`)
    const match = content.match(regex)
    return match ? match[1].trim() : ''
  }

  /**
   * 提取章节列表
   */
  #extractChapters(content) {
    const chapters = []
    const lines = content.split('\n')

    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s*(.+?)\s*-\s*(.+)$/)
      if (match) {
        chapters.push({
          number: parseInt(match[1]),
          title: match[2].trim(),
          description: match[3].trim()
        })
      }
    }

    return chapters
  }

  /**
   * 生成章节内容建议
   */
  async suggestChapterContent(chapterNumber) {
    const context = this.#loadContext()

    const chapter = context.chapters.find(c => c.number === chapterNumber)
    if (!chapter) {
      throw new Error(`章节 ${chapterNumber} 不存在`)
    }

    this.#logger.info(`生成第 ${chapterNumber} 章建议...`)

    // 生成建议内容（这里应该调用 AI，现在先用模板）
    const content = this.#generateSuggestion(chapter, context)

    return {
      chapterNumber,
      title: chapter.title,
      content
    }
  }

  /**
   * 生成建议内容
   */
  #generateSuggestion(chapter, context) {
    return `# ${chapter.title}

${chapter.description}

## 概述

本章将介绍${chapter.title}的核心概念和实践方法。

## 主要内容

### 1. 基础概念

（待补充具体内容）

### 2. 实践应用

（待补充具体内容）

### 3. 案例分析

（待补充具体内容）

## 总结

本章介绍了${chapter.title}的关键要点。

## 延伸阅读

- 相关章节链接
- 外部资源

---

**注意**: 这是 AI 生成的内容建议，请根据实际情况调整和完善。
`
  }

  /**
   * 应用建议到文件
   */
  async applySuggestion(chapterNumber, content) {
    const docsPath = path.join(this.#projectPath, 'docs')

    // 确保 docs 目录存在
    if (!fs.existsSync(docsPath)) {
      fs.mkdirSync(docsPath, { recursive: true })
    }

    const fileName = `chapter-${String(chapterNumber).padStart(2, '0')}.md`
    const filePath = path.join(docsPath, fileName)

    fs.writeFileSync(filePath, content, 'utf-8')

    this.#logger.success(`章节 ${chapterNumber} 内容已写入: ${fileName}`)

    return { success: true, filePath }
  }

  /**
   * 修复章节编号
   */
  async fixChapterNumbers() {
    this.#logger.section('修复章节编号')

    const docsPath = path.join(this.#projectPath, 'docs')
    const files = fs.readdirSync(docsPath)
      .filter(f => f.match(/^chapter-\d+\.md$/))
      .sort()

    let newNumber = 1
    for (const file of files) {
      if (file !== `chapter-${String(newNumber).padStart(2, '0')}.md`) {
        const oldPath = path.join(docsPath, file)
        const newPath = path.join(docsPath, `chapter-${String(newNumber).padStart(2, '0')}.md`)

        fs.renameSync(oldPath, newPath)
        this.#logger.info(`重命名: ${file} → chapter-${String(newNumber).padStart(2, '0')}.md`)
      }
      newNumber++
    }

    this.#logger.success('章节编号修复完成')
  }
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
npm test tests/content-collaborator.test.mjs
```

预期：通过

- [ ] **步骤 5：提交 ContentCollaborator**

```bash
git add scripts/content-collaborator.mjs tests/content-collaborator.test.mjs
git commit -m "feat: 实现 ContentCollaborator 内容建议生成"
```

---

## 任务 6：集成 WorkflowEngine 与各模块

**文件：**
- 修改：`scripts/workflow-engine.mjs`
- 修改：`tests/workflow-engine.test.mjs`

- [ ] **步骤 1：编写集成测试**

在 `tests/workflow-engine.test.mjs` 中添加：

```javascript
import { InputDetector } from '../scripts/input-detector.mjs'
import { ReferenceAnalyzer } from '../scripts/reference-analyzer.mjs'
import { FrameworkGenerator } from '../scripts/framework-generator.mjs'
import { DeployManager } from '../scripts/deploy-manager.mjs'

describe('WorkflowEngine - 完整流程', () => {
  let engine
  let tempDir

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    engine = new WorkflowEngine(tempDir)
    await engine.init()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该完成完整工作流', async () => {
    // 阶段1: 项目初始化
    await engine.executeStage(1, { projectPath: tempDir })
    await engine.completeStage(1, { projectPath: tempDir })

    // 阶段2: 分析与规划
    const result2 = await engine.executeStage(2, {
      source: path.join(process.cwd(), 'tests/fixtures/sample-book')
    })
    await engine.completeStage(2, result2.output)

    // 阶段3: 框架生成
    const result3 = await engine.executeStage(3, result2.output)
    await engine.completeStage(3, result3.output)

    // 验证生成的文件
    expect(fs.existsSync(path.join(tempDir, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs/.vitepress/config.mts'))).toBe(true)
  })
})
```

- [ ] **步骤 2：更新 WorkflowEngine 集成各模块**

在 `scripts/workflow-engine.mjs` 中更新阶段实现：

```javascript
import { InputDetector } from './input-detector.mjs'
import { ReferenceAnalyzer } from './reference-analyzer.mjs'
import { FrameworkGenerator } from './framework-generator.mjs'
import { EnvironmentManager } from './environment-manager.mjs'
import { ConsistencyChecker } from './consistency-checker.mjs'
import { ContentCollaborator } from './content-collaborator.mjs'
import { DeployManager } from './deploy-manager.mjs'

// ... 已有代码 ...

/**
 * 阶段2: 分析与规划
 */
async #executeStage2(input) {
  const detector = new InputDetector()
  const analyzer = new ReferenceAnalyzer()

  const detected = detector.detect(input.source)
  const analysis = await analyzer.analyze(detected.path || detected.url)

  // 生成 BOOK_CONTEXT.md
  const contextContent = this.#generateBookContext(analysis)
  const contextPath = path.join(this.#projectPath, 'BOOK_CONTEXT.md')
  fs.writeFileSync(contextPath, contextContent, 'utf-8')

  return {
    success: true,
    output: {
      contextFile: 'BOOK_CONTEXT.md',
      analysis
    }
  }
}

/**
 * 阶段3: 框架生成
 */
async #executeStage3(input) {
  const generator = new FrameworkGenerator(this.#projectPath, input.analysis)

  await generator.generate()

  return {
    success: true,
    output: {
      frameworkGenerated: true
    }
  }
}

/**
 * 阶段4: 环境配置
 */
async #executeStage4(input) {
  const envManager = new EnvironmentManager()
  const checker = new ConsistencyChecker(envManager)

  // 安装依赖
  execSync('npm install', { cwd: this.#projectPath, stdio: 'inherit' })

  // 检查一致性
  const consistency = await checker.checkFull(
    this.#projectPath,
    path.join(this.#projectPath, '.github/workflows/deploy.yml')
  )

  return {
    success: true,
    output: {
      consistency
    }
  }
}

/**
 * 阶段5: 内容创作
 */
async #executeStage5(input) {
  const collaborator = new ContentCollaborator(this.#projectPath)

  // 这里只是准备阶段，实际内容创作由用户调用
  return {
    success: true,
    output: {
      contentCollaboratorReady: true
    }
  }
}

/**
 * 阶段6: 部署发布
 */
async #executeStage6(input) {
  const deployer = new DeployManager(this.#projectPath)

  await deployer.initGit()

  return {
    success: true,
    output: {
      gitInitialized: true
    }
  }
}

/**
 * 生成 BOOK_CONTEXT.md
 */
#generateBookContext(analysis) {
  return `# 书籍项目上下文

## 项目信息
- **书名**: ${analysis.title || '未命名书籍'}
- **描述**: ${analysis.description || '书籍描述'}
- **目标读者**: 开发者
- **技术栈**: ${analysis.techStack?.framework || 'VitePress'}

## 章节大纲
${analysis.chapters.map((ch, i) => `${i + 1}. ${ch.title} - ${ch.description || '章节描述'}`).join('\n')}
`
}
```

- [ ] **步骤 3：运行测试验证通过**

```bash
npm test tests/workflow-engine.test.mjs
```

预期：通过

- [ ] **步骤 4：提交集成代码**

```bash
git add scripts/workflow-engine.mjs tests/workflow-engine.test.mjs
git commit -m "feat: 集成 WorkflowEngine 与各模块"
```

---

## 任务 7：端到端测试

**文件：**
- 创建：`tests/e2e/full-workflow.test.mjs`

- [ ] **步骤 1：编写端到端测试**

创建 `tests/e2e/full-workflow.test.mjs`：

```javascript
import { WorkflowEngine } from '../../scripts/workflow-engine.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

describe('端到端工作流测试', () => {
  let tempDir
  let engine

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-e2e-'))
    engine = new WorkflowEngine(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该完成完整的书籍创建流程', async () => {
    // 初始化工作流
    await engine.init()

    // 阶段1: 项目初始化
    await engine.executeStage(1, { projectPath: tempDir })
    await engine.completeStage(1, { projectPath: tempDir })

    // 验证状态
    const state1 = engine.getState()
    expect(state1.currentStage).toBe(2)
    expect(state1.stages['1'].status).toBe('completed')

    // 阶段2: 分析与规划
    const fixturePath = path.join(process.cwd(), 'tests/fixtures/sample-book')
    const result2 = await engine.executeStage(2, { source: fixturePath })
    await engine.completeStage(2, result2.output)

    // 验证 BOOK_CONTEXT.md 生成
    const contextPath = path.join(tempDir, 'BOOK_CONTEXT.md')
    expect(fs.existsSync(contextPath)).toBe(true)

    // 阶段3: 框架生成
    const result3 = await engine.executeStage(3, result2.output)
    await engine.completeStage(3, result3.output)

    // 验证框架文件
    expect(fs.existsSync(path.join(tempDir, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs/.vitepress/config.mts'))).toBe(true)

    // 阶段4: 环境配置
    const result4 = await engine.executeStage(4, result3.output)
    await engine.completeStage(4, result4.output)

    // 验证依赖安装
    expect(fs.existsSync(path.join(tempDir, 'node_modules'))).toBe(true)

    // 阶段5: 内容创作（准备阶段）
    const result5 = await engine.executeStage(5, result4.output)
    await engine.completeStage(5, result5.output)

    // 阶段6: 部署发布
    const result6 = await engine.executeStage(6, result5.output)
    await engine.completeStage(6, result6.output)

    // 验证 Git 仓库
    expect(fs.existsSync(path.join(tempDir, '.git'))).toBe(true)

    // 最终验证
    const finalState = engine.getState()
    expect(finalState.currentStage).toBe(7) // 所有阶段完成
  }, 60000) // 设置超时时间为60秒
})
```

- [ ] **步骤 2：运行端到端测试**

```bash
npm test tests/e2e/full-workflow.test.mjs
```

预期：通过（可能需要较长时间）

- [ ] **步骤 3：提交端到端测试**

```bash
git add tests/e2e/full-workflow.test.mjs
git commit -m "test: 添加端到端工作流测试"
```

---

## 任务 8：更新 SKILL.md 和文档

**文件：**
- 修改：`SKILL.md`

- [ ] **步骤 1：更新 SKILL.md**

在 `SKILL.md` 中添加第二阶段功能说明：

```markdown
## 高级功能

### WorkflowEngine - 工作流编排

完整的工作流管理，支持中断恢复：

```javascript
import { WorkflowEngine } from './scripts/workflow-engine.mjs'

const engine = new WorkflowEngine('/path/to/project')
await engine.init()
await engine.nextStage() // 执行下一阶段
await engine.resume()    // 恢复执行
```

### FrameworkGenerator - 项目生成

自动生成 VitePress 项目骨架：

```javascript
import { FrameworkGenerator } from './scripts/framework-generator.mjs'

const generator = new FrameworkGenerator('/path/to/project', analysis)
await generator.generate()
```

### ContentCollaborator - 内容协作

AI 辅助内容创作：

```javascript
import { ContentCollaborator } from './scripts/content-collaborator.mjs'

const collaborator = new ContentCollaborator('/path/to/project')
const suggestion = await collaborator.suggestChapterContent(1)
await collaborator.applySuggestion(1, suggestion.content)
```

### DeployManager - 部署管理

Git 和 GitHub 自动化：

```javascript
import { DeployManager } from './scripts/deploy-manager.mjs'

const deployer = new DeployManager('/path/to/project')
await deployer.initGit()
await deployer.createGitHubRepo('my-book', { private: false })
await deployer.configurePages()
```
```

- [ ] **步骤 2：提交文档更新**

```bash
git add SKILL.md
git commit -m "docs: 更新 SKILL.md 添加第二阶段功能说明"
```

---

## 任务 9：最终验证和发布准备

- [ ] **步骤 1：运行完整测试套件**

```bash
npm test
```

预期：所有测试通过

- [ ] **步骤 2：验证代码质量**

```bash
# 检查代码风格
npm run lint 2>/dev/null || echo "未配置 lint"

# 检查测试覆盖率
npm test -- --coverage 2>/dev/null || echo "覆盖率报告未配置"
```

- [ ] **步骤 3：创建最终提交**

```bash
git add .
git commit -m "chore: 第二阶段实施完成"
```

- [ ] **步骤 4：推送所有更改**

```bash
git push origin main
```

---

## 总结

**第二阶段完成标志**：

- ✅ WorkflowEngine - 有状态工作流编排
- ✅ FrameworkGenerator - VitePress 项目生成
- ✅ ContentCollaborator - AI 内容建议
- ✅ DeployManager - Git/GitHub 集成
- ✅ 端到端测试通过
- ✅ 文档完善

**预期成果**：

- 从 40% 完成度提升到 100%
- 达到生产就绪状态
- 支持完整的书籍创建流程
- 所有测试通过
- 代码质量良好

**下一步建议**：

1. 在真实项目中测试
2. 根据反馈迭代优化
3. 添加更多模板支持
4. 增强 AI 内容生成能力
