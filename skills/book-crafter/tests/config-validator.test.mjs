import { jest } from '@jest/globals'
import fs from 'fs/promises'
import path from 'path'
import { ConfigValidator } from '../scripts/config-validator.mjs'

describe('ConfigValidator 测试', () => {
  let validator
  let testDir

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = path.join(process.cwd(), 'test-config-validator-temp')
    await fs.mkdir(testDir, { recursive: true })
    validator = new ConfigValidator(testDir)
  })

  afterEach(async () => {
    // 清理测试目录
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      // 忽略清理错误
    }
  })

  describe('构造函数验证', () => {
    test('应该接受有效的项目路径', () => {
      expect(() => new ConfigValidator('/valid/path')).not.toThrow()
    })

    test('应该拒绝 null 项目路径', () => {
      expect(() => new ConfigValidator(null)).toThrow('projectPath 必须是非空字符串')
    })

    test('应该拒绝 undefined 项目路径', () => {
      expect(() => new ConfigValidator(undefined)).toThrow('projectPath 必须是非空字符串')
    })

    test('应该拒绝空字符串项目路径', () => {
      expect(() => new ConfigValidator('')).toThrow('projectPath 必须是非空字符串')
    })

    test('应该拒绝非字符串项目路径', () => {
      expect(() => new ConfigValidator(123)).toThrow('projectPath 必须是非空字符串')
    })
  })

  describe('validate() 方法', () => {
    test('应该返回有效的配置结构', async () => {
      // 创建最小化的 VitePress 项目
      await createMinimalVitePressProject(testDir)

      const result = await validator.validate()

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    test('应该在缺少配置文件时返回 CRITICAL 错误', async () => {
      // 不创建配置文件
      const result = await validator.validate()

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].type).toBe('CRITICAL')
    })
  })

  describe('#validateSidebarLinks() 私有方法', () => {
    test('应该检测断开的侧边栏链接', async () => {
      await createVitePressProjectWithBrokenLink(testDir)

      const result = await validator.validate()

      expect(result.valid).toBe(false)
      const brokenLinkError = result.errors.find(e => e.type === 'BROKEN_LINK')
      expect(brokenLinkError).toBeDefined()
      expect(brokenLinkError.link).toBeDefined()
    })

    test('应该通过有效的侧边栏链接', async () => {
      await createValidVitePressProject(testDir)

      const result = await validator.validate()

      const brokenLinkErrors = result.errors.filter(e => e.type === 'BROKEN_LINK')
      expect(brokenLinkErrors.length).toBe(0)
    })

    test('应该处理嵌套的侧边栏结构', async () => {
      await createNestedSidebarProject(testDir)

      const result = await validator.validate()

      expect(result).toBeDefined()
    })
  })

  describe('#checkLayoutIssues() 私有方法', () => {
    test('应该检测 index.md 使用 home 布局', async () => {
      await createVitePressProjectWithHomeLayout(testDir)

      const result = await validator.validate()

      const layoutError = result.warnings.find(w => w.type === 'LAYOUT_ISSUE')
      expect(layoutError).toBeDefined()
      expect(layoutError.file).toContain('index.md')
    })

    test('应该通过非 home 布局', async () => {
      await createValidVitePressProject(testDir)

      const result = await validator.validate()

      const layoutErrors = result.warnings.filter(w => w.type === 'LAYOUT_ISSUE')
      expect(layoutErrors.length).toBe(0)
    })

    test('应该在缺少 index.md 时不报布局错误', async () => {
      await createMinimalVitePressProject(testDir)

      const result = await validator.validate()

      const layoutErrors = result.warnings.filter(w => w.type === 'LAYOUT_ISSUE')
      expect(layoutErrors.length).toBe(0)
    })
  })

  describe('#validateFilesExist() 私有方法', () => {
    test('应该检测缺少标题的 Markdown 文件', async () => {
      await createVitePressProjectWithoutTitle(testDir)

      const result = await validator.validate()

      const titleError = result.errors.find(e => e.type === 'MISSING_TITLE')
      expect(titleError).toBeDefined()
    })

    test('应该通过有标题的 Markdown 文件', async () => {
      await createValidVitePressProject(testDir)

      const result = await validator.validate()

      const titleErrors = result.errors.filter(e => e.type === 'MISSING_TITLE')
      expect(titleErrors.length).toBe(0)
    })

    test('应该忽略非 Markdown 文件', async () => {
      await createVitePressProjectWithNonMarkdown(testDir)

      const result = await validator.validate()

      expect(result).toBeDefined()
    })
  })

  describe('#checkInternalLinks() 私有方法', () => {
    test('应该检测断开的内部链接', async () => {
      await createVitePressProjectWithBrokenInternalLink(testDir)

      const result = await validator.validate()

      const brokenLinkError = result.errors.find(e => e.type === 'BROKEN_INTERNAL_LINK')
      expect(brokenLinkError).toBeDefined()
    })

    test('应该通过有效的内部链接', async () => {
      await createValidVitePressProject(testDir)

      const result = await validator.validate()

      const brokenInternalLinks = result.errors.filter(e => e.type === 'BROKEN_INTERNAL_LINK')
      expect(brokenInternalLinks.length).toBe(0)
    })

    test('应该处理相对路径链接', async () => {
      await createVitePressProjectWithRelativeLinks(testDir)

      const result = await validator.validate()

      expect(result).toBeDefined()
    })
  })

  describe('#checkImages() 私有方法', () => {
    test('应该检测缺失的图片引用', async () => {
      await createVitePressProjectWithMissingImage(testDir)

      const result = await validator.validate()

      const imageError = result.errors.find(e => e.type === 'MISSING_IMAGE')
      expect(imageError).toBeDefined()
    })

    test('应该通过存在的图片引用', async () => {
      await createVitePressProjectWithValidImage(testDir)

      const result = await validator.validate()

      const imageErrors = result.errors.filter(e => e.type === 'MISSING_IMAGE')
      expect(imageErrors.length).toBe(0)
    })

    test('应该处理外部图片链接', async () => {
      await createVitePressProjectWithExternalImage(testDir)

      const result = await validator.validate()

      const imageErrors = result.errors.filter(e => e.type === 'MISSING_IMAGE')
      expect(imageErrors.length).toBe(0)
    })
  })

  describe('#checkContentCompleteness() 私有方法', () => {
    test('应该检测 TODO 标记', async () => {
      await createVitePressProjectWithTODO(testDir)

      const result = await validator.validate()

      const incompleteError = result.warnings.find(w => w.type === 'INCOMPLETE_CONTENT')
      expect(incompleteError).toBeDefined()
    })

    test('应该检测"待编写"标记', async () => {
      await createVitePressProjectWithPending(testDir)

      const result = await validator.validate()

      const incompleteError = result.warnings.find(w => w.type === 'INCOMPLETE_CONTENT')
      expect(incompleteError).toBeDefined()
    })

    test('应该检测短内容（少于 5 行）', async () => {
      await createVitePressProjectWithShortContent(testDir)

      const result = await validator.validate()

      const shortError = result.warnings.find(w => w.type === 'SHORT_CONTENT')
      expect(shortError).toBeDefined()
    })

    test('应该通过完整的内容', async () => {
      await createValidVitePressProject(testDir)

      const result = await validator.validate()

      const incompleteErrors = result.warnings.filter(w =>
        w.type === 'INCOMPLETE_CONTENT' || w.type === 'SHORT_CONTENT'
      )
      expect(incompleteErrors.length).toBe(0)
    })
  })

  describe('generateFixSuggestions() 方法', () => {
    test('应该为 BROKEN_LINK 生成修复建议', () => {
      const errors = [
        { type: 'BROKEN_LINK', link: '/missing-page' }
      ]

      const suggestions = validator.generateFixSuggestions(errors)

      expect(suggestions[0]).toContain('创建缺失的文件')
      expect(suggestions[0]).toContain('/missing-page')
    })

    test('应该为 LAYOUT_ISSUE 生成修复建议', () => {
      const errors = [
        { type: 'LAYOUT_ISSUE', file: 'index.md' }
      ]

      const suggestions = validator.generateFixSuggestions(errors)

      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toContain('移除 home 布局')
    })

    test('应该为 MISSING_TITLE 生成修复建议', () => {
      const errors = [
        { type: 'MISSING_TITLE', file: 'test.md' }
      ]

      const suggestions = validator.generateFixSuggestions(errors)

      expect(suggestions[0]).toContain('添加标题')
    })

    test('应该为 BROKEN_INTERNAL_LINK 生成修复建议', () => {
      const errors = [
        { type: 'BROKEN_INTERNAL_LINK', link: './missing.md', file: 'test.md' }
      ]

      const suggestions = validator.generateFixSuggestions(errors)

      expect(suggestions[0]).toContain('修复内部链接')
    })

    test('应该为 MISSING_IMAGE 生成修复建议', () => {
      const errors = [
        { type: 'MISSING_IMAGE', image: 'missing.png', file: 'test.md' }
      ]

      const suggestions = validator.generateFixSuggestions(errors)

      expect(suggestions[0]).toContain('添加缺失的图片')
    })

    test('应该为 INCOMPLETE_CONTENT 生成修复建议', () => {
      const errors = [
        { type: 'INCOMPLETE_CONTENT', file: 'test.md' }
      ]

      const suggestions = validator.generateFixSuggestions(errors)

      expect(suggestions[0]).toContain('完成待编写的内容')
    })

    test('应该处理空错误数组', () => {
      const suggestions = validator.generateFixSuggestions([])

      expect(suggestions).toEqual([])
    })

    test('应该处理 null 输入', () => {
      const suggestions = validator.generateFixSuggestions(null)

      expect(suggestions).toEqual([])
    })

    test('应该处理 undefined 输入', () => {
      const suggestions = validator.generateFixSuggestions(undefined)

      expect(suggestions).toEqual([])
    })

    test('应该为多个错误生成建议', () => {
      const errors = [
        { type: 'BROKEN_LINK', link: '/page1' },
        { type: 'MISSING_TITLE', file: 'test.md' }
      ]

      const suggestions = validator.generateFixSuggestions(errors)

      expect(suggestions.length).toBe(2)
    })
  })

  describe('边界情况处理', () => {
    test('应该处理空的侧边栏配置', async () => {
      await createVitePressProjectWithEmptySidebar(testDir)

      const result = await validator.validate()

      expect(result).toBeDefined()
    })

    test('应该处理格式错误的配置文件', async () => {
      await createVitePressProjectWithMalformedConfig(testDir)

      const result = await validator.validate()

      expect(result.valid).toBe(false)
      expect(result.errors.find(e => e.type === 'CRITICAL')).toBeDefined()
    })

    test('应该处理空的 Markdown 文件', async () => {
      await createVitePressProjectWithEmptyMarkdown(testDir)

      const result = await validator.validate()

      expect(result).toBeDefined()
    })

    test('应该处理特殊字符路径', async () => {
      const specialDir = path.join(process.cwd(), 'test-special-chars-测试')
      try {
        await fs.mkdir(specialDir, { recursive: true })
        const specialValidator = new ConfigValidator(specialDir)

        const result = await specialValidator.validate()

        expect(result).toBeDefined()
      } finally {
        await fs.rm(specialDir, { recursive: true, force: true }).catch(() => {})
      }
    })
  })
})

