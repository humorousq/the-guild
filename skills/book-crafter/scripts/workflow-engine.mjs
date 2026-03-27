import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { Logger } from '../utils/logger.mjs'
import { InputDetector } from './input-detector.mjs'
import { ReferenceAnalyzer } from './reference-analyzer.mjs'
import { FrameworkGenerator } from './framework-generator.mjs'
import { EnvironmentManager } from './environment-manager.mjs'
import { ConsistencyChecker } from './consistency-checker.mjs'
import { ContentCollaborator } from './content-collaborator.mjs'
import { DeployManager } from './deploy-manager.mjs'

export class WorkflowEngine {
  #projectPath
  #statePath
  #logger
  #state

  constructor(projectPath) {
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('projectPath 必须是非空字符串')
    }
    this.#projectPath = projectPath
    this.#statePath = path.join(projectPath, '.book-crafter', 'state.json')
    this.#logger = new Logger()
    this.#state = null
  }

  /**
   * 初始化工作流
   */
  async init() {
    // 检查状态文件是否已存在
    try {
      await fs.access(this.#statePath)
      throw new Error('工作流已初始化')
    } catch (error) {
      if (error.message === '工作流已初始化') {
        throw error
      }
      // 文件不存在，继续初始化
    }

    // 创建状态目录
    const stateDir = path.dirname(this.#statePath)
    await fs.mkdir(stateDir, { recursive: true })

    // 初始化状态
    this.#state = {
      version: '1.0.0',
      currentStage: 1,
      stages: {
        '1': { name: '项目初始化', status: 'pending' },
        '2': { name: '分析与规划', status: 'pending' },
        '3': { name: '框架生成', status: 'pending' },
        '4': { name: '环境配置', status: 'pending' },
        '5': { name: '内容创作', status: 'pending' },
        '6': { name: '部署发布', status: 'pending' }
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    await this.#saveState()
    this.#logger.success('工作流初始化完成')
  }

  /**
   * 获取当前状态
   */
  async getState() {
    if (!this.#state) {
      await this.#loadState()
    }
    return this.#state
  }

  /**
   * 完成当前阶段
   */
  async completeStage(stageNumber, output = {}) {
    const state = await this.getState()

    if (!state.stages[stageNumber]) {
      throw new Error(`无效的阶段编号: ${stageNumber}`)
    }

    // 验证阶段转换
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
    this.#logger.success(`阶段 ${stageNumber} 完成: ${state.stages[stageNumber].name}`)
  }

  /**
   * 执行指定阶段
   */
  async executeStage(stageNumber, input = {}) {
    const state = await this.getState()

    // 验证阶段编号
    if (stageNumber < 1 || stageNumber > 6) {
      throw new Error(`无效的阶段编号: ${stageNumber}`)
    }

    // 验证 input 参数
    if (input !== null && typeof input !== 'object') {
      throw new Error('input 必须是对象类型')
    }

    // 验证是否可以执行该阶段
    if (stageNumber > 1) {
      const prevStage = state.stages[stageNumber - 1]
      if (prevStage.status !== 'completed') {
        throw new Error(`必须先完成阶段 ${stageNumber - 1}`)
      }
    }

    this.#logger.section(`执行阶段 ${stageNumber}: ${state.stages[stageNumber].name}`)

    // 根据阶段编号执行相应的处理
    const handlers = {
      1: this.#executeStage1.bind(this),
      2: this.#executeStage2.bind(this),
      3: this.#executeStage3.bind(this),
      4: this.#executeStage4.bind(this),
      5: this.#executeStage5.bind(this),
      6: this.#executeStage6.bind(this)
    }

    const result = await handlers[stageNumber](input)

    return result
  }

  /**
   * 执行下一阶段
   */
  async nextStage(input = {}) {
    const state = await this.getState()
    const nextStage = state.currentStage

    const result = await this.executeStage(nextStage, input)
    await this.completeStage(nextStage, result.output)

    return result
  }

  /**
   * 恢复执行
   */
  async resume() {
    const state = await this.getState()
    this.#logger.info(`恢复执行，当前阶段: ${state.currentStage}`)

    return await this.nextStage()
  }

  /**
   * 阶段1: 项目初始化
   */
  async #executeStage1(input) {
    return {
      success: true,
      output: {
        projectPath: input.projectPath || this.#projectPath
      }
    }
  }

  /**
   * 阶段2: 分析与规划
   */
  async #executeStage2(input) {
    // 如果提供了 source，则分析参考源；否则使用默认分析
    let analysis

    if (input.source) {
      const detector = new InputDetector()
      const analyzer = new ReferenceAnalyzer()

      const detected = detector.detect(input.source)
      const sourcePath = detected.path || detected.url

      // 分析参考源
      analysis = await analyzer.analyze(sourcePath)
    } else {
      // 使用默认分析结果
      analysis = input.analysis || {
        title: 'My Book',
        description: 'A new book project',
        chapters: [
          { number: 1, title: 'Chapter 1', description: 'First chapter' }
        ]
      }
    }

    // 生成 BOOK_CONTEXT.md
    const contextContent = this.#generateBookContext(analysis)
    const contextPath = path.join(this.#projectPath, 'BOOK_CONTEXT.md')
    await fs.writeFile(contextPath, contextContent, 'utf-8')

    this.#logger.success('已生成 BOOK_CONTEXT.md')

    return {
      success: true,
      output: {
        contextPath,
        analysis
      }
    }
  }

  /**
   * 生成 BOOK_CONTEXT.md 内容
   */
  #generateBookContext(analysis) {
    return `# 书籍项目上下文

## 项目信息
- **书名**: ${analysis.title || '未命名书籍'}
- **描述**: ${analysis.description || '暂无描述'}
- **目标读者**: 开发者

## 章节大纲
${analysis.chapters.map((ch, i) => `${i + 1}. ${ch.title} - ${ch.description || '待补充'}`).join('\n')}

## 风格指南
- **语调**: 实用
- **代码风格**: 简洁清晰

---
Generated by Book Crafter
`
  }

  /**
   * 阶段3: 框架生成
   */
  async #executeStage3(input) {
    const generator = new FrameworkGenerator(this.#projectPath, input.analysis)

    await generator.generate()

    return {
      success: true,
      output: {
        projectPath: this.#projectPath
      }
    }
  }

  /**
   * 阶段4: 环境配置
   */
  async #executeStage4(input) {
    const envManager = new EnvironmentManager(this.#projectPath)
    const checker = new ConsistencyChecker(this.#projectPath)

    // 安装依赖
    await envManager.installDependencies()

    // 检查一致性
    const result = await checker.check()

    if (!result.consistent) {
      this.#logger.warn('检测到环境不一致:')
      result.issues.forEach(issue => {
        this.#logger.warn(`  - ${issue}`)
      })
    }

    return {
      success: true,
      output: {
        consistent: result.consistent,
        issues: result.issues
      }
    }
  }

  /**
   * 阶段5: 内容创作
   */
  async #executeStage5(input) {
    const collaborator = new ContentCollaborator(this.#projectPath)

    // 加载上下文
    const context = collaborator.loadContext()

    this.#logger.info(`共 ${context.chapters.length} 个章节待创作`)

    // 这里只做示例，实际应该逐章节生成
    // 用户可以手动调用 suggestChapterContent 和 applySuggestion

    return {
      success: true,
      output: {
        chaptersCount: context.chapters.length,
        message: '内容创作阶段已准备就绪，请使用 ContentCollaborator 生成内容'
      }
    }
  }

  /**
   * 阶段6: 部署发布
   */
  async #executeStage6(input) {
    const deployManager = new DeployManager(this.#projectPath)

    // 初始化 Git
    await deployManager.initGit()

    // 检查 GitHub CLI
    const cliAvailable = await deployManager.checkGitHubCLI()

    if (!cliAvailable) {
      this.#logger.warn('GitHub CLI 不可用，跳过远程部署')
      return {
        success: true,
        output: {
          gitInitialized: true,
          deployed: false,
          message: 'Git 已初始化，但 GitHub CLI 不可用'
        }
      }
    }

    // 创建初始提交
    await deployManager.commit('Initial commit: Book project created by Book Crafter')

    return {
      success: true,
      output: {
        gitInitialized: true,
        deployed: false,
        message: 'Git 仓库已初始化并创建初始提交'
      }
    }
  }

  /**
   * 保存状态到文件
   */
  async #saveState() {
    await fs.writeFile(
      this.#statePath,
      JSON.stringify(this.#state, null, 2),
      'utf-8'
    )
  }

  /**
   * 从文件加载状态
   */
  async #loadState() {
    try {
      const content = await fs.readFile(this.#statePath, 'utf-8')
      this.#state = JSON.parse(content)
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('工作流未初始化，请先运行 init()')
      }
      if (error instanceof SyntaxError) {
        throw new Error('状态文件已损坏，请检查 .book-crafter/state.json')
      }
      throw error
    }
  }

  /**
   * 验证阶段转换
   */
  #validateTransition(currentStage, targetStage) {
    // 检查目标阶段是否是当前阶段
    if (targetStage !== currentStage) {
      throw new Error(
        `只能顺序执行阶段，当前阶段 ${currentStage}，不能跳到 ${targetStage}`
      )
    }
  }
}
