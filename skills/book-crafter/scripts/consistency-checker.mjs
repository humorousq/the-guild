import { Logger } from '../utils/logger.mjs'

export class ConsistencyChecker {
  constructor(envManager) {
    this.envManager = envManager
    this.logger = new Logger()
  }

  /**
   * 检查 Node.js 版本一致性
   * @param {string} localVersion - 本地 Node.js 版本
   * @param {string} actionsVersion - GitHub Actions 使用的 Node.js 版本
   * @returns {Object} 检查结果
   */
  checkNodeVersionMatch(localVersion, actionsVersion) {
    const match = this.envManager.versionsMatch(localVersion, actionsVersion)
    const result = {
      match,
      local: localVersion,
      actions: actionsVersion,
      issues: []
    }

    if (!match) {
      result.issues.push({
        type: 'node-version-mismatch',
        severity: 'high',
        message: `本地 Node.js ${localVersion} 与 Actions ${actionsVersion} 不匹配`,
        fix: `更新 Actions 使用 node-version: ${localVersion.replace('v', '')}`
      })
    }

    return result
  }

  /**
   * 检查 lock 文件
   * @param {boolean} hasLockFile - 是否存在 lock 文件
   * @returns {Object} 检查结果
   */
  checkLockFile(hasLockFile) {
    const result = {
      hasLockFile,
      issues: []
    }

    if (!hasLockFile) {
      result.issues.push({
        type: 'missing-lock-file',
        severity: 'high',
        message: '项目缺少 package-lock.json 文件，可能导致依赖版本不一致',
        fix: '运行 npm install 生成 package-lock.json'
      })
    }

    return result
  }

  /**
   * 检查平台依赖同步
   * @param {string} localPlatform - 本地平台
   * @param {string} localArch - 本地架构
   * @param {boolean} actionsHasLinuxDep - Actions 是否有 Linux 依赖
   * @returns {Object} 检查结果
   */
  checkPlatformDeps(localPlatform, localArch, actionsHasLinuxDep) {
    const isLinuxLocal = localPlatform === 'linux'
    const synced = isLinuxLocal === actionsHasLinuxDep

    const result = {
      localPlatform,
      localArch,
      actionsHasLinuxDep,
      synced,
      issues: []
    }

    if (!synced) {
      if (isLinuxLocal && !actionsHasLinuxDep) {
        result.issues.push({
          type: 'platform-deps-mismatch',
          severity: 'medium',
          message: '本地是 Linux 环境，但 Actions 未安装 Linux 特定依赖',
          fix: '在 package.json 中添加 optionalDependencies'
        })
      } else if (!isLinuxLocal && actionsHasLinuxDep) {
        result.issues.push({
          type: 'platform-deps-mismatch',
          severity: 'medium',
          message: `本地是 ${localPlatform} 环境，但 Actions 安装了 Linux 特定依赖`,
          fix: '确保本地开发环境和 CI 环境使用相同的依赖策略'
        })
      }
    }

    return result
  }

  /**
   * 完整一致性检查
   * @param {string} projectPath - 项目路径
   * @param {string} workflowPath - workflow 文件路径（可选）
   * @returns {Object} 完整检查结果
   */
  async checkFull(projectPath, workflowPath) {
    const results = {
      nodeVersion: null,
      lockFile: null,
      platformDeps: null,
      allIssues: [],
      hasIssues: false
    }

    // 检测本地环境
    const localEnv = await this.envManager.detectLocal(projectPath)

    // 检查 Node.js 版本
    if (workflowPath) {
      const actionsVersion = await this.envManager.extractActionsNodeVersion(workflowPath)
      if (actionsVersion) {
        results.nodeVersion = this.checkNodeVersionMatch(
          localEnv.nodeVersion,
          actionsVersion
        )
        results.allIssues.push(...results.nodeVersion.issues)
      }
    }

    // 检查 lock 文件
    const hasLockFile = this.envManager.hasLockFile(projectPath)
    results.lockFile = this.checkLockFile(hasLockFile)
    results.allIssues.push(...results.lockFile.issues)

    // 检查平台依赖（Actions 总是运行在 Linux 环境）
    results.platformDeps = this.checkPlatformDeps(
      localEnv.platform,
      localEnv.arch,
      true // Actions 环境总是需要 Linux 依赖
    )
    results.allIssues.push(...results.platformDeps.issues)

    results.hasIssues = results.allIssues.length > 0

    return results
  }
}