// 辅助函数：创建各种测试场景

async function createMinimalVitePressProject(dir) {
  const configDir = path.join(dir, 'docs', '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )
}

async function createValidVitePressProject(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  // 创建配置文件
  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default {
  title: "Test Book",
  themeConfig: {
    sidebar: [
      {
        text: 'Chapter 1',
        link: '/chapter-1'
      }
    ]
  }
}`,
    'utf-8'
  )

  // 创建 Markdown 文件 - 确保没有 TODO 或待编写标记
  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    `# Test Book

This is a complete test document with enough content.
It has multiple lines.
At least 5 lines.
To pass the short content check.
More content here.
`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'chapter-1.md'),
    `# Chapter 1

This is chapter 1 content with multiple lines.
Enough content to pass validation.
And more lines here.
At least five lines total.
Making sure it passes all checks.
`,
    'utf-8'
  )
}

async function createVitePressProjectWithBrokenLink(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default {
  title: "Test",
  themeConfig: {
    sidebar: [
      { text: 'Missing Page', link: '/missing-page' }
    ]
  }
}`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    '# Test\n\nContent here.',
    'utf-8'
  )
}

async function createVitePressProjectWithHomeLayout(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    `---
layout: home
---

# Test
Content.`,
    'utf-8'
  )
}

