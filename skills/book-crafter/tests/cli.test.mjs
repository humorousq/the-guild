import { CLI } from '../scripts/cli.mjs'
import { WorkflowEngine } from '../scripts/workflow-engine.mjs'
import { OutputFormatter } from '../scripts/output-formatter.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('CLI - 命令解析', () => {
  let cli
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    cli = new CLI(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该创建 CLI 实例', () => {
    expect(cli).toBeInstanceOf(CLI)
  })

  test('应该拒绝无效的 projectPath 参数', () => {
    expect(() => new CLI(null)).toThrow('projectPath 必须是非空字符串')
    expect(() => new CLI('')).toThrow('projectPath 必须是非空字符串')
    expect(() => new CLI(123)).toThrow('projectPath 必须是非空字符串')
  })

  test('应该初始化 OutputFormatter', () => {
    expect(cli.formatter).toBeInstanceOf(OutputFormatter)
  })
})

describe('CLI - init 命令', () => {
  let cli
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    cli = new CLI(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该初始化工作流', async () => {
    const result = await cli.init()

    expect(result.success).toBe(true)
    expect(fs.existsSync(path.join(tempDir, '.book-crafter', 'state.json'))).toBe(true)
  })

  test('应该拒绝重复初始化', async () => {
    await cli.init()

    await expect(cli.init()).rejects.toThrow()
  })
})

describe('CLI - status 命令', () => {
  let cli
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    cli = new CLI(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该返回工作流状态', async () => {
    await cli.init()
    const status = await cli.status()

    expect(status.currentStage).toBe(1)
    expect(status.stages).toHaveProperty('1')
  })

  test('应该在未初始化时抛出错误', async () => {
    await expect(cli.status()).rejects.toThrow('工作流未初始化')
  })
})

describe('CLI - next 命令', () => {
  let cli
  let tempDir

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    cli = new CLI(tempDir)
    await cli.init()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该执行下一阶段', async () => {
    const result = await cli.next({ projectPath: tempDir })

    expect(result.success).toBe(true)
    const status = await cli.status()
    expect(status.currentStage).toBe(2)
  })
})

describe('CLI - resume 命令', () => {
  let cli
  let tempDir

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    cli = new CLI(tempDir)
    await cli.init()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该恢复执行', async () => {
    // 完成阶段 1
    await cli.next({ projectPath: tempDir })

    // 创建新的 CLI 实例并恢复
    const newCli = new CLI(tempDir)
    const result = await newCli.resume()

    expect(result.success).toBe(true)
    const status = await newCli.status()
    expect(status.currentStage).toBe(3)
  })

  test('应该在未初始化时抛出错误', async () => {
    // 创建一个新的临时目录，确保没有状态文件
    const newTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    const newCli = new CLI(newTempDir)

    await expect(newCli.resume()).rejects.toThrow('工作流未初始化')

    fs.rmSync(newTempDir, { recursive: true, force: true })
  })
})

describe('CLI - help 命令', () => {
  let cli
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    cli = new CLI(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该返回帮助信息', () => {
    const help = cli.help()

    expect(help).toContain('Book Crafter CLI')
    expect(help).toContain('init')
    expect(help).toContain('next')
    expect(help).toContain('resume')
    expect(help).toContain('status')
  })
})

describe('CLI - parseCommand 方法', () => {
  let cli
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    cli = new CLI(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该解析 init 命令', () => {
    const parsed = cli.parseCommand(['init'])
    expect(parsed.command).toBe('init')
    expect(parsed.args).toEqual({})
  })

  test('应该解析 status 命令', () => {
    const parsed = cli.parseCommand(['status'])
    expect(parsed.command).toBe('status')
  })

  test('应该解析 --help 参数', () => {
    const parsed = cli.parseCommand(['--help'])
    expect(parsed.command).toBe('help')
  })

  test('应该解析 -h 参数', () => {
    const parsed = cli.parseCommand(['-h'])
    expect(parsed.command).toBe('help')
  })

  test('应该拒绝无效命令', () => {
    expect(() => cli.parseCommand(['invalid'])).toThrow('未知命令')
  })

  test('应该拒绝空命令', () => {
    expect(() => cli.parseCommand([])).toThrow('请指定命令')
  })
})

describe('CLI - run 方法', () => {
  let cli
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    cli = new CLI(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该运行 init 命令', async () => {
    const result = await cli.run(['init'])

    expect(result.success).toBe(true)
  })

  test('应该运行 status 命令', async () => {
    await cli.run(['init'])
    const result = await cli.run(['status'])

    expect(result.currentStage).toBeDefined()
  })

  test('应该运行 help 命令', async () => {
    const result = await cli.run(['--help'])

    expect(result).toContain('Book Crafter CLI')
  })

  test('应该处理命令执行错误', async () => {
    await expect(cli.run(['status'])).rejects.toThrow()
  })
})

describe('CLI - deploy 命令', () => {
  let cli
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    cli = new CLI(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该解析 deploy 命令', () => {
    const parsed = cli.parseCommand(['deploy'])
    expect(parsed.command).toBe('deploy')
    expect(parsed.args).toEqual({})
  })

  test('应该显示在帮助信息中', () => {
    const help = cli.help()

    expect(help).toContain('deploy')
    expect(help).toContain('部署到 GitHub Pages')
  })
})
