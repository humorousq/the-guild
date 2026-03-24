# Book Crafter Skill 实施计划 - 第一阶段

> **For agentic workers:** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 来逐任务实施此计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标**：构建 Book Crafter Skill 的基础 - 核心工具、环境管理和基础分析功能

**架构**：6层架构（交互层 → 工作流引擎 → 智能层 → 环境层 → 内容层 → 部署层）。此阶段实现基础工具并为第二阶段核心模块做准备。

**技术栈**：Node.js 22+, VitePress, Puppeteer, simple-git, @octokit/rest, fast-glob, markdown-it

**第一阶段范围**（当前计划）：
- ✅ 项目结构和工具配置
- ✅ 核心工具（日志器、输入检测）
- ✅ 环境管理和一致性检查
- ✅ 参考源分析
- ✅ 文档和模板
- ⏸ 第二阶段：WorkflowEngine, FrameworkGenerator, ContentCollaborator, DeployManager

**预期完成度**：约 40% 的总功能

---

## 文件结构概览

```
~/Github/the-guild/
├── skills/
│   └── book-crafter/
│       ├── SKILL.md                           # Skill 主文档
│       ├── templates/                         # 书籍模板
│       │   ├── vitepress-flat/
│       │   └── vitepress-multipart/
│       ├── workflows/                         # GitHub Actions 模板
│       │   ├── deploy.yml
│       │   └── release.yml
│       ├── scripts/                           # 核心实现
│       │   ├── input-detector.mjs
│       │   ├── reference-analyzer.mjs
│       │   ├── framework-generator.mjs
│       │   ├── environment-manager.mjs
│       │   ├── content-collaborator.mjs
│       │   ├── deploy-manager.mjs
│       │   └── consistency-checker.mjs
│       ├── knowledge/                         # 环境问题排查
│       │   ├── troubleshooting-database.json
│       │   ├── node-version-issues.md
│       │   ├── puppeteer-issues.md
│       │   ├── platform-deps.md
│       │   └── ci-cd-issues.md
│       ├── utils/                             # 工具函数
│       │   ├── git-helper.mjs
│       │   ├── github-api.mjs
│       │   ├── markdown-parser.mjs
│       │   └── logger.mjs
│       └── tests/                             # 测试文件
│           ├── input-detector.test.mjs
│           ├── reference-analyzer.test.mjs
│           ├── environment-manager.test.mjs
│           └── consistency-checker.test.mjs
```

---

## 任务 1：项目初始化

**文件：**
- 创建：`~/Github/the-guild/skills/book-crafter/`
- 创建：`~/Github/the-guild/skills/book-crafter/package.json`
- 创建：`~/Github/the-guild/skills/book-crafter/.gitignore`

- [ ] **步骤 1：创建目录结构**

```bash
cd ~/Github/the-guild/skills
mkdir -p book-crafter/{templates/{vitepress-flat,vitepress-multipart},workflows,scripts,knowledge,utils,tests}
cd book-crafter
```

- [ ] **步骤 2：初始化 package.json**

创建 `package.json`：

```json
{
  "name": "book-crafter",
  "version": "1.0.0",
  "type": "module",
  "description": "AI 驱动的书籍创建技能，支持部署到 GitHub Pages",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "npm test -- --watch"
  },
  "keywords": ["skill", "book", "vitepress", "ai"],
  "author": "The Guild",
  "license": "MIT",
  "devDependencies": {
    "jest": "^29.7.0"
  },
  "dependencies": {
    "simple-git": "^3.22.0",
    "@octokit/rest": "^20.0.2",
    "fast-glob": "^3.3.0",
    "markdown-it": "^14.0.0",
    "chalk": "^5.3.0"
  }
}
```

- [ ] **步骤 3：创建 .gitignore**

创建 `.gitignore`：

```
node_modules/
.env
.DS_Store
*.log
.book-crafter/
pdf-output/
dist/
```

- [ ] **步骤 4：创建 Jest 配置**

创建 `jest.config.js`：

```javascript
export default {
  testEnvironment: 'node',
  testMatch: ['**/*.test.mjs'],
  transform: {},
  moduleFileExtensions: ['mjs', 'js', 'json'],
  extensionsToTreatAsEsm: ['.mjs'],
  verbose: true
}
```

验证配置：

```bash
# 这会失败（还没有测试）但可以验证 Jest 设置
npm test -- --version
```

预期：Jest 版本输出

- [ ] **步骤 5：安装依赖**

```bash
npm install
```

- [ ] **步骤 6：提交初始化**

```bash
git add .
git commit -m "feat: 初始化 book-crafter skill 结构"
```

---

