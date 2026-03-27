# Book Crafter 用户体验改进实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改进 book-crafter 技能的用户体验，修复 9 个已知问题，添加 CLI 支持、配置验证、Mermaid 图表支持等功能

**Architecture:** 采用模块化设计，新增 3 个独立模块（CLI、ConfigValidator、OutputFormatter），改进 3 个现有模块，更新 3 个模板文件，完善测试覆盖率

**Tech Stack:** Node.js 22+, VitePress 1.0+, vitepress-plugin-mermaid 2.0+, Jest 29+

---

## 文件结构

**新增文件：**
- `skills/book-crafter/scripts/output-formatter.mjs` - 统一的输出格式化器
- `skills/book-crafter/scripts/config-validator.mjs` - VitePress 配置验证器
- `skills/book-crafter/scripts/cli.mjs` - 命令行接口
- `skills/book-crafter/tests/output-formatter.test.mjs` - OutputFormatter 测试
- `skills/book-crafter/tests/config-validator.test.mjs` - ConfigValidator 测试
- `skills/book-crafter/tests/cli.test.mjs` - CLI 测试

**修改文件：**
- `skills/book-crafter/scripts/workflow-engine.mjs` - 集成 OutputFormatter
- `skills/book-crafter/scripts/framework-generator.mjs` - 集成验证和格式化，修正路由
- `skills/book-crafter/scripts/reference-analyzer.mjs` - 集成 OutputFormatter
- `skills/book-crafter/templates/vitepress-flat/package.json` - 添加 Mermaid 依赖
- `skills/book-crafter/templates/vitepress-flat/docs/index.md` - 修正 layout
- `skills/book-crafter/templates/vitepress-flat/docs/.vitepress/config.mts` - 启用 Mermaid
- `skills/book-crafter/tests/framework-generator.test.mjs` - 添加验证测试
- `skills/book-crafter/tests/e2e/full-workflow.test.mjs` - 添加 CLI 和验证测试

---

## Phase 1: 基础模块

### Task 1: OutputFormatter 模块

**Files:**
- Create: `skills/book-crafter/scripts/output-formatter.mjs`
- Test: `skills/book-crafter/tests/output-formatter.test.mjs`

- [ ] **Step 1: 编写 OutputFormatter 测试**

```javascript
// tests/output-formatter.test.mjs
import { OutputFormatter } from '../scripts/output-formatter.mjs'

describe('OutputFormatter 测试', () => {
  let formatter
  let logSpy

  beforeEach(() => {
    formatter = new OutputFormatter()
    logSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  test('应该正确格式化工作流状态', () => {
    const state = {
      currentStage: 3,
      stages: {
        '1': { name: '初始化', status: 'completed' },
        '2': { name: '分析', status: 'completed' },
        '3': { name: '生成', status: 'pending' },
        '4': { name: '配置', status: 'pending' },
        '5': { name: '创作', status: 'pending' },
        '6': { name: '部署', status: 'pending' }
      }
    }

    formatter.formatWorkflowState(state)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('阶段 3/6'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('已完成: 2/6'))
  })

  test('应该正确格式化分析结果', () => {
    const analysis = {
      title: 'Test Book',
      bookType: 'documentation',
      chapters: [
        { title: 'Chapter 1' },
        { title: 'Chapter 2' }
      ]
    }

    formatter.formatAnalysisResult(analysis)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Test Book'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('2 个潜在章节'))
  })

  test('应该生成浏览器缓存提示', () => {
    formatter.formatBrowserCacheTip()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Cmd+Shift+R'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Ctrl+Shift+F5'))
  })

  test('应该格式化成功的验证结果', () => {
    const result = { valid: true, errors: [], warnings: [] }
    formatter.formatValidationResult(result)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('✅'))
  })

  test('应该格式化失败的验证结果', () => {
    const result = {
      valid: false,
      errors: [{ message: 'Error 1' }],
      warnings: [{ message: 'Warning 1' }]
    }
    formatter.formatValidationResult(result)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('❌'))
  })

  test('应该输出成功消息', () => {
    formatter.success('操作成功')

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('✅ 操作成功'))
  })

  test('应该输出警告消息', () => {
    formatter.warn('警告信息')

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  警告信息'))
  })

  test('应该输出错误消息', () => {
    formatter.error('错误信息')

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('❌ 错误信息'))
  })

  test('应该输出信息消息', () => {
    formatter.info('提示信息')

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ️  提示信息'))
  })

  test('应该输出步骤消息', () => {
    formatter.step(1, 5, '复制文件')

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('步骤 1/5: 复制文件'))
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

运行: `cd skills/book-crafter && npm test tests/output-formatter.test.mjs`
预期: FAIL - Cannot find module '../scripts/output-formatter.mjs'

- [ ] **Step 3: 实现 OutputFormatter**

```javascript
// scripts/output-formatter.mjs
export class OutputFormatter {
  /**
   * 格式化工作流状态
   */
  formatWorkflowState(state) {
    const completed = Object.values(state.stages)
      .filter(s => s.status === 'completed').length

    console.log(`
📊 当前状态: 阶段 ${state.currentStage}/6
   ${state.stages[state.currentStage]?.name || '未知'}

✅ 已完成: ${completed}/6
    `)
  }

  /**
   * 格式化分析结果
   */
  formatAnalysisResult(analysis) {
    console.log(`
📚 分析结果:
   书名: ${analysis.title}
   类型: ${analysis.bookType}
   章节数: ${analysis.chapters.length}

📊 分析建议:
   发现 ${analysis.chapters.length} 个潜在章节
   建议按以下方式组织:
${analysis.chapters.map((ch, i) => `   ${i+1}. ${ch.title}`).join('\n')}
    `)
  }

  /**
   * 生成浏览器缓存问题提示
   */
  formatBrowserCacheTip() {
    console.log(`
⚠️  重要提示：
   如果浏览器显示空白或 404，请：
   1. 按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+F5 (Windows) 强制刷新
   2. 或使用浏览器的隐私/无痕模式访问
    `)
  }

