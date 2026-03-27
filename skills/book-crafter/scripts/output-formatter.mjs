/**
 * OutputFormatter 类 - 提供统一的输出格式化接口
 * 负责将各种数据格式化为用户友好的控制台输出
 */
export class OutputFormatter {
  /**
   * 格式化工作流状态
   * @param {Object} state - 工作流状态对象
   * @param {number} state.currentStage - 当前阶段编号
   * @param {Object} state.stages - 阶段信息映射表
   */
  formatWorkflowState(state) {
    if (!state || !state.stages) {
      console.log('\n📊 无法显示状态信息\n')
      return
    }

    const completed = Object.values(state.stages)
      .filter(s => s.status === 'completed').length

    console.log(`
📊 当前状态: 阶段 ${state.currentStage}/6
   ${state.stages[state.currentStage]?.name || '未知'}

✅ 已完成: ${completed}/6
    `)
  }

  /**
   * 格式化分析结果
   * @param {Object} analysis - 分析结果对象
   * @param {string} analysis.title - 书名
   * @param {string} analysis.bookType - 书籍类型
   * @param {Array} analysis.chapters - 章节数组
   */
  formatAnalysisResult(analysis) {
    if (!analysis) {
      console.log('\n📚 无法显示分析结果\n')
      return
    }

    const chapters = analysis.chapters || []
    const title = analysis.title || '未知书名'
    const bookType = analysis.bookType || '未知类型'

    console.log(`
📚 分析结果:
   书名: ${title}
   类型: ${bookType}
   章节数: ${chapters.length}

📊 分析建议:
   发现 ${chapters.length} 个潜在章节
   建议按以下方式组织:
${chapters.map((ch, i) => `   ${i+1}. ${ch.title || '未命名章节'}`).join('\n')}
    `)
  }

  /**
   * 生成浏览器缓存提示
   */
  formatBrowserCacheTip() {
    console.log(`
⚠️  重要提示：
   如果浏览器显示空白或 404，请：
   1. 按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+F5 (Windows) 强制刷新
   2. 或使用浏览器的隐私/无痕模式访问
    `)
  }

  /**
   * 格式化验证结果
   * @param {Object} result - 验证结果对象
   * @param {boolean} result.valid - 是否验证通过
   * @param {Array} result.errors - 错误列表
   * @param {Array} result.warnings - 警告列表
   */
  formatValidationResult(result) {
    if (!result) {
      this.warn('无法显示验证结果')
      return
    }

    if (result.valid) {
      this.success('配置验证通过')
      return
    }

    const errors = result.errors || []
    const warnings = result.warnings || []

    console.log(`\n🔍 配置验证报告\n`)

    if (errors.length > 0) {
      console.log(`❌ 发现 ${errors.length} 个错误:`)
      errors.forEach((err, i) => {
        console.log(`  ${i+1}. ${err.message || '未知错误'}`)
      })
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️  发现 ${warnings.length} 个警告:`)
      warnings.forEach((warn, i) => {
        console.log(`  ${i+1}. ${warn.message || '未知警告'}`)
      })
    }
  }

  /**
   * 输出成功消息
   * @param {string} message - 要输出的消息
   */
  success(message) {
    if (message === null || message === undefined) {
      message = ''
    }
    console.log(`\n✅ ${String(message)}\n`)
  }

  /**
   * 输出警告消息
   * @param {string} message - 要输出的消息
   */
  warn(message) {
    if (message === null || message === undefined) {
      message = ''
    }
    console.log(`⚠️  ${String(message)}`)
  }

  /**
   * 输出错误消息
   * @param {string} message - 要输出的消息
   */
  error(message) {
    if (message === null || message === undefined) {
      message = ''
    }
    console.log(`❌ ${String(message)}`)
  }

  /**
   * 输出信息消息
   * @param {string} message - 要输出的消息
   */
  info(message) {
    if (message === null || message === undefined) {
      message = ''
    }
    console.log(`ℹ️  ${String(message)}`)
  }

  /**
   * 输出步骤进度消息
   * @param {number} number - 当前步骤编号
   * @param {number} total - 总步骤数
   * @param {string} message - 步骤描述消息
   */
  step(number, total, message) {
    if (message === null || message === undefined) {
      message = ''
    }
    console.log(`\n📍 步骤 ${number}/${total}: ${String(message)}`)
  }
}
