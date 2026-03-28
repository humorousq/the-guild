# Book Crafter 部署和文档改进实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 简化用户部署体验，添加 README 模板和部署文档，提供灵活的部署方式

**Architecture:** 模板文件改进（package.json、index.md、README.md）+ DeployManager 扩展 + CLI 新增命令，采用中心化文档策略

**Tech Stack:** Node.js, gh-pages, VitePress, Git

---

## 文件结构

### 模板文件改动
- `skills/book-crafter/templates/vitepress-flat/package.json` - 添加 deploy 脚本和 gh-pages 依赖
- `skills/book-crafter/templates/vitepress-flat/docs/index.md` - 添加部署说明章节
- `skills/book-crafter/templates/vitepress-flat/README.md` - 新建 README 模板文件

### 业务逻辑改动
- `skills/book-crafter/scripts/framework-generator.mjs` - 添加 #generateReadme() 和 #getGitHubUserName() 方法
- `skills/book-crafter/scripts/deploy-manager.mjs` - 添加 deployToGitHubPages() 方法
- `skills/book-crafter/scripts/cli.mjs` - 添加 deploy 命令支持

### 测试文件改动
- `skills/book-crafter/tests/framework-generator.test.mjs` - 添加 README 生成测试
- `skills/book-crafter/tests/deploy-manager.test.mjs` - 添加部署方法测试
- `skills/book-crafter/tests/cli.test.mjs` - 添加 deploy 命令测试

### 文档改动
- `skills/book-crafter/SKILL.md` - 更新部署说明

---

## Task 1: 更新 package.json 模板

**Files:**
- Modify: `skills/book-crafter/templates/vitepress-flat/package.json`

- [ ] **Step 1: 更新 package.json 添加部署支持**

```json
{
  "name": "my-book",
  "version": "1.0.0",
  "type": "module",
  "description": "技术书籍项目",
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs",
    "generate:pdf": "node scripts/generate-pdf.mjs",
    "deploy": "gh-pages -d docs/.vitepress/dist"
  },
  "devDependencies": {
    "gh-pages": "^6.3.0",
    "vitepress": "^1.5.0",
    "vitepress-plugin-mermaid": "^2.0.17"
  },
  "engines": {
    "node": ">=22.13.0"
  }
}
```

- [ ] **Step 2: 提交改动**

```bash
git add skills/book-crafter/templates/vitepress-flat/package.json
git commit -m "feat: 添加 gh-pages 部署支持到模板

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 更新 index.md 模板

**Files:**
- Modify: `skills/book-crafter/templates/vitepress-flat/docs/index.md`

- [ ] **Step 1: 读取当前 index.md 内容**

当前内容：
```markdown
---
layout: doc
---

# My Book

欢迎使用 VitePress 创建的技术书籍。

## 关于本书

这是一本使用 Book Crafter Skill 创建的技术书籍。它提供了：

- 清晰的文档结构
- 响应式设计
- 搜索功能
- 暗色主题支持
- Mermaid 图表支持

## 快速开始

1. 克隆仓库
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run docs:dev`

## 目录

请使用侧边栏导航浏览章节。
```

- [ ] **Step 2: 更新 index.md 添加部署章节**

```markdown
---
layout: doc
---

# My Book

欢迎使用 VitePress 创建的技术书籍。

## 关于本书

这是一本使用 Book Crafter Skill 创建的技术书籍。它提供了：

- 清晰的文档结构
- 响应式设计
- 搜索功能
- 暗色主题支持
- Mermaid 图表支持

## 快速开始

1. 克隆仓库
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run docs:dev`

## 部署到 GitHub Pages

1. 构建项目：
   ```bash
   npm run docs:build
   ```

2. 部署到 GitHub Pages：
   ```bash
   npm run deploy
   ```

3. 在 GitHub 仓库设置中：
   - Settings > Pages
   - Source: Deploy from a branch
   - Branch: gh-pages
   - 点击 Save