## 任务 2：工具函数 - 日志器

**文件：**
- 创建：`utils/logger.mjs`
- 创建：`tests/logger.test.mjs`

- [ ] **步骤 1：编写日志器的失败测试**

创建 `tests/logger.test.mjs`：

```javascript
import { Logger } from '../utils/logger.mjs'

describe('Logger', () => {
  let logger
  let consoleOutput

  beforeEach(() => {
    consoleOutput = []
    logger = new Logger()
    // Mock console 方法
    console.log = (...args) => consoleOutput.push(['log', ...args])
    console.error = (...args) => consoleOutput.push(['error', ...args])
    console.warn = (...args) => consoleOutput.push(['warn', ...args])
  })

  afterEach(() => {
    // 恢复 console 方法
  })

  test('应该记录信息消息', () => {
    logger.info('测试消息')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][0]).toBe('log')
    expect(consoleOutput[0][1]).toContain('测试消息')
  })

  test('应该记录错误消息', () => {
    logger.error('错误消息')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][0]).toBe('error')
  })

  test('应该用勾号记录成功消息', () => {
    logger.success('操作成功')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][1]).toContain('✓')
  })

  test('应该格式化章节标题', () => {
    logger.section('章节标题')
    expect(consoleOutput).toHaveLength(3) // 空行、标题、分隔符
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
npm test tests/logger.test.mjs
```

预期：失败，提示 "Cannot find module '../utils/logger.mjs'"

- [ ] **步骤 3：实现日志器工具**

创建 `utils/logger.mjs`：

```javascript
import chalk from 'chalk'

export class Logger {
  info(message) {
    console.log(chalk.blue(message))
  }

  success(message) {
    console.log(chalk.green(`✓ ${message}`))
  }

  error(message) {
    console.error(chalk.red(`✗ ${message}`))
  }

  warn(message) {
    console.warn(chalk.yellow(`⚠ ${message}`))
  }

  section(title) {
    console.log()
    console.log(chalk.bold(title))
    console.log(chalk.gray('━'.repeat(40)))
  }

  step(step, total, message) {
    console.log(chalk.gray(`[${step}/${total}]`), message)
  }
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
npm test tests/logger.test.mjs
```

预期：通过

- [ ] **步骤 5：提交日志器工具**

```bash
git add utils/logger.mjs tests/logger.test.mjs
git commit -m "feat: 添加带测试的日志器工具"
```

---

## 任务 3：输入检测器

**文件：**
- 创建：`scripts/input-detector.mjs`
- 创建：`tests/input-detector.test.mjs`

- [ ] **步骤 1：编写输入检测的失败测试**

创建 `tests/input-detector.test.mjs`：

```javascript
import { InputDetector } from '../scripts/input-detector.mjs'

describe('InputDetector', () => {
  let detector

  beforeEach(() => {
    detector = new InputDetector()
  })

  test('应该检测 GitHub URL', () => {
    const result = detector.detect('https://github.com/user/repo')
    expect(result.type).toBe('github')
    expect(result.url).toBe('https://github.com/user/repo')
  })

  test('应该检测带波浪号的本地路径', () => {
    const result = detector.detect('~/Github/my-project')
    expect(result.type).toBe('local')
    expect(result.path).toContain('/Users/')
  })

  test('应该检测绝对路径', () => {
    const result = detector.detect('/Users/test/project')
    expect(result.type).toBe('local')
    expect(result.path).toBe('/Users/test/project')
  })

  test('应该检测相对路径', () => {
    const result = detector.detect('./my-project')
    expect(result.type).toBe('local')
  })

  test('应该在输入无效时抛出错误', () => {
    expect(() => detector.detect('invalid-input')).toThrow()
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
npm test tests/input-detector.test.mjs
```

预期：失败

- [ ] **步骤 3：实现输入检测器**

创建 `scripts/input-detector.mjs`：

```javascript
import path from 'path'
import os from 'os'
import fs from 'fs'

export class InputDetector {
  /**
   * 检测输入类型并返回规范化结果
   */
  detect(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('无效输入：必须是非空字符串')
    }

    // GitHub URL 检测
    if (input.startsWith('https://github.com/')) {
      return {
        type: 'github',
        url: input,
        action: 'clone'
      }
    }

    // 本地路径检测
    if (this.isLocalPath(input)) {
      const expandedPath = this.expandPath(input)

      return {
        type: 'local',
        path: expandedPath,
        exists: fs.existsSync(expandedPath),
        action: 'read'
      }
    }

    throw new Error(`无法检测输入类型：${input}`)
  }

  /**
   * 检查是否为本地路径
   */
  isLocalPath(input) {
    return input.startsWith('/') ||
           input.startsWith('~') ||
           input.startsWith('./') ||
           input.startsWith('../')
  }

  /**
   * 展开路径（处理 ~, ., ..）
   */
  expandPath(inputPath) {
    if (inputPath.startsWith('~')) {
      return inputPath.replace('~', os.homedir())
    }
    return path.resolve(inputPath)
  }
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
npm test tests/input-detector.test.mjs
```