async function createVitePressProjectWithoutTitle(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'no-title.md'),
    'This file has no title.\nJust content.',
    'utf-8'
  )
}

async function createVitePressProjectWithBrokenInternalLink(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    `# Test

[Broken Link](./missing.md)
`,
    'utf-8'
  )
}

async function createVitePressProjectWithMissingImage(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    `# Test

![Missing Image](./images/missing.png)
`,
    'utf-8'
  )
}

async function createVitePressProjectWithValidImage(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  const imagesDir = path.join(docsDir, 'images')
  await fs.mkdir(configDir, { recursive: true })
  await fs.mkdir(imagesDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  // 创建图片文件
  await fs.writeFile(
    path.join(imagesDir, 'test.png'),
    'fake image content',
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    `# Test

![Valid Image](./images/test.png)
`,
    'utf-8'
  )
}

async function createVitePressProjectWithExternalImage(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    `# Test

![External Image](https://example.com/image.png)
`,
    'utf-8'
  )
}

async function createVitePressProjectWithTODO(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    `# Test

TODO: This needs to be completed.
More content here.
`,
    'utf-8'
  )
}

async function createVitePressProjectWithPending(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    `# Test

待编写内容。
More content here.
`,
    'utf-8'
  )
}

async function createVitePressProjectWithShortContent(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'short.md'),
    `# Short
Line 2`,
    'utf-8'
  )
}

