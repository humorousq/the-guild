import fs from 'fs/promises'
import path from 'path'
import fg from 'fast-glob'

/**
 * ConfigValidator 类 - 验证 VitePress 配置和项目结构
 *
 * 负责检查 VitePress 项目的配置完整性和最佳实践
 */
export class ConfigValidator {
  #projectPath

  /**
   * 创建 ConfigValidator 实例
   * @param {string} projectPath - VitePress 项目路径
   * @throws {Error} 如果 projectPath 无效
   */
  constructor(projectPath) {
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('projectPath 必须是非空字符串')
    }

    this.#projectPath = projectPath
  }

  /**
   * 执行完整的配置验证
   * @returns {Promise<{valid: boolean, errors: Array, warnings: Array}>} 验证结果
   */
  async validate() {
    const errors = []
    const warnings = []

    try {
      // 读取配置
      const config = await this.#readConfig()

      // 1. 验证侧边栏链接
      const sidebarErrors = await this.#validateSidebarLinks(config)
      errors.push(...sidebarErrors)

      // 2. 检查布局问题
      const layoutWarnings = await this.#checkLayoutIssues()
      warnings.push(...layoutWarnings)

      // 3. 验证文件存在性
      const fileErrors = await this.#validateFilesExist()
      errors.push(...fileErrors)

      // 4. 检查内部链接
      const linkErrors = await this.#checkInternalLinks()
      errors.push(...linkErrors)

      // 5. 检查图片引用
      const imageErrors = await this.#checkImages()
      errors.push(...imageErrors)

      // 6. 检查内容完整性
      const contentWarnings = await this.#checkContentCompleteness()
      warnings.push(...contentWarnings)

    } catch (error) {
      // 配置文件不存在或格式错误
      errors.push({
        type: 'CRITICAL',
        message: `配置验证失败: ${error.message}`,
        file: 'docs/.vitepress/config.mts'
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 生成修复建议
   * @param {Array} errors - 错误列表
   * @returns {Array<string>} 修复建议列表
   */
  generateFixSuggestions(errors) {
    if (!errors || !Array.isArray(errors)) {
      return []
    }

    const suggestions = []

    for (const error of errors) {
      switch (error.type) {
        case 'BROKEN_LINK':
          suggestions.push(`创建缺失的文件: ${error.link} 或更新侧边栏配置`)
          break
        case 'LAYOUT_ISSUE':
          suggestions.push(`在 ${error.file} 中移除 home 布局，使用默认布局`)
          break
        case 'MISSING_TITLE':
          suggestions.push(`在 ${error.file} 中添加标题 (使用 # 标记)`)
          break
        case 'BROKEN_INTERNAL_LINK':
          suggestions.push(`修复内部链接 ${error.link} 在文件 ${error.file || '未知'}`)
          break
        case 'MISSING_IMAGE':
          suggestions.push(`添加缺失的图片: ${error.image} 或更新图片引用`)
          break
        case 'INCOMPLETE_CONTENT':
          suggestions.push(`完成待编写的内容在 ${error.file}`)
          break
        case 'SHORT_CONTENT':
          suggestions.push(`扩充 ${error.file} 的内容 (建议至少 5 行)`)
          break
        case 'CRITICAL':
          suggestions.push(`修复严重错误: ${error.message}`)
          break
        default:
          suggestions.push(`修复未知错误类型: ${error.type}`)
      }
    }

    return suggestions
  }

  /**
   * 读取 VitePress 配置文件
   * @returns {Promise<Object>} 配置对象
   * @private
   */
  async #readConfig() {
    const configPath = path.join(this.#projectPath, 'docs', '.vitepress', 'config.mts')

    try {
      const content = await fs.readFile(configPath, 'utf-8')

      // 检查文件是否为空或只包含注释
      const strippedContent = content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '')
        .trim()

      if (!strippedContent || strippedContent.length === 0) {
        throw new Error('配置文件为空或只包含注释')
      }

      // 简单提取配置（生产环境应使用适当的解析器）
      // 这里使用基本的正则表达式匹配
      const config = {}

      // 提取 title
      const titleMatch = content.match(/title:\s*["']([^"']+)["']/)
      if (titleMatch) {
        config.title = titleMatch[1]
      }

      // 提取 themeConfig.sidebar
      config.themeConfig = { sidebar: this.#extractSidebar(content) }

      // 基本验证：配置应该至少有 title
      if (!config.title) {
        throw new Error('配置文件格式无效：缺少 title 配置')
      }

      return config

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('VitePress 配置文件不存在')
      }
      if (error instanceof SyntaxError) {
        throw new Error(`配置文件格式错误: ${error.message}`)
      }
      // 重新抛出其他错误
      throw error
    }
  }

  /**
   * 从配置内容中提取侧边栏配置
   * @param {string} content - 配置文件内容
   * @returns {Array} 侧边栏项数组
   * @private
   */
  #extractSidebar(content) {
    const sidebar = []

    // 匹配 sidebar 配置块
    const sidebarMatch = content.match(/sidebar:\s*\[([\s\S]*?)\n\s*\]/)
    if (!sidebarMatch) {
      return sidebar
    }

    const sidebarContent = sidebarMatch[1]

    // 提取所有 link 项
    const linkRegex = /{\s*text:\s*["']([^"']+)["']\s*,\s*link:\s*["']([^"']+)["']\s*}/g
    let match

    while ((match = linkRegex.exec(sidebarContent)) !== null) {
      sidebar.push({
        text: match[1],
        link: match[2]
      })
    }

    // 提取嵌套结构中的 items
    const itemsRegex = /items:\s*\[([\s\S]*?)\]/g
    let itemsMatch

    while ((itemsMatch = itemsRegex.exec(sidebarContent)) !== null) {
      const itemsContent = itemsMatch[1]
      let itemMatch

      while ((match = linkRegex.exec(itemsContent)) !== null) {
        sidebar.push({
          text: match[1],
          link: match[2]
        })
      }
    }

    return sidebar
  }

  /**
   * 验证侧边栏链接
   * @param {Object} config - VitePress 配置对象
   * @returns {Promise<Array>} 错误列表
   * @private
   */
  async #validateSidebarLinks(config) {
    const errors = []

    if (!config.themeConfig || !config.themeConfig.sidebar) {
      return errors
    }

    const sidebar = config.themeConfig.sidebar

    for (const item of sidebar) {
      if (!item.link) continue

      const filePath = this.#linkToFile(item.link)
      const fullPath = path.join(this.#projectPath, 'docs', filePath)

      try {
        await fs.access(fullPath)
      } catch {
        errors.push({
          type: 'BROKEN_LINK',
          message: `侧边栏链接指向不存在的文件: ${item.link}`,
          link: item.link,
          text: item.text
        })
      }
    }

    return errors
  }

  /**
   * 检查布局问题
   * @returns {Promise<Array>} 警告列表
   * @private
   */
  async #checkLayoutIssues() {
    const warnings = []
    const indexPath = path.join(this.#projectPath, 'docs', 'index.md')

    try {
      const content = await fs.readFile(indexPath, 'utf-8')

      // 检查是否包含 home 布局
      if (content.includes('layout: home')) {
        warnings.push({
          type: 'LAYOUT_ISSUE',
          message: 'index.md 使用了 home 布局，建议使用默认布局以获得更好的导航体验',
          file: 'index.md'
        })
      }

    } catch (error) {
      // index.md 不存在，忽略
    }

    return warnings
  }

  /**
   * 验证文件存在性并检查标题
   * @returns {Promise<Array>} 错误列表
   * @private
   */
  async #validateFilesExist() {
    const errors = []

    try {
      const docsPath = path.join(this.#projectPath, 'docs')
      const files = await fg('**/*.md', { cwd: docsPath, onlyFiles: true })

      for (const file of files) {
        const filePath = path.join(docsPath, file)

        try {
          const content = await fs.readFile(filePath, 'utf-8')

          // 检查是否有标题
          if (!content.match(/^#\s+.+$/m)) {
            errors.push({
              type: 'MISSING_TITLE',
              message: `Markdown 文件缺少标题: ${file}`,
              file
            })
          }
        } catch (error) {
          // 忽略单个文件的读取错误
        }
      }
    } catch (error) {
      // docs 目录不存在或其他错误
    }

    return errors
  }

  /**
   * 检查内部链接
   * @returns {Promise<Array>} 错误列表
   * @private
   */
  async #checkInternalLinks() {
    const errors = []

    try {
      const docsPath = path.join(this.#projectPath, 'docs')
      const files = await fg('**/*.md', { cwd: docsPath, onlyFiles: true })

      for (const file of files) {
        const filePath = path.join(docsPath, file)
        const content = await fs.readFile(filePath, 'utf-8')

        // 提取所有 Markdown 链接 [text](link)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
        let match

        while ((match = linkRegex.exec(content)) !== null) {
          const link = match[2]

          // 只检查内部链接（以 . 或 / 或 ./ 开头，且不是外部链接）
          if (link.startsWith('http://') ||
              link.startsWith('https://') ||
              link.startsWith('#')) {
            continue
          }

          // 处理相对路径链接
          const linkPath = path.resolve(path.dirname(filePath), link)

          try {
            await fs.access(linkPath)
          } catch {
            errors.push({
              type: 'BROKEN_INTERNAL_LINK',
              message: `内部链接失效: ${link} 在文件 ${file}`,
              link,
              file
            })
          }
        }
      }
    } catch (error) {
      // 忽略错误
    }

    return errors
  }

  /**
   * 检查图片引用
   * @returns {Promise<Array>} 错误列表
   * @private
   */
  async #checkImages() {
    const errors = []

    try {
      const docsPath = path.join(this.#projectPath, 'docs')
      const files = await fg('**/*.md', { cwd: docsPath, onlyFiles: true })

      for (const file of files) {
        const filePath = path.join(docsPath, file)
        const content = await fs.readFile(filePath, 'utf-8')

        // 提取图片引用 ![alt](src)
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
        let match

        while ((match = imageRegex.exec(content)) !== null) {
          const imageSrc = match[2]

          // 跳过外部链接
          if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
            continue
          }

          // 处理图片路径
          const imagePath = path.resolve(path.dirname(filePath), imageSrc)

          try {
            await fs.access(imagePath)
          } catch {
            errors.push({
              type: 'MISSING_IMAGE',
              message: `图片引用失效: ${imageSrc} 在文件 ${file}`,
              image: imageSrc,
              file
            })
          }
        }
      }
    } catch (error) {
      // 忽略错误
    }

    return errors
  }

  /**
   * 检查内容完整性
   * @returns {Promise<Array>} 警告列表
   * @private
   */
  async #checkContentCompleteness() {
    const warnings = []

    try {
      const docsPath = path.join(this.#projectPath, 'docs')
      const files = await fg('**/*.md', { cwd: docsPath, onlyFiles: true })

      for (const file of files) {
        const filePath = path.join(docsPath, file)
        const content = await fs.readFile(filePath, 'utf-8')

        // 检查 TODO 标记
        if (content.includes('TODO') || content.includes('待编写')) {
          warnings.push({
            type: 'INCOMPLETE_CONTENT',
            message: `文件包含待完成内容: ${file}`,
            file
          })
        }

        // 检查短内容（少于 5 行非空内容）
        const lines = content.split('\n').filter(line => line.trim().length > 0)
        if (lines.length < 5 && content.trim().length > 0) {
          warnings.push({
            type: 'SHORT_CONTENT',
            message: `文件内容过短 (少于 5 行): ${file}`,
            file
          })
        }
      }
    } catch (error) {
      // 忽略错误
    }

    return warnings
  }

  /**
   * 将链接转换为文件路径
   * @param {string} link - 链接路径
   * @returns {string} 文件路径
   * @private
   */
  #linkToFile(link) {
    // 移除开头的 /
    let filePath = link.replace(/^\//, '')

    // 如果没有扩展名，添加 .md
    if (!path.extname(filePath)) {
      filePath += '.md'
    }

    return filePath
  }
}
