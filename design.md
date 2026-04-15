# Design: `design-md` Skill

## 概述

`design-md` 是一个 Claude Code Skill，用于在编写系统设计 Markdown 文档时自动生成嵌入式图表。

**支持两类图表：**
- **脑图**：使用 [markmap](https://markmap.js.org/) 语法（`.mmd` 文件）→ PNG
- **架构图**：使用 [D2](https://d2lang.com/) 语法（`.d2` 文件）→ PNG

**核心原则**：源文件（`.mmd` / `.d2`）与生成物（`.png`）同级存放于 `.mddoc/` 目录，Markdown 中同时嵌入图片和源文件链接，使大模型读取文档时可进一步解析图表语义。

---

## 仓库目录结构

本项目包含两个独立目录：

```
design-md-skills/
├── mddoc-cli/                 # Node.js 工具包（发布到 npm）
│   ├── package.json
│   ├── bin/
│   │   └── mddoc.js           # CLI 入口 (#!/usr/bin/env node)
│   └── src/
│       ├── index.js           # 程序化 API 导出
│       ├── mindmap.js         # .mmd → PNG（markmap-lib + resvg-js）
│       ├── arch.js            # .d2  → PNG（调用 d2 CLI）
│       ├── build.js           # 批量处理 .mddoc/ 目录
│       └── utils.js           # 公共工具（ensureDir、defaultOutputPath）
│
├── skill/
│   └── design-md.md           # Claude Code Skill 提示词
│
└── design.md                  # 本设计文档
```

**用户项目中的约定目录：**

```
your-project/
├── .mddoc/                    # 图表源文件 & 生成图片
│   ├── overview.mmd           # markmap 脑图源文件
│   ├── overview.png           # 生成的脑图 PNG
│   ├── system-arch.d2         # D2 架构图源文件
│   └── system-arch.png        # 生成的架构图 PNG
└── DESIGN.md                  # 系统设计文档（主文档）
```

`.mddoc/` 目录与主 Markdown 文档平级放置。

---

## 脑图工作流（markmap）

### 1. 编写源文件

将 markmap 内容写入 `.mddoc/[名称].mmd`：

```markdown
# 系统核心模块

## 用户层
- Web 客户端
- 移动端 App

## 服务层
- API Gateway
  - 认证鉴权
  - 限流熔断
- 业务服务
  - 订单服务
  - 用户服务

## 数据层
- PostgreSQL
- Redis Cache
```

### 2. 生成 PNG

```bash
# 生成 SVG（markmap-cli 原生支持）
markmap --no-open -o .mddoc/[名称].svg .mddoc/[名称].mmd

# 转换 SVG → PNG（需 ImageMagick 或 rsvg-convert）
convert -background white .mddoc/[名称].svg .mddoc/[名称].png
# 或
rsvg-convert -o .mddoc/[名称].png .mddoc/[名称].svg
```

> **备选方案**：若环境支持 Puppeteer，可用 `markmap --screenshot` 直接生成 PNG。

### 3. 嵌入 Markdown

```markdown
![脑图：系统核心模块](.mddoc/overview.png)
*图表源文件：[overview.mmd](.mddoc/overview.mmd)*
```

---

## 架构图工作流（D2）

### 1. 编写源文件

将 D2 内容写入 `.mddoc/[名称].d2`：

```d2
direction: right

client: 客户端 {
  shape: rectangle
}

gateway: API Gateway {
  shape: rectangle
  auth: 认证鉴权
  ratelimit: 限流熔断
}

services: 业务服务层 {
  order: 订单服务
  user: 用户服务
}

db: 数据层 {
  pg: PostgreSQL {shape: cylinder}
  redis: Redis {shape: cylinder}
}

client -> gateway
gateway -> services
services -> db
```

### 2. 生成 PNG

```bash
# D2 直接输出 PNG（原生支持）
d2 .mddoc/[名称].d2 .mddoc/[名称].png

# 可选：指定主题
d2 --theme 200 .mddoc/[名称].d2 .mddoc/[名称].png
```

### 3. 嵌入 Markdown

```markdown
![架构图：系统整体架构](.mddoc/system-arch.png)
*图表源文件：[system-arch.d2](.mddoc/system-arch.d2)*
```

---

## Markdown 嵌入规范

嵌入格式要求**同时包含**图片和源文件链接，使人和 LLM 均可访问：

```markdown
![{类型}：{描述}](.mddoc/{文件名}.png)
*图表源文件：[{文件名}.{ext}](.mddoc/{文件名}.{ext})*
```

| 字段 | 说明 |
|------|------|
| `{类型}` | `脑图` 或 `架构图` |
| `{描述}` | 图表内容的简短说明，供无法渲染图片时理解语义 |
| `{文件名}` | 语义化命名，使用英文小写 + 连字符（如 `auth-flow`） |
| `{ext}` | 脑图用 `.mmd`，架构图用 `.d2` |

---

## Skill 触发方式

以下情况触发 `design-md` 技能：

1. 用户明确调用 `/design-md`
2. 在 Markdown 文档中描述需要脑图的场景（如"画一个模块关系脑图"）
3. 在 Markdown 文档中描述需要架构图的场景（如"画一个系统架构图"）
4. 用户要求在设计文档中添加可视化内容

---

## Skill 行为规范

Claude 在执行 `design-md` 技能时应遵循以下步骤：

1. **确认 `.mddoc/` 目录存在**，不存在则创建
2. **为图表起语义化文件名**（英文，描述内容而非序号）
3. **先写源文件**（`.mmd` 或 `.d2`），内容应完整、语义清晰
4. **执行生成命令**生成 PNG
5. **将嵌入代码插入**到 Markdown 的适当位置，紧跟相关文字段落
6. **不要在 Markdown 中直接写 D2/markmap 代码块**，源文件统一放 `.mddoc/`

---

## 依赖项

| 工具 | 用途 | 安装方式 |
|------|------|----------|
| `mddoc-cli` | 脑图 + 架构图 → PNG 统一入口 | `npm install -g mddoc-cli` |
| `d2` | 架构图 `.d2` → PNG（`arch.js` 内部调用） | https://d2lang.com/tour/install |
| `markmap-lib` | 脑图 markdown 解析（npm 包，自动安装） | — |
| `@resvg/resvg-js` | SVG → PNG 光栅化（预编译二进制，零系统依赖） | — |

`markmap-cli`、ImageMagick、rsvg-convert 均不再需要。

---

## 完整示例

以下是在 `DESIGN.md` 中使用本技能的完整示例片段：

```markdown
## 系统架构

本系统采用微服务架构，各模块职责分离。

![架构图：系统整体架构](.mddoc/system-arch.png)
*图表源文件：[system-arch.d2](.mddoc/system-arch.d2)*

## 核心模块关系

以下脑图展示了核心模块及其子系统的层级关系：

![脑图：核心模块关系](.mddoc/module-overview.png)
*图表源文件：[module-overview.mmd](.mddoc/module-overview.mmd)*
```

---

## Skill 文件位置

本技能的实现文件在本仓库的 `skill/design-md.md`。

安装到全局（所有项目可用）：

```bash
cp skill/design-md.md ~/.claude/skills/design-md.md
```

或安装到项目级（仅当前项目可用）：

```bash
cp skill/design-md.md .claude/skills/design-md.md
```

---

## 后续扩展方向

- 支持 [Mermaid](https://mermaid.js.org/) 作为架构图的备选格式（`mmdc` CLI 支持直接输出 PNG）
- 支持 sequence diagram、ER diagram 等更多 D2 图表类型的快捷模板
- 批量重新生成：扫描 `.mddoc/` 下所有源文件并重新渲染所有 PNG