  /**
   * 格式化配置验证结果
   */
  formatValidationResult(result) {
    if (result.valid) {
      this.success('配置验证通过')
      return
    }

    console.log(`\n🔍 配置验证报告\n`)

    if (result.errors.length > 0) {
      console.log(`❌ 发现 ${result.errors.length} 个错误:`)
      result.errors.forEach((err, i) => {
        console.log(`  ${i+1}. ${err.message}`)
      })
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  发现 ${result.warnings.length} 个警告:`)
      result.warnings.forEach((warn, i) => {
        console.log(`  ${i+1}. ${warn.message}`)
      })
    }
  }

  /**
   * 成功消息
   */
  success(message) {
    console.log(`\n✅ ${message}\n`)
  }

  /**
   * 警告消息
   */
  warn(message) {
    console.log(`⚠️  ${message}`)
  }

  /**
   * 错误消息
   */
  error(message) {
    console.log(`❌ ${message}`)
  }

  /**
   * 信息消息
   */
  info(message) {
    console.log(`ℹ️  ${message}`)
  }

  /**
   * 步骤消息
   */
  step(number, total, message) {
    console.log(`\n📍 步骤 ${number}/${total}: ${message}`)
  }
}
```

- [ ] **Step 4: 运行测试，确认通过**

运行: `cd skills/book-crafter && npm test tests/output-formatter.test.mjs`
预期: PASS - 所有测试通过

- [ ] **Step 5: 提交 OutputFormatter**

```bash
git add skills/book-crafter/scripts/output-formatter.mjs skills/book-crafter/tests/output-formatter.test.mjs
git commit -m "feat: 添加 OutputFormatter 模块

- 统一的输出格式化器
- 支持工作流状态、分析结果、验证结果格式化
- 提供成功、警告、错误、信息、步骤消息
- 完整的单元测试覆盖

解决问题 5 和 6：统一输出格式，友好提示

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: ConfigValidator 模块

**Files:**
- Create: `skills/book-crafter/scripts/config-validator.mjs`
- Test: `skills/book-crafter/tests/config-validator.test.mjs`

- [ ] **Step 1: 编写 ConfigValidator 基础测试**

```javascript
// tests/config-validator.test.mjs
import { ConfigValidator } from '../scripts/config-validator.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('ConfigValidator 测试', () => {
  let tempDir
  let validator

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-test-'))
    validator = new ConfigValidator(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  async function createProject(structure) {
    const docsPath = path.join(tempDir, 'docs')
    fs.mkdirSync(docsPath, { recursive: true })
    fs.mkdirSync(path.join(docsPath, '.vitepress'), { recursive: true })

    // 创建配置文件
    if (structure.config) {
      fs.writeFileSync(
        path.join(docsPath, '.vitepress', 'config.mts'),
        structure.config
      )
    }

    // 创建 markdown 文件
    for (const file of structure.files || []) {
      fs.writeFileSync(
        path.join(docsPath, file.name),
        file.content
      )
    }
  }

  test('应该检测到路由不匹配', async () => {
    await createProject({
      config: `
export default {
  themeConfig: {
    sidebar: [
      { text: 'Chapter 1', link: '/chapters/chapter-1' }
    ]
  }
}
      `,
      files: [
        { name: 'chapter-01.md', content: '# Chapter 1' }
      ]
    })

    const result = await validator.validate()

    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: 'BROKEN_LINK'
      })
    )
  })

