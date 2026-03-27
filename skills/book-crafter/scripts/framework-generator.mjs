import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { Logger } from '../utils/logger.mjs'
import { ConfigValidator } from './config-validator.mjs'
import { OutputFormatter } from './output-formatter.mjs'

export class FrameworkGenerator {
  #projectPath
  #analysis
  #logger
  #formatter
  #templatePath

  constructor(projectPath, analysis) {
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('projectPath 必须是非空字符串')
    }
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('analysis 必须是对象')
    }
    if (!analysis.title) {
      throw new Error('analysis 必须包含 title')
    }
    if (!Array.isArray(analysis.chapters) || analysis.chapters.length === 0) {
      throw new Error('analysis.chapters 必须是非空数组')
    }

    this.#projectPath = projectPath
    this.#analysis = analysis
    this.#logger = new Logger()
    this.#formatter = new OutputFormatter()

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
    await this.#replacePlaceholders()

    // 3. 生成章节文件
    this.#logger.step(3, 5, '生成章节文件')
    await this.#generateChapterFiles()

    // 4. 配置 VitePress
    this.#logger.step(4, 5, '配置 VitePress')
    await this.#configureVitePress()

    // 5. 验证项目
    this.#logger.step(5, 5, '验证项目结构')
    await this.#validateProject()

    this.#logger.success('项目框架生成完成')
  }

  /**
   * 复制模板文件
   */
  async #copyTemplate() {
    const copyDir = async (src, dest) => {
      await fs.mkdir(dest, { recursive: true })
      const entries = await fs.readdir(src, { withFileTypes: true })

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)

        if (entry.isDirectory()) {
          await copyDir(srcPath, destPath)
        } else {
          await fs.copyFile(srcPath, destPath)
        }
      }
    }

    await copyDir(this.#templatePath, this.#projectPath)
  }

  /**
   * 替换占位符
   */
  async #replacePlaceholders() {
    const packageJsonPath = path.join(this.#projectPath, 'package.json')
    let packageJson
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      packageJson = JSON.parse(content)
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('模板 package.json 文件不存在')
      }
      if (error instanceof SyntaxError) {
        throw new Error(`模板 package.json 格式错误: ${error.message}`)
      }
      throw error
    }

    // 生成项目名称：
    // npm 包名只接受 ASCII 字符（a-z, 0-9, -, _）
    let projectName = 'my-book'  // 默认名称

    const title = this.#analysis.title
    if (/^[\x00-\x7F]+$/.test(title)) {
      // ASCII 字符，转为 kebab-case
      projectName = title
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w\-]/g, '')
        .substring(0, 214)  // npm 限制包名最大 214 字符
    } else {
      // 非ASCII字符（如中文），使用默认名称
      this.#logger.warn('检测到中文标题，使用默认项目名称 "my-book"')
    }

    packageJson.name = projectName
    packageJson.description = this.#analysis.description

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8')
  }

  /**
   * 生成章节文件
   */
  async #generateChapterFiles() {
    const docsPath = path.join(this.#projectPath, 'docs')

    for (const chapter of this.#analysis.chapters) {
      const chapterPath = path.join(docsPath, chapter.file)
      const content = `# ${chapter.title}\n\n待编写内容...\n`
      await fs.writeFile(chapterPath, content, 'utf-8')
    }
  }

  /**
   * 配置 VitePress
   */
  async #configureVitePress() {
    const configPath = path.join(this.#projectPath, 'docs', '.vitepress', 'config.mts')
    let content = await fs.readFile(configPath, 'utf-8')

    // 替换标题和描述
    content = content
      .replace(/title:\s*"[^"]*"/, `title: "${this.#analysis.title}"`)
      .replace(/description:\s*"[^"]*"/, `description: "${this.#analysis.description}"`)

    // 生成 sidebar 配置（使用扁平路径）
    const sidebarItems = this.#analysis.chapters.map(chapter => {
      // 从文件名提取章节编号，例如 chapter-01.md -> chapter-01
      const link = `/${chapter.file.replace('.md', '')}`
      return `{ text: '${chapter.title}', link: '${link}' }`
    })

    // 替换 sidebar 配置
    const sidebarConfig = `[
      {
        text: '开始',
        items: [
          { text: '简介', link: '/' },
${sidebarItems.map(item => `          ${item}`).join(',\n')}
        ]
      }
    ]`

    // 替换整个 sidebar 配置块
    content = content.replace(
      /sidebar:\s*\[[\s\S]*?\n    \]/,
      `sidebar: ${sidebarConfig}`
    )

    // 更新导航栏的章节链接（如果有多个章节，链接到第一个章节）
    if (this.#analysis.chapters.length > 0) {
      const firstChapterLink = `/${this.#analysis.chapters[0].file.replace('.md', '')}`
      content = content.replace(
        /{ text: '章节', link: '\/chapters\/chapter-1' }/,
        `{ text: '章节', link: '${firstChapterLink}' }`
      )
    }

    await fs.writeFile(configPath, content, 'utf-8')
  }

  /**
   * 验证项目
   */
  async #validateProject() {
    const requiredFiles = [
      'package.json',
      'docs/.vitepress/config.mts'
    ]

    for (const file of requiredFiles) {
      const filePath = path.join(this.#projectPath, file)
      try {
        await fs.access(filePath)
      } catch {
        throw new Error(`必需文件不存在: ${file}`)
      }
    }

    // 使用 ConfigValidator 验证配置
    const validator = new ConfigValidator(this.#projectPath)
    const result = await validator.validate()

    // 显示验证结果
    this.#formatter.formatValidationResult(result)

    // 如果有错误，生成修复建议
    if (!result.valid) {
      const suggestions = validator.generateFixSuggestions(result.errors)
      if (suggestions.length > 0) {
        this.#formatter.info('修复建议:')
        suggestions.forEach((suggestion, i) => {
          console.log(`  ${i + 1}. ${suggestion}`)
        })
      }
    }
  }
}