4. 访问网站：
   ```
   https://[用户名].github.io/[仓库名]/
   ```

## 更新书籍

每次修改内容后：
```bash
npm run docs:build
npm run deploy
```

## 目录

请使用侧边栏导航浏览章节。
```

- [ ] **Step 3: 提交改动**

```bash
git add skills/book-crafter/templates/vitepress-flat/docs/index.md
git commit -m "docs: 添加 GitHub Pages 部署说明到模板

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 创建 README.md 模板

**Files:**
- Create: `skills/book-crafter/templates/vitepress-flat/README.md`

- [ ] **Step 1: 创建 README.md 模板文件**

```markdown
# {{bookTitle}}

> {{bookDescription}}

## 📖 在线阅读

**[立即阅读 →](https://{{userName}}.github.io/{{repoName}}/)**

## 📚 关于本书

{{bookAbout}}

## 📑 目录

{{chaptersList}}

## 🚀 本地开发

\`\`\`bash
# 克隆仓库
git clone [仓库地址]

# 安装依赖
npm install

# 启动开发服务器
npm run docs:dev

# 访问 http://localhost:5173
\`\`\`

## 📝 更新书籍

查看 [部署文档](docs/index.md#部署到-github-pages) 了解如何更新和部署书籍。

---

**[开始阅读 →](https://{{userName}}.github.io/{{repoName}}/)**
```

- [ ] **Step 2: 提交改动**