  test('应该检测到 layout 问题', async () => {
    await createProject({
      config: `export default {}`,
      files: [
        { name: 'index.md', content: '---\nlayout: home\n---\n# Title' }
      ]
    })

    const result = await validator.validate()

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: 'LAYOUT_ISSUE'
      })
    )
  })

  test('应该验证通过的配置', async () => {
    await createProject({
      config: `
export default {
  themeConfig: {
    sidebar: [
      { text: 'Chapter 1', link: '/chapter-01' }
    ]
  }
}
      `,
      files: [
        { name: 'index.md', content: '---\nlayout: doc\n---\n# Title' },
        { name: 'chapter-01.md', content: '# Chapter 1' }
      ]
    })

    const result = await validator.validate()

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

运行: `cd skills/book-crafter && npm test tests/config-validator.test.mjs`
预期: FAIL - Cannot find module

- [ ] **Step 3: 实现 ConfigValidator 基础功能**

```javascript
// scripts/config-validator.mjs
import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'

export class ConfigValidator {
  constructor(projectPath) {
    this.projectPath = projectPath
    this.docsPath = path.join(projectPath, 'docs')
    this.configPath = path.join(this.docsPath, '.vitepress', 'config.mts')
  }

  /**
   * 验证整个配置
   * @returns {Promise<{valid: boolean, errors: Array, warnings: Array}>}
   */
  async validate() {
    const errors = []
    const warnings = []

    try {
      // 1. 验证配置文件存在
      await this.#validateConfigExists()

      // 2. 验证路由配置
      const routerErrors = await this.#validateSidebarLinks()
      errors.push(...routerErrors)

      // 3. 检查 layout 设置
      const layoutErrors = await this.#checkLayoutIssues()
      errors.push(...layoutErrors)

      // 4. 验证文件存在性
      const fileErrors = await this.#validateFilesExist()
      errors.push(...fileErrors)

    } catch (error) {
      errors.push({
        type: 'CRITICAL',
        message: error.message
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证侧边栏链接
   * @private
   */
  async #validateSidebarLinks() {
    const errors = []
    const config = await this.#readConfig()
    const sidebar = this.#extractSidebar(config)

    for (const item of sidebar) {
      const link = item.link
      const expectedFile = this.#linkToFile(link)

      const filePath = path.join(this.docsPath, expectedFile)
      try {
        await fs.access(filePath)
      } catch {
        errors.push({
          type: 'BROKEN_LINK',
          message: `链接 ${link} 指向不存在的文件: ${expectedFile}`,
          link,
          expectedFile
        })
      }
    }

    return errors
  }

  /**
   * 检测常见的 layout 问题
   * @private
   */
  async #checkLayoutIssues() {
    const errors = []
    const indexPath = path.join(this.docsPath, 'index.md')

    try {
      const content = await fs.readFile(indexPath, 'utf-8')

      if (content.includes('layout: home')) {
        errors.push({
          type: 'LAYOUT_ISSUE',
          message: 'index.md 使用 "home" layout，内容将不会显示',
          file: 'docs/index.md',
          suggestion: '将 layout 改为 "doc"'
        })
      }
    } catch {
      // index.md 不存在，忽略
    }

    return errors
  }

  /**
   * 验证文件存在性
   * @private
   */
  async #validateFilesExist() {
    const errors = []
    const files = await fg(path.join(this.docsPath, '*.md'))

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      // 检查文件是否有有效的标题
      if (!content.match(/^#\s+.+/m)) {
        errors.push({
          type: 'MISSING_TITLE',
          message: `文件 ${path.basename(file)} 缺少标题`,
          file
        })
      }
    }

    return errors
  }

  /**
   * 链接转文件路径
   */
  #linkToFile(link) {
    // /chapter-01 -> chapter-01.md
    return link.replace(/^\//, '') + '.md'
  }

  /**
   * 生成修复建议
   */
  generateFixSuggestions(errors) {
    return errors.map(error => {
      switch(error.type) {
        case 'BROKEN_LINK':
          return `修复链接: 将 ${error.link} 改为指向存在的文件`
        case 'LAYOUT_ISSUE':
          return `修改 ${error.file} 的 layout 为 "doc"`
        case 'MISSING_TITLE':
          return `为 ${error.file} 添加标题`
        default:
          return error.message
      }
    })
  }

  async #readConfig() {
    const content = await fs.readFile(this.configPath, 'utf-8')
    return content
  }

  #extractSidebar(config) {
    // 简化实现：正则提取 sidebar 链接
    const links = []
    const linkPattern = /link:\s*['"]([^'"]+)['"]/g
    let match

    while ((match = linkPattern.exec(config)) !== null) {
      links.push({ link: match[1] })
    }

    return links
  }

  async #validateConfigExists() {
    await fs.access(this.configPath)
  }
}
```

- [ ] **Step 4: 运行测试，确认通过**

运行: `cd skills/book-crafter && npm test tests/config-validator.test.mjs`
预期: PASS

- [ ] **Step 5: 扩展测试 - 内部链接和图片检查**

在 `tests/config-validator.test.mjs` 中添加更多测试：

```javascript
  test('应该检测到内部链接错误', async () => {
    await createProject({
      config: `export default {}`,
      files: [
        {
          name: 'chapter-01.md',
          content: '# Chapter 1\n\n[链接](./missing.md)'
        }
      ]
    })

    const result = await validator.validate()

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: 'BROKEN_INTERNAL_LINK'
      })
    )
  })

  test('应该检测到缺失的图片', async () => {
    await createProject({
      config: `export default {}`,
      files: [
        {
          name: 'chapter-01.md',
          content: '# Chapter 1\n\n![图片](./missing.png)'
        }
      ]
    })

    const result = await validator.validate()

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: 'MISSING_IMAGE'
      })
    )
  })

  test('应该警告未完成的内容', async () => {
    await createProject({
      config: `export default {}`,
      files: [
        {
          name: 'chapter-01.md',
          content: '# Chapter 1\n\nTODO: 待补充'
        }
      ]
    })

    const result = await validator.validate()

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        type: 'INCOMPLETE_CONTENT'
      })
    )
  })

  test('应该生成正确的修复建议', async () => {
    const errors = [
      {
        type: 'BROKEN_LINK',
        message: '链接 /chapters/chapter-1 不存在',
        link: '/chapters/chapter-1',
        expectedFile: 'chapters/chapter-1.md'
      },
      {
        type: 'LAYOUT_ISSUE',
        message: 'index.md 使用 home layout',
        file: 'docs/index.md'
      },
      {
        type: 'BROKEN_INTERNAL_LINK',
        message: '链接不存在',
        file: 'docs/chapter-01.md',
        link: './missing.md'
      },
      {
        type: 'MISSING_IMAGE',
        message: '图片不存在',
        file: 'docs/chapter-01.md',
        image: './images/missing.png'
      }
    ]

    const suggestions = validator.generateFixSuggestions(errors)

    expect(suggestions).toHaveLength(4)
    expect(suggestions[0]).toContain('修复链接')
    expect(suggestions[1]).toContain('layout 为 "doc"')
    expect(suggestions[2]).toContain('./missing.md')
    expect(suggestions[3]).toContain('添加缺失的图片')
  })
```

- [ ] **Step 6: 运行测试，确认失败**

运行: `cd skills/book-crafter && npm test tests/config-validator.test.mjs`
预期: FAIL - BROKEN_INTERNAL_LINK 等错误类型未实现

- [ ] **Step 7: 扩展 ConfigValidator 实现**

在 `scripts/config-validator.mjs` 的 `validate()` 方法中添加新的检查：

```javascript
  async validate() {
    const errors = []
    const warnings = []

    try {
      // 1. 验证配置文件存在
      await this.#validateConfigExists()

      // 2. 验证路由配置
      const routerErrors = await this.#validateSidebarLinks()
      errors.push(...routerErrors)

      // 3. 检查 layout 设置
      const layoutErrors = await this.#checkLayoutIssues()
      errors.push(...layoutErrors)

      // 4. 验证文件存在性
      const fileErrors = await this.#validateFilesExist()
      errors.push(...fileErrors)

      // 5. 检查内部链接（新增）
      const linkErrors = await this.#checkInternalLinks()
      errors.push(...linkErrors)

      // 6. 检查图片资源（新增）
      const imageErrors = await this.#checkImages()
      errors.push(...imageErrors)

      // 7. 检查内容完整性（新增）
      const contentWarnings = await this.#checkContentCompleteness()
      warnings.push(...contentWarnings)

    } catch (error) {
      errors.push({
        type: 'CRITICAL',
        message: error.message
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
```

添加新的私有方法：

```javascript
  /**
   * 检查内部链接有效性（新增）
   * @private
   */
  async #checkInternalLinks() {
    const errors = []
    const files = await fg(path.join(this.docsPath, '**/*.md'))

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      // 提取 Markdown 链接 [text](link)
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
      let match

      while ((match = linkPattern.exec(content)) !== null) {
        const link = match[2]

        // 只检查相对路径链接（不检查外部链接）
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
          const targetPath = path.resolve(path.dirname(file), link)

          try {
            await fs.access(targetPath)
          } catch {
            errors.push({
              type: 'BROKEN_INTERNAL_LINK',
              message: `文件 ${path.basename(file)} 中的链接指向不存在的路径: ${link}`,
              file,
              link
            })
          }
        }
      }
    }

    return errors
  }

  /**
   * 检查图片资源（新增）
   * @private
   */
  async #checkImages() {
    const errors = []
    const files = await fg(path.join(this.docsPath, '**/*.md'))

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      // 提取图片链接 ![alt](src)
      const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
      let match

      while ((match = imagePattern.exec(content)) !== null) {
        const src = match[2]

        // 只检查相对路径图片
        if (!src.startsWith('http://') && !src.startsWith('https://')) {
          const imagePath = path.resolve(path.dirname(file), src)

          try {
            await fs.access(imagePath)
          } catch {
            errors.push({
              type: 'MISSING_IMAGE',
              message: `文件 ${path.basename(file)} 引用的图片不存在: ${src}`,
              file,
              image: src
            })
          }
        }
      }
    }

    return errors
  }

  /**
   * 检查内容完整性（新增）
   * @private
   */
  async #checkContentCompleteness() {
    const warnings = []
    const files = await fg(path.join(this.docsPath, '*.md'))

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      const basename = path.basename(file)

      // 检查是否有待办标记
      if (content.includes('TODO') || content.includes('待编写')) {
        warnings.push({
          type: 'INCOMPLETE_CONTENT',
          message: `文件 ${basename} 包含未完成的内容标记`,
          file
        })
      }

      // 检查内容长度（太短可能不完整）
      const lines = content.split('\n').filter(line => !line.startsWith('#')).length
      if (lines < 5) {
        warnings.push({
          type: 'SHORT_CONTENT',
          message: `文件 ${basename} 内容较少（仅 ${lines} 行），可能不完整`,
          file
        })
      }
    }

    return warnings
  }
```

更新 `generateFixSuggestions` 方法：

```javascript
  generateFixSuggestions(errors) {
    return errors.map(error => {
      switch(error.type) {
        case 'BROKEN_LINK':
          return `修复链接: 将 ${error.link} 改为指向存在的文件`
        case 'LAYOUT_ISSUE':
          return `修改 ${error.file} 的 layout 为 "doc"`
        case 'MISSING_TITLE':
          return `为 ${error.file} 添加标题`
        case 'BROKEN_INTERNAL_LINK':
          return `修复 ${path.basename(error.file)} 中的链接: ${error.link}`
        case 'MISSING_IMAGE':
          return `添加缺失的图片: ${error.image}`
        default:
          return error.message
      }
    })
  }
```

- [ ] **Step 8: 运行测试，确认通过**

运行: `cd skills/book-crafter && npm test tests/config-validator.test.mjs`
预期: PASS - 所有测试通过

- [ ] **Step 9: 提交 ConfigValidator**

```bash
git add skills/book-crafter/scripts/config-validator.mjs skills/book-crafter/tests/config-validator.test.mjs
git commit -m "feat: 添加 ConfigValidator 模块

- VitePress 配置验证器
- 检查路由配置、layout、文件存在性
- 检查内部链接、图片资源、内容完整性
- 生成修复建议
- 完整的单元测试覆盖

解决问题 2, 3, 4, 9：配置验证、路由修正、质量检查

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 2: CLI 模块

### Task 3: CLI 模块

**Files:**
- Create: `skills/book-crafter/scripts/cli.mjs`
- Test: `skills/book-crafter/tests/cli.test.mjs`

- [ ] **Step 1: 编写 CLI 测试**

```javascript
// tests/cli.test.mjs
import { CLI } from '../scripts/cli.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { WorkflowEngine } from '../scripts/workflow-engine.mjs'

// Mock WorkflowEngine
jest.mock('../scripts/workflow-engine.mjs')

describe('CLI 模块测试', () => {
  let tempDir
  let originalArgv

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-'))
    originalArgv = process.argv
    jest.clearAllMocks()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
    process.argv = originalArgv
  })

  test('应该正确解析 init 命令', async () => {
    process.argv = ['node', 'cli.mjs', 'init', tempDir]

    const mockInit = jest.fn()
    WorkflowEngine.mockImplementation(() => ({
      init: mockInit
    }))

    const cli = new CLI()
    await cli.run()

    expect(WorkflowEngine).toHaveBeenCalledWith(tempDir)
    expect(mockInit).toHaveBeenCalled()
  })

  test('应该正确解析 next 命令', async () => {
    process.argv = ['node', 'cli.mjs', 'next']

    const mockNextStage = jest.fn()
    WorkflowEngine.mockImplementation(() => ({
      nextStage: mockNextStage
    }))

    const cli = new CLI()
    await cli.run()

    expect(mockNextStage).toHaveBeenCalled()
  })

  test('应该正确解析 resume 命令', async () => {
    process.argv = ['node', 'cli.mjs', 'resume']

    const mockResume = jest.fn()
    WorkflowEngine.mockImplementation(() => ({
      resume: mockResume
    }))

    const cli = new CLI()
    await cli.run()

    expect(mockResume).toHaveBeenCalled()
  })

  test('应该正确解析 status 命令', async () => {
    process.argv = ['node', 'cli.mjs', 'status']

    const mockState = { currentStage: 1, stages: {} }
    WorkflowEngine.mockImplementation(() => ({
      getState: jest.fn().mockResolvedValue(mockState)
    }))

    const logSpy = jest.spyOn(console, 'log').mockImplementation()

    const cli = new CLI()
    await cli.run()

    expect(logSpy).toHaveBeenCalled()
    logSpy.mockRestore()
  })

  test('应该显示帮助信息', async () => {
    process.argv = ['node', 'cli.mjs', '--help']

    const logSpy = jest.spyOn(console, 'log').mockImplementation()

    const cli = new CLI()
    await cli.run()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Book Crafter CLI'))
    logSpy.mockRestore()
  })

  test('应该处理无效命令', async () => {
    process.argv = ['node', 'cli.mjs', 'invalid']

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})

    const cli = new CLI()
    await cli.run()

    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
  })

  test('应该使用当前目录作为默认路径', async () => {
    process.argv = ['node', 'cli.mjs', 'init']

    const mockInit = jest.fn()
    WorkflowEngine.mockImplementation((path) => ({
      init: mockInit
    }))

    const cli = new CLI()
    await cli.run()

    expect(WorkflowEngine).toHaveBeenCalledWith(process.cwd())
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

运行: `cd skills/book-crafter && npm test tests/cli.test.mjs`
预期: FAIL - Cannot find module

- [ ] **Step 3: 实现 CLI**

```javascript
// scripts/cli.mjs
import { WorkflowEngine } from './workflow-engine.mjs'
import { OutputFormatter } from './output-formatter.mjs'

class CLI {
  constructor() {
    this.engine = null
    this.formatter = new OutputFormatter()
  }

  async run() {
    const { command, options } = this.#parseArgs()
    await this.#executeCommand(command, options)
  }

  #parseArgs() {
    const args = process.argv.slice(2)
    const command = args[0]
    const options = {
      path: args[1] || process.cwd()
    }
    return { command, options }
  }

  async #executeCommand(command, options) {
    this.engine = new WorkflowEngine(options.path)

    switch(command) {
      case 'init':
        await this.engine.init()
        break
      case 'next':
        await this.engine.nextStage()
        break
      case 'resume':
        await this.engine.resume()
        break
      case 'status':
        const state = await this.engine.getState()
        this.formatter.formatWorkflowState(state)
        break
      case '--help':
      case '-h':
        this.#printHelp()
        break
      default:
        this.formatter.error(`未知命令: ${command}`)
        this.#printHelp()
        process.exit(1)
    }
  }

  #printHelp() {
    console.log(`
Book Crafter CLI

用法:
  node scripts/cli.mjs <command> [options]

命令:
  init [path]    初始化工作流 (默认: 当前目录)
  next           执行下一阶段
  resume         恢复执行
  status         查看当前状态
  --help, -h     显示帮助信息

示例:
  node scripts/cli.mjs init /path/to/my-book
  node scripts/cli.mjs next
  node scripts/cli.mjs resume
    `)
  }
}

// 入口
if (process.argv[1] && process.argv[1].endsWith('cli.mjs')) {
  const cli = new CLI()
  await cli.run()
}

export { CLI }
```

- [ ] **Step 4: 运行测试，确认通过**

运行: `cd skills/book-crafter && npm test tests/cli.test.mjs`
预期: PASS - 所有测试通过

- [ ] **Step 5: 提交 CLI**

```bash
git add skills/book-crafter/scripts/cli.mjs skills/book-crafter/tests/cli.test.mjs
git commit -m "feat: 添加 CLI 模块

- 命令行接口支持 init, next, resume, status 命令
- 参数解析和错误处理
- 友好的帮助信息
- 完整的单元测试覆盖

解决问题 1：工作流引擎缺少 CLI 入口

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 3: 改进现有模块

### Task 4: 改进 workflow-engine.mjs

**Files:**
- Modify: `skills/book-crafter/scripts/workflow-engine.mjs`

- [ ] **Step 1: 添加 OutputFormatter 集成测试**

在 `tests/workflow-engine.test.mjs` 中添加：

```javascript
  test('应该使用 OutputFormatter 格式化输出', async () => {
    const engine = new WorkflowEngine(tempDir)
    await engine.init()

    // 验证状态格式化输出
    const logSpy = jest.spyOn(console, 'log')
    const state = await engine.getState()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('阶段'))
    logSpy.mockRestore()
  })
```

- [ ] **Step 2: 运行测试，确认失败**

运行: `cd skills/book-crafter && npm test tests/workflow-engine.test.mjs`
预期: FAIL - 未集成 OutputFormatter

- [ ] **Step 3: 修改 workflow-engine.mjs**

在文件开头添加导入：

```javascript
import { OutputFormatter } from './output-formatter.mjs'
```

在构造函数中添加 formatter：

```javascript
  constructor(projectPath) {
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('projectPath 必须是非空字符串')
    }
    this.#projectPath = projectPath
    this.#statePath = path.join(projectPath, '.book-crafter', 'state.json')
    this.#logger = new Logger()
    this.#formatter = new OutputFormatter()  // 新增
    this.#state = null
  }
