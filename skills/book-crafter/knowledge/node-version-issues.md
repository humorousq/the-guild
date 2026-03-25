# Node.js 版本问题指南

## 概述

Node.js 版本不一致是导致"本地正常但 CI 失败"的最常见原因之一。本文档详细介绍如何诊断和解决这类问题。

## 常见问题场景

### 场景 1：版本不匹配

**症状：**
- 本地构建成功，GitHub Actions 失败
- 依赖安装行为不同
- 某些 API 行为不一致

**原因：**
本地和 CI 环境使用不同版本的 Node.js。

**解决方案：**

1. 确认本地 Node.js 版本：
   ```bash
   node --version
   # 输出: v22.13.0
   ```

2. 更新 GitHub Actions workflow：
   ```yaml
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '22.13.0'  # 与本地版本一致
             cache: 'npm'
   ```

### 场景 2：未指定版本要求

**症状：**
- 不同开发者使用不同版本
- CI 环境使用默认版本
- 构建结果不可预测

**解决方案：**

在 `package.json` 中添加 `engines` 字段：
```json
{
  "engines": {
    "node": ">=22.13.0",
    "npm": ">=10.0.0"
  },
  "engineStrict": true
}
```

创建 `.nvmrc` 文件：
```
22.13.0
```

### 场景 3：nvm 用户版本切换

**症状：**
- 切换项目后忘记切换 Node.js 版本
- 多个项目需要不同版本

**解决方案：**

使用 `.nvmrc` 自动切换：
```bash
# 在项目根目录创建 .nvmrc
echo "22.13.0" > .nvmrc

# 进入目录时自动切换（需要配置 shell）
cd /path/to/project
# 自动切换到 22.13.0
```

## 最佳实践

### 1. 使用 Volta 或 nvm 管理版本

**Volta（推荐）：**
```bash
# 安装 Volta
curl https://get.volta.sh | bash

# 设置项目 Node.js 版本
volta pin node@22.13.0

# 这会自动更新 package.json
```

**nvm：**
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装特定版本
nvm install 22.13.0

# 使用特定版本
nvm use 22.13.0
```

### 2. CI 配置最佳实践

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.13.0'
          cache: 'npm'  # 启用缓存加速

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
```

### 3. 验证版本一致性

添加验证脚本到 `package.json`：
```json
{
  "scripts": {
    "check:node": "node -e \"if (process.version.slice(1).split('.').map(Number)[0] < 22) { console.error('需要 Node.js 22+'); process.exit(1); }\""
  }
}
```

## 版本选择建议

| Node.js 版本 | 状态 | 推荐用途 |
|-------------|------|---------|
| 22.x (Current) | 活跃开发 | 新项目推荐 |
| 20.x (LTS) | 长期支持 | 生产环境推荐 |
| 18.x (LTS) | 维护阶段 | 遗留项目 |

**推荐：** 使用 Node.js 22.13.0 以获得最新特性和性能优化。

## 故障排查清单

- [ ] 检查本地 `node --version` 输出
- [ ] 检查 GitHub Actions workflow 中的 `node-version`
- [ ] 确认 `package.json` 中的 `engines` 字段
- [ ] 确认 `.nvmrc` 文件存在且正确
- [ ] 运行 `npm ci` 确保依赖一致
