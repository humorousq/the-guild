import { WorkflowEngine } from '../scripts/workflow-engine.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('WorkflowEngine - 状态管理', () => {
  let engine
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    engine = new WorkflowEngine(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该初始化工作流状态', async () => {
    await engine.init()

    const stateFile = path.join(tempDir, '.book-crafter', 'state.json')
    expect(fs.existsSync(stateFile)).toBe(true)

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'))
    expect(state.currentStage).toBe(1)
    expect(state.stages).toHaveProperty('1')
  })

  test('应该保存当前阶段状态', async () => {
    await engine.init()
    await engine.completeStage(1, { projectPath: tempDir })

    const state = await engine.getState()
    expect(state.stages['1'].status).toBe('completed')
    expect(state.stages['1'].output.projectPath).toBe(tempDir)
  })

  test('应该加载现有状态', async () => {
    await engine.init()
    await engine.completeStage(1, { projectPath: tempDir })

    const newEngine = new WorkflowEngine(tempDir)
    const state = await newEngine.getState()
    expect(state.currentStage).toBe(2)
  })

  test('应该验证阶段转换 - 不能跳过阶段', async () => {
    await engine.init()

    // 尝试跳过阶段 1 直接完成阶段 2 应该抛出错误
    await expect(engine.completeStage(2, {})).rejects.toThrow()
  })

  test('应该顺序完成阶段', async () => {
    await engine.init()

    // 完成阶段 1
    await engine.completeStage(1, { projectPath: tempDir })
    expect((await engine.getState()).currentStage).toBe(2)

    // 完成阶段 2
    await engine.completeStage(2, { analysis: 'test' })
    expect((await engine.getState()).currentStage).toBe(3)
  })

  test('应该拒绝无效的阶段编号', async () => {
    await engine.init()

    await expect(engine.completeStage(99, {})).rejects.toThrow('无效的阶段编号')
  })

  test('应该拒绝完成已完成的阶段', async () => {
    await engine.init()
    await engine.completeStage(1, { projectPath: tempDir })

    // 再次尝试完成同一阶段应该抛出错误
    await expect(engine.completeStage(1, {})).rejects.toThrow()
  })

  test('应该在状态文件损坏时抛出错误', async () => {
    await engine.init()

    // 损坏状态文件
    const stateFile = path.join(tempDir, '.book-crafter', 'state.json')
    fs.writeFileSync(stateFile, 'invalid json content', 'utf-8')

    const newEngine = new WorkflowEngine(tempDir)
    await expect(newEngine.getState()).rejects.toThrow('状态文件已损坏')
  })

  test('应该在未初始化时调用 getState() 抛出错误', async () => {
    const newEngine = new WorkflowEngine(tempDir)
    await expect(newEngine.getState()).rejects.toThrow('工作流未初始化')
  })

  test('应该拒绝无效的 projectPath 参数', () => {
    expect(() => new WorkflowEngine(null)).toThrow('projectPath 必须是非空字符串')
    expect(() => new WorkflowEngine('')).toThrow('projectPath 必须是非空字符串')
    expect(() => new WorkflowEngine(123)).toThrow('projectPath 必须是非空字符串')
  })
})

describe('WorkflowEngine - 阶段执行', () => {
  let engine
  let tempDir

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    engine = new WorkflowEngine(tempDir)
    await engine.init()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该执行阶段1', async () => {
    const result = await engine.executeStage(1, {
      projectPath: tempDir
    })

    expect(result.success).toBe(true)
    expect(result.output.projectPath).toBe(tempDir)

    const state = await engine.getState()
    expect(state.stages['1'].status).toBe('pending') // executeStage 不改变状态
  })

  test('应该执行下一阶段', async () => {
    await engine.executeStage(1, { projectPath: tempDir })
    await engine.nextStage()

    const state = await engine.getState()
    expect(state.currentStage).toBe(2)
    expect(state.stages['1'].status).toBe('completed')
  })

  test('应该拒绝跳过阶段', async () => {
    await expect(
      engine.executeStage(3, {})
    ).rejects.toThrow('必须先完成阶段 2')
  })

  test('应该恢复执行', async () => {
    await engine.executeStage(1, { projectPath: tempDir })
    await engine.completeStage(1, { projectPath: tempDir })

    const newEngine = new WorkflowEngine(tempDir)
    await newEngine.resume()

    const state = await newEngine.getState()
    expect(state.currentStage).toBe(3)
  })

  test('应该拒绝无效的 input 参数', async () => {
    await expect(
      engine.executeStage(1, 'invalid')
    ).rejects.toThrow('input 必须是对象类型')

    await expect(
      engine.executeStage(1, 123)
    ).rejects.toThrow('input 必须是对象类型')
  })
})

describe('WorkflowEngine - 模块集成', () => {
  let engine
  let tempDir

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    engine = new WorkflowEngine(tempDir)
    await engine.init()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该执行阶段 1-3 并生成项目骨架', async () => {
    // 阶段1: 项目初始化
    await engine.executeStage(1, { projectPath: tempDir })
    await engine.completeStage(1, { projectPath: tempDir })

    // 验证阶段1完成
    const state1 = await engine.getState()
    expect(state1.currentStage).toBe(2)

    // 阶段2: 分析与规划（直接传入分析结果）
    const analysis = {
      title: 'Test Book',
      description: 'A test book for integration testing',
      chapters: [
        { number: 1, title: 'Chapter 1', description: 'First chapter', file: 'chapter-01.md' },
        { number: 2, title: 'Chapter 2', description: 'Second chapter', file: 'chapter-02.md' }
      ]
    }

    await engine.executeStage(2, { analysis })
    await engine.completeStage(2, { analysis })

    // 验证 BOOK_CONTEXT.md 生成
    const contextPath = path.join(tempDir, 'BOOK_CONTEXT.md')
    expect(fs.existsSync(contextPath)).toBe(true)

    // 阶段3: 框架生成
    await engine.executeStage(3, { analysis })
    await engine.completeStage(3, { projectPath: tempDir })

    // 验证生成的文件
    expect(fs.existsSync(path.join(tempDir, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs', '.vitepress', 'config.mts'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs', 'chapter-01.md'))).toBe(true)
  })
})
