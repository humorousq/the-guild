import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { Logger } from '../utils/logger.mjs'

export class ContentCollaborator {
  #projectPath
  #logger
  #context

  constructor(projectPath) {
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('projectPath 必须是非空字符串')
    }

    this.#projectPath = projectPath
    this.#logger = new Logger()
    this.#context = null
  }

  /**
   * 加载 BOOK_CONTEXT.md
   */
  loadContext() {
    if (this.#context) {
      return this.#context
    }

    const contextPath = path.join(this.#projectPath, 'BOOK_CONTEXT.md')

    try {
      const content = fs.readFileSync(contextPath, 'utf-8')

      // 解析上下文
      this.#context = {
        title: this.#extractField(content, '书名'),
        description: this.#extractField(content, '描述'),
        targetReader: this.#extractField(content, '目标读者'),
        chapters: this.#extractChapters(content)
      }

      return this.#context
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('未找到 BOOK_CONTEXT.md，请先运行分析阶段')
      }
      throw error
    }
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
    const context = this.loadContext()

    const chapter = context.chapters.find(c => c.number === chapterNumber)
    if (!chapter) {
      throw new Error(`章节 ${chapterNumber} 不存在`)
    }

    this.#logger.info(`生成第 ${chapterNumber} 章建议...`)

    // 生成建议内容
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
    try {
      await fsPromises.access(docsPath)
    } catch {
      await fsPromises.mkdir(docsPath, { recursive: true })
    }

    // 写入章节文件
    const chapterFile = `chapter-${String(chapterNumber).padStart(2, '0')}.md`
    const chapterPath = path.join(docsPath, chapterFile)

    await fsPromises.writeFile(chapterPath, content, 'utf-8')

    this.#logger.success(`章节 ${chapterNumber} 内容已写入: ${chapterFile}`)
  }
}
