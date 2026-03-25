import path from 'path'
import { InputDetector } from '../../scripts/input-detector.mjs'
import { ReferenceAnalyzer } from '../../scripts/reference-analyzer.mjs'
import { EnvironmentManager } from '../../scripts/environment-manager.mjs'
import { ConsistencyChecker } from '../../scripts/consistency-checker.mjs'

describe('集成测试 - 模块协作', () => {
  test('应该通过完整流程处理本地路径', async () => {
    const fixturePath = path.join(process.cwd(), 'tests/fixtures/sample-book')

    // 1. 检测输入
    const detector = new InputDetector()
    const input = detector.detect(fixturePath)

    // 验证输入检测结果
    expect(input.type).toBe('local')
    expect(input.path).toBe(fixturePath)
    expect(input.exists).toBe(true)
    expect(input.action).toBe('read')

    // 2. 分析参考源
    const analyzer = new ReferenceAnalyzer()
    const analysis = await analyzer.analyze(input.path)

    // 验证分析结果
    expect(analysis.techStack.framework).toBe('vitepress')
    expect(analysis.techStack.packageManager).toBe('npm')
    expect(analysis.structure).toBeDefined()
    expect(analysis.chapters).toBeDefined()
    expect(analysis.language).toBeDefined()
    expect(analysis.bookType).toBe('documentation')

    // 3. 检查环境
    const envManager = new EnvironmentManager()
    const localEnv = await envManager.detectLocal()

    // 验证环境检测结果
    expect(localEnv.nodeVersion).toBeDefined()
    expect(localEnv.npmVersion).toBeDefined()
    expect(localEnv.platform).toBeDefined()
    expect(localEnv.arch).toBeDefined()
    expect(localEnv.cwd).toBeDefined()

    // 4. 检查一致性
    const checker = new ConsistencyChecker(envManager)
    const consistency = checker.checkLockFile(false)

    // 验证一致性检查结果
    expect(consistency.hasLockFile).toBe(false)
    expect(consistency.issues).toHaveLength(1)
    expect(consistency.issues[0].type).toBe('missing-lock-file')
    expect(consistency.issues[0].severity).toBe('high')
  })

  test('应该正确检测实际项目的 lock 文件', async () => {
    const projectPath = process.cwd()

    // 使用当前项目测试 lock 文件存在的情况
    const detector = new InputDetector()
    const input = detector.detect(projectPath)

    const envManager = new EnvironmentManager()
    const checker = new ConsistencyChecker(envManager)

    // 检查当前项目的 lock 文件
    const hasLockFile = envManager.hasLockFile(input.path)
    const consistency = checker.checkLockFile(hasLockFile)

    // 当前项目应该有 package-lock.json
    expect(consistency.hasLockFile).toBe(true)
    expect(consistency.issues).toHaveLength(0)
  })

  test('应该检测 Node.js 版本一致性', async () => {
    const envManager = new EnvironmentManager()
    const checker = new ConsistencyChecker(envManager)

    const localEnv = await envManager.detectLocal()

    // 测试匹配的版本
    const matchingResult = checker.checkNodeVersionMatch(
      localEnv.nodeVersion,
      localEnv.nodeVersion
    )
    expect(matchingResult.match).toBe(true)
    expect(matchingResult.issues).toHaveLength(0)

    // 测试不匹配的版本
    const mismatchingResult = checker.checkNodeVersionMatch('v18.0.0', 'v20.0.0')
    expect(mismatchingResult.match).toBe(false)
    expect(mismatchingResult.issues).toHaveLength(1)
    expect(mismatchingResult.issues[0].type).toBe('node-version-mismatch')
  })

  test('应该完整分析示例书籍', async () => {
    const fixturePath = path.join(process.cwd(), 'tests/fixtures/sample-book')

    const analyzer = new ReferenceAnalyzer()
    const analysis = await analyzer.analyze(fixturePath)

    // 验证完整分析结果的结构
    expect(analysis).toHaveProperty('path')
    expect(analysis).toHaveProperty('techStack')
    expect(analysis).toHaveProperty('structure')
    expect(analysis).toHaveProperty('chapters')
    expect(analysis).toHaveProperty('language')
    expect(analysis).toHaveProperty('bookType')

    // 验证 techStack 结构
    expect(analysis.techStack).toHaveProperty('framework')
    expect(analysis.techStack).toHaveProperty('packageManager')
    expect(analysis.techStack).toHaveProperty('dependencies')
    expect(analysis.techStack).toHaveProperty('devDependencies')

    // 验证 structure 结构
    expect(analysis.structure).toHaveProperty('type')
    expect(analysis.structure).toHaveProperty('docsPath')
  })
})
