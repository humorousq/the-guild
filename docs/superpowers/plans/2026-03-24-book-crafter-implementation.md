# Book Crafter Skill Implementation Plan - Phase 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build foundation for Book Crafter Skill - core utilities, environment management, and basic analysis tools

**Architecture:** 6-layer architecture (Interaction → Workflow Engine → Intelligence → Environment → Content → Deployment). This phase implements foundational tools and prepares for Phase 2 core modules.

**Tech Stack:** Node.js 22+, VitePress, Puppeteer, simple-git, @octokit/rest, fast-glob, markdown-it

**Phase 1 Scope** (Current Plan):
- ✅ Project structure and tooling
- ✅ Core utilities (Logger, Input detection)
- ✅ Environment management and consistency checking
- ✅ Reference analysis
- ✅ Documentation and templates
- ⏸ Phase 2: WorkflowEngine, FrameworkGenerator, ContentCollaborator, DeployManager

**Expected completion:** ~40% of total skill functionality

---

## File Structure Overview

```
~/Github/the-guild/
├── skills/
│   └── book-crafter/
│       ├── SKILL.md                           # Main skill documentation
│       ├── templates/                         # Book templates
│       │   ├── vitepress-flat/
│       │   └── vitepress-multipart/
│       ├── workflows/                         # GitHub Actions templates
│       │   ├── deploy.yml
│       │   └── release.yml
│       ├── scripts/                           # Core implementation
│       │   ├── input-detector.mjs
│       │   ├── reference-analyzer.mjs
│       │   ├── framework-generator.mjs
│       │   ├── environment-manager.mjs
│       │   ├── content-collaborator.mjs
│       │   ├── deploy-manager.mjs
│       │   └── consistency-checker.mjs
│       ├── knowledge/                         # Environment troubleshooting
│       │   ├── troubleshooting-database.json
│       │   ├── node-version-issues.md
│       │   ├── puppeteer-issues.md
│       │   ├── platform-deps.md
│       │   └── ci-cd-issues.md
│       ├── utils/                             # Utility functions
│       │   ├── git-helper.mjs
│       │   ├── github-api.mjs
│       │   ├── markdown-parser.mjs
│       │   └── logger.mjs
│       └── tests/                             # Test files
│           ├── input-detector.test.mjs
│           ├── reference-analyzer.test.mjs
│           ├── environment-manager.test.mjs
│           └── consistency-checker.test.mjs
```

---

## Task 1: Project Initialization

**Files:**
- Create: `~/Github/the-guild/skills/book-crafter/`
- Create: `~/Github/the-guild/skills/book-crafter/package.json`
- Create: `~/Github/the-guild/skills/book-crafter/.gitignore`

- [ ] **Step 1: Create directory structure**

```bash
cd ~/Github/the-guild/skills
mkdir -p book-crafter/{templates/{vitepress-flat,vitepress-multipart},workflows,scripts,knowledge,utils,tests}
cd book-crafter
```

- [ ] **Step 2: Initialize package.json**

Create `package.json`:

```json
{
  "name": "book-crafter",
  "version": "1.0.0",
  "type": "module",
  "description": "AI-driven book creation skill with GitHub Pages deployment",
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

- [ ] **Step 3: Create .gitignore**

Create `.gitignore`:

```
node_modules/
.env
.DS_Store
*.log
.book-crafter/
pdf-output/
dist/
```

- [ ] **Step 4: Create Jest configuration**

Create `jest.config.js`:

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

Verify configuration:

```bash
# This will fail (no tests yet) but validates Jest setup
npm test -- --version
```

Expected: Jest version output

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

- [ ] **Step 6: Commit initialization**

```bash
git add .
git commit -m "feat: initialize book-crafter skill structure"
```

---

## Task 2: Utility Functions - Logger

**Files:**
- Create: `utils/logger.mjs`
- Create: `tests/logger.test.mjs`

- [ ] **Step 1: Write the failing test for logger**

Create `tests/logger.test.mjs`:

```javascript
import { Logger } from '../utils/logger.mjs'

