---
layout: doc
---

# My Book

欢迎使用 VitePress 创建的技术书籍。

## 关于本书

这是一本使用 Book Crafter Skill 创建的技术书籍。它提供了：

- 清晰的文档结构
- 响应式设计
- 搜索功能
- 暗色主题支持
- Mermaid 图表支持

## 快速开始

1. 克隆仓库
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run docs:dev`

## 部署到 GitHub Pages

1. 构建项目：
   ```bash
   npm run docs:build
   ```

2. 部署到 GitHub Pages：
   ```bash
   npm run deploy
   ```

3. 在 GitHub 仓库设置中：
   - Settings > Pages
   - Source: Deploy from a branch
   - Branch: gh-pages
   - 点击 Save

4. 访问网站：
   ```
   https://[用户名].github.io/[仓库名]/
   ```

## 更新书籍

每次修改内容后：
```bash
npm run docs:build
npm run deploy
```

## 目录

请使用侧边栏导航浏览章节。
