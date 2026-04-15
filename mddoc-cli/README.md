# mddoc-cli

Generate mind map and architecture diagram PNGs from `.mmd` and `.d2` source files — for embedding in system design Markdown documents.

## Install

```bash
npm install -g mddoc-cli
```

For architecture diagrams, also install [d2](https://d2lang.com/tour/install):

```bash
# macOS
brew install d2

# Linux / Windows — see https://d2lang.com/tour/install
```

## Commands

### `mddoc mindmap <file.mmd>`

Render a [markmap](https://markmap.js.org/) mind map source file to PNG.

```bash
mddoc mindmap .mddoc/overview.mmd
# → .mddoc/overview.png

mddoc mindmap .mddoc/overview.mmd -o docs/overview.png
```

**Input format** — standard Markdown headings, depth = tree level:

```markdown
# System Overview

## User Layer
- Web Client
- Mobile App

## Service Layer
- API Gateway
  - Auth
  - Rate Limiting
- Order Service

## Data Layer
- PostgreSQL
- Redis
```

---

### `mddoc arch <file.d2>`

Render a [D2](https://d2lang.com) architecture diagram source file to PNG.

```bash
mddoc arch .mddoc/system-arch.d2
# → .mddoc/system-arch.png

mddoc arch .mddoc/system-arch.d2 -o docs/system-arch.png --theme 200
```

**Input format** — D2 diagram language:

```d2
direction: right

client: Client {shape: rectangle}
gateway: API Gateway {shape: rectangle}
db: PostgreSQL {shape: cylinder}
cache: Redis {shape: cylinder}

client -> gateway
gateway -> db
gateway -> cache
```

---

### `mddoc build [dir]`

Scan `.mddoc/` in the given directory (default: current directory) and regenerate PNGs for every `.mmd` and `.d2` file found.

```bash
# from project root
mddoc build

# from a specific directory
mddoc build ./docs
```

---

## Recommended project layout

```
your-project/
├── .mddoc/
│   ├── overview.mmd        ← mind map source
│   ├── overview.png        ← generated (committed to repo)
│   ├── system-arch.d2      ← architecture diagram source
│   └── system-arch.png     ← generated (committed to repo)
└── DESIGN.md
```

Embed in Markdown with a link back to the source so LLMs can also read the diagram:

```markdown
![脑图：系统概览](.mddoc/overview.png)
*源文件：[overview.mmd](.mddoc/overview.mmd)*

![架构图：系统架构](.mddoc/system-arch.png)
*源文件：[system-arch.d2](.mddoc/system-arch.d2)*
```

## Options

| Flag | Command | Description |
|------|---------|-------------|
| `-o, --output <path>` | `mindmap`, `arch` | Custom output PNG path |
| `-t, --theme <id>` | `arch` | D2 theme ID (default: `0`) |

## Dependencies

| Package | Purpose |
|---------|---------|
| [`markmap-lib`](https://www.npmjs.com/package/markmap-lib) | Parse `.mmd` markdown into a tree |
| [`@resvg/resvg-js`](https://www.npmjs.com/package/@resvg/resvg-js) | Rasterise SVG → PNG (pre-built native binaries, no system deps) |
| [`d2`](https://d2lang.com) CLI | Render `.d2` → PNG (external, must be on PATH) |
