import { WorkflowEngine } from './workflow-engine.mjs'
import { OutputFormatter } from './output-formatter.mjs'

/**
 * CLI 类 - 提供命令行接口
 *
 * 负责解析命令行参数并调用相应的工作流方法
 */
export class CLI {
  #projectPath
  #engine
  #formatter

  /**
   * 创建 CLI 实例
   * @param {string} projectPath - 项目路径
   * @throws {Error} 如果 projectPath 无效
   */
  constructor(projectPath) {
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('projectPath 必须是非空字符串')
    }

    this.#projectPath = projectPath
    this.#engine = new WorkflowEngine(projectPath)
    this.#formatter = new OutputFormatter()
  }

  /**
   * 获取 formatter 实例（用于测试）
   * @returns {OutputFormatter}
   */
  get formatter() {
    return this.#formatter
  }

  /**
   * 初始化工作流
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async init() {
    try {
      await this.#engine.init()
      return { success: true, message: '工作流初始化成功' }
    } catch (error) {
      if (error.message.includes('已存在')) {
        throw new Error('工作流已初始化，请使用 status 查看状态或 resume 恢复执行')
      }
      throw error
    }
  }

  /**
   * 执行下一阶段
   * @param {Object} input - 阶段输入参数
   * @returns {Promise<{success: boolean, output?: Object}>}
   */
  async next(input = {}) {
    if (input !== null && typeof input !== 'object') {
      throw new Error('input 必须是对象类型')
    }

    const result = await this.#engine.nextStage(input)
    return result
  }

  /**
   * 恢复执行
   * @returns {Promise<{success: boolean, output?: Object}>}
   */
  async resume() {
    try {
      const result = await this.#engine.resume()
      return result
    } catch (error) {
      if (error.message && error.message.includes('未初始化')) {
        throw new Error('工作流未初始化，请先运行 init')
      }
      throw error
    }
  }

  /**
   * 获取当前状态
   * @returns {Promise<Object>}
   */
  async status() {
    try {
      const state = await this.#engine.getState()
      this.#formatter.formatWorkflowState(state)
      return state
    } catch (error) {
      if (error.message.includes('未初始化')) {
        throw new Error('工作流未初始化，请先运行 init')
      }
      throw error
    }
  }

  /**
   * 部署到 GitHub Pages
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async deploy() {
    const { DeployManager } = await import('./deploy-manager.mjs')
    const manager = new DeployManager(this.#projectPath)
    await manager.deployToGitHubPages()
    return { success: true, message: '部署成功' }
  }

  /**
   * 显示帮助信息
   * @returns {string}
   */
  help() {
    return `
Book Crafter CLI - AI 驱动的书籍创建工具

用法: node scripts/cli.mjs <command> [options]

命令:
  init          初始化工作流
  next          执行下一阶段
  resume        恢复执行
  status        显示当前状态
  deploy        部署到 GitHub Pages
  --help, -h    显示此帮助信息

示例:
  node scripts/cli.mjs init
  node scripts/cli.mjs status
  node scripts/cli.mjs next
  node scripts/cli.mjs resume
  node scripts/cli.mjs deploy

阶段说明:
  1. 项目初始化 - 创建项目骨架
  2. 分析与规划 - 分析参考源并生成规划
  3. 框架生成 - 生成 VitePress 项目结构
  4. 环境配置 - 安装依赖并检查一致性
  5. 内容创作 - 生成章节内容
  6. 部署发布 - 初始化 Git 并部署到 GitHub Pages

更多信息请访问: https://github.com/the-guild/book-crafter
    `.trim()
  }

  /**
   * 解析命令行参数
   * @param {Array<string>} args - 命令行参数数组
   * @returns {{command: string, args: Object}}
   */
  parseCommand(args) {
    if (!args || args.length === 0) {
      throw new Error('请指定命令。使用 --help 查看帮助信息')
    }

    const firstArg = args[0]

    // 处理帮助参数
    if (firstArg === '--help' || firstArg === '-h') {
      return { command: 'help', args: {} }
    }

    // 验证命令
    const validCommands = ['init', 'next', 'resume', 'status', 'deploy']
    if (!validCommands.includes(firstArg)) {
      throw new Error(`未知命令: ${firstArg}。使用 --help 查看帮助信息`)
    }

    // 解析额外参数（未来扩展用）
    const parsedArgs = {}
    for (let i = 1; i < args.length; i++) {
      const arg = args[i]
      if (arg.startsWith('--')) {
        const key = arg.slice(2)
        const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true
        parsedArgs[key] = value
        if (value !== true) i++ // 跳过已处理的值
      }
    }

    return { command: firstArg, args: parsedArgs }
  }

  /**
   * 运行 CLI
   * @param {Array<string>} args - 命令行参数数组
   * @returns {Promise<any>}
   */
  async run(args) {
    const { command } = this.parseCommand(args)

    const handlers = {
      init: async () => {
        const result = await this.init()
        this.#formatter.success(result.message)
        return result
      },
      next: async () => {
        const result = await this.next()
        this.#formatter.success('阶段执行完成')
        return result
      },
      resume: async () => {
        const result = await this.resume()
        this.#formatter.success('恢复执行成功')
        return result
      },
      status: async () => {
        return await this.status()
      },
      deploy: async () => {
        const result = await this.deploy()
        this.#formatter.success(result.message)
        return result
      },
      help: () => {
        const helpText = this.help()
        console.log(helpText)
        return helpText
      }
    }

    return await handlers[command]()
  }
}

// 如果直接运行此文件，则执行 CLI
if (process.argv[1] && process.argv[1].endsWith('cli.mjs')) {
  const cli = new CLI(process.cwd())
  const args = process.argv.slice(2)

  try {
    await cli.run(args)
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}\n`)
    process.exit(1)
  }
}