```

修改 init() 方法：

```javascript
  async init() {
    // ... 现有代码 ...

    await this.#saveState()
    this.#formatter.success('工作流初始化完成')
    this.#formatter.formatWorkflowState(this.#state)
  }
```

修改 completeStage() 方法：

```javascript
  async completeStage(stageNumber, output = {}) {
    const state = await this.getState()

    if (!state.stages[stageNumber]) {
      throw new Error(`无效的阶段编号: ${stageNumber}`)
    }

    this.#validateTransition(state.currentStage, stageNumber)

    state.stages[stageNumber] = {
      ...state.stages[stageNumber],
      status: 'completed',
      timestamp: new Date().toISOString(),
      output
    }

    state.currentStage = stageNumber + 1
    state.metadata.updatedAt = new Date().toISOString()

    await this.#saveState()
    this.#formatter.success(`阶段 ${stageNumber} 完成: ${state.stages[stageNumber].name}`)
    this.#formatter.formatWorkflowState(state)
  }
```

修改 nextStage() 方法：

```javascript
  async nextStage(input = {}) {
    const state = await this.getState()
    this.#formatter.info(`开始执行阶段 ${state.currentStage}: ${state.stages[state.currentStage].name}`)

    const result = await this.executeStage(state.currentStage, input)
    await this.completeStage(state.currentStage, result.output)

    return result
  }
