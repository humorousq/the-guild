import { InputDetector } from '../scripts/input-detector.mjs'

describe('InputDetector', () => {
  let detector

  beforeEach(() => {
    detector = new InputDetector()
  })

  test('应该检测 GitHub URL', () => {
    const result = detector.detect('https://github.com/user/repo')
    expect(result.type).toBe('github')
    expect(result.url).toBe('https://github.com/user/repo')
    expect(result.owner).toBe('user')
    expect(result.repo).toBe('repo')
  })

  test('应该拒绝不完整的 GitHub URL', () => {
    expect(() => detector.detect('https://github.com/')).toThrow('无效的 GitHub URL 格式')
    expect(() => detector.detect('https://github.com/only-owner')).toThrow('无效的 GitHub URL 格式')
  })

  test('应该检测带波浪号的本地路径', () => {
    const result = detector.detect('~/Github/my-project')
    expect(result.type).toBe('local')
    expect(result.path).toContain('/Users/')
  })

  test('应该正确处理路径中包含波浪号字符的情况', () => {
    // 路径中包含 ~ 字符时，只有开头的 ~ 应该被替换
    const result = detector.detect('~/project~backup')
    expect(result.type).toBe('local')
    expect(result.path).toMatch(/\/Users\/[^/]+\/project~backup$/)
    // 确保 ~ 在路径中间时没有被错误替换
    expect(result.path).toContain('~backup')
  })

  test('应该检测绝对路径', () => {
    const result = detector.detect('/Users/test/project')
    expect(result.type).toBe('local')
    expect(result.path).toBe('/Users/test/project')
  })

  test('应该检测相对路径', () => {
    const result = detector.detect('./my-project')
    expect(result.type).toBe('local')
  })

  test('应该在输入无效时抛出错误', () => {
    expect(() => detector.detect('invalid-input')).toThrow()
  })
})
