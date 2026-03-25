import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { Logger } from '../utils/logger.mjs'

export class EnvironmentManager {
  constructor() {
    this.logger = new Logger()
  }

  /**
   * 检测本地环境
   */
  async detectLocal() {
    return {
      nodeVersion: process.version,
      npmVersion: this.getNpmVersion(),
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd()
    }
  }

  /**
   * 获取 npm 版本
   */
  getNpmVersion() {
    try {
      return execSync('npm --version', { encoding: 'utf-8' }).trim()
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * 检查 Node.js 版本是否匹配
   */
  versionsMatch(local, actions) {
    // 规范化版本（移除 'v' 前缀）
    const normalize = (v) => v.replace(/^v/, '')
    return normalize(local) === normalize(actions)
  }

  /**
   * 获取平台特定的 Rollup 依赖
   */
  getPlatformDeps(platform, arch) {
    const deps = {
      'darwin-arm64': ['@rollup/rollup-darwin-arm64'],
      'darwin-x64': ['@rollup/rollup-darwin-x64'],
      'linux-x64': ['@rollup/rollup-linux-x64-gnu'],
      'win32-x64': ['@rollup/rollup-win32-x64-msvc']
    }

    const key = `${platform}-${arch}`
    return deps[key] || []
  }

  /**
   * 检查 package-lock.json 是否存在
   */
  hasLockFile(projectPath) {
    return fs.existsSync(path.join(projectPath, 'package-lock.json'))
  }

  /**
   * 从 GitHub Actions workflow 提取 Node.js 版本
   */
  async extractActionsNodeVersion(workflowPath) {
    if (!fs.existsSync(workflowPath)) {
      return null
    }

    const content = fs.readFileSync(workflowPath, 'utf-8')
    const match = content.match(/node-version:\s*['"]?([\d.]+)['"]?/)

    return match ? match[1] : null
  }
}