async function createNestedSidebarProject(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default {
  title: "Test",
  themeConfig: {
    sidebar: [
      {
        text: 'Section 1',
        items: [
          { text: 'Page 1', link: '/page-1' }
        ]
      }
    ]
  }
}`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'page-1.md'),
    `# Page 1\n\nContent.`,
    'utf-8'
  )
}

async function createVitePressProjectWithNonMarkdown(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'script.js'),
    'console.log("test")',
    'utf-8'
  )
}

async function createVitePressProjectWithRelativeLinks(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    `# Test

[Link](./page.md)
`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'page.md'),
    '# Page\n\nContent.',
    'utf-8'
  )
}

async function createVitePressProjectWithEmptySidebar(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default {
  title: "Test",
  themeConfig: {
    sidebar: []
  }
}`,
    'utf-8'
  )
}

async function createVitePressProjectWithMalformedConfig(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  // 创建一个无效的配置文件（没有 title 或其他有效配置）
  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default {
  // This config has no valid properties
}`,
    'utf-8'
  )
}

async function createVitePressProjectWithEmptyMarkdown(dir) {
  const docsDir = path.join(dir, 'docs')
  const configDir = path.join(docsDir, '.vitepress')
  await fs.mkdir(configDir, { recursive: true })

  await fs.writeFile(
    path.join(configDir, 'config.mts'),
    `export default { title: "Test" }`,
    'utf-8'
  )

  await fs.writeFile(
    path.join(docsDir, 'empty.md'),
    '',
    'utf-8'
  )
}
