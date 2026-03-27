import { jest } from '@jest/globals'
import { OutputFormatter } from '../scripts/output-formatter.mjs'

describe('OutputFormatter 测试', () => {
  let formatter
  let logSpy

  beforeEach(() => {
    formatter = new OutputFormatter()
    logSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  test('应该正确格式化工作流状态', () => {
    const state = {
      currentStage: 3,
      stages: {
        '1': { name: '初始化', status: 'completed' },
        '2': { name: '分析', status: 'completed' },
        '3': { name: '生成', status: 'pending' },
        '4': { name: '配置', status: 'pending' },
        '5': { name: '创作', status: 'pending' },
        '6': { name: '部署', status: 'pending' }
      }
    }

    formatter.formatWorkflowState(state)

    const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
    expect(output).toContain('阶段 3/6')
    expect(output).toContain('已完成: 2/6')
  })

  test('应该正确格式化分析结果', () => {
    const analysis = {
      title: 'Test Book',
      bookType: 'documentation',
      chapters: [
        { title: 'Chapter 1' },
        { title: 'Chapter 2' }
      ]
    }

    formatter.formatAnalysisResult(analysis)

    const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
    expect(output).toContain('Test Book')
    expect(output).toContain('2 个潜在章节')
  })

  test('应该生成浏览器缓存提示', () => {
    formatter.formatBrowserCacheTip()

    const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
    expect(output).toContain('Cmd+Shift+R')
    expect(output).toContain('Ctrl+Shift+F5')
  })

  test('应该格式化成功的验证结果', () => {
    const result = { valid: true, errors: [], warnings: [] }
    formatter.formatValidationResult(result)

    const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
    expect(output).toContain('✅')
  })

  test('应该格式化失败的验证结果', () => {
    const result = {
      valid: false,
      errors: [{ message: 'Error 1' }],
      warnings: [{ message: 'Warning 1' }]
    }
    formatter.formatValidationResult(result)

    const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
    expect(output).toContain('❌')
  })

  test('应该输出成功消息', () => {
    formatter.success('操作成功')
    const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
    expect(output).toContain('✅ 操作成功')
  })

  test('应该输出警告消息', () => {
    formatter.warn('警告信息')
    const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
    expect(output).toContain('⚠️  警告信息')
  })

  test('应该输出错误消息', () => {
    formatter.error('错误信息')
    const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
    expect(output).toContain('❌ 错误信息')
  })

  test('应该输出信息消息', () => {
    formatter.info('提示信息')
    const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
    expect(output).toContain('ℹ️  提示信息')
  })

  test('应该输出步骤消息', () => {
    formatter.step(1, 5, '复制文件')
    const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
    expect(output).toContain('步骤 1/5: 复制文件')
  })

  // 边界情况测试
  describe('边界情况处理', () => {
    test('formatWorkflowState 应该处理 null 输入', () => {
      expect(() => formatter.formatWorkflowState(null)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('formatWorkflowState 应该处理 undefined 输入', () => {
      expect(() => formatter.formatWorkflowState(undefined)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('formatWorkflowState 应该处理缺失 stages 属性', () => {
      expect(() => formatter.formatWorkflowState({ currentStage: 1 })).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('formatAnalysisResult 应该处理 null 输入', () => {
      expect(() => formatter.formatAnalysisResult(null)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('formatAnalysisResult 应该处理 undefined 输入', () => {
      expect(() => formatter.formatAnalysisResult(undefined)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('formatAnalysisResult 应该处理缺失 chapters 属性', () => {
      expect(() => formatter.formatAnalysisResult({ title: 'Test', bookType: 'doc' })).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('formatAnalysisResult 应该处理空 chapters 数组', () => {
      const analysis = {
        title: 'Test Book',
        bookType: 'documentation',
        chapters: []
      }

      expect(() => formatter.formatAnalysisResult(analysis)).not.toThrow()
      const output = logSpy.mock.calls.map(call => call.join(' ')).join(' ')
      expect(output).toContain('0 个潜在章节')
    })

    test('formatValidationResult 应该处理 null 输入', () => {
      expect(() => formatter.formatValidationResult(null)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('formatValidationResult 应该处理 undefined 输入', () => {
      expect(() => formatter.formatValidationResult(undefined)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('success 应该处理 null 消息', () => {
      expect(() => formatter.success(null)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('success 应该处理 undefined 消息', () => {
      expect(() => formatter.success(undefined)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('warn 应该处理 null 消息', () => {
      expect(() => formatter.warn(null)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('error 应该处理 null 消息', () => {
      expect(() => formatter.error(null)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('info 应该处理 null 消息', () => {
      expect(() => formatter.info(null)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })

    test('step 应该处理 null 消息', () => {
      expect(() => formatter.step(1, 5, null)).not.toThrow()
      expect(logSpy).toHaveBeenCalled()
    })
  })
})