```

修改 resume() 方法：

```javascript
  async resume() {
    const state = await this.getState()
    this.#formatter.info(`恢复执行，当前阶段: ${state.currentStage}`)
    return await this.nextStage()
  }
```

- [ ] **Step 4: 运行测试，确认通过**

运行: `cd skills/book-crafter && npm test tests/workflow-engine.test.mjs`
预期: PASS

- [ ] **Step 5: 提交改进**

```bash
git add skills/book-crafter/scripts/workflow-engine.mjs skills/book-crafter/tests/workflow-engine.test.mjs
git commit -m "feat: 集成 OutputFormatter 到 WorkflowEngine

- 统一的输出格式
- 友好的状态提示
- 浏览器缓存提示

解决问题 5：没有浏览器自动刷新提示

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: 改进 framework-generator.mjs

**Files:**
- Modify: `skills/book-crafter/scripts/framework-generator.mjs`
- Modify: `skills/book-crafter/tests/framework-generator.test.mjs`

- [ ] **Step 1: 添加路由修正和验证集成测试**

在 `tests/framework-generator.test.mjs` 中添加：

```javascript
describe('FrameworkGenerator 配置验证', () => {
  test('应该生成正确的路由格式', async () => {
    const analysis = {
      title: 'Test Book',
      description: 'Test',
      chapters: [
        { number: 1, title: 'Chapter 1', file: 'chapter-01.md' },
        { number: 2, title: 'Chapter 2', file: 'chapter-02.md' }
      ]
    }

    const generator = new FrameworkGenerator(tempDir, analysis)
    await generator.generate()

    const config = await fs.readFile(
      path.join(tempDir, 'docs', '.vitepress', 'config.mts'),
      'utf-8'
    )

    // 验证路由格式正确
    expect(config).toContain('/chapter-01')
    expect(config).toContain('/chapter-02')
    expect(config).not.toContain('/chapters/chapter-1')
  })

  test('应该在生成后验证配置', async () => {
    const analysis = {
      title: 'Test Book',
      description: 'Test',
      chapters: [{ number: 1, title: 'Chapter 1', file: 'chapter-01.md' }]
    }

    const generator = new FrameworkGenerator(tempDir, analysis)
    await generator.generate()

    const validator = new ConfigValidator(tempDir)
    const result = await validator.validate()

    expect(result.valid).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

运行: `cd skills/book-crafter && npm test tests/framework-generator.test.mjs`
预期: FAIL - 路由格式错误，缺少验证

- [ ] **Step 3: 修改 framework-generator.mjs**

添加导入：

```javascript
import { ConfigValidator } from './config-validator.mjs'
import { OutputFormatter } from './output-formatter.mjs'
```

添加私有字段：

```javascript
  #validator  // 新增
  #formatter  // 新增
