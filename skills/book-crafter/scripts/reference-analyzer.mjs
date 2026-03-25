import path from 'path'
import fs from 'fs/promises'
import fg from 'fast-glob'

export class ReferenceAnalyzer {
  /**
   * 分析参考书籍项目
   * @param {string} projectPath - 项目路径
   * @returns {Promise<Object>} 分析结果
   */
  async analyze(projectPath) {
    const techStack = await this.detectTechStack(projectPath)
    const structure = await this.analyzeStructure(projectPath)
    const chapters = await this.findChapters(projectPath)
    const language = await this.detectLanguage(projectPath)
    const bookType = this.determineBookType({ techStack, structure, chapters })

    return {
      path: projectPath,
      techStack,
      structure,
      chapters,
      language,
      bookType
    }
  }

  /**
   * 检测技术栈
   * @param {string} projectPath - 项目路径
   * @returns {Promise<Object>} 技术栈信息
   */
  async detectTechStack(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json')

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)

      // 检测框架
      const framework = this.detectFramework(packageJson)

      // 检测包管理器
      const packageManager = await this.detectPackageManager(projectPath)

      return {
        framework,
        packageManager,
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {}
      }
    } catch (error) {
      throw new Error(`无法检测技术栈：${error.message}`)
    }
  }

  /**
   * 分析书籍结构
   * @param {string} projectPath - 项目路径
   * @returns {Promise<Object>} 结构信息
   */
  async analyzeStructure(projectPath) {
    // 检测常见的文档目录
    const possibleDocsPaths = ['docs', 'src', 'content', '']
    let docsPath = null
    let structureType = 'unknown'

    for (const possiblePath of possibleDocsPaths) {
      const fullPath = path.join(projectPath, possiblePath)
      try {
        const stat = await fs.stat(fullPath)
        if (stat.isDirectory()) {
          docsPath = possiblePath

          // 检测是否有子目录结构
          const entries = await fs.readdir(fullPath, { withFileTypes: true })
          const hasSubdirectories = entries.some(entry =>
            entry.isDirectory() && !entry.name.startsWith('.')
          )

          structureType = hasSubdirectories ? 'hierarchical' : 'flat'
          break
        }
      } catch {
        // 目录不存在，继续检查下一个
      }
    }

    if (!docsPath) {
      throw new Error('无法检测文档目录')
    }

    return {
      type: structureType,
      docsPath: path.join(projectPath, docsPath)
    }
  }

  /**
   * 查找所有章节文件
   * @param {string} projectPath - 项目路径
   * @returns {Promise<Array>} 章节列表
   */
  async findChapters(projectPath) {
    const structure = await this.analyzeStructure(projectPath)
    const pattern = path.join(structure.docsPath, '**/*.md')

    const files = await fg(pattern)

    const chapters = []
    for (const file of files) {
      const title = await this.extractTitle(file)
      chapters.push({
        path: file,
        title: title || path.basename(file, '.md'),
        relativePath: path.relative(projectPath, file)
      })
    }

    return chapters.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  }

  /**
   * 检测主要语言
   * @param {string} projectPath - 项目路径
   * @returns {Promise<string>} 语言代码
   */
  async detectLanguage(projectPath) {
    const chapters = await this.findChapters(projectPath)

    // 读取所有章节内容，检测语言
    const languageCounts = {}

    for (const chapter of chapters.slice(0, 5)) { // 只检查前5个章节
      try {
        const content = await fs.readFile(chapter.path, 'utf-8')
        const language = this.detectContentLanguage(content)
        languageCounts[language] = (languageCounts[language] || 0) + 1
      } catch {
        // 忽略错误
      }
    }

    // 返回最常见的语言
    const sortedLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])

    return sortedLanguages.length > 0 ? sortedLanguages[0][0] : 'en'
  }

  /**
   * 确定书籍类型
   * @param {Object} analysis - 分析结果
   * @returns {string} 书籍类型
   */
  determineBookType(analysis) {
    const { techStack, structure, chapters } = analysis

    // 基于框架和结构推断类型
    if (techStack.framework === 'vitepress') {
      return 'documentation'
    }

    if (chapters && chapters.length > 20) {
      return 'comprehensive-book'
    }

    if (structure.type === 'hierarchical') {
      return 'structured-guide'
    }

    return 'simple-guide'
  }

  /**
   * 检测框架
   * @private
   */
  detectFramework(packageJson) {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }

    if (allDeps.vitepress) return 'vitepress'
    if (allDeps.docusaurus) return 'docusaurus'
    if (allDeps.gitbook) return 'gitbook'
    if (allDeps.hexo) return 'hexo'
    if (allDeps.vuepress) return 'vuepress'

    return 'unknown'
  }

  /**
   * 检测包管理器
   * @private
   */
  async detectPackageManager(projectPath) {
    const lockFiles = [
      { file: 'package-lock.json', manager: 'npm' },
      { file: 'yarn.lock', manager: 'yarn' },
      { file: 'pnpm-lock.yaml', manager: 'pnpm' }
    ]

    for (const { file, manager } of lockFiles) {
      try {
        await fs.access(path.join(projectPath, file))
        return manager
      } catch {
        // 文件不存在，继续检查
      }
    }

    return 'npm' // 默认使用 npm
  }

  /**
   * 从 Markdown 文件中提取标题
   * @private
   */
  async extractTitle(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')

      for (const line of lines) {
        const match = line.match(/^#\s+(.+)$/)
        if (match) {
          return match[1].trim()
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * 检测内容语言（简单实现）
   * @private
   */
  detectContentLanguage(content) {
    // 检测中文字符
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g)
    if (chineseChars && chineseChars.length > content.length * 0.1) {
      return 'zh'
    }

    // 检测日文字符
    const japaneseChars = content.match(/[\u3040-\u309f\u30a0-\u30ff]/g)
    if (japaneseChars && japaneseChars.length > content.length * 0.1) {
      return 'ja'
    }

    return 'en'
  }
}