import chalk from 'chalk'

/**
 * Logger 工具类 - 提供统一的日志输出接口
 */
export class Logger {
  /**
   * 记录信息消息
   * @param {string} message - 要记录的消息
   */
  info(message) {
    if (message === null || message === undefined) {
      message = ''
    }
    console.log(chalk.blue(String(message)))
  }

  /**
   * 记录成功消息
   * @param {string} message - 要记录的消息
   */
  success(message) {
    if (message === null || message === undefined) {
      message = ''
    }
    console.log(chalk.green(`✓ ${String(message)}`))
  }

  /**
   * 记录错误消息
   * @param {string} message - 要记录的消息
   */
  error(message) {
    if (message === null || message === undefined) {
      message = ''
    }
    console.error(chalk.red(`✗ ${String(message)}`))
  }

  /**
   * 记录警告消息
   * @param {string} message - 要记录的消息
   */
  warn(message) {
    if (message === null || message === undefined) {
      message = ''
    }
    console.warn(chalk.yellow(`⚠ ${String(message)}`))
  }

  /**
   * 记录章节标题
   * @param {string} title - 章节标题
   */
  section(title) {
    if (title === null || title === undefined) {
      title = ''
    }
    console.log()
    console.log(chalk.bold(String(title)))
    console.log(chalk.gray('━'.repeat(40)))
  }

  /**
   * 记录步骤进度
   * @param {number} stepNumber - 当前步骤编号
   * @param {number} total - 总步骤数
   * @param {string} message - 步骤描述消息
   */
  step(stepNumber, total, message) {
    if (message === null || message === undefined) {
      message = ''
    }
    console.log(chalk.gray(`[${stepNumber}/${total}]`), String(message))
  }
}