```bash
git add skills/book-crafter/templates/vitepress-flat/README.md
git commit -m "feat: 添加 README.md 模板

包含书籍信息、在线阅读链接、章节目录

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 扩展 FrameworkGenerator

**Files:**
- Modify: `skills/book-crafter/scripts/framework-generator.mjs`
- Modify: `skills/book-crafter/tests/framework-generator.test.mjs`

### Phase 1: 编写测试

- [ ] **Step 1: 添加 README 生成测试（正常情况）**

在 `tests/framework-generator.test.mjs` 的适当位置添加：

```javascript
describe('README.md 生成', () => {
  test('应该生成包含正确变量的 README.md', async () => {
    const analysis = {
      title: 'Test Book',
      description: 'A test book description',
      chapters: [
        { number: 1, title: 'Chapter 1', file: 'chapter-01.md' },
        { number: 2, title: 'Chapter 2', file: 'chapter-02.md' }
      ]
    }

    const generator = new FrameworkGenerator(testProjectPath, analysis)
    await generator.generate()

    const readme = await fs.readFile(
      path.join(testProjectPath, 'README.md'),
      'utf-8'
    )

    expect(readme).toContain('Test Book')
    expect(readme).toContain('A test book description')
    expect(readme).toContain('Chapter 1')
    expect(readme).toContain('Chapter 2')
    expect(readme).toContain('github.io')
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd skills/book-crafter && node --experimental-vm-modules node_modules/jest/bin/jest.js tests/framework-generator.test.mjs -t "应该生成包含正确变量的 README.md"`

Expected: FAIL with "no such file or directory" or similar

- [ ] **Step 3: 添加边界测试（缺失 description）**

```javascript
test('应该处理缺失的 description', async () => {
  const analysis = {
    title: 'Test Book',
    chapters: [{ number: 1, title: 'Chapter 1', file: 'chapter-01.md' }]
  }

  const generator = new FrameworkGenerator(testProjectPath, analysis)
  await generator.generate()

  const readme = await fs.readFile(
    path.join(testProjectPath, 'README.md'),
    'utf-8'
  )

  expect(readme).toContain('Test Book')
  expect(readme).toContain('技术书籍项目')
})
```

- [ ] **Step 4: 添加边界测试（空章节列表）**

```javascript
test('应该处理空章节列表', async () => {
  const analysis = {
    title: 'Test Book',
    chapters: []
  }

  const generator = new FrameworkGenerator(testProjectPath, analysis)
  await generator.generate()

  const readme = await fs.readFile(
    path.join(testProjectPath, 'README.md'),
    'utf-8'
  )

  expect(readme).toContain('Test Book')
  expect(readme).toContain('章节待添加')
})
```

- [ ] **Step 5: 添加 package.json 部署脚本测试**

```javascript
describe('package.json 部署脚本', () => {
  test('应该包含 deploy 脚本', async () => {
    const analysis = {
      title: 'Test Book',
      chapters: [{ number: 1, title: 'Chapter 1', file: 'chapter-01.md' }]
    }

    const generator = new FrameworkGenerator(testProjectPath, analysis)
    await generator.generate()

    const pkg = JSON.parse(await fs.readFile(
      path.join(testProjectPath, 'package.json'),
      'utf-8'
    ))

    expect(pkg.scripts.deploy).toBe('gh-pages -d docs/.vitepress/dist')
    expect(pkg.devDependencies).toHaveProperty('gh-pages')
  })
})
```

### Phase 2: 实现功能

- [ ] **Step 6: 读取 framework-generator.mjs 当前实现**

文件路径：`skills/book-crafter/scripts/framework-generator.mjs`

在构造函数后添加导入：

```javascript
import { exec as execCallback } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(execCallback)
```

- [ ] **Step 7: 实现 #getGitHubUserName() 方法**

在 FrameworkGenerator 类中添加私有方法：

```javascript
/**
 * 获取 GitHub 用户名
 * @returns {Promise<string>} 用户名
 */
async #getGitHubUserName() {
  try {
    const { stdout } = await execAsync('git config --get user.name')
    return stdout.trim() || 'your-username'
  } catch {
    return 'your-username'
  }
}
```

- [ ] **Step 8: 实现 #generateReadme() 方法**

```javascript
/**
 * 生成 README.md
 */
async #generateReadme() {
  this.#logger.step(5, 6, '生成 README.md')

  const readmePath = path.join(this.#projectPath, 'README.md')

  // 获取用户名和仓库名
  const userName = await this.#getGitHubUserName()
  const repoName = path.basename(this.#projectPath)

  // 生成章节列表
  const chaptersList = this.#analysis.chapters.length > 0
    ? this.#analysis.chapters
        .map(ch => `- [${ch.title}](chapter-${String(ch.number).padStart(2, '0')}.md)`)
        .join('\n')
    : '章节待添加'

  // 读取模板
  const templatePath = path.join(this.#templatePath, 'README.md')
  let readme
  try {
    readme = await fs.readFile(templatePath, 'utf-8')
  } catch (error) {
    this.#logger.warn('README.md 模板不存在，跳过生成')
    return
  }

  // 替换变量
  readme = readme
    .replace(/{{bookTitle}}/g, this.#analysis.title)
    .replace(/{{bookDescription}}/g, this.#analysis.description || '技术书籍项目')
    .replace(/{{bookAbout}}/g, this.#analysis.description || '技术书籍项目')
    .replace(/{{userName}}/g, userName)
    .replace(/{{repoName}}/g, repoName)
    .replace(/{{chaptersList}}/g, chaptersList)

  // 写入文件
  await fs.writeFile(readmePath, readme, 'utf-8')
}
```

- [ ] **Step 9: 修改 generate() 方法调用**

在 `generate()` 方法中，找到步骤编号并调整：

```javascript
async generate() {
  this.#logger.section('生成项目框架')

  // 1. 复制模板文件
  this.#logger.step(1, 6, '复制模板文件')
  await this.#copyTemplate()

  // 2. 替换占位符
  this.#logger.step(2, 6, '替换配置占位符')
  await this.#replacePlaceholders()

  // 3. 生成章节文件
  this.#logger.step(3, 6, '生成章节文件')
  await this.#generateChapters()

  // 4. 生成 VitePress 配置
  this.#logger.step(4, 6, '生成 VitePress 配置')
  await this.#generateConfig()

  // 5. 生成 README.md（新增）
  await this.#generateReadme()

  // 6. 验证配置
  this.#logger.step(6, 6, '验证项目配置')
  await this.#validateProject()

  this.#formatter.success('项目框架生成完成')
}
```

- [ ] **Step 10: 运行测试验证通过**

Run: `cd skills/book-crafter && node --experimental-vm-modules node_modules/jest/bin/jest.js tests/framework-generator.test.mjs`

Expected: All tests PASS

- [ ] **Step 11: 提交改动**

```bash
git add skills/book-crafter/scripts/framework-generator.mjs skills/book-crafter/tests/framework-generator.test.mjs
git commit -m "feat: FrameworkGenerator 添加 README.md 生成功能

- 新增 #generateReadme() 方法
- 新增 #getGitHubUserName() 方法
- 支持变量替换：title, description, userName, repoName, chaptersList
- 添加完整测试覆盖

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 扩展 DeployManager

**Files:**
- Modify: `skills/book-crafter/scripts/deploy-manager.mjs`
- Modify: `skills/book-crafter/tests/deploy-manager.test.mjs`

### Phase 1: 编写测试

- [ ] **Step 1: 添加未构建时错误测试**

在 `tests/deploy-manager.test.mjs` 添加：

```javascript
describe('deployToGitHubPages', () => {
  test('应该在未构建时提示错误', async () => {
    const manager = new DeployManager(testProjectPath)
    const result = await manager.deployToGitHubPages()

    expect(result).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd skills/book-crafter && node --experimental-vm-modules node_modules/jest/bin/jest.js tests/deploy-manager.test.mjs -t "应该在未构建时提示错误"`

Expected: FAIL with "deployToGitHubPages is not a function"

- [ ] **Step 3: 添加缺少 deploy 脚本测试**

```javascript
test('应该在缺少 deploy 脚本时提示错误', async () => {
  // 创建 dist 目录
  await fs.mkdir(
    path.join(testProjectPath, 'docs', '.vitepress', 'dist'),
    { recursive: true }
  )

  // 创建没有 deploy 脚本的 package.json
  await fs.writeFile(
    path.join(testProjectPath, 'package.json'),
    JSON.stringify({ scripts: {} })
  )

  const manager = new DeployManager(testProjectPath)
  const result = await manager.deployToGitHubPages()

  expect(result).toBe(false)
})
```

- [ ] **Step 4: 添加缺少 gh-pages 依赖测试**

```javascript
test('应该在缺少 gh-pages 依赖时提示错误', async () => {
  // 创建 dist 目录
  await fs.mkdir(
    path.join(testProjectPath, 'docs', '.vitepress', 'dist'),
    { recursive: true }
  )

  // 创建有 deploy 脚本但无依赖的 package.json
  await fs.writeFile(
    path.join(testProjectPath, 'package.json'),
    JSON.stringify({
      scripts: { deploy: 'gh-pages -d docs/.vitepress/dist' }
    })
  )

  const manager = new DeployManager(testProjectPath)
  const result = await manager.deployToGitHubPages()

  expect(result).toBe(false)
})
```

- [ ] **Step 5: 添加正常部署测试**

```javascript
test('应该在所有检查通过后执行部署', async () => {
  // 创建 dist 目录
  await fs.mkdir(
    path.join(testProjectPath, 'docs', '.vitepress', 'dist'),
    { recursive: true }
  )

  // 创建完整的 package.json
  await fs.writeFile(
    path.join(testProjectPath, 'package.json'),
    JSON.stringify({
      scripts: { deploy: 'echo "deploy mock"' },
      devDependencies: { 'gh-pages': '^6.3.0' }
    })
  )

  // 初始化 Git 仓库
  await execAsync('git init', { cwd: testProjectPath })

  const manager = new DeployManager(testProjectPath)
  const result = await manager.deployToGitHubPages()

  expect(result).toBe(true)
})
```

### Phase 2: 实现功能

- [ ] **Step 6: 实现 deployToGitHubPages() 方法**

在 `scripts/deploy-manager.mjs` 中添加必要导入和方法：

首先在文件顶部添加导入（如果没有的话）：

```javascript
import { exec as execCallback } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(execCallback)
```

然后在 DeployManager 类中添加方法：

```javascript
/**
 * 部署到 GitHub Pages
 * @returns {Promise<boolean>} 部署是否成功
 */
async deployToGitHubPages() {
  this.#logger.section('部署到 GitHub Pages')

  // 1. 检查是否已构建
  const distPath = path.join(this.#projectPath, 'docs', '.vitepress', 'dist')
  try {
    await fs.access(distPath)
  } catch {
    this.#logger.error('请先运行 npm run docs:build 构建项目')
    return false
  }

  // 2. 检查 package.json
  const pkgPath = path.join(this.#projectPath, 'package.json')
  let pkg
  try {
    pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'))
  } catch {
    this.#logger.error('无法读取 package.json')
    return false
  }

  // 3. 检查 deploy 脚本
  if (!pkg.scripts?.deploy) {
    this.#logger.error('package.json 缺少 deploy 脚本')
    this.#logger.info('请添加: "deploy": "gh-pages -d docs/.vitepress/dist"')
    return false
  }

  // 4. 检查 gh-pages 依赖
  if (!pkg.devDependencies?.['gh-pages']) {
    this.#logger.error('缺少 gh-pages 依赖')
    this.#logger.info('请运行: npm install --save-dev gh-pages')
    return false
  }

  // 5. 检查 Git 仓库
  try {
    await execAsync('git rev-parse --is-inside-work-tree', { cwd: this.#projectPath })
  } catch {
    this.#logger.error('请在 Git 仓库中执行部署')
    this.#logger.info('请运行: git init')
    return false
  }

  // 6. 执行部署
  this.#logger.step(1, 2, '执行 gh-pages 部署')
  try {
    await execAsync('npm run deploy', { cwd: this.#projectPath })
    this.#logger.success('部署成功')
  } catch (error) {
    this.#logger.error(`部署失败: ${error.message}`)

    // 常见错误提示
    if (error.message.includes('ENOENT')) {
      this.#logger.info('可能原因: gh-pages 未安装')
      this.#logger.info('解决方法: npm install --save-dev gh-pages')
    } else if (error.message.includes('permission')) {
      this.#logger.info('可能原因: 权限不足')
      this.#logger.info('解决方法: 检查 Git 配置或使用 SSH')
    }

    return false
  }

  // 7. 提示配置 GitHub Pages
  this.#logger.step(2, 2, '配置 GitHub Pages')
  this.#logger.info('请在 GitHub 仓库设置中配置 Pages:')
  this.#logger.info('  Settings > Pages')
  this.#logger.info('  Source: Deploy from a branch')
  this.#logger.info('  Branch: gh-pages')
  this.#logger.info('  Folder: / (root)')

  return true
}
```

- [ ] **Step 7: 运行测试验证通过**

Run: `cd skills/book-crafter && node --experimental-vm-modules node_modules/jest/bin/jest.js tests/deploy-manager.test.mjs`

Expected: All tests PASS

- [ ] **Step 8: 提交改动**

```bash
git add skills/book-crafter/scripts/deploy-manager.mjs skills/book-crafter/tests/deploy-manager.test.mjs
git commit -m "feat: DeployManager 添加 GitHub Pages 部署方法

- 新增 deployToGitHubPages() 方法
- 完整的前置检查（构建状态、配置、依赖、Git 环境）
- 友好的错误提示和解决建议
- 添加完整测试覆盖

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: 扩展 CLI

**Files:**
- Modify: `skills/book-crafter/scripts/cli.mjs`
- Modify: `skills/book-crafter/tests/cli.test.mjs`

### Phase 1: 编写测试

- [ ] **Step 1: 添加 deploy 命令测试**

在 `tests/cli.test.mjs` 添加：

```javascript
describe('deploy 命令', () => {
  test('应该调用 DeployManager.deployToGitHubPages()', async () => {
    const cli = new CLI(testProjectPath)

    // Mock DeployManager
    const deploySpy = jest.spyOn(
      DeployManager.prototype,
      'deployToGitHubPages'
    ).mockResolvedValue(true)

    await cli.run(['deploy'])

    expect(deploySpy).toHaveBeenCalled()
    deploySpy.mockRestore()
  })

  test('应该显示在帮助信息中', () => {
    const cli = new CLI(testProjectPath)
    const help = cli.help()

    expect(help).toContain('deploy')
    expect(help).toContain('部署到 GitHub Pages')
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd skills/book-crafter && node --experimental-vm-modules node_modules/jest/bin/jest.js tests/cli.test.mjs -t "deploy 命令"`

Expected: FAIL with deploy command not found or similar

### Phase 2: 实现功能

- [ ] **Step 3: 读取 cli.mjs 找到命令处理位置**

找到 `#runCommand()` 方法中的 switch 语句，添加新的 case。

- [ ] **Step 4: 添加 deploy 命令处理**

在 `scripts/cli.mjs` 的 switch 语句中添加：

```javascript
case 'deploy':
  await this.#deploy()
  break
```

- [ ] **Step 5: 实现 #deploy() 方法**

添加私有方法：

```javascript
/**
 * 部署到 GitHub Pages
 */
async #deploy() {
  const { DeployManager } = await import('./deploy-manager.mjs')
  const manager = new DeployManager(this.#projectPath)
  await manager.deployToGitHubPages()
}
```

- [ ] **Step 6: 更新帮助信息**

修改 `help()` 方法：

```javascript
help() {
  return `
Book Crafter CLI

用法:
  node scripts/cli.mjs <command> [options]

命令:
  init       初始化工作流
  status     查看当前状态
  next       执行下一阶段
  resume     恢复执行
  deploy     部署到 GitHub Pages

选项:
  --help     显示帮助信息

示例:
  node scripts/cli.mjs init
  node scripts/cli.mjs deploy
`.trim()
}
```

- [ ] **Step 7: 运行测试验证通过**

Run: `cd skills/book-crafter && node --experimental-vm-modules node_modules/jest/bin/jest.js tests/cli.test.mjs`

Expected: All tests PASS

- [ ] **Step 8: 提交改动**

```bash
git add skills/book-crafter/scripts/cli.mjs skills/book-crafter/tests/cli.test.mjs
git commit -m "feat: CLI 添加 deploy 命令

- 新增 deploy 命令调用 DeployManager.deployToGitHubPages()
- 更新帮助信息
- 添加完整测试覆盖

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: 运行完整测试套件

**Files:**
- All test files

- [ ] **Step 1: 运行所有测试**

Run: `cd skills/book-crafter && node --experimental-vm-modules node_modules/jest/bin/jest.js`

Expected: All test suites PASS

- [ ] **Step 2: 检查测试覆盖率**

Run: `cd skills/book-crafter && node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage`

Expected: Coverage > 90%

- [ ] **Step 3: 如有失败，修复并重新运行**

如果测试失败，根据错误信息修复代码，然后重新运行测试直到全部通过。

---

## Task 8: 更新 SKILL.md 文档

**Files:**
- Modify: `skills/book-crafter/SKILL.md`

- [ ] **Step 1: 在"快速开始"章节后添加部署说明**

找到合适位置添加：

```markdown
## 部署到 GitHub Pages

生成的项目内置了 gh-pages 部署支持。

### 使用工作流部署

```bash
node scripts/cli.mjs next  # 阶段 6 自动部署
```

### 使用 CLI 命令部署

```bash
# 构建项目
npm run docs:build

# 部署到 GitHub Pages
node scripts/cli.mjs deploy
```

### 使用 npm 脚本部署

```bash
npm run docs:build
npm run deploy
```

### 配置 GitHub Pages

部署后需要在 GitHub 仓库设置中配置：

1. 访问 Settings > Pages
2. Source: Deploy from a branch
3. Branch: gh-pages
4. Folder: / (root)
5. 点击 Save

等待 1-2 分钟后访问：`https://[用户名].github.io/[仓库名]/`
```

- [ ] **Step 2: 更新 API 参考章节**

在 DeployManager API 部分添加：

```markdown
### DeployManager

```javascript
import { DeployManager } from './scripts/deploy-manager.mjs'

const manager = new DeployManager(projectPath)

// 部署到 GitHub Pages（新增）
const success = await manager.deployToGitHubPages()
if (success) {
  console.log('部署成功')
}
```

**deployToGitHubPages() 方法**：
- 检查构建状态
- 验证配置文件
- 执行 npm run deploy
- 返回 boolean 表示是否成功
```

- [ ] **Step 3: 提交改动**

```bash
git add skills/book-crafter/SKILL.md
git commit -m "docs: 更新 SKILL.md 添加部署说明

- 添加 GitHub Pages 部署章节
- 更新 DeployManager API 文档
- 说明三种部署方式

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: 创建发布提交

- [ ] **Step 1: 查看所有改动**

Run: `git status`

确保所有文件都已提交。

- [ ] **Step 2: 创建最终发布提交**

```bash
git add -A
git commit -m "release: Book Crafter 部署和文档改进

## 新功能

### gh-pages 部署支持
- package.json 添加 deploy 脚本和 gh-pages 依赖
- DeployManager.deployToGitHubPages() 方法
- CLI deploy 命令
- 完整的前置检查和错误提示

### README.md 模板
- 自动生成 README.md 包含书籍信息
- 变量替换：title, description, userName, repoName, chaptersList
- 在线阅读链接和章节目录

### 部署文档
- index.md 添加完整部署步骤
- SKILL.md 添加部署说明

## 测试覆盖

- FrameworkGenerator: 新增 4 个测试用例
- DeployManager: 新增 4 个测试用例
- CLI: 新增 2 个测试用例
- 总测试数：新增 10+ 测试用例

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 3: 推送到远程仓库**

```bash
git push origin main
```

---

## 完成标准

- ✅ 所有模板文件更新完成（package.json, index.md, README.md）
- ✅ FrameworkGenerator 生成 README.md 功能完整
- ✅ DeployManager 部署方法实现完整
- ✅ CLI deploy 命令实现完整
- ✅ 所有测试通过
- ✅ 测试覆盖率 > 90%
- ✅ SKILL.md 文档更新
- ✅ 所有改动已提交并推送

---

## 注意事项

1. **测试优先**：每个功能都要先写测试，确保 TDD 流程
2. **完整代码**：每个步骤都包含完整代码，不要使用占位符
3. **错误处理**：所有方法都要有完整的错误处理和友好提示
4. **JSDoc 注释**：所有公共方法都要有 JSDoc 注释
5. **遵循现有代码风格**：保持与现有代码一致的命名和格式
6. **频繁提交**：每个功能点完成后立即提交

---

## 风险评估

**低风险**：
- 模板文件修改：不影响现有功能
- CLI 新增命令：向后兼容

**中风险**：
- FrameworkGenerator 修改：需充分测试变量替换逻辑
- DeployManager 扩展：需测试各种边界情况

**缓解措施**：
- 完整的单元测试和集成测试
- 充分的错误处理和回退逻辑
- 变量缺失时使用合理的默认值
