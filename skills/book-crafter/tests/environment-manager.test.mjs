import { EnvironmentManager } from '../scripts/environment-manager.mjs'

describe('EnvironmentManager', () => {
  let manager

  beforeEach(() => {
    manager = new EnvironmentManager()
  })

  test('应该检测本地环境', async () => {
    const env = await manager.detectLocal()
    expect(env).toHaveProperty('nodeVersion')
    expect(env).toHaveProperty('platform')
    expect(env).toHaveProperty('arch')
    expect(env.nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/)
  })

  test('应该检查 Node.js 版本匹配', () => {
    const match = manager.versionsMatch('v22.13.0', '22.13.0')
    expect(match).toBe(true)
  })

  test('应该检测版本不匹配', () => {
    const match = manager.versionsMatch('v18.0.0', '22.13.0')
    expect(match).toBe(false)
  })

  test('应该识别平台特定依赖', () => {
    const deps = manager.getPlatformDeps('darwin', 'arm64')
    expect(deps).toContain('@rollup/rollup-darwin-arm64')

    const linuxDeps = manager.getPlatformDeps('linux', 'x64')
    expect(linuxDeps).toContain('@rollup/rollup-linux-x64-gnu')
  })

  test('应该检查 package-lock.json 存在', () => {
    const hasLock = manager.hasLockFile(process.cwd())
    expect(typeof hasLock).toBe('boolean')
  })

  test('应该检查 package-lock.json 不存在', () => {
    const hasLock = manager.hasLockFile('/nonexistent/path')
    expect(hasLock).toBe(false)
  })

  test('应该从 workflow 文件提取 Node 版本', async () => {
    // 创建临时测试文件
    const fs = await import('fs')
    const os = await import('os')
    const path = await import('path')

    const tmpDir = os.tmpdir()
    const tmpFile = path.join(tmpDir, 'test-workflow.yml')
    const content = `
name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v6
        with:
          node-version: '22.13.0'
`
    fs.writeFileSync(tmpFile, content)

    const version = await manager.extractActionsNodeVersion(tmpFile)
    expect(version).toBe('22.13.0')

    // 清理
    fs.unlinkSync(tmpFile)
  })

  test('应该在 workflow 文件不存在时返回 null', async () => {
    const version = await manager.extractActionsNodeVersion('/nonexistent/workflow.yml')
    expect(version).toBeNull()
  })
})
