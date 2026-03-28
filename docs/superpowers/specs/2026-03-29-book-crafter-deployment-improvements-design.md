# Book Crafter 部署和文档改进设计

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 简化用户部署体验，添加 README 模板和部署文档，提供灵活的部署方式

**Architecture:** 模板文件改进（package.json、index.md、README.md）+ DeployManager 扩展 + CLI 新增命令，采用中心化文档策略（部署步骤维护在 index.md，README.md 简洁引用）

**Tech Stack:** Node.js, gh-pages, VitePress, Git

---

## 问题背景

当前 Book Crafter 生成的项目缺少部署指导：

1. ❌ package.json 没有 deploy 脚本
2. ❌ 没有安装 gh-pages 依赖
3. ❌ index.md 只有"快速开始"指导开发，完全没有部署说明
4. ❌ 缺少 README.md，用户不知道书籍发布在哪里、如何本地开发

用户反馈建议：
- 添加 gh-pages 部署支持（基于成功实践）
- 在 index.md 中添加部署步骤
- 添加 README.md 模板，包含在线阅读链接和项目概览

## 设计目标

1. **简化部署体验** - 用户无需自己摸索，开箱即用
2. **提供多种部署方式** - npm script / CLI 命令 / 工作流集成
3. **改善项目展示** - README.md 作为项目门面，包含关键信息
4. **文档中心化** - 部署详细步骤维护在 index.md，避免重复

## 架构设计

### 整体架构

```
模板层（Template Files）
  ├─ package.json          → 添加 deploy 脚本和 gh-pages 依赖
  ├─ index.md              → 添加"部署到 GitHub Pages"章节
  └─ README.md             → 新建模板，包含书籍信息和链接

业务层（Business Logic）
  └─ DeployManager         → 新增 deployToGitHubPages() 方法

接口层（Interface）
  └─ CLI                   → 新增 deploy 命令

数据流：
  用户 → CLI/工作流 → DeployManager → npm run deploy → gh-pages
```

### 文档策略：中心化引用

**选择方案 B**：README.md 简要 + index.md 详细

**理由**：
- README.md = 项目门面（"这是什么，在哪里看，怎么开始"）
- index.md = 详细说明（开发、部署、更新完整流程）
- 部署步骤只维护一处，符合 DRY 原则
- 用户体验：GitHub 首页看到"立即阅读"，需要详情时进入文档

## 组件设计

### 1. 模板文件改进

#### 1.1 package.json

**位置**：`templates/vitepress-flat/package.json`

**改动**：
```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs",
    "deploy": "gh-pages -d docs/.vitepress/dist"
  },
  "devDependencies": {
    "gh-pages": "^6.3.0",
    "vitepress": "^1.5.0",
    "vitepress-plugin-mermaid": "^2.0.17"
  }
}
```

**新增**：
- `scripts.deploy`: gh-pages 部署命令
- `devDependencies.gh-pages`: gh-pages 依赖包

#### 1.2 index.md

**位置**：`templates/vitepress-flat/docs/index.md`

**改动**：在"快速开始"章节后添加

```markdown
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
```

**说明**：完整部署流程，包含 GitHub Pages 配置步骤

#### 1.3 README.md 模板

**位置**：`templates/vitepress-flat/README.md`

**内容**：
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

**变量说明**：
- `{{bookTitle}}` - 书籍标题
- `{{bookDescription}}` - 书籍描述
- `{{bookAbout}}` - 书籍介绍（与 description 相同）
- `{{userName}}` - GitHub 用户名（从 git config 获取）
- `{{repoName}}` - 仓库名（项目目录名）
- `{{chaptersList}}` - 章节列表（自动生成）

### 2. FrameworkGenerator 扩展

**位置**：`scripts/framework-generator.mjs`

