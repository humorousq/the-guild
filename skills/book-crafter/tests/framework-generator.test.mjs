import { FrameworkGenerator } from '../scripts/framework-generator.mjs'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('FrameworkGenerator', () => {
  let generator
  let tempDir
  let mockAnalysis

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-crafter-test-'))
    mockAnalysis = {
      title: 'Test Book',
      description: 'This is a test book',
      chapters: [
        { number: 1, title: '第一章', file: 'chapter-01.md' },
        { number: 2, title: '第二章', file: 'chapter-02.md' }
      ]
    }
    generator = new FrameworkGenerator(tempDir, mockAnalysis)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('应该复制模板文件', async () => {
    await generator.generate()

    // 检查基础文件存在
    expect(fs.existsSync(path.join(tempDir, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs', '.vitepress', 'config.mts'))).toBe(true)
  })

  test('应该替换占位符', async () => {
    await generator.generate()

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(tempDir, 'package.json'), 'utf-8')
    )
    expect(packageJson.name).toBe('test-book')
  })

  test('应该生成章节文件', async () => {
    await generator.generate()

    expect(fs.existsSync(path.join(tempDir, 'docs', 'chapter-01.md'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'docs', 'chapter-02.md'))).toBe(true)
  })

  test('应该配置 VitePress', async () => {
    await generator.generate()

    const configPath = path.join(tempDir, 'docs', '.vitepress', 'config.mts')
    const config = fs.readFileSync(configPath, 'utf-8')
    expect(config).toContain('Test Book')
  })

  test('应该处理中文标题并使用默认名称', async () => {
    const chineseAnalysis = {
      title: '测试书籍',
      description: '中文描述',
      chapters: [
        { number: 1, title: '第一章', file: 'chapter-01.md' }
      ]
    }
    const chineseGenerator = new FrameworkGenerator(tempDir, chineseAnalysis)
    await chineseGenerator.generate()

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(tempDir, 'package.json'), 'utf-8')
    )
    // 应该生成有效的 npm 包名（仅 ASCII 字符）
    expect(packageJson.name).toBe('my-book')
    expect(/^[a-z0-9\-_]+$/.test(packageJson.name)).toBe(true)
  })

  test('应该拒绝空章节数组', () => {
    const invalidAnalysis = {
      title: 'Test Book',
      description: 'Test',
      chapters: []
    }
    expect(() => new FrameworkGenerator(tempDir, invalidAnalysis))
      .toThrow('analysis.chapters 必须是非空数组')
  })
})