```

在构造函数中初始化：

```javascript
  constructor(projectPath, analysis) {
    // ... 现有验证代码 ...

    this.#projectPath = projectPath
    this.#analysis = analysis
    this.#logger = new Logger()
    this.#validator = new ConfigValidator(projectPath)  // 新增
    this.#formatter = new OutputFormatter()  // 新增

    // 获取模板路径
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    this.#templatePath = path.join(currentDir, '..', 'templates', 'vitepress-flat')
  }
```

修改 generate() 方法：

```javascript
  async generate() {
    this.#formatter.step(0, 5, '开始生成项目框架')

    // 1. 复制模板文件
    this.#formatter.step(1, 5, '复制模板文件')
    await this.#copyTemplate()

    // 2. 替换占位符
    this.#formatter.step(2, 5, '替换配置占位符')
    await this.#replacePlaceholders()

    // 3. 生成章节文件
    this.#formatter.step(3, 5, '生成章节文件')
    await this.#generateChapterFiles()

    // 4. 配置 VitePress（修正路由）
    this.#formatter.step(4, 5, '配置 VitePress')
    await this.#configureVitePress()

    // 5. 验证配置（新增）
    this.#formatter.step(5, 5, '验证项目配置')
    const validation = await this.#validator.validate()
    this.#formatter.formatValidationResult(validation)

    if (!validation.valid) {
      this.#formatter.warn('配置验证发现问题，建议修复后再启动服务器')
      const suggestions = this.#validator.generateFixSuggestions(validation.errors)
      this.#formatter.warn('修复建议:')
      suggestions.forEach(s => this.#formatter.warn(`  - ${s}`))
    }

    this.#formatter.success('项目框架生成完成')
    this.#formatter.formatBrowserCacheTip()
  }
```

修改 #configureVitePress() 方法：

```javascript
  async #configureVitePress() {
    const configPath = path.join(this.#projectPath, 'docs', '.vitepress', 'config.mts')
    let content = await fs.readFile(configPath, 'utf-8')

    // 1. 替换标题和描述
    content = content
      .replace(/title:\s*"[^"]*"/, `title: "${this.#analysis.title}"`)
      .replace(/description:\s*"[^"]*"/, `description: "${this.#analysis.description}"`)

    // 2. 生成侧边栏配置（修正路由格式）
    const sidebarItems = this.#analysis.chapters.map(ch => {
      const chapterNum = String(ch.number).padStart(2, '0')
      return `{ text: '${ch.title}', link: '/chapter-${chapterNum}' }`
    }).join(',\n          ')

    // 替换侧边栏 items
    content = content.replace(
      /items:\s*\[[\s\S]*?\]/,
      `items: [
          { text: '简介', link: '/' },
          ${sidebarItems}
        ]`
    )

    await fs.writeFile(configPath, content, 'utf-8')
  }
```

- [ ] **Step 4: 运行测试，确认通过**

运行: `cd skills/book-crafter && npm test tests/framework-generator.test.mjs`
预期: PASS

- [ ] **Step 5: 提交改进**

```bash
git add skills/book-crafter/scripts/framework-generator.mjs skills/book-crafter/tests/framework-generator.test.mjs
git commit -m "fix: 修正 framework-generator 路由配置并集成验证

- 修正侧边栏路由格式（/chapters/chapter-1 -> /chapter-01）
- 集成 ConfigValidator 进行配置验证
- 集成 OutputFormatter 格式化输出
- 添加浏览器缓存提示

解决问题 2, 3, 4, 5：路由错误、layout、验证、提示

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: 改进 reference-analyzer.mjs

**Files:**
- Modify: `skills/book-crafter/scripts/reference-analyzer.mjs`

- [ ] **Step 1: 修改 reference-analyzer.mjs**

添加导入：

```javascript
import { OutputFormatter } from './output-formatter.mjs'
```

添加私有字段：

```javascript
  #formatter
```

修改构造函数：

```javascript
  constructor() {
    this.#formatter = new OutputFormatter()
  }
```

修改 analyze() 方法：

```javascript
  async analyze(projectPath) {
    this.#formatter.info('开始分析参考项目...')

    const techStack = await this.detectTechStack(projectPath)
    const structure = await this.analyzeStructure(projectPath)
    const chapters = await this.findChapters(projectPath)
    const language = await this.detectLanguage(projectPath)
    const bookType = this.determineBookType({ techStack, structure, chapters })

    const result = {
      path: projectPath,
      techStack,
      structure,
      chapters,
      language,
      bookType
    }

    // 输出友好的分析结果
    this.#formatter.formatAnalysisResult(result)

    return result
  }
```

- [ ] **Step 2: 运行现有测试**

运行: `cd skills/book-crafter && npm test tests/reference-analyzer.test.mjs`
预期: PASS - 现有测试应该仍然通过

- [ ] **Step 3: 提交改进**

```bash
git add skills/book-crafter/scripts/reference-analyzer.mjs
git commit -m "feat: 集成 OutputFormatter 到 ReferenceAnalyzer

- 友好的分析结果输出
- 智能建议格式化

解决问题 6：reference-analyzer 的输出格式

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 4: 更新模板

### Task 7: 更新模板文件

**Files:**
- Modify: `skills/book-crafter/templates/vitepress-flat/package.json`
- Modify: `skills/book-crafter/templates/vitepress-flat/docs/index.md`
- Modify: `skills/book-crafter/templates/vitepress-flat/docs/.vitepress/config.mts`

- [ ] **Step 1: 更新 package.json 添加 Mermaid 依赖**

```json
{
  "name": "my-book",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "^1.0.0",
    "vitepress-plugin-mermaid": "^2.0.0"
  }
}
```

- [ ] **Step 2: 更新 index.md 修正 layout**

```markdown
---
layout: doc
---