**新增方法**：`#generateReadme()`

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
  const chaptersList = this.#analysis.chapters
    .map(ch => `- [${ch.title}](chapter-${String(ch.number).padStart(2, '0')}.md)`)
    .join('\n')

  // 读取模板
  const templatePath = path.join(this.#templatePath, 'README.md')
  let readme = await fs.readFile(templatePath, 'utf-8')

  // 替换变量
  readme = readme
    .replace(/{{bookTitle}}/g, this.#analysis.title)
    .replace(/{{bookDescription}}/g, this.#analysis.description || '技术书籍项目')
    .replace(/{{bookAbout}}/g, this.#analysis.description || '技术书籍项目')
    .replace(/{{userName}}/g, userName)
    .replace(/{{repoName}}/g, repoName)
    .replace(/{{chaptersList}}/g, chaptersList || '章节待添加')

  // 写入文件
  await fs.writeFile(readmePath, readme, 'utf-8')
}

/**
 * 获取 GitHub 用户名
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

**调用位置**：在 `generate()` 方法中添加步骤

```javascript
async generate() {
  // ... 现有步骤

  // 5. 生成 README.md（新增）
  await this.#generateReadme()

  // 6. 验证配置（原有步骤）
  await this.#validateProject()
}
```

### 3. DeployManager 扩展

**位置**：`scripts/deploy-manager.mjs`

**新增方法**：`deployToGitHubPages()`

```javascript
/**
 * 部署到 GitHub Pages
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

**说明**：
- 完整的前置检查（构建状态、配置、依赖、Git 环境）
- 友好的错误提示和解决建议
- 部署成功后提示 GitHub Pages 配置步骤

### 4. CLI 扩展

**位置**：`scripts/cli.mjs`

**新增命令**：

```javascript
case 'deploy':
  await this.#deploy()
  break
```

**新增方法**：

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

**更新帮助信息**：

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

## 用户使用流程

### 场景 1：使用工作流的用户

```bash
# 1. 初始化项目
node cli.mjs init

# 2. 分析和生成框架
node cli.mjs next

# 3. 生成内容
node cli.mjs next

# 4. 部署
node cli.mjs next  # 或 node cli.mjs deploy
```

### 场景 2：手动开发的用户

```bash
# 1. 本地开发
npm run docs:dev

# 2. 构建
npm run docs:build

# 3. 部署
npm run deploy
# 或
node scripts/cli.mjs deploy
```

### 场景 3：查看项目的访客

```
1. 打开 GitHub 仓库
   ↓
   看到 README.md（包含"立即阅读"链接）

2. 点击"立即阅读"
   ↓
   访问 GitHub Pages 网站

3. 需要了解部署？
   ↓
   进入 docs/index.md 查看详细步骤
```

## 错误处理

### 部署前检查

1. **未构建检查**
   - 检查 `docs/.vitepress/dist` 目录是否存在
   - 不存在则提示：`请先运行 npm run docs:build 构建项目`

2. **package.json 检查**
   - 检查是否存在 deploy 脚本
   - 缺少则提示添加命令

3. **依赖检查**
   - 检查是否安装 gh-pages
   - 缺少则提示安装命令

4. **Git 环境检查**
   - 检查是否在 Git 仓库中
   - 不在则提示初始化 Git

### 部署失败处理

常见错误及提示：

- **ENOENT 错误**：gh-pages 未安装 → 提示 `npm install --save-dev gh-pages`
- **权限错误**：权限不足 → 提示检查 Git 配置或使用 SSH
- **其他错误**：显示错误消息，建议用户检查配置

### README 变量缺失处理

- `userName` 无法获取 → 使用默认值 `'your-username'`
- `description` 缺失 → 使用默认值 `'技术书籍项目'`
- `chapters` 为空 → 显示 `'章节待添加'`

## 测试设计

### 1. 模板文件测试

**tests/framework-generator.test.mjs**

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

    expect(readme).toContain('章节待添加')
  })
})

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

### 2. DeployManager 测试

**tests/deploy-manager.test.mjs**

```javascript
describe('deployToGitHubPages', () => {
  test('应该在未构建时提示错误', async () => {
    const manager = new DeployManager(testProjectPath)
    const result = await manager.deployToGitHubPages()

    expect(result).toBe(false)
  })

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
        scripts: { deploy: 'gh-pages -d docs/.vitepress/dist' },
        devDependencies: { 'gh-pages': '^6.3.0' }
      })
    )

    // 初始化 Git 仓库
    await execAsync('git init', { cwd: testProjectPath })

    const manager = new DeployManager(testProjectPath)
    const result = await manager.deployToGitHubPages()

    expect(result).toBe(true)
  })
})
```

### 3. CLI 测试

**tests/cli.test.mjs**

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

### 4. 端到端测试

**tests/e2e/full-workflow.test.mjs**

```javascript
describe('部署工作流', () => {
  test('应该生成包含部署配置的完整项目', async () => {
    // 1. 初始化项目
    const engine = new WorkflowEngine(testProjectPath)
    await engine.init()

    // 2. 生成框架
    const analysis = {
      title: 'Test Book',
      description: 'Test description',
      chapters: [
        { number: 1, title: 'Chapter 1', file: 'chapter-01.md' }
      ]
    }
    const generator = new FrameworkGenerator(testProjectPath, analysis)
    await generator.generate()

    // 3. 验证 package.json
    const pkg = JSON.parse(await fs.readFile(
      path.join(testProjectPath, 'package.json'),
      'utf-8'
    ))
    expect(pkg.scripts.deploy).toBe('gh-pages -d docs/.vitepress/dist')
    expect(pkg.devDependencies).toHaveProperty('gh-pages')

    // 4. 验证 README.md
    const readme = await fs.readFile(
      path.join(testProjectPath, 'README.md'),
      'utf-8'
    )
    expect(readme).toContain('Test Book')
    expect(readme).toContain('Test description')
    expect(readme).toContain('github.io')

    // 5. 验证 index.md
    const index = await fs.readFile(
      path.join(testProjectPath, 'docs', 'index.md'),
      'utf-8'
    )
    expect(index).toContain('部署到 GitHub Pages')
    expect(index).toContain('npm run deploy')
  })
})
```

## 实施任务

### Task 1: 更新 package.json 模板
- 文件：`templates/vitepress-flat/package.json`
- 改动：添加 deploy 脚本和 gh-pages 依赖

### Task 2: 更新 index.md 模板
- 文件：`templates/vitepress-flat/docs/index.md`
- 改动：添加"部署到 GitHub Pages"章节

### Task 3: 创建 README.md 模板
- 文件：`templates/vitepress-flat/README.md`
- 改动：新建模板文件，包含变量占位符

### Task 4: 扩展 FrameworkGenerator
- 文件：`scripts/framework-generator.mjs`
- 改动：添加 `#generateReadme()` 方法

### Task 5: 扩展 DeployManager
- 文件：`scripts/deploy-manager.mjs`
- 改动：添加 `deployToGitHubPages()` 方法

### Task 6: 扩展 CLI
- 文件：`scripts/cli.mjs`
- 改动：添加 deploy 命令

### Task 7: 编写测试
- 文件：`tests/framework-generator.test.mjs`, `tests/deploy-manager.test.mjs`, `tests/cli.test.mjs`
- 改动：添加新功能测试用例

### Task 8: 运行测试套件
- 验证所有测试通过

### Task 9: 更新 SKILL.md
- 文件：`SKILL.md`
- 改动：更新文档，添加部署说明

### Task 10: 创建发布提交
- 创建 commit 并推送

## 预期效果

### 用户收益

1. **开箱即用的部署**
   - 生成项目后立即可用 `npm run deploy`
   - 无需研究 gh-pages 配置

2. **清晰的项目展示**
   - README.md 包含在线阅读链接
   - GitHub 首页直接看到关键信息

3. **完整的文档**
   - index.md 包含详细部署步骤
   - 从开发到部署的完整流程

4. **灵活的使用方式**
   - 支持工作流自动化
   - 支持手动部署
   - 支持独立 CLI 命令

### 代码质量

- 完整的错误处理和友好提示
- 测试覆盖率 > 95%
- JSDoc 文档完整
- 遵循现有代码规范

## 风险评估

### 低风险

- 模板文件修改：不影响现有功能
- CLI 新增命令：向后兼容

### 中风险

- FrameworkGenerator 修改：需充分测试变量替换逻辑
- DeployManager 扩展：需测试各种边界情况

### 缓解措施

- 完整的单元测试和集成测试
- 端到端测试验证完整流程
- 充分的错误处理和回退逻辑
- 变量缺失时使用合理的默认值

## 未来扩展

### 可能的改进方向

1. **自动 GitHub Pages 配置**
   - 使用 GitHub API 自动配置 Pages 设置
   - 需要用户授权 token

2. **部署状态检查**
   - 部署后轮询检查网站是否可访问
   - 提供访问链接

3. **多环境部署**
   - 支持自定义域名
   - 支持 GitHub Actions 自动部署
   - 支持其他平台（Netlify、Vercel）

4. **README 增强功能**
   - 自动生成书籍封面图
   - 添加构建状态徽章
   - 添加贡献指南链接

这些改进可在后续版本中根据用户反馈逐步实现。
