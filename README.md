# 🏰 The Guild - AI 技能工坊

<div align="center">

**让 AI 成为你的数字工匠**

每个技能都是独立的工匠，帮你完成特定的创作任务

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.13.0-brightgreen.svg)](https://nodejs.org)

</div>

---

## 💡 我们的愿景

The Guild 致力于打造一个**开放的 AI 技能生态系统**：

- 🎯 **专业化** - 每个技能专注做好一件事
- 🤝 **协作化** - 人机协作，你主导，AI 辅助
- 🔌 **可扩展** - 社区可以贡献新技能
- 🔄 **可恢复** - 工作流有状态，中断后可继续

**任何能通过 AI 辅助完成的创作任务，都可以成为一个 Guild 技能。**

---

## 📚 技能目录

### 📖 Book Crafter - 书籍工匠

> 从代码仓库到精美书籍，AI 助你一臂之力

**功能**：
- 分析 GitHub 项目或本地代码库
- 自动生成 VitePress 书籍项目
- AI 辅助内容创作
- 一键部署到 GitHub Pages

**状态**: ✅ 生产可用

**文档**: [完整使用指南](skills/book-crafter/SKILL.md)

**快速开始**:
```bash
git clone https://github.com/humorousq/the-guild.git
cd the-guild/skills/book-crafter
npm install
node scripts/cli.mjs init
```

---

**更多技能开发中...**

---

## 🤝 贡献技能

我们欢迎社区贡献新技能！每个技能都是一个独立模块：

```
skills/
├── your-skill-name/
│   ├── SKILL.md          # 技能文档
│   ├── scripts/          # 核心脚本
│   ├── tests/            # 测试
│   ├── templates/        # 模板（如需要）
│   └── package.json      # 依赖
```

**贡献流程**：
1. Fork 本仓库
2. 在 `skills/` 下创建你的技能
3. 编写完整文档和测试
4. 提交 Pull Request

---

## 📋 核心原则

每个 Guild 技能都遵循：

- ✅ **单一职责** - 只做一件事，做到极致
- ✅ **人机协作** - AI 建议，用户确认
- ✅ **状态管理** - 工作流可中断、可恢复
- ✅ **完整测试** - 确保质量
- ✅ **清晰文档** - 开箱即用

---

## 📄 许可证

[MIT](LICENSE)

---

<div align="center">

**选择一个技能，开始创作之旅**

</div>