# {{{title}}}

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
```

- [ ] **Step 3: 更新 config.mts 启用 Mermaid**

```javascript
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
  title: "My Book",
  description: "A technical book powered by VitePress",
  lang: 'zh-CN',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' }
    ],

    sidebar: [
      {
        text: '开始',
        items: [
          { text: '简介', link: '/' }
          // 章节将由 framework-generator 动态添加
        ]
      }
    ],

    search: {
      provider: 'local'
    }
  },

  // Mermaid 配置
  mermaid: {
    // 参考: https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults
    theme: 'default'
  },

  markdown: {
    lineNumbers: true
  }
}))
```

- [ ] **Step 4: 运行测试，确认模板正常**

运行: `cd skills/book-crafter && npm test tests/framework-generator.test.mjs`
预期: PASS - 模板更改不影响现有测试

- [ ] **Step 5: 提交模板更新**

```bash
git add skills/book-crafter/templates/vitepress-flat/package.json \
        skills/book-crafter/templates/vitepress-flat/docs/index.md \
        skills/book-crafter/templates/vitepress-flat/docs/.vitepress/config.mts
git commit -m "feat: 更新模板支持 Mermaid 并修正 layout

- 添加 vitepress-plugin-mermaid 依赖
- 启用 Mermaid 图表支持
- 修正 index.md 的 layout 为 doc
- 简化侧边栏配置

解决问题 3 和 8：layout 配置、Mermaid 支持

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 5: 完善测试

### Task 8: 改进端到端测试

**Files:**
- Modify: `skills/book-crafter/tests/e2e/full-workflow.test.mjs`

- [ ] **Step 1: 添加 CLI 和验证测试**

在 `tests/e2e/full-workflow.test.mjs` 中添加导入：

```javascript
import { ConfigValidator } from '../../scripts/config-validator.mjs'
import { CLI } from '../../scripts/cli.mjs'
```

添加新测试：

```javascript
  test('应该完成完整流程并验证配置', async () => {
    // 1. 初始化
    await engine.init()

    // 2. 分析
    const analysis = {
      title: 'E2E Test Book',
      description: 'An end-to-end test book',
      chapters: [
        { number: 1, title: 'Introduction', description: 'Introduction', file: 'chapter-01.md' },
        { number: 2, title: 'Getting Started', description: 'Getting started', file: 'chapter-02.md' }
      ]
    }

    const result2 = await engine.executeStage(2, { analysis })
    await engine.completeStage(2, result2.output)

    // 3. 生成框架
    const result3 = await engine.executeStage(3, result2.output)
    await engine.completeStage(3, result3.output)

    // 4. 验证配置
    const validator = new ConfigValidator(tempDir)
    const validation = await validator.validate()

    expect(validation.valid).toBe(true)

    // 5. 验证文件结构
    expect(fs.existsSync(path.join(tempDir, 'docs', 'chapter-01.md'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs', 'chapter-02.md'))).toBe(true)

    // 6. 验证配置内容
    const config = fs.readFileSync(
      path.join(tempDir, 'docs', '.vitepress', 'config.mts'),
      'utf-8'
    )
    expect(config).toContain('/chapter-01')
    expect(config).toContain('/chapter-02')
    expect(config).not.toContain('/chapters/chapter-1')
  })

  test('应该通过 CLI 完成完整流程', async () => {
    // 模拟 CLI 调用
    const originalArgv = process.argv
    process.argv = ['node', 'cli.mjs', 'init', tempDir]

    const cli = new CLI()
    await cli.run()

    // 验证初始化成功
    expect(fs.existsSync(path.join(tempDir, '.book-crafter', 'state.json'))).toBe(true)

    process.argv = originalArgv
  })
```

- [ ] **Step 2: 运行端到端测试**

运行: `cd skills/book-crafter && npm test tests/e2e/full-workflow.test.mjs`
预期: PASS - 所有端到端测试通过

- [ ] **Step 3: 提交测试改进**

