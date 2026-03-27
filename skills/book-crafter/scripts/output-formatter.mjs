export class OutputFormatter {
  formatWorkflowState(state) {
    const completed = Object.values(state.stages)
      .filter(s => s.status === 'completed').length

    console.log(`
📊 当前状态: 阶段 ${state.currentStage}/6
   ${state.stages[state.currentStage]?.name || '未知'}

✅ 已完成: ${completed}/6
    `)
  }

  formatAnalysisResult(analysis) {
    console.log(`
📚 分析结果:
   书名: ${analysis.title}
   类型: ${analysis.bookType}
   章节数: ${analysis.chapters.length}

📊 分析建议:
   发现 ${analysis.chapters.length} 个潜在章节
   建议按以下方式组织:
${analysis.chapters.map((ch, i) => `   ${i+1}. ${ch.title}`).join('\n')}
    `)
  }

  formatBrowserCacheTip() {
    console.log(`
⚠️  重要提示：
   如果浏览器显示空白或 404，请：
   1. 按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+F5 (Windows) 强制刷新
   2. 或使用浏览器的隐私/无痕模式访问
    `)
  }

  formatValidationResult(result) {
    if (result.valid) {
      this.success('配置验证通过')
      return
    }

    console.log(`\n🔍 配置验证报告\n`)

    if (result.errors.length > 0) {
      console.log(`❌ 发现 ${result.errors.length} 个错误:`)
      result.errors.forEach((err, i) => {
        console.log(`  ${i+1}. ${err.message}`)
      })
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  发现 ${result.warnings.length} 个警告:`)
      result.warnings.forEach((warn, i) => {
        console.log(`  ${i+1}. ${warn.message}`)
      })
    }
  }

  success(message) {
    console.log(`\n✅ ${message}\n`)
  }

  warn(message) {
    console.log(`⚠️  ${message}`)
  }

  error(message) {
    console.log(`❌ ${message}`)
  }

  info(message) {
    console.log(`ℹ️  ${message}`)
  }

  step(number, total, message) {
    console.log(`\n📍 步骤 ${number}/${total}: ${message}`)
  }
}
