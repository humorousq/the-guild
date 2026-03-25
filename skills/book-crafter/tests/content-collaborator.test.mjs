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

    // 创建 docs 目录
    fs.mkdirSync(path.join(tempDir, 'docs'), { recursive: true })

    collaborator = new ContentCollaborator(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该加载 BOOK_CONTEXT', () => {
    const context = collaborator.loadContext()

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

  test('应该拒绝无效的章节编号', async () => {
    await expect(collaborator.suggestChapterContent(99))
      .rejects.toThrow('章节 99 不存在')
  })

  test('应该拒绝无效的 projectPath', () => {
    expect(() => new ContentCollaborator(null)).toThrow()
    expect(() => new ContentCollaborator('')).toThrow()
  })
})