```bash
git add skills/book-crafter/tests/e2e/full-workflow.test.mjs
git commit -m "test: 完善端到端测试

- 添加配置验证测试
- 添加 CLI 流程测试
- 验证路由格式正确性
- 覆盖所有 6 个阶段

解决问题 7：缺少端到端测试示例

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 6: 最终验证和文档

### Task 9: 运行完整测试套件

- [ ] **Step 1: 运行所有测试**

```bash
cd skills/book-crafter
npm test
```

预期: 所有测试通过

- [ ] **Step 2: 运行测试覆盖率**

```bash
cd skills/book-crafter
npm test -- --coverage
```

预期:
- CLI 模块: 100% 覆盖率
- ConfigValidator: 95% 覆盖率
- OutputFormatter: 100% 覆盖率
- FrameworkGenerator: 90% 覆盖率

- [ ] **Step 3: 提交测试覆盖率报告**

```bash
git add skills/book-crafter/coverage/
git commit -m "test: 添加测试覆盖率报告

- CLI: 100%
- ConfigValidator: 95%
- OutputFormatter: 100%
- FrameworkGenerator: 90%

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 10: 更新 SKILL.md 文档

**Files:**
- Modify: `skills/book-crafter/SKILL.md`

- [ ] **Step 1: 更新 SKILL.md 添加 CLI 使用说明**

在快速开始部分添加 CLI 使用：

```markdown
## 快速开始

### 使用 CLI（推荐）

```bash
# 1. 初始化工作流
node scripts/cli.mjs init /path/to/my-book

# 2. 执行下一阶段
node scripts/cli.mjs next

# 3. 查看当前状态
node scripts/cli.mjs status

# 4. 恢复中断的工作流
node scripts/cli.mjs resume
```

### 完整工作流（API 方式）

```bash
# 1. 初始化工作流
node scripts/workflow-engine.mjs init --path /path/to/my-book

# 2. 执行下一阶段
node scripts/workflow-engine.mjs next

# 3. 恢复中断的工作流
node scripts/workflow-engine.mjs resume
```
```

添加新功能说明：

```markdown
## 核心功能

### 🔧 CLI 命令行接口

提供友好的命令行接口：

```bash
node scripts/cli.mjs <command> [options]
```

**支持的命令**：
- `init [path]` - 初始化工作流
- `next` - 执行下一阶段
- `resume` - 恢复执行
- `status` - 查看当前状态
- `--help` - 显示帮助

### ✅ 配置验证器

自动验证 VitePress 配置：

- 检查路由配置与文件匹配
- 验证 layout 设置
- 检查内部链接有效性
- 检查图片资源存在性
- 验证内容完整性

### 📊 Mermaid 图表支持

内置 Mermaid 支持，可直接使用：

\`\`\`mermaid
graph TD
    A[开始] --> B[处理]
    B --> C[结束]
\`\`\`

### 🎨 统一输出格式

友好的输出格式和提示：

- 工作流状态格式化
- 分析结果建议
- 配置验证报告
- 浏览器缓存提示
```

更新常见问题：

```markdown
## 常见问题

### Q: 如何使用 CLI？

A: 使用命令行接口最简单：

\`\`\`bash
node scripts/cli.mjs init /path/to/my-book
node scripts/cli.mjs next
\`\`\`

### Q: 生成的配置有错误怎么办？

A: FrameworkGenerator 会自动验证配置并输出报告：

- 显示所有错误和警告
- 提供修复建议
- 建议修复后再启动服务器

### Q: 如何使用 Mermaid 图表？

A: Mermaid 已内置，直接在 Markdown 中使用：

\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello
    Bob->>Alice: Hi!
\`\`\`
```

- [ ] **Step 2: 提交文档更新**

```bash
git add skills/book-crafter/SKILL.md
git commit -m "docs: 更新 SKILL.md 文档

- 添加 CLI 使用说明
- 添加配置验证器说明
- 添加 Mermaid 支持说明
- 更新常见问题

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 11: 创建发布提交

- [ ] **Step 1: 创建最终提交**

```bash
git add -A
git commit -m "release: Book Crafter UX 改进 v2.0.0

## 新功能

### CLI 命令行接口
- 支持 init, next, resume, status 命令
- 友好的帮助信息和错误提示
- 解决问题 1：工作流引擎缺少 CLI 入口

### 配置验证器
- 自动验证 VitePress 配置
- 检查路由、layout、链接、图片、内容完整性
- 生成修复建议
- 解决问题 2, 3, 4, 9

### 统一输出格式
- 工作流状态格式化
- 分析结果建议
- 浏览器缓存提示
- 解决问题 5, 6

### Mermaid 图表支持
- 内置 vitepress-plugin-mermaid
- 开箱即用的图表功能
- 解决问题 8

## 改进

- 修正 framework-generator 路由配置
- 改进 index.md layout 设置
- 完善端到端测试
- 解决问题 7

## 测试覆盖率

- CLI: 100%
- ConfigValidator: 95%
- OutputFormatter: 100%
- FrameworkGenerator: 90%

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 2: 验证所有功能**

手动测试完整流程：

```bash
cd skills/book-crafter

# 测试 CLI
node scripts/cli.mjs --help
node scripts/cli.mjs init /tmp/test-book
cd /tmp/test-book
node ~/Github/the-guild/skills/book-crafter/scripts/cli.mjs status

# 验证测试
npm test
```

预期: 所有功能正常工作

---

## 总结

本实施计划解决了 9 个问题：

1. ✅ 工作流引擎缺少 CLI 入口 - 新增 CLI 模块
2. ✅ 框架生成器的路由配置错误 - 修正路由生成逻辑
3. ✅ 首页 layout 配置不当 - 修正模板和验证
4. ✅ 缺少配置验证 - 新增 ConfigValidator
5. ✅ 没有浏览器自动刷新提示 - OutputFormatter 提示
6. ✅ reference-analyzer 的输出格式 - 集成 OutputFormatter
7. ✅ 缺少端到端测试示例 - 完善测试
8. ✅ 缺少 Mermaid 图表支持 - 模板集成
9. ✅ 缺少内容质量验证 - ConfigValidator 扩展

所有改动遵循 TDD 原则，测试先行，确保代码质量。