describe('Logger', () => {
  let logger
  let consoleOutput

  beforeEach(() => {
    consoleOutput = []
    logger = new Logger()
    // Mock console methods
    console.log = (...args) => consoleOutput.push(['log', ...args])
    console.error = (...args) => consoleOutput.push(['error', ...args])
    console.warn = (...args) => consoleOutput.push(['warn', ...args])
  })

  test('should log info messages', () => {
    logger.info('Test message')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][0]).toBe('log')
    expect(consoleOutput[0][1]).toContain('Test message')
  })

  test('should log error messages', () => {
    logger.error('Error message')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][0]).toBe('error')
  })

  test('should log success messages with checkmark', () => {
    logger.success('Operation successful')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][1]).toContain('✓')
  })

  test('should format section headers', () => {
    logger.section('Section Title')
    expect(consoleOutput).toHaveLength(3) // Empty line, title, separator
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/logger.test.mjs
```

Expected: FAIL with "Cannot find module '../utils/logger.mjs'"

- [ ] **Step 3: Implement logger utility**

Create `utils/logger.mjs`:

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

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test tests/logger.test.mjs
```

Expected: PASS

- [ ] **Step 5: Commit logger utility**

```bash
git add utils/logger.mjs tests/logger.test.mjs
git commit -m "feat: add logger utility with tests"
```

---

## Task 3: Input Detector

**Files:**
- Create: `scripts/input-detector.mjs`
- Create: `tests/input-detector.test.mjs`

- [ ] **Step 1: Write the failing test for input detection**

Create `tests/input-detector.test.mjs`:

```javascript
import { InputDetector } from '../scripts/input-detector.mjs'

describe('InputDetector', () => {
  let detector

  beforeEach(() => {
    detector = new InputDetector()
  })

  test('should detect GitHub URL', () => {
    const result = detector.detect('https://github.com/user/repo')
    expect(result.type).toBe('github')
    expect(result.url).toBe('https://github.com/user/repo')
  })

  test('should detect local path with tilde', () => {
    const result = detector.detect('~/Github/my-project')
    expect(result.type).toBe('local')
    expect(result.path).toContain('/Users/')
  })

  test('should detect local absolute path', () => {
    const result = detector.detect('/Users/test/project')
    expect(result.type).toBe('local')
    expect(result.path).toBe('/Users/test/project')
  })

  test('should detect local relative path', () => {
    const result = detector.detect('./my-project')
    expect(result.type).toBe('local')
  })

  test('should throw error for invalid input', () => {
    expect(() => detector.detect('invalid-input')).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/input-detector.test.mjs
```

Expected: FAIL

- [ ] **Step 3: Implement input detector**

Create `scripts/input-detector.mjs`:

```javascript
import path from 'path'
import os from 'os'
import fs from 'fs'

export class InputDetector {
  /**
   * Detect input type and return normalized result
   */
  detect(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: must be a non-empty string')
    }

    // GitHub URL detection
    if (input.startsWith('https://github.com/')) {
      return {
        type: 'github',
        url: input,
        action: 'clone'
      }
    }

    // Local path detection
    if (this.isLocalPath(input)) {
      const expandedPath = this.expandPath(input)

      return {
        type: 'local',
        path: expandedPath,
        exists: fs.existsSync(expandedPath),
        action: 'read'
      }
    }

    throw new Error(`Unable to detect input type for: ${input}`)
  }

  /**
   * Check if input is a local path
   */
  isLocalPath(input) {
    return input.startsWith('/') ||
           input.startsWith('~') ||
           input.startsWith('./') ||
           input.startsWith('../')
  }

  /**
   * Expand path (handle ~, ., ..)
   */
  expandPath(inputPath) {
    if (inputPath.startsWith('~')) {
      return inputPath.replace('~', os.homedir())
    }
    return path.resolve(inputPath)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test tests/input-detector.test.mjs
```

Expected: PASS

- [ ] **Step 5: Commit input detector**

```bash
git add scripts/input-detector.mjs tests/input-detector.test.mjs
git commit -m "feat: add input detector with path expansion"
```

---

## Task 4: Environment Manager

**Files:**
- Create: `scripts/environment-manager.mjs`
- Create: `tests/environment-manager.test.mjs`

- [ ] **Step 1: Write the failing test for environment manager**

Create `tests/environment-manager.test.mjs`:

```javascript
import { EnvironmentManager } from '../scripts/environment-manager.mjs'

describe('EnvironmentManager', () => {
  let manager

  beforeEach(() => {
    manager = new EnvironmentManager()
  })

  test('should detect local environment', async () => {
    const env = await manager.detectLocal()
    expect(env).toHaveProperty('nodeVersion')
    expect(env).toHaveProperty('platform')
    expect(env).toHaveProperty('arch')
    expect(env.nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/)
  })

  test('should check Node.js version match', () => {
    const match = manager.versionsMatch('v22.13.0', '22.13.0')
    expect(match).toBe(true)
  })

  test('should detect version mismatch', () => {
    const match = manager.versionsMatch('v18.0.0', '22.13.0')
    expect(match).toBe(false)
  })

  test('should identify platform-specific dependencies', () => {
    const deps = manager.getPlatformDeps('darwin', 'arm64')
    expect(deps).toContain('@rollup/rollup-darwin-arm64')

    const linuxDeps = manager.getPlatformDeps('linux', 'x64')
    expect(linuxDeps).toContain('@rollup/rollup-linux-x64-gnu')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/environment-manager.test.mjs
```

Expected: FAIL

- [ ] **Step 3: Implement environment manager**

Create `scripts/environment-manager.mjs`:

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
   * Detect local environment
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
   * Get npm version
   */
  getNpmVersion() {
    try {
      return execSync('npm --version', { encoding: 'utf-8' }).trim()
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Check if Node.js versions match
   */
  versionsMatch(local, actions) {
    // Normalize versions (remove 'v' prefix)
    const normalize = (v) => v.replace(/^v/, '')
    return normalize(local) === normalize(actions)
  }

  /**
   * Get platform-specific Rollup dependencies
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
   * Check if package-lock.json exists
   */
  hasLockFile(projectPath) {
    return fs.existsSync(path.join(projectPath, 'package-lock.json'))
  }

  /**
   * Extract Node.js version from GitHub Actions workflow
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

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test tests/environment-manager.test.mjs
```

Expected: PASS

- [ ] **Step 5: Commit environment manager**

```bash
git add scripts/environment-manager.mjs tests/environment-manager.test.mjs
git commit -m "feat: add environment manager with platform detection"
```

---

## Task 5: Consistency Checker

**Files:**
- Create: `scripts/consistency-checker.mjs`
- Create: `tests/consistency-checker.test.mjs`

- [ ] **Step 1: Write the failing test for consistency checker**

Create `tests/consistency-checker.test.mjs`:

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

  test('should detect Node.js version mismatch', () => {
    const result = checker.checkNodeVersionMatch('v18.0.0', '22.0.0')
    expect(result.match).toBe(false)
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].type).toBe('node-version-mismatch')
  })

  test('should pass when versions match', () => {
    const result = checker.checkNodeVersionMatch('v22.13.0', '22.13.0')
    expect(result.match).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  test('should detect missing lock file', () => {
    const result = checker.checkLockFile(false)
    expect(result.hasLockFile).toBe(false)
    expect(result.issue).toBeDefined()
    expect(result.issue.type).toBe('missing-lock-file')
  })

  test('should check platform dependency sync', () => {
    const result = checker.checkPlatformDeps(
      'darwin', 'arm64',
      false  // Actions doesn't have Linux dep
    )
    expect(result.synced).toBe(false)
    expect(result.issues).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/consistency-checker.test.mjs
```

Expected: FAIL

- [ ] **Step 3: Implement consistency checker**

Create `scripts/consistency-checker.mjs`:

```javascript
import { Logger } from '../utils/logger.mjs'

export class ConsistencyChecker {
  constructor(envManager) {
    this.envManager = envManager
    this.logger = new Logger()
  }

  /**
   * Check Node.js version consistency
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
        message: `Local Node.js ${localVersion} doesn't match Actions ${actionsVersion}`,
        fix: `Update Actions to use node-version: ${localVersion.replace('v', '')}`
      })
    }

    return result
  }

  /**
   * Check package-lock.json existence
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
        message: 'package-lock.json is missing',
        fix: 'Run npm install to generate package-lock.json'
      }
    }

    return result
  }

  /**
   * Check platform-specific dependencies sync
   */
  checkPlatformDeps(localPlatform, localArch, actionsHasLinuxDep) {
    const result = {
      synced: true,
      issues: []
    }

    // If local is macOS arm64, Actions needs Linux x64 dep
    if (localPlatform === 'darwin' && localArch === 'arm64') {
      if (!actionsHasLinuxDep) {
        result.synced = false
        result.issues.push({
          type: 'missing-platform-dep',
          severity: 'high',
          message: 'Actions missing Linux platform dependency',
          fix: 'Add: npm install @rollup/rollup-linux-x64-gnu --no-save'
        })
      }
    }

    return result
  }

  /**
   * Full consistency check
   */
  async checkFull(projectPath, workflowPath) {
    const localEnv = await this.envManager.detectLocal()
    const actionsNodeVersion = await this.envManager.extractActionsNodeVersion(workflowPath)

    const issues = []

    // Node.js version check
    if (actionsNodeVersion) {
      const nodeCheck = this.checkNodeVersionMatch(localEnv.nodeVersion, actionsNodeVersion)
      issues.push(...nodeCheck.issues)
    }

    // Lock file check
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

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test tests/consistency-checker.test.mjs
```

Expected: PASS

- [ ] **Step 5: Commit consistency checker**

```bash
git add scripts/consistency-checker.mjs tests/consistency-checker.test.mjs
git commit -m "feat: add consistency checker for environment validation"
```

---

## Task 6: Reference Analyzer

**Files:**
- Create: `scripts/reference-analyzer.mjs`
- Create: `tests/reference-analyzer.test.mjs`
- Create test fixtures

- [ ] **Step 1: Create test fixtures**

```bash
mkdir -p tests/fixtures/sample-book
```

Create `tests/fixtures/sample-book/package.json`:

```json
{
  "name": "sample-book",
  "version": "1.0.0",
  "devDependencies": {
    "vitepress": "^1.3.0"
  }
}
```

Create `tests/fixtures/sample-book/docs/index.md`:

```markdown
# Sample Book

This is a sample book for testing.
```

- [ ] **Step 2: Write the failing test for reference analyzer**

Create `tests/reference-analyzer.test.mjs`:

```javascript
import { ReferenceAnalyzer } from '../scripts/reference-analyzer.mjs'
import path from 'path'

describe('ReferenceAnalyzer', () => {
  let analyzer
  const fixturePath = path.join(process.cwd(), 'tests/fixtures/sample-book')

  beforeEach(() => {
    analyzer = new ReferenceAnalyzer()
  })

  test('should analyze book structure', async () => {
    const result = await analyzer.analyze(fixturePath)

    expect(result).toHaveProperty('type')
    expect(result).toHaveProperty('structure')
    expect(result).toHaveProperty('techStack')
  })

  test('should detect VitePress tech stack', async () => {
    const result = await analyzer.analyze(fixturePath)

    expect(result.techStack.builder).toBe('vitepress')
  })

  test('should detect flat structure', async () => {
    const result = await analyzer.analyze(fixturePath)

    expect(result.structure.type).toBe('flat')
  })

  test('should extract chapters', async () => {
    const result = await analyzer.analyze(fixturePath)

    expect(result.structure).toHaveProperty('chapters')
    expect(Array.isArray(result.structure.chapters)).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test tests/reference-analyzer.test.mjs
```

Expected: FAIL

- [ ] **Step 4: Implement reference analyzer**

Create `scripts/reference-analyzer.mjs`:

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
   * Analyze a reference book project
   */
  async analyze(projectPath) {
    this.logger.info(`Analyzing: ${projectPath}`)

    const result = {
      path: projectPath,
      type: null,
      structure: null,
      techStack: null,
      language: null
    }

    // Detect tech stack
    result.techStack = await this.detectTechStack(projectPath)

    // Analyze structure
    result.structure = await this.analyzeStructure(projectPath)

    // Detect language
    result.language = await this.detectLanguage(projectPath)

    // Determine book type
    result.type = this.determineBookType(result)

    return result
  }

  /**
   * Detect technology stack
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
   * Analyze book structure
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
   * Find all chapter files
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
   * Detect primary language
   */
  async detectLanguage(projectPath) {
    // Simple heuristic: check README.md or first chapter
    const readmePath = path.join(projectPath, 'README.md')

    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf-8')
      // Check for Chinese characters
      if (/[\u4e00-\u9fa5]/.test(content)) {
        return 'zh'
      }
    }

    return 'en'
  }

  /**
   * Determine book type from structure and content
   */
  determineBookType(analysis) {
    const chapterCount = analysis.structure.chapters.length

    if (chapterCount < 5) {
      return 'quick-start'
    }

    // Check for tutorial-style indicators
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

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test tests/reference-analyzer.test.mjs
```

Expected: PASS

- [ ] **Step 6: Commit reference analyzer**

```bash
git add scripts/reference-analyzer.mjs tests/reference-analyzer.test.mjs tests/fixtures/
git commit -m "feat: add reference analyzer with structure detection"
```

---

## Task 6.5: Integration Test

**Files:**
- Create: `tests/integration/workflow.test.mjs`

- [ ] **Step 1: Create integration test directory**

```bash
mkdir -p tests/integration
```

- [ ] **Step 2: Write integration test for module collaboration**

Create `tests/integration/workflow.test.mjs`:

```javascript
import { InputDetector } from '../../scripts/input-detector.mjs'
import { ReferenceAnalyzer } from '../../scripts/reference-analyzer.mjs'
import { EnvironmentManager } from '../../scripts/environment-manager.mjs'
import { ConsistencyChecker } from '../../scripts/consistency-checker.mjs'
import path from 'path'

describe('Module Integration', () => {
  test('should process local path through full pipeline', async () => {
    // Step 1: Detect input
    const detector = new InputDetector()
    const fixturePath = path.join(process.cwd(), 'tests/fixtures/sample-book')
    const input = detector.detect(fixturePath)

    expect(input.type).toBe('local')
    expect(input.exists).toBe(true)

    // Step 2: Analyze reference
    const analyzer = new ReferenceAnalyzer()
    const analysis = await analyzer.analyze(input.path)

    expect(analysis.techStack.builder).toBe('vitepress')
    expect(analysis.structure.type).toBe('flat')

    // Step 3: Check environment
    const envManager = new EnvironmentManager()
    const localEnv = await envManager.detectLocal()

    expect(localEnv.nodeVersion).toBeDefined()
    expect(localEnv.platform).toBeDefined()

    // Step 4: Check consistency
    const checker = new ConsistencyChecker(envManager)
    const consistency = checker.checkLockFile(false)

    expect(consistency.hasLockFile).toBe(false)
    expect(consistency.issue).toBeDefined()
  })

  test('should detect GitHub URL correctly', () => {
    const detector = new InputDetector()
    const result = detector.detect('https://github.com/user/repo')

    expect(result.type).toBe('github')
    expect(result.action).toBe('clone')
  })
})
```

- [ ] **Step 3: Run integration test**

```bash
npm test tests/integration/workflow.test.mjs
```

Expected: PASS (all modules working together)

- [ ] **Step 4: Commit integration test**

```bash
git add tests/integration/
git commit -m "test: add integration test for module collaboration"
```

---

## Task 7: SKILL.md Documentation

**Files:**
- Create: `skills/book-crafter/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `SKILL.md`:

```markdown
---
name: book-crafter
description: Use when creating technical books with deployment to GitHub Pages - analyzes references, generates framework, configures environment, collaborates on content, and automates deployment
---

# Book Crafter - 智能书籍创作伙伴

## Overview
Book Crafter 是一个 AI 驱动的书籍创作 Skill，提供从参考源分析到 GitHub 部署的全流程支持。

## When to Use
- 需要创建技术书籍并部署到 GitHub Pages
- 基于现有资源创作新书籍
- 需要系统化解决环境配置问题
- 需要 AI 协助内容创作
- 跨语言书籍创作（英文参考源 → 中文书籍）

## Workflow

**5 阶段工作流**：

1. **项目初始化** - 确定项目路径
2. **分析与规划** - 分析参考源，生成 BOOK_CONTEXT.md
3. **框架生成** - 创建项目骨架和配置
4. **环境配置** - 确保本地和 Actions 环境一致
5. **内容创作** - AI 专家式协作
6. **部署发布** - 自动部署到 GitHub Pages

## Quick Reference

| 阶段 | 输入 | 输出 | 验证点 |
|------|------|------|--------|
| 项目初始化 | 项目路径 | 项目目录 | ✓ 路径有效 |
| 分析与规划 | 参考源 | BOOK_CONTEXT.md | ✓ 规划确认 |
| 框架生成 | 规划文档 | 项目骨架 | ✓ 构建测试 |
| 环境配置 | 项目骨架 | 环境就绪 | ✓ 一致性验证 |
| 内容创作 | BOOK_CONTEXT.md | 书籍内容 | ✓ 质量检查 |
| 部署发布 | 完整项目 | GitHub Release | ✓ 部署成功 |

## Key Features
- 支持多种参考源（GitHub URL / 本地路径）
- 环境一致性保障机制
- AI 专家式内容协作
- 跨语言直接创作
- 自动化部署和发布

## Environment Consistency

运行环境一致性检查：

```bash
npm run verify-env
```

检查项：
- Node.js 版本匹配
- package-lock.json 存在
- 平台特定依赖同步

## Common Issues

### 环境不一致？
检查 Node.js 版本和平台依赖配置

### 部署失败？
查看 Actions 日志，参考 knowledge/ 目录

## Real-World Impact
已帮助创建：
- Claude Code 实战工作流指南
- Python 实战指南
- React 开发手册
```

- [ ] **Step 2: Commit SKILL.md**

```bash
git add SKILL.md
git commit -m "docs: add SKILL.md documentation"
```

---

## Task 8: GitHub Actions Workflow Templates

**Files:**
- Create: `workflows/deploy.yml`
- Create: `workflows/release.yml`

- [ ] **Step 1: Create deploy.yml workflow**

Create `workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

# Environment consistency
env:
  NODE_VERSION: '22.13.0'  # Lock Node.js version

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

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          npm install @rollup/rollup-linux-x64-gnu --no-save

      - name: Fix chapter numbering
        run: npm run fix
        continue-on-error: true

      - name: Build website
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
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
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create release.yml workflow**

Create `workflows/release.yml`:

```yaml
name: Release with PDF

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

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          npm install @rollup/rollup-linux-x64-gnu --no-save

      - name: Install Chrome for Puppeteer
        run: npx puppeteer browsers install chrome

      - name: Build website
        run: |
          npm run fix
          npm run build

      - name: Generate PDF
        run: npm run pdf

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          files: pdf-output/*.pdf
          generate_release_notes: true
```

- [ ] **Step 3: Commit workflow templates**

```bash
git add workflows/
git commit -m "feat: add GitHub Actions workflow templates"
```

---

## Task 9: Troubleshooting Knowledge Base

**Files:**
- Create: `knowledge/troubleshooting-database.json`
- Create: `knowledge/node-version-issues.md`
- Create: `knowledge/platform-deps.md`

- [ ] **Step 1: Create troubleshooting database**

Create `knowledge/troubleshooting-database.json`:

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

- [ ] **Step 2: Create node-version-issues.md**

Create `knowledge/node-version-issues.md`:

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

- [ ] **Step 3: Create platform-deps.md**

Create `knowledge/platform-deps.md`:

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
- name: Install dependencies
  run: |
    npm ci
    npm install @rollup/rollup-linux-x64-gnu --no-save
\`\`\`
```

- [ ] **Step 4: Commit knowledge base**

```bash
git add knowledge/
git commit -m "docs: add troubleshooting knowledge base"
```

---

## Task 10: VitePress Flat Template

**Files:**
- Create: `templates/vitepress-flat/package.json`
- Create: `templates/vitepress-flat/docs/.vitepress/config.mts`
- Create: `templates/vitepress-flat/docs/index.md`
- Create: `templates/vitepress-flat/scripts/generate-pdf.mjs`

- [ ] **Step 1: Create template package.json**

Create `templates/vitepress-flat/package.json`:

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

- [ ] **Step 2: Create VitePress config**

Create `templates/vitepress-flat/docs/.vitepress/config.mts`:

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'My Book',
  description: 'A technical book',
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

- [ ] **Step 3: Create index.md**

Create `templates/vitepress-flat/docs/index.md`:

```markdown
---
layout: home

hero:
  name: "My Book"
  text: "技术书籍标题"
  tagline: 书籍简介
  actions:
    - theme: brand
      text: 开始阅读
      link: /chapters/chapter-01
---
```

- [ ] **Step 4: Create PDF generation script placeholder**

Create `templates/vitepress-flat/scripts/generate-pdf.mjs`:

```javascript
#!/usr/bin/env node

// PDF generation script
// Implementation will be added in future tasks

console.log('PDF generation - to be implemented')
```

- [ ] **Step 5: Commit template**

```bash
git add templates/vitepress-flat/
git commit -m "feat: add VitePress flat template"
```

---

## Summary

**Phase 1 Complete** - Foundation and core utilities for the Book Crafter Skill.

**Key Accomplishments**:

✅ **Project structure** initialized with Jest configuration
✅ **Logger utility** for consistent output
✅ **Input detector** for GitHub URL and local paths
✅ **Environment manager** for local environment detection
✅ **Consistency checker** for environment validation
✅ **Reference analyzer** for book structure detection
✅ **Integration test** for module collaboration
✅ **SKILL.md** documentation
✅ **GitHub Actions** workflow templates
✅ **Troubleshooting knowledge base**
✅ **VitePress flat template**

**Phase 1 Coverage**: ~40% of total skill functionality

**Phase 2 Roadmap** (not in this plan):
- **WorkflowEngine** - 5-stage workflow orchestration
- **FrameworkGenerator** - Project skeleton generation
- **ContentCollaborator** - AI-powered content creation
- **DeployManager** - Git/GitHub deployment automation
- **Template system** - Complete template management
- **End-to-end testing** - Full workflow tests

**Total commits**: 11 atomic commits following TDD approach
