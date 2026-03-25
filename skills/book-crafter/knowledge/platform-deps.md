# 平台依赖问题指南

## 概述

当项目使用原生 Node.js 模块（如 Rollup、esbuild、sharp 等）时，不同平台可能需要不同的二进制文件。这经常导致"本地正常但 CI 失败"的问题。

## 常见问题场景

### 场景 1：Rollup 平台依赖

**症状：**
```
Error: Cannot find module '@rollup/rollup-linux-x64-gnu'
```

**原因：**
Rollup 使用平台特定的二进制文件。本地安装的是当前平台的版本，但 CI 运行在不同平台。

**解决方案：**

1. 确保 VitePress/Rollup 正确配置 optionalDependencies：

```json
{
  "optionalDependencies": {
    "@rollup/rollup-darwin-arm64": "^4.9.0",
    "@rollup/rollup-darwin-x64": "^4.9.0",
    "@rollup/rollup-linux-x64-gnu": "^4.9.0",
    "@rollup/rollup-win32-x64-msvc": "^4.9.0"
  }
}
```

2. 或者，让包管理器自动处理：
```bash
# 使用 npm
npm install vitepress --save-dev

# npm 会自动安装正确的平台依赖
```

### 场景 2：esbuild 原生模块

**症状：**
```
Error: The esbuild loader is not compatible with the current platform
```

**解决方案：**

esbuild 通常会自动处理平台依赖，但如果遇到问题：

```bash
# 清除缓存并重新安装
rm -rf node_modules package-lock.json
npm install
```

### 场景 3：sharp 图像处理

**症状：**
```
Error: Could not load the "sharp" module
```

**解决方案：**

```bash
# 重新构建 sharp
npm rebuild sharp

# 或完全重装
rm -rf node_modules/sharp
npm install sharp
```

## 平台标识对照表

| 平台 | 架构 | npm 后缀 |
|-----|-----|---------|
| macOS | Intel (x64) | `darwin-x64` |
| macOS | Apple Silicon (M1/M2) | `darwin-arm64` |
| Linux | x64 | `linux-x64-gnu` / `linux-x64-musl` |
| Windows | x64 | `win32-x64-msvc` |

## GitHub Actions 平台

GitHub Actions 默认运行在 `ubuntu-latest`（Linux x64）上。

```yaml
jobs:
  build:
    runs-on: ubuntu-latest  # Linux x64
```

因此需要确保安装了 Linux x64 的原生依赖。

## 最佳实践

### 1. 使用 package-lock.json

**重要：** 始终提交 `package-lock.json` 文件。它会记录所有平台依赖的确切版本。

```bash
# 生成 lock 文件
npm install

# 提交到版本控制
git add package-lock.json
git commit -m "chore: update package-lock.json"
```

### 2. 正确的安装命令

```bash
# 开发环境（安装当前平台依赖）
npm install

# CI 环境（严格按 lock 文件安装）
npm ci
```

### 3. 配置 .npmrc（可选）

创建 `.npmrc` 文件确保可选依赖正确处理：

```
# .npmrc
optional = true
```

## 故障排查清单

### 本地环境检查

```bash
# 1. 检查平台
node -e "console.log(process.platform, process.arch)"
# 输出: darwin arm64 (macOS M1/M2)
# 或: linux x64 (Linux)

# 2. 检查已安装的平台依赖
npm ls @rollup/rollup-darwin-arm64

# 3. 测试构建
npm run build
```

### CI 环境检查

在 GitHub Actions 中添加调试步骤：

```yaml
- name: Debug environment
  run: |
    echo "Node: $(node --version)"
    echo "Platform: $(node -e 'console.log(process.platform, process.arch)')"
    npm ls --depth=0 | grep rollup
```

## 常见依赖列表

以下包使用平台特定二进制文件：

| 包名 | 用途 | 处理方式 |
|-----|-----|---------|
| `@rollup/rollup-*` | 打包工具 | 自动安装 |
| `esbuild` | 快速打包 | 自动安装 |
| `sharp` | 图像处理 | 可能需要 rebuild |
| `better-sqlite3` | SQLite 绑定 | 需要 rebuild |
| `bcrypt` | 密码哈希 | 需要 rebuild |
| `node-gyp` | 原生模块编译 | 需要编译工具链 |

## 处理原生依赖问题的通用方案

如果遇到原生依赖问题，按以下步骤操作：

1. **清除缓存**
   ```bash
   rm -rf node_modules
   rm package-lock.json
   ```

2. **确保编译工具链存在（Linux CI）**
   ```yaml
   - name: Setup build tools
     run: |
       sudo apt-get update
       sudo apt-get install -y build-essential python3
   ```

3. **重新安装**
   ```bash
   npm install
   ```

4. **验证安装**
   ```bash
   npm run build
   ```
