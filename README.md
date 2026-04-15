# PROGRAM'S MARKDOWN SKILL

> Turn system design docs into living documents — with mind maps and architecture diagrams that both humans and LLMs can read.

---

## The Problem

When engineers write system design documents in Markdown, diagrams are usually an afterthought:

- Paste a screenshot — it gets stale the moment the design changes
- Drop in a code block — GitHub renders it, your LLM context doesn't
- Link to Figma / draw.io — breaks when the file moves, invisible to AI tools

What you actually want is a diagram that is **readable by humans as an image** and **readable by LLMs as source code** — stored together, versioned together.

## How It Works

This project provides two things:

**1. `mddoc-cli`** — a Node.js CLI that converts diagram source files to PNG:

| Source file | Tool | Output |
|-------------|------|--------|
| `.mddoc/name.mmd` | markmap-lib + resvg-js | `.mddoc/name.png` |
| `.mddoc/name.d2` | d2 | `.mddoc/name.png` |

**2. `mddoc-design` skill** — a Claude Code skill that automates the whole workflow: write the source, generate the PNG, embed both into your Markdown in one step.

The embedded format looks like this:

```markdown
![架构图：系统概览](.mddoc/system-arch.png)
*源文件：[system-arch.d2](.mddoc/system-arch.d2)*
```

The image is for humans. The source link is for LLMs — they follow it and parse the diagram semantics directly.

---

## Installation

### 1. Install `mddoc-cli`

```bash
npm install -g mddoc-cli
```

### 2. Install `d2`

```bash
# macOS
brew install d2

# Windows
winget install terrastruct.d2

# Linux / others
# See https://d2lang.com/tour/install
```

### 3. Install the Claude Code skill

```bash
npx clawhub@latest install mddoc-design
```

Then in any project, say **"画个架构图"** or **"给这个模块画脑图"** — Claude handles the rest.

---

## Manual Usage

If you prefer to run `mddoc` directly without the skill:

```bash
# Mind map: .mmd → PNG
mddoc mindmap .mddoc/overview.mmd

# Architecture diagram: .d2 → PNG
mddoc arch .mddoc/system-arch.d2

# Regenerate all diagrams in .mddoc/
mddoc build
```

---

## Project Structure

```
md-of-programer/
├── mddoc-cli/        # npm package (published as mddoc-cli)
└── skill/
    └── design-md/
        └── SKILL.md  # Claude Code skill (published as mddoc-design on clawhub)
```

---

## Feedback

Issues and suggestions → https://github.com/drunkpig/md-of-programer/issues