预期：通过

- [ ] **步骤 5：提交输入检测器**

```bash
git add scripts/input-detector.mjs tests/input-detector.test.mjs
git commit -m "feat: 添加带路径展开的输入检测器"
```

---

## 任务 4：环境管理器

**文件：**
- 创建：`scripts/environment-manager.mjs`
- 创建：`tests/environment-manager.test.mjs`

- [ ] **步骤 1：编写环境管理器的失败测试**

创建 `tests/environment-manager.test.mjs`：

```javascript
import { EnvironmentManager } from '../scripts/environment-manager.mjs'

describe('EnvironmentManager', () => {
  let manager

  beforeEach(() => {
    manager = new EnvironmentManager()
  })

  test('应该检测本地环境', async () => {
    const env = await manager.detectLocal()
    expect(env).toHaveProperty('nodeVersion')
    expect(env).toHaveProperty('platform')
    expect(env).toHaveProperty('arch')
    expect(env.nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/)
  })

  test('应该检查 Node.js 版本匹配', () => {
    const match = manager.versionsMatch('v22.13.0', '22.13.0')
    expect(match).toBe(true)
  })

  test('应该检测版本不匹配', () => {
    const match = manager.versionsMatch('v18.0.0', '22.13.0')
    expect(match).toBe(false)
  })

  test('应该识别平台特定依赖', () => {
    const deps = manager.getPlatformDeps('darwin', 'arm64')
    expect(deps).toContain('@rollup/rollup-darwin-arm64')

    const linuxDeps = manager.getPlatformDeps('linux', 'x64')
    expect(linuxDeps).toContain('@rollup/rollup-linux-x64-gnu')
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
npm test tests/environment-manager.test.mjs
```

预期：失败

- [ ] **步骤 3：实现环境管理器**

创建 `scripts/environment-manager.mjs`：

```javascript
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { Logger } from '../utils/logger.mjs'

export class EnvironmentManager {
  constructor() {
    this.logger = new Logger()
  }

  /**
   * 检测本地环境
   */
  async detectLocal() {
    return {
      nodeVersion: process.version,
      npmVersion: this.getNpmVersion(),
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd()
    }
  }

  /**
   * 获取 npm 版本
   */
  getNpmVersion() {
    try {
      return execSync('npm --version', { encoding: 'utf-8' }).trim()
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * 检查 Node.js 版本是否匹配
   */
  versionsMatch(local, actions) {
    // 规范化版本（移除 'v' 前缀）
    const normalize = (v) => v.replace(/^v/, '')
    return normalize(local) === normalize(actions)
  }

  /**
   * 获取平台特定的 Rollup 依赖
   */
  getPlatformDeps(platform, arch) {
    const deps = {
      'darwin-arm64': ['@rollup/rollup-darwin-arm64'],
      'darwin-x64': ['@rollup/rollup-darwin-x64'],
      'linux-x64': ['@rollup/rollup-linux-x64-gnu'],
      'win32-x64': ['@rollup/rollup-win32-x64-msvc']
    }

    const key = `${platform}-${arch}`
    return deps[key] || []
  }

  /**
   * 检查 package-lock.json 是否存在
   */
  hasLockFile(projectPath) {
    return fs.existsSync(path.join(projectPath, 'package-lock.json'))
  }

  /**
   * 从 GitHub Actions workflow 提取 Node.js 版本
   */
  async extractActionsNodeVersion(workflowPath) {
    if (!fs.existsSync(workflowPath)) {
      return null
    }

    const content = fs.readFileSync(workflowPath, 'utf-8')
    const match = content.match(/node-version:\s*['"]?([\d.]+)['"]?/)

    return match ? match[1] : null
  }
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
npm test tests/environment-manager.test.mjs
```

预期：通过

- [ ] **步骤 5：提交环境管理器**

```bash
git add scripts/environment-manager.mjs tests/environment-manager.test.mjs
git commit -m "feat: 添加带平台检测的环境管理器"
```

---

## 任务 5：一致性检查器

**文件：**
- 创建：`scripts/consistency-checker.mjs`
- 创建：`tests/consistency-checker.test.mjs`

- [ ] **步骤 1：编写一致性检查器的失败测试**

创建 `tests/consistency-checker.test.mjs`：

