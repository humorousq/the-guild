import path from 'path'
import { ReferenceAnalyzer } from '../scripts/reference-analyzer.mjs'

describe('ReferenceAnalyzer', () => {
  let analyzer
  const sampleBookPath = path.join(process.cwd(), 'tests/fixtures/sample-book')

  beforeEach(() => {
    analyzer = new ReferenceAnalyzer()
  })

  test('应该分析书籍结构', async () => {
    const analysis = await analyzer.analyze(sampleBookPath)

    expect(analysis).toBeDefined()
    expect(analysis.path).toBe(sampleBookPath)
    expect(analysis.structure).toBeDefined()
    expect(analysis.techStack).toBeDefined()
  })

  test('应该检测 VitePress 技术栈', async () => {
    const techStack = await analyzer.detectTechStack(sampleBookPath)

    expect(techStack).toBeDefined()
    expect(techStack.framework).toBe('vitepress')
    expect(techStack.packageManager).toBeDefined()
  })

  test('应该检测扁平结构', async () => {
    const structure = await analyzer.analyzeStructure(sampleBookPath)

    expect(structure).toBeDefined()
    expect(structure.type).toBe('flat')
    expect(structure.docsPath).toContain('docs')
  })

  test('应该提取章节', async () => {
    const chapters = await analyzer.findChapters(sampleBookPath)

    expect(chapters).toBeDefined()
    expect(chapters.length).toBeGreaterThan(0)
    expect(chapters[0]).toHaveProperty('path')
    expect(chapters[0]).toHaveProperty('title')
  })
})