import { DeployManager } from '../scripts/deploy-manager.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

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