```javascript
import { ConsistencyChecker } from '../scripts/consistency-checker.mjs'
import { EnvironmentManager } from '../scripts/environment-manager.mjs'

describe('ConsistencyChecker', () => {
  let checker
  let envManager

  beforeEach(() => {
    envManager = new EnvironmentManager()
    checker = new ConsistencyChecker(envManager)
  })

  test('应该检测 Node.js 版本不匹配', () => {
    const result = checker.checkNodeVersionMatch('v18.0.0', '22.0.0')
    expect(result.match).toBe(false)
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].type).toBe('node-version-mismatch')
  })

  test('应该在版本匹配时通过', () => {
    const result = checker.checkNodeVersionMatch('v22.13.0', '22.13.0')
    expect(result.match).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  test('应该检测缺失的 lock 文件', () => {
    const result = checker.checkLockFile(false)
    expect(result.hasLockFile).toBe(false)
    expect(result.issue).toBeDefined()
    expect(result.issue.type).toBe('missing-lock-file')
  })

  test('应该检查平台依赖同步', () => {
    const result = checker.checkPlatformDeps(
      'darwin', 'arm64',
      false  // Actions 没有 Linux 依赖
    )
    expect(result.synced).toBe(false)
    expect(result.issues).toHaveLength(1)
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

```bash
npm test tests/consistency-checker.test.mjs
```

预期：失败

- [ ] **步骤 3：实现一致性检查器**

创建 `scripts/consistency-checker.mjs`：

```javascript
import { Logger } from '../utils/logger.mjs'

export class ConsistencyChecker {
  constructor(envManager) {
    this.envManager = envManager
    this.logger = new Logger()
  }

  /**
   * 检查 Node.js 版本一致性
   */
  checkNodeVersionMatch(localVersion, actionsVersion) {
    const match = this.envManager.versionsMatch(localVersion, actionsVersion)

    const result = {
      match,
      local: localVersion,
      actions: actionsVersion,
      issues: []
    }

    if (!match) {
      result.issues.push({
        type: 'node-version-mismatch',
        severity: 'high',
        message: `本地 Node.js ${localVersion} 与 Actions ${actionsVersion} 不匹配`,
        fix: `更新 Actions 使用 node-version: ${localVersion.replace('v', '')}`
      })
    }

    return result
  }

  /**
   * 检查 package-lock.json 存在性
   */
  checkLockFile(hasLockFile) {
    const result = {
      hasLockFile,
      issue: null
    }

    if (!hasLockFile) {
      result.issue = {
        type: 'missing-lock-file',
        severity: 'medium',
        message: 'package-lock.json 缺失',
        fix: '运行 npm install 生成 package-lock.json'
      }
    }

    return result
  }

  /**
   * 检查平台特定依赖同步
   */
  checkPlatformDeps(localPlatform, localArch, actionsHasLinuxDep) {
    const result = {
      synced: true,
      issues: []
    }

    // 如果本地是 macOS arm64，Actions 需要 Linux x64 依赖
    if (localPlatform === 'darwin' && localArch === 'arm64') {
      if (!actionsHasLinuxDep) {
        result.synced = false
        result.issues.push({
          type: 'missing-platform-dep',
          severity: 'high',
          message: 'Actions 缺少 Linux 平台依赖',
          fix: '添加：npm install @rollup/rollup-linux-x64-gnu --no-save'
        })
      }
    }

    return result
  }

