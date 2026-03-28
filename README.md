# 🏰 The Guild - AI 技能工坊

<div align="center">

**让 AI 成为你的数字工匠**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.13.0-brightgreen.svg)](https://nodejs.org)
[![AI Powered](https://img.shields.io/badge/AI-Powered-ff69b4.svg)](https://anthropic.com)

*从想法到成品，AI 助你一臂之力*

</div>

---

## ✨ 这是什么？

The Guild 是一个 **AI 驱动的技能集合**，每个技能都是一个独立的数字工匠，帮你完成特定的创作任务。

想象一下：你有一个想法，比如"我想写一本技术书籍"，但你不知道从何开始。The Guild 的工匠们会：
- 🎯 规划整个项目
- 🔨 搭建框架
- ✍️ 协助创作内容
- 🚀 帮你发布上线

**最重要的是**：你保持完全控制，AI 只是你的得力助手。

---

## 🛠️ 当前可用技能

### 📚 Book Crafter - 书籍工匠

> **"从代码仓库到精美书籍，只需几步"**

Book Crafter 是我们的第一位工匠，专精于技术书籍创作：

**核心能力**：
- 🔍 **智能分析** - 分析你的 GitHub 项目或本地代码库
- 🏗️ **框架生成** - 自动创建 VitePress 书籍项目
- 🤖 **AI 协作** - 建议章节内容，你确认后采纳
- 🚀 **一键部署** - 自动部署到 GitHub Pages
- 📊 **状态管理** - 中断？恢复？没问题，工作流有记忆

**快速开始**：
```bash
# 创建新书籍
node skills/book-crafter/scripts/cli.mjs init

# 分析你的项目
node skills/book-crafter/scripts/cli.mjs next

# 生成框架
node skills/book-crafter/scripts/cli.mjs next

# 部署上线
node skills/book-crafter/scripts/cli.mjs deploy
```

**示例**：
- 📖 从一个 GitHub 仓库创建技术文档
- 📘 把你的代码库转换成教程书籍
- 📗 为你的 API 创建精美的文档站点

**详细文档**: [Book Crafter 使用指南](skills/book-crafter/SKILL.md)

---

## 🎭 工作原理

每个 Guild 技能都遵循一个核心理念：**人机协作，你主导，AI 辅助**。

```
┌─────────────┐
│  你的想法   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  🤖 AI 分析 & 建议   │
│  (Book Crafter)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  ✋ 你确认 & 调整    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  🚀 自动化执行      │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│  📦 成品     │
└─────────────┘
```

**关键特性**：
- ✅ **有状态工作流** - 中断恢复，永不丢失进度
- ✅ **阶段依赖** - 智能验证，确保每一步都正确
- ✅ **可扩展架构** - 新技能轻松加入
- ✅ **完整测试** - 169 个测试确保质量

---

## 🚀 快速上手

### 安装

```bash
# 克隆仓库
git clone https://github.com/humorousq/the-guild.git
cd the-guild

# 安装依赖
cd skills/book-crafter
npm install
```

### 使用 Book Crafter

```bash
# 1. 初始化项目
node scripts/cli.mjs init

# 2. 查看状态
node scripts/cli.mjs status

# 3. 执行下一步
node scripts/cli.mjs next

# 4. 如果中断了，恢复执行
node scripts/cli.mjs resume

# 5. 部署到 GitHub Pages
node scripts/cli.mjs deploy
```

---

## 🌟 特色功能

### 🎯 智能工作流

6 阶段工作流引擎，每个阶段都是独立的里程碑：

1. **项目初始化** → 创建结构
2. **分析规划** → 理解你的项目
3. **框架生成** → 搭建 VitePress
4. **环境配置** → 安装依赖
5. **内容创作** → AI 辅助写作
6. **部署发布** → 上线展示

### 🔄 状态持久化

工作流被意外中断？别担心：

```json
{
  "currentStage": 3,
  "stages": {
    "1": { "status": "completed", "output": {...} },
    "2": { "status": "completed", "output": {...} },
    "3": { "status": "in_progress" }
  }
}
```

运行 `resume` 命令，从上次中断的地方继续。

### 🤝 AI 协作模式

不是 AI 替你做决定，而是 AI 建议你来选：

```
🤖 AI: "我分析了你的项目，建议分为 5 个章节：
  1. 快速开始
  2. 核心概念
  3. API 参考
  4. 最佳实践
  5. 故障排查

你觉得如何？"

👤 你: "好的，但我想加一个'性能优化'章节"

🤖 AI: "明白了，已添加。现在开始生成内容..."
```

### 📦 开箱即用

生成的书籍项目包含：

- ✅ **README.md** - 项目介绍、在线阅读链接、章节目录
- ✅ **package.json** - 开发脚本、部署命令
- ✅ **VitePress 配置** - 现代化文档主题
- ✅ **Mermaid 支持** - 流程图、时序图
- ✅ **GitHub Pages** - 一键部署配置

---

## 🎨 示例项目

### 使用 Book Crafter 创建的书籍

你可以用 Book Crafter 从任何代码仓库或项目创建技术书籍：

- 📖 **项目文档** - 从你的 GitHub 项目创建用户手册
- 📘 **教程书籍** - 把代码示例转换成教学书籍
- 📗 **API 文档** - 自动化生成 API 参考文档
- 📙 **知识库** - 整理团队知识到结构化文档

---

## 🔮 未来规划

The Guild 正在成长中，未来会有更多工匠加入：

- 🎨 **Course Maker** - 创建在线课程
- 📊 **Data Visualizer** - 自动生成数据可视化报告
- 🎮 **Game Doc Writer** - 游戏文档生成器
- 📝 **Blog Architect** - 博客文章规划与生成

**想贡献新技能？** 欢迎提交 PR！

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **报告问题** - 发现 bug？提交 Issue
2. **建议功能** - 有好想法？开个 Discussion
3. **提交代码** - 修复 bug 或添加功能
4. **完善文档** - 帮助改进文档

### 开发指南

```bash
# Fork 并克隆
git clone https://github.com/your-username/the-guild.git

# 创建特性分支
git checkout -b feature/amazing-feature

# 运行测试
cd skills/book-crafter
npm test

# 提交改动
git commit -m "feat: 添加某个很酷的功能"

# 推送分支
git push origin feature/amazing-feature

# 创建 Pull Request
```

### 代码质量标准

- ✅ 完整的测试覆盖
- ✅ JSDoc 文档注释
- ✅ 遵循现有代码风格
- ✅ 更新相关文档

---

## 📚 文档资源

- **Book Crafter 使用指南**: [skills/book-crafter/SKILL.md](skills/book-crafter/SKILL.md)
- **设计文档**: [docs/superpowers/specs/](docs/superpowers/specs/)
- **实施计划**: [docs/superpowers/plans/](docs/superpowers/plans/)

---

## 📄 许可证

本项目基于 MIT 许可证开源 - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

The Guild 的诞生离不开以下优秀的开源项目：

- [VitePress](https://vitepress.dev/) - 现代化的静态网站生成器
- [gh-pages](https://github.com/tschaub/gh-pages) - GitHub Pages 部署工具
- [Jest](https://jestjs.io/) - JavaScript 测试框架
- [Anthropic Claude](https://anthropic.com) - 强大的 AI 助手

---

## 💬 社区

有问题？想讨论？欢迎：

- 📧 提交 [Issue](https://github.com/humorousq/the-guild/issues)
- 💬 参与 [Discussion](https://github.com/humorousq/the-guild/discussions)

---

<div align="center">

**让 AI 成为你的数字工匠，让创作更轻松**

**[开始使用](skills/book-crafter/SKILL.md) · [报告问题](https://github.com/humorousq/the-guild/issues) · [贡献代码](https://github.com/humorousq/the-guild/pulls)**

---

*Built with ❤️ and 🤖 by The Guild*

</div>
