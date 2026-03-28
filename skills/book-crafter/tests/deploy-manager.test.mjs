import { DeployManager } from '../scripts/deploy-manager.mjs'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import { exec as execCallback } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(execCallback)

describe('DeployManager - Git 操作', () => {
  let manager
  let tempDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    manager = new DeployManager(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该初始化 Git 仓库', async () => {
    await manager.initGit()

    const gitDir = path.join(tempDir, '.git')
    expect(fs.existsSync(gitDir)).toBe(true)
  })

  test('应该创建初始提交', async () => {
    await manager.initGit()

    // 创建测试文件
    fs.writeFileSync(path.join(tempDir, 'test.md'), '# Test')

    const result = await manager.commit('Initial commit')
    expect(result.success).toBe(true)

    const log = execSync('git log --oneline', { cwd: tempDir, encoding: 'utf-8' })
    expect(log).toContain('Initial commit')
  })

  test('应该检查 GitHub CLI 可用性', async () => {
    const isAvailable = await manager.checkGitHubCLI()
    // 根据实际环境，这里可能是 true 或 false
    expect(typeof isAvailable).toBe('boolean')
  })

  test('应该拒绝无效的 projectPath', () => {
    expect(() => new DeployManager(null)).toThrow()
    expect(() => new DeployManager('')).toThrow()
  })
})

describe('deployToGitHubPages', () => {
  let testProjectPath

  beforeEach(async () => {
    testProjectPath = path.join(os.tmpdir(), `book-crafter-deploy-test-${Date.now()}`)
    await fsPromises.mkdir(testProjectPath, { recursive: true })
  })

  afterEach(async () => {
    await fsPromises.rm(testProjectPath, { recursive: true, force: true })
  })

  test('应该在未构建时提示错误', async () => {
    const manager = new DeployManager(testProjectPath)
    const result = await manager.deployToGitHubPages()

    expect(result).toBe(false)
  })

  test('应该在缺少 deploy 脚本时提示错误', async () => {
    // 创建 dist 目录
    await fsPromises.mkdir(
      path.join(testProjectPath, 'docs', '.vitepress', 'dist'),
      { recursive: true }
    )

    // 创建没有 deploy 脚本的 package.json
    await fsPromises.writeFile(
      path.join(testProjectPath, 'package.json'),
      JSON.stringify({ scripts: {} })
    )

    const manager = new DeployManager(testProjectPath)
    const result = await manager.deployToGitHubPages()

    expect(result).toBe(false)
  })

  test('应该在缺少 gh-pages 依赖时提示错误', async () => {
    // 创建 dist 目录
    await fsPromises.mkdir(
      path.join(testProjectPath, 'docs', '.vitepress', 'dist'),
      { recursive: true }
    )

    // 创建有 deploy 脚本但无依赖的 package.json
    await fsPromises.writeFile(
      path.join(testProjectPath, 'package.json'),
      JSON.stringify({
        scripts: { deploy: 'gh-pages -d docs/.vitepress/dist' }
      })
    )

    const manager = new DeployManager(testProjectPath)
    const result = await manager.deployToGitHubPages()

    expect(result).toBe(false)
  })

  test('应该在所有检查通过后执行部署', async () => {
    // 创建 dist 目录
    await fsPromises.mkdir(
      path.join(testProjectPath, 'docs', '.vitepress', 'dist'),
      { recursive: true }
    )

    // 创建完整的 package.json
    await fsPromises.writeFile(
      path.join(testProjectPath, 'package.json'),
      JSON.stringify({
        scripts: { deploy: 'echo "deploy mock"' },
        devDependencies: { 'gh-pages': '^6.3.0' }
      })
    )

    // 初始化 Git 仓库
    await execAsync('git init', { cwd: testProjectPath })

    const manager = new DeployManager(testProjectPath)
    const result = await manager.deployToGitHubPages()

    expect(result).toBe(true)
  })
})