  /**
   * 完整一致性检查
   */
  async checkFull(projectPath, workflowPath) {
    const localEnv = await this.envManager.detectLocal()
    const actionsNodeVersion = await this.envManager.extractActionsNodeVersion(workflowPath)

    const issues = []

    // Node.js 版本检查
    if (actionsNodeVersion) {
      const nodeCheck = this.checkNodeVersionMatch(localEnv.nodeVersion, actionsNodeVersion)
      issues.push(...nodeCheck.issues)
    }

    // Lock 文件检查
    const hasLock = this.envManager.hasLockFile(projectPath)
    const lockCheck = this.checkLockFile(hasLock)
    if (lockCheck.issue) {
      issues.push(lockCheck.issue)
    }

    return {
      consistent: issues.length === 0,
      issues,
      localEnv,
      actionsEnv: {
        nodeVersion: actionsNodeVersion
      }
    }
  }
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
npm test tests/consistency-checker.test.mjs
```

预期：通过

- [ ] **步骤 5：提交一致性检查器**

```bash
git add scripts/consistency-checker.mjs tests/consistency-checker.test.mjs
git commit -m "feat: 添加环境验证的一致性检查器"
```

---

## 任务 6：参考源分析器

**文件：**
- 创建：`scripts/reference-analyzer.mjs`
- 创建：`tests/reference-analyzer.test.mjs`
- 创建测试固件

- [ ] **步骤 1：创建测试固件**

```bash
mkdir -p tests/fixtures/sample-book
```

创建 `tests/fixtures/sample-book/package.json`：

```json
{
  "name": "sample-book",
  "version": "1.0.0",
  "devDependencies": {
    "vitepress": "^1.3.0"
  }
}
```

创建 `tests/fixtures/sample-book/docs/index.md`：

```markdown
# 示例书籍

这是一个用于测试的示例书籍。
```

- [ ] **步骤 2：编写参考源分析器的失败测试**

创建 `tests/reference-analyzer.test.mjs`：

```javascript
import { ReferenceAnalyzer } from '../scripts/reference-analyzer.mjs'
import path from 'path'

describe('ReferenceAnalyzer', () => {
  let analyzer
  const fixturePath = path.join(process.cwd(), 'tests/fixtures/sample-book')

  beforeEach(() => {
    analyzer = new ReferenceAnalyzer()
  })

  test('应该分析书籍结构', async () => {
    const result = await analyzer.analyze(fixturePath)

    expect(result).toHaveProperty('type')
    expect(result).toHaveProperty('structure')
    expect(result).toHaveProperty('techStack')
  })

  test('应该检测 VitePress 技术栈', async () => {
    const result = await analyzer.analyze(fixturePath)

    expect(result.techStack.builder).toBe('vitepress')
  })

  test('应该检测扁平结构', async () => {
    const result = await analyzer.analyze(fixturePath)

    expect(result.structure.type).toBe('flat')
  })

  test('应该提取章节', async () => {
    const result = await analyzer.analyze(fixturePath)

    expect(result.structure).toHaveProperty('chapters')
    expect(Array.isArray(result.structure.chapters)).toBe(true)
  })
})
```

- [ ] **步骤 3：运行测试验证失败**

```bash
npm test tests/reference-analyzer.test.mjs
```

预期：失败

- [ ] **步骤 4：实现参考源分析器**

创建 `scripts/reference-analyzer.mjs`：

```javascript
import fs from 'fs'
import path from 'path'
import { glob } from 'fast-glob'
import { Logger } from '../utils/logger.mjs'

export class ReferenceAnalyzer {
  constructor() {
    this.logger = new Logger()
  }

  /**
   * 分析参考书籍项目
   */
  async analyze(projectPath) {
    this.logger.info(`分析中：${projectPath}`)

    const result = {
      path: projectPath,
      type: null,
      structure: null,
      techStack: null,
      language: null
    }

    // 检测技术栈
    result.techStack = await this.detectTechStack(projectPath)

    // 分析结构
    result.structure = await this.analyzeStructure(projectPath)

    // 检测语言
    result.language = await this.detectLanguage(projectPath)

    // 确定书籍类型
    result.type = this.determineBookType(result)

    return result
  }

  /**
   * 检测技术栈
   */
  async detectTechStack(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json')

    if (!fs.existsSync(packageJsonPath)) {
      return { builder: 'unknown' }
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    if (deps.vitepress) {
      return { builder: 'vitepress', version: deps.vitepress }
    }

    if (deps.gitbook) {
      return { builder: 'gitbook', version: deps.gitbook }
    }

    if (deps.docusaurus) {
      return { builder: 'docusaurus', version: deps.docusaurus }
    }

    return { builder: 'unknown' }
  }

  /**
   * 分析书籍结构
   */
  async analyzeStructure(projectPath) {
    const chapters = await this.findChapters(projectPath)

    const hasParts = chapters.some(ch => ch.includes('/part-'))

    if (hasParts) {
      return {
        type: 'multi-part',
        chapters: chapters
      }
    }

    return {
      type: 'flat',
      chapters: chapters
    }
  }

  /**
   * 查找所有章节文件
   */
  async findChapters(projectPath) {
    const docsPath = path.join(projectPath, 'docs')

    if (!fs.existsSync(docsPath)) {
      return []
    }

    const files = await glob([
      '**/chapter-*.md',
      '**/appendix-*.md'
    ], {
      cwd: docsPath,
      absolute: true
    })

    return files.sort()
  }

  /**
   * 检测主要语言
   */
  async detectLanguage(projectPath) {
    // 简单启发式：检查 README.md 或第一章
    const readmePath = path.join(projectPath, 'README.md')

    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf-8')
      // 检查中文字符
      if (/[\u4e00-\u9fa5]/.test(content)) {
        return 'zh'
      }
    }

    return 'en'
  }

