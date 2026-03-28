import { exec as execCallback, execSync } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { Logger } from '../utils/logger.mjs'
import simpleGit from 'simple-git'

const execAsync = promisify(execCallback)

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

  /**
   * 部署到 GitHub Pages
   * @returns {Promise<boolean>} 部署是否成功
   */
  async deployToGitHubPages() {
    this.#logger.section('部署到 GitHub Pages')

    // 1. 检查是否已构建
    const distPath = path.join(this.#projectPath, 'docs', '.vitepress', 'dist')
    try {
      await fs.access(distPath)
    } catch {
      this.#logger.error('请先运行 npm run docs:build 构建项目')
      return false
    }

    // 2. 检查 package.json
    const pkgPath = path.join(this.#projectPath, 'package.json')
    let pkg
    try {
      pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'))
    } catch {
      this.#logger.error('无法读取 package.json')
      return false
    }

    // 3. 检查 deploy 脚本
    if (!pkg.scripts?.deploy) {
      this.#logger.error('package.json 缺少 deploy 脚本')
      this.#logger.info('请添加: "deploy": "gh-pages -d docs/.vitepress/dist"')
      return false
    }

    // 4. 检查 gh-pages 依赖
    if (!pkg.devDependencies?.['gh-pages']) {
      this.#logger.error('缺少 gh-pages 依赖')
      this.#logger.info('请运行: npm install --save-dev gh-pages')
      return false
    }

    // 5. 检查 Git 仓库
    try {
      await execAsync('git rev-parse --is-inside-work-tree', { cwd: this.#projectPath })
    } catch {
      this.#logger.error('请在 Git 仓库中执行部署')
      this.#logger.info('请运行: git init')
      return false
    }

    // 6. 执行部署
    this.#logger.step(1, 2, '执行 gh-pages 部署')
    try {
      await execAsync('npm run deploy', { cwd: this.#projectPath })
      this.#logger.success('部署成功')
    } catch (error) {
      this.#logger.error(`部署失败: ${error.message}`)

      // 常见错误提示
      if (error.message.includes('ENOENT')) {
        this.#logger.info('可能原因: gh-pages 未安装')
        this.#logger.info('解决方法: npm install --save-dev gh-pages')
      } else if (error.message.includes('permission')) {
        this.#logger.info('可能原因: 权限不足')
        this.#logger.info('解决方法: 检查 Git 配置或使用 SSH')
      }

      return false
    }

    // 7. 提示配置 GitHub Pages
    this.#logger.step(2, 2, '配置 GitHub Pages')
    this.#logger.info('请在 GitHub 仓库设置中配置 Pages:')
    this.#logger.info('  Settings > Pages')
    this.#logger.info('  Source: Deploy from a branch')
    this.#logger.info('  Branch: gh-pages')
    this.#logger.info('  Folder: / (root)')

    return true
  }
}
