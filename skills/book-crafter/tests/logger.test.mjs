import { Logger } from '../utils/logger.mjs'

describe('Logger', () => {
  let logger
  let consoleOutput
  let originalLog
  let originalError
  let originalWarn

  beforeEach(() => {
    consoleOutput = []
    logger = new Logger()
    // 保存原始 console 方法
    originalLog = console.log
    originalError = console.error
    originalWarn = console.warn
    // Mock console 方法
    console.log = (...args) => consoleOutput.push(['log', ...args])
    console.error = (...args) => consoleOutput.push(['error', ...args])
    console.warn = (...args) => consoleOutput.push(['warn', ...args])
  })

  afterEach(() => {
    // 恢复 console 方法
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn
  })

  test('应该记录信息消息', () => {
    logger.info('测试消息')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][0]).toBe('log')
    expect(consoleOutput[0][1]).toContain('测试消息')
  })

  test('应该记录错误消息', () => {
    logger.error('错误消息')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][0]).toBe('error')
  })

  test('应该用勾号记录成功消息', () => {
    logger.success('操作成功')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][1]).toContain('✓')
  })

  test('应该格式化章节标题', () => {
    logger.section('章节标题')
    expect(consoleOutput).toHaveLength(3) // 空行、标题、分隔符
  })

  test('应该记录警告消息', () => {
    logger.warn('警告消息')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][0]).toBe('warn')
    expect(consoleOutput[0][1]).toContain('⚠')
  })

  test('应该格式化步骤进度', () => {
    logger.step(2, 5, '处理中')
    expect(consoleOutput).toHaveLength(1)
    expect(consoleOutput[0][0]).toBe('log')
    expect(consoleOutput[0][1]).toContain('[2/5]')
    expect(consoleOutput[0][2]).toBe('处理中')
  })

  test('应该处理空字符串输入', () => {
    expect(() => logger.info('')).not.toThrow()
    expect(() => logger.success('')).not.toThrow()
    expect(() => logger.error('')).not.toThrow()
    expect(() => logger.warn('')).not.toThrow()
    expect(() => logger.section('')).not.toThrow()
    expect(() => logger.step(1, 1, '')).not.toThrow()
  })

  test('应该处理 null 输入而不抛出异常', () => {
    expect(() => logger.info(null)).not.toThrow()
    expect(() => logger.success(null)).not.toThrow()
    expect(() => logger.error(null)).not.toThrow()
    expect(() => logger.warn(null)).not.toThrow()
    expect(() => logger.section(null)).not.toThrow()
    expect(() => logger.step(1, 1, null)).not.toThrow()
  })
})
