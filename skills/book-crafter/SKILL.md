# Book Crafter Skill

name: book-crafter
description: 创建技术书籍并部署到 GitHub Pages

---

## 概览

Book Crafter 是一个 AI 驱动的技能，帮助您从各种来源创建技术书籍，并自动部署到 GitHub Pages。它支持分析现有书籍项目、创建新的书籍结构、生成 PDF 文件，并确保本地和 CI 环境的一致性。

## 何时使用

使用此技能当您需要：

- 从 GitHub 仓库创建技术书籍
- 从本地 Markdown 文件创建书籍
- 分析现有书籍项目结构
- 部署书籍到 GitHub Pages
- 生成 PDF 版本的书籍
- 确保开发环境和 CI 环境一致性

## 工作流程

### 1. 输入检测

```bash
/book-crafter https://github.com/owner/repo
# 或
/book-crafter /path/to/local/project
```

### 2. 环境一致性检查

技能会自动检查：
- Node.js 版本是否与 GitHub Actions 匹配
- 是否存在 package-lock.json 文件
- 平台依赖是否正确配置

### 3. 参考源分析

分析现有项目：
- 检测技术栈（VitePress、Docusaurus 等）
- 分析书籍结构
- 提取章节信息
- 检测语言

### 4. 部署与发布

- 自动部署到 GitHub Pages
- 支持生成 PDF 版本
- 版本发布管理

## 快速参考

### 命令格式

```bash
# 从 GitHub 创建书籍
/book-crafter https://github.com/{owner}/{repo}

# 从本地路径创建书籍
/book-crafter /path/to/project

# 使用特定模板
/book-crafter --template vitepress-flat https://github.com/owner/repo
```

### 可用模板

| 模板名称 | 描述 |
|---------|------|
| `vitepress-flat` | 扁平结构的 VitePress 项目 |
| `vitepress-multipart` | 多部分结构的 VitePress 项目 |

### 环境要求

- Node.js 22.13.0（推荐）
- npm 或 pnpm
- Git

## 关键特性

### 环境一致性检查

自动检测并提示以下问题：
- 本地与 CI 环境的 Node.js 版本不匹配
- 缺少 lock 文件
- 平台特定依赖问题

### 智能结构分析

- 自动检测书籍类型
- 提取章节标题和结构
- 支持多种文档框架

### 一键部署

- 自动配置 GitHub Actions
- 部署到 GitHub Pages
- 支持 PDF 生成

## 环境一致性

为确保本地开发和 CI 环境一致，建议：

1. **固定 Node.js 版本**

   在 GitHub Actions workflow 中指定：
   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '22.13.0'
   ```

2. **提交 lock 文件**

   始终提交 `package-lock.json` 以确保依赖版本一致。

3. **平台依赖**

   如果使用原生依赖，确保在 package.json 中正确配置 optionalDependencies。

## 常见问题

### Q: 为什么本地构建成功但 CI 失败？

A: 通常是环境不一致导致。请检查：
1. Node.js 版本是否一致
2. 是否提交了 package-lock.json
3. 平台特定依赖是否正确配置

### Q: 如何修复 Node.js 版本不匹配？

A: 更新 GitHub Actions workflow 中的 `node-version` 配置：
```yaml
node-version: '22.13.0'  # 与本地版本一致
```

### Q: PDF 生成失败怎么办？

A: PDF 生成依赖于正确安装的依赖。请检查：
1. 是否安装了所有必需依赖
2. 构建过程是否成功
3. 查看 `scripts/generate-pdf.mjs` 脚本配置
