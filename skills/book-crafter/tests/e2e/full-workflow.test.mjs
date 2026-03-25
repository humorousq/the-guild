import { WorkflowEngine } from '../../scripts/workflow-engine.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('端到端工作流测试', () => {
  let tempDir
  let engine

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-e2e-'))
    engine = new WorkflowEngine(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该完成完整的书籍创建流程（阶段1-3）', async () => {
    // 初始化工作流
    await engine.init()

    // 阶段1: 项目初始化
    await engine.executeStage(1, { projectPath: tempDir })
    await engine.completeStage(1, { projectPath: tempDir })

    // 验证状态
    const state1 = await engine.getState()
    expect(state1.currentStage).toBe(2)
    expect(state1.stages['1'].status).toBe('completed')

    // 阶段2: 分析与规划（使用默认分析）
    const analysis = {
      title: 'E2E Test Book',
      description: 'An end-to-end test book',
      chapters: [
        { number: 1, title: 'Introduction', description: 'Introduction to the book', file: 'chapter-01.md' },
        { number: 2, title: 'Getting Started', description: 'How to get started', file: 'chapter-02.md' }
      ]
    }

    const result2 = await engine.executeStage(2, { analysis })
    await engine.completeStage(2, result2.output)

    // 验证 BOOK_CONTEXT.md 生成
    const contextPath = path.join(tempDir, 'BOOK_CONTEXT.md')
    expect(fs.existsSync(contextPath)).toBe(true)

    // 阶段3: 框架生成
    const result3 = await engine.executeStage(3, result2.output)
    await engine.completeStage(3, result3.output)

    // 验证框架文件
    expect(fs.existsSync(path.join(tempDir, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs', '.vitepress', 'config.mts'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs', 'chapter-01.md'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs', 'chapter-02.md'))).toBe(true)

    // 验证状态完成
    const finalState = await engine.getState()
    expect(finalState.stages['3'].status).toBe('completed')
  })

  test('应该支持工作流恢复', async () => {
    // 初始化并完成阶段1
    await engine.init()
    await engine.executeStage(1, { projectPath: tempDir })
    await engine.completeStage(1, { projectPath: tempDir })

    // 创建新引擎实例（模拟中断后恢复）
    const recoveredEngine = new WorkflowEngine(tempDir)

    // 恢复执行
    const analysis = {
      title: 'Recovered Book',
      description: 'A book recovered from interruption',
      chapters: [
        { number: 1, title: 'Chapter 1', description: 'First chapter', file: 'chapter-01.md' }
      ]
    }

    await recoveredEngine.executeStage(2, { analysis })
    await recoveredEngine.completeStage(2, { analysis })

    // 验证恢复成功
    const state = await recoveredEngine.getState()
    expect(state.currentStage).toBe(3)
    expect(state.stages['2'].status).toBe('completed')
  })
})
