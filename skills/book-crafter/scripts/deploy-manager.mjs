import { execSync } from 'child_process'
import path from 'path'
import { Logger } from '../utils/logger.mjs'
import simpleGit from 'simple-git'

export class DeployManager {
  #projectPath
  #logger
  #git

  constructor(projectPath) {
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('projectPath 必须是非空字符串')
    }

    this.#projectPath = projectPath
    this.#logger = new Logger()
    this.#git = simpleGit(projectPath)
  }

  /**
   * 初始化 Git 仓库
   */
  async initGit() {
    this.#logger.section('初始化 Git 仓库')

    // 检查是否已经是 Git 仓库
    const isRepo = await this.#git.checkIsRepo()

    if (!isRepo) {
      await this.#git.init()
      this.#logger.success('Git 仓库初始化完成')
    } else {
      this.#logger.info('Git 仓库已存在')
    }
  }

  /**
   * 提交更改
   */
  async commit(message) {
    try {
      await this.#git.add('.')
      await this.#git.commit(message)

      this.#logger.success(`提交成功: ${message}`)

      return { success: true }
    } catch (error) {
      this.#logger.error(`提交失败: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  /**
   * 检查 GitHub CLI 可用性
   */
  async checkGitHubCLI() {
    try {
      execSync('gh --version', { encoding: 'utf-8' })
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser() {
    try {
      const result = execSync('gh api user --jq .login', { encoding: 'utf-8' })
      return result.trim()
    } catch (error) {
      this.#logger.error('无法获取 GitHub 用户信息')
      throw new Error('请确保已安装并登录 GitHub CLI: gh auth login')
    }
  }

  /**
   * 创建 GitHub 仓库
   */
  async createGitHubRepo(repoName, options = {}) {
    this.#logger.section('创建 GitHub 仓库')

    // 检查 CLI
    const cliAvailable = await this.checkGitHubCLI()
    if (!cliAvailable) {
      throw new Error('GitHub CLI 未安装或不可用')
    }

    // 获取当前用户
    const user = await this.getCurrentUser()

    // 创建仓库
    const visibility = options.private ? '--private' : '--public'
    const cmd = `gh repo create ${repoName} ${visibility} --source=. --remote=origin`

    try {
      execSync(cmd, { cwd: this.#projectPath, encoding: 'utf-8', stdio: 'pipe' })
      this.#logger.success(`仓库创建成功: ${user}/${repoName}`)

      return {
        success: true,
        url: `https://github.com/${user}/${repoName}`
      }
    } catch (error) {
      this.#logger.error(`仓库创建失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 推送到远程
   */
  async push() {
    try {
      await this.#git.push('origin', 'main', { '-u': null })
      this.#logger.success('推送成功')

      return { success: true }
    } catch (error) {
      this.#logger.error(`推送失败: ${error.message}`)
      throw error
    }
  }
}
