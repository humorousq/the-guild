import fs from 'fs/promises'
import path from 'path'
import { Logger } from '../utils/logger.mjs'

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
