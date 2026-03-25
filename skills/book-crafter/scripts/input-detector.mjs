import path from 'path'
import os from 'os'
import fs from 'fs'

export class InputDetector {
  /**
   * 检测输入类型并返回规范化结果
   */
  detect(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('无效输入：必须是非空字符串')
    }

    // GitHub URL 检测
    if (input.startsWith('https://github.com/')) {
      // 验证格式：https://github.com/{owner}/{repo}
      const match = input.match(/^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)(\/|$)/)
      if (!match) {
        throw new Error('无效的 GitHub URL 格式，期望：https://github.com/{owner}/{repo}')
      }
      return {
        type: 'github',
        url: input,
        owner: match[1],
        repo: match[2],
        action: 'clone'
      }
    }

    // 本地路径检测
    if (this.isLocalPath(input)) {
      const expandedPath = this.expandPath(input)

      return {
        type: 'local',
        path: expandedPath,
        exists: fs.existsSync(expandedPath),
        action: 'read'
      }
    }

    throw new Error(`无法检测输入类型：${input}`)
  }

  /**
   * 检查是否为本地路径
   */
  isLocalPath(input) {
    return input.startsWith('/') ||
           input.startsWith('~') ||
           input.startsWith('./') ||
           input.startsWith('../')
  }

  /**
   * 展开路径（处理 ~, ., ..）
   */
  expandPath(inputPath) {
    if (inputPath.startsWith('~')) {
      return inputPath.replace(/^~/, os.homedir())  // 使用 ^ 确保只匹配开头
    }
    return path.resolve(inputPath)
  }
}