  /**
   * 从结构和内容确定书籍类型
   */
  determineBookType(analysis) {
    const chapterCount = analysis.structure.chapters.length

    if (chapterCount < 5) {
      return 'quick-start'
    }

    // 检查教程风格指示
    const hasGettingStarted = analysis.structure.chapters.some(
      ch => ch.includes('getting-started') || ch.includes('quick-start')
    )

    if (hasGettingStarted) {
      return 'tutorial'
    }

    return 'manual'
  }
}
```

- [ ] **步骤 5：运行测试验证通过**

```bash
npm test tests/reference-analyzer.test.mjs
```

预期：通过

- [ ] **步骤 6：提交参考源分析器**

```bash
git add scripts/reference-analyzer.mjs tests/reference-analyzer.test.mjs tests/fixtures/
git commit -m "feat: 添加带结构检测的参考源分析器"
```

---

## 任务 6.5：集成测试

**文件：**
- 创建：`tests/integration/workflow.test.mjs`

- [ ] **步骤 1：创建集成测试目录**

```bash
mkdir -p tests/integration
```

- [ ] **步骤 2：编写模块协作的集成测试**

创建 `tests/integration/workflow.test.mjs`：

```javascript
import { InputDetector } from '../../scripts/input-detector.mjs'
import { ReferenceAnalyzer } from '../../scripts/reference-analyzer.mjs'
import { EnvironmentManager } from '../../scripts/environment-manager.mjs'
import { ConsistencyChecker } from '../../scripts/consistency-checker.mjs'
import path from 'path'

describe('模块集成', () => {
  test('应该通过完整流程处理本地路径', async () => {
    // 步骤 1：检测输入
    const detector = new InputDetector()
    const fixturePath = path.join(process.cwd(), 'tests/fixtures/sample-book')
    const input = detector.detect(fixturePath)

    expect(input.type).toBe('local')
    expect(input.exists).toBe(true)

    // 步骤 2：分析参考源
    const analyzer = new ReferenceAnalyzer()
    const analysis = await analyzer.analyze(input.path)

    expect(analysis.techStack.builder).toBe('vitepress')
    expect(analysis.structure.type).toBe('flat')

    // 步骤 3：检查环境
    const envManager = new EnvironmentManager()
    const localEnv = await envManager.detectLocal()

    expect(localEnv.nodeVersion).toBeDefined()
    expect(localEnv.platform).toBeDefined()

    // 步骤 4：检查一致性
    const checker = new ConsistencyChecker(envManager)
    const consistency = checker.checkLockFile(false)

    expect(consistency.hasLockFile).toBe(false)
    expect(consistency.issue).toBeDefined()
  })

  test('应该正确检测 GitHub URL', () => {
    const detector = new InputDetector()
    const result = detector.detect('https://github.com/user/repo')

    expect(result.type).toBe('github')
    expect(result.action).toBe('clone')
  })
})
```

- [ ] **步骤 3：运行集成测试**

```bash
npm test tests/integration/workflow.test.mjs
```

预期：通过（所有模块协作正常）

- [ ] **步骤 4：提交集成测试**

```bash
git add tests/integration/
git commit -m "test: 添加模块协作的集成测试"
```

---

## 任务 7：SKILL.md 文档

**文件：**
- 创建：`skills/book-crafter/SKILL.md`

- [ ] **步骤 1：编写 SKILL.md**

创建 `SKILL.md`：

```markdown
---
name: book-crafter
description: 当创建技术书籍并部署到 GitHub Pages 时使用 - 分析参考源、生成框架、配置环境、协作内容并自动化部署
---

# Book Crafter - 智能书籍创作伙伴

## 概览
Book Crafter 是一个 AI 驱动的书籍创作 Skill，提供从参考源分析到 GitHub 部署的全流程支持。

## 何时使用
- 需要创建技术书籍并部署到 GitHub Pages
- 基于现有资源创作新书籍
- 需要系统化解决环境配置问题
- 需要 AI 协助内容创作
- 跨语言书籍创作（英文参考源 → 中文书籍）

## 工作流程

**5 阶段工作流**：

1. **项目初始化** - 确定项目路径
2. **分析与规划** - 分析参考源，生成 BOOK_CONTEXT.md
3. **框架生成** - 创建项目骨架和配置
4. **环境配置** - 确保本地和 Actions 环境一致
5. **内容创作** - AI 专家式协作
6. **部署发布** - 自动部署到 GitHub Pages

## 快速参考

| 阶段 | 输入 | 输出 | 验证点 |
|------|------|------|--------|
| 项目初始化 | 项目路径 | 项目目录 | ✓ 路径有效 |
| 分析与规划 | 参考源 | BOOK_CONTEXT.md | ✓ 规划确认 |
| 框架生成 | 规划文档 | 项目骨架 | ✓ 构建测试 |
| 环境配置 | 项目骨架 | 环境就绪 | ✓ 一致性验证 |
| 内容创作 | BOOK_CONTEXT.md | 书籍内容 | ✓ 质量检查 |
| 部署发布 | 完整项目 | GitHub Release | ✓ 部署成功 |

## 关键特性
- 支持多种参考源（GitHub URL / 本地路径）
- 环境一致性保障机制
- AI 专家式内容协作
- 跨语言直接创作
- 自动化部署和发布

## 环境一致性

运行环境一致性检查：

```bash
npm run verify-env
```

检查项：
- Node.js 版本匹配
- package-lock.json 存在
- 平台特定依赖同步

## 常见问题

### 环境不一致？
检查 Node.js 版本和平台依赖配置

### 部署失败？
查看 Actions 日志，参考 knowledge/ 目录

## 实际影响
已帮助创建：
- Claude Code 实战工作流指南
- Python 实战指南
- React 开发手册
```

- [ ] **步骤 2：提交 SKILL.md**

```bash
git add SKILL.md
git commit -m "docs: 添加 SKILL.md 文档"
```

---

## 任务 8：GitHub Actions 工作流模板

**文件：**
- 创建：`workflows/deploy.yml`
- 创建：`workflows/release.yml`

- [ ] **步骤 1：创建 deploy.yml 工作流**

创建 `workflows/deploy.yml`：

```yaml
name: 部署到 GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

# 环境一致性
env:
  NODE_VERSION: '22.13.0'  # 锁定 Node.js 版本

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: 设置 Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: |
          npm ci
          npm install @rollup/rollup-linux-x64-gnu --no-save

      - name: 修复章节编号
        run: npm run fix
        continue-on-error: true

      - name: 构建网站
        run: npm run build

      - name: 设置 Pages
        uses: actions/configure-pages@v5

      - name: 上传构件
        uses: actions/upload-pages-artifact@v4
        with:
          path: docs/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: 部署到 GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **步骤 2：创建 release.yml 工作流**

创建 `workflows/release.yml`：

```yaml
name: 发布并生成 PDF

on:
  push:
    tags:
      - 'v*'

env:
  NODE_VERSION: '22.13.0'

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: 设置 Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: |
          npm ci
          npm install @rollup/rollup-linux-x64-gnu --no-save

      - name: 为 Puppeteer 安装 Chrome
        run: npx puppeteer browsers install chrome

      - name: 构建网站
        run: |
          npm run fix
          npm run build

      - name: 生成 PDF
        run: npm run pdf

      - name: 创建 Release
        uses: softprops/action-gh-release@v2
        with:
          files: pdf-output/*.pdf
          generate_release_notes: true
```

- [ ] **步骤 3：提交工作流模板**

```bash
git add workflows/
git commit -m "feat: 添加 GitHub Actions 工作流模板"
```

---

## 任务 9：故障排查知识库

**文件：**
- 创建：`knowledge/troubleshooting-database.json`
- 创建：`knowledge/node-version-issues.md`
- 创建：`knowledge/platform-deps.md`

- [ ] **步骤 1：创建故障排查数据库**

创建 `knowledge/troubleshooting-database.json`：

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-03-24",
  "issues": [
    {
      "type": "node-version-mismatch",
      "name": "Node.js 版本不匹配",
      "symptoms": [
        "本地构建成功，GitHub Actions 失败",
        "依赖安装报错"
      ],
      "severity": "high",
      "autoFix": true
    },
    {
      "type": "missing-lock-file",
      "name": "缺少 package-lock.json",
      "symptoms": [
        "本地和 Actions 安装的依赖版本不一致"
      ],
      "severity": "medium",
      "autoFix": true
    },
    {
      "type": "missing-platform-dep",
      "name": "平台特定依赖缺失",
      "symptoms": [
        "本地构建成功，Actions 构建失败",
        "Cannot find module '@rollup/rollup-xxx'"
      ],
      "severity": "high",
      "autoFix": true
    }
  ]
}
```

- [ ] **步骤 2：创建 node-version-issues.md**

创建 `knowledge/node-version-issues.md`：

```markdown
# Node.js 版本问题指南

## 问题表现

- 本地构建成功，但 GitHub Actions 失败
- 依赖安装时出现语法错误
- 某些特性在 Actions 中不可用

## 根本原因

Node.js 版本不一致导致：
1. 内置模块 API 差异
2. npm 依赖行为不同
3. 编译型原生模块不兼容

## 解决方案

### 锁定 Node.js 版本

