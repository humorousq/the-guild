import { ConsistencyChecker } from '../scripts/consistency-checker.mjs'
import { EnvironmentManager } from '../scripts/environment-manager.mjs'

describe('ConsistencyChecker', () => {
  let checker
  let envManager

  beforeEach(() => {
    envManager = new EnvironmentManager()
    checker = new ConsistencyChecker(envManager)
  })

  test('应该检测 Node.js 版本不匹配', () => {
    const result = checker.checkNodeVersionMatch('v18.0.0', '22.13.0')

    expect(result.match).toBe(false)
    expect(result.local).toBe('v18.0.0')
    expect(result.actions).toBe('22.13.0')
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].type).toBe('node-version-mismatch')
    expect(result.issues[0].severity).toBe('high')
    expect(result.issues[0].message).toContain('v18.0.0')
    expect(result.issues[0].message).toContain('22.13.0')
    expect(result.issues[0].fix).toContain('node-version')
  })

  test('应该在版本匹配时通过', () => {
    const result = checker.checkNodeVersionMatch('v22.13.0', '22.13.0')

    expect(result.match).toBe(true)
    expect(result.local).toBe('v22.13.0')
    expect(result.actions).toBe('22.13.0')
    expect(result.issues).toHaveLength(0)
  })

  test('应该检测缺失的 lock 文件', () => {
    const result = checker.checkLockFile(false)

    expect(result.hasLockFile).toBe(false)
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].type).toBe('missing-lock-file')
    expect(result.issues[0].severity).toBe('high')
    expect(result.issues[0].message).toContain('package-lock.json')
  })

  test('应该在 lock 文件存在时通过', () => {
    const result = checker.checkLockFile(true)

    expect(result.hasLockFile).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  test('应该检查平台依赖同步', () => {
    // darwin-arm64 没有 linux 依赖，应该通过
    const result1 = checker.checkPlatformDeps('darwin', 'arm64', false)
    expect(result1.synced).toBe(true)
    expect(result1.issues).toHaveLength(0)

    // darwin-arm64 有 linux 依赖，应该警告
    const result2 = checker.checkPlatformDeps('darwin', 'arm64', true)
    expect(result2.synced).toBe(false)
    expect(result2.issues).toHaveLength(1)
    expect(result2.issues[0].type).toBe('platform-deps-mismatch')

    // linux-x64 有 linux 依赖，应该通过
    const result3 = checker.checkPlatformDeps('linux', 'x64', true)
    expect(result3.synced).toBe(true)

    // linux-x64 没有 linux 依赖，应该警告
    const result4 = checker.checkPlatformDeps('linux', 'x64', false)
    expect(result4.synced).toBe(false)
    expect(result4.issues).toHaveLength(1)
  })

  test('应该执行完整的一致性检查', async () => {
    // 使用项目真实路径
    const result = await checker.checkFull(process.cwd())

    expect(result).toHaveProperty('nodeVersion')
    expect(result).toHaveProperty('lockFile')
    expect(result).toHaveProperty('platformDeps')
    expect(result).toHaveProperty('allIssues')
    expect(result).toHaveProperty('hasIssues')
    expect(Array.isArray(result.allIssues)).toBe(true)
    expect(typeof result.hasIssues).toBe('boolean')
  })
})
