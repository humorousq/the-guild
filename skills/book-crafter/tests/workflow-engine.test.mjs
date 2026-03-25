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
})