1. 检查本地版本：
   \`\`\`bash
   node --version
   \`\`\`

2. 更新 GitHub Actions 配置：
   \`\`\`yaml
   env:
     NODE_VERSION: '22.13.0'
   \`\`\`

## 验证方法

运行一致性检查：
\`\`\`bash
npm run verify-env
\`\`\`
```

- [ ] **步骤 3：创建 platform-deps.md**

创建 `knowledge/platform-deps.md`：

```markdown
# 平台依赖问题指南

## 问题表现

- Error: Cannot find module '@rollup/rollup-darwin-arm64'
- Error: Cannot find module '@rollup/rollup-linux-x64-gnu'
- 本地构建成功，Actions 构建失败

## 根本原因

Rollup 需要针对特定平台的二进制文件。

## 解决方案

### 本地：macOS Apple Silicon

\`\`\`bash
npm install @rollup/rollup-darwin-arm64 --save-dev
\`\`\`

### GitHub Actions：Ubuntu Linux

在 workflow 中添加：

\`\`\`yaml
- name: 安装依赖
  run: |
    npm ci
    npm install @rollup/rollup-linux-x64-gnu --no-save
\`\`\`
```

- [ ] **步骤 4：提交知识库**

```bash
git add knowledge/
git commit -m "docs: 添加故障排查知识库"
```

---

## 任务 10：VitePress 扁平模板

**文件：**
- 创建：`templates/vitepress-flat/package.json`
- 创建：`templates/vitepress-flat/docs/.vitepress/config.mts`
- 创建：`templates/vitepress-flat/docs/index.md`
- 创建：`templates/vitepress-flat/scripts/generate-pdf.mjs`

- [ ] **步骤 1：创建模板 package.json**

创建 `templates/vitepress-flat/package.json`：

```json
{
  "name": "my-book",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vitepress dev docs",
    "build": "vitepress build docs",
    "preview": "vitepress preview docs",
    "pdf": "node scripts/generate-pdf.mjs"
  },
  "devDependencies": {
    "vitepress": "^1.3.0",
    "puppeteer": "^22.0.0",
    "pdf-lib": "^1.17.0",
    "chalk": "^5.3.0"
  }
}
```

- [ ] **步骤 2：创建 VitePress 配置**

创建 `templates/vitepress-flat/docs/.vitepress/config.mts`：

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '我的书籍',
  description: '一本技术书籍',
  lang: 'zh-CN',

  base: '/my-book/',
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' }
    ],

    sidebar: [
      {
        text: '开始阅读',
        items: []
      }
    ],

    search: {
      provider: 'local'
    },

    lastUpdated: true
  },

  markdown: {
    lineNumbers: true,
    math: true
  }
})
```

- [ ] **步骤 3：创建 index.md**

创建 `templates/vitepress-flat/docs/index.md`：

```markdown
---
layout: home

hero:
  name: "我的书籍"
  text: "技术书籍标题"
  tagline: 书籍简介
  actions:
    - theme: brand
      text: 开始阅读
      link: /chapters/chapter-01
---
```

- [ ] **步骤 4：创建 PDF 生成脚本占位符**

创建 `templates/vitepress-flat/scripts/generate-pdf.mjs`：

```javascript
#!/usr/bin/env node

// PDF 生成脚本
// 实现将在后续任务中添加

console.log('PDF 生成 - 待实现')
```

- [ ] **步骤 5：提交模板**

```bash
git add templates/vitepress-flat/
git commit -m "feat: 添加 VitePress 扁平模板"
```

---

## 总结

**第一阶段完成** - Book Crafter Skill 的基础和核心工具。

**关键成就**：

✅ **项目结构** 初始化（含 Jest 配置）
✅ **日志器工具** 用于一致的输出
✅ **输入检测器** 用于 GitHub URL 和本地路径
✅ **环境管理器** 用于本地环境检测
✅ **一致性检查器** 用于环境验证
✅ **参考源分析器** 用于书籍结构检测
✅ **集成测试** 用于模块协作
✅ **SKILL.md** 文档
✅ **GitHub Actions** 工作流模板
✅ **故障排查知识库**
✅ **VitePress 扁平模板**

**第一阶段覆盖度**：约 40% 的总功能

**第二阶段路线图**（不在此计划中）：
- **WorkflowEngine** - 5 阶段工作流编排
- **FrameworkGenerator** - 项目骨架生成
- **ContentCollaborator** - AI 驱动的内容创作
- **DeployManager** - Git/GitHub 部署自动化
- **模板系统** - 完整的模板管理
- **端到端测试** - 完整工作流测试

**总提交数**：11 个原子提交，遵循 TDD 方法
