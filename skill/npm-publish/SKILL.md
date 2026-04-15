---
name: npm-publish
version: 0.1.0
description: 发布 npm 包到 npmjs.com。用户说"发布/发包/publish npm"时触发。
disable-model-invocation: true
allowed-tools: Bash, Read
metadata:
  openclaw:
    requires:
      bins:
        - npm
---

发布 npm 包时，按顺序执行以下步骤。

## 1. 发布前检查

依次执行，任何一步失败立即停止并告知用户：

```bash
# 新包：确认包名未被占用（404 = 可用）
npm view <name> --registry https://registry.npmjs.com 2>&1

# 预览打包内容，确认无敏感文件（.env、token、私钥等）
npm pack --dry-run

# 若有 bin 字段，确认入口文件有可执行权限
chmod +x bin/*.js

# 修正 package.json 格式问题
npm pkg fix
```

## 2. 版本号

询问用户发布类型，然后执行对应命令：

| 类型 | 场景 | 命令 |
|------|------|------|
| patch | bug fix | `npm version patch` |
| minor | 新功能，向下兼容 | `npm version minor` |
| major | 破坏性变更 | `npm version major` |
| 不变 | 首次发布 | 跳过 |

## 3. 发布

始终加 `--registry` 避免误发到镜像站：

```bash
npm publish --registry https://registry.npmjs.com
```

若报 `E403 Two-factor authentication required`，需要带 token：

```bash
npm publish --registry https://registry.npmjs.com --//registry.npmjs.com/:_authToken=<token>
```

**获取 token**：npmjs.com → Access Tokens → Generate New Token → Granular Access Token
→ Packages 权限选 **Read and write**
→ 勾选 **Allow this token to bypass two-factor authentication**

> **安全警告**：告知用户 token 必须通过 `!` 前缀在终端直接运行，**不要粘贴进对话消息**，否则 token 会出现在对话历史中。

## 4. 验证

```bash
npm view <name> --registry https://registry.npmjs.com
```

输出包页面地址：`https://www.npmjs.com/package/<name>`

## 错误速查

| 错误 | 原因 | 处理 |
|------|------|------|
| `E403 Two-factor` | 缺少 bypass token | 按步骤 3 获取 Granular token |
| `E403 no permission` | 包名属于他人 | 换包名 |
| `E409 Conflict` | 版本号已存在 | `npm version patch` |
| `bin script invalid` | bin 路径格式问题 | `npm pkg fix` |
| `E404 Not found` | 包名首次发布（正常） | 直接发布即可 |

## 注意

- 发布**不可撤销**（72 小时后无法 unpublish）
- npm 源若配置为淘宝镜像，login 和 publish 都需加 `--registry https://registry.npmjs.com`
