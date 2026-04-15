/**
 * mindmap.js
 *
 * .mmd (markmap markdown) → PNG
 *
 * Pipeline:
 *   markmap-lib Transformer  →  INode tree
 *   buildSvg()               →  SVG string  (custom radial-left layout)
 *   @resvg/resvg-js Resvg    →  PNG buffer
 *
 * Zero system dependencies: @resvg/resvg-js ships pre-built native binaries
 * for Mac (x64/arm64), Linux (x64/arm64), and Windows (x64).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { Transformer } from 'markmap-lib'
import { Resvg } from '@resvg/resvg-js'
import { ensureDir, defaultOutputPath } from './utils.js'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a markmap .mmd file to a PNG image.
 *
 * @param {string} inputPath   Absolute path to the .mmd source file
 * @param {string} [outputPath]  Output .png path (defaults to same dir, same stem)
 */
export async function renderMindmap(inputPath, outputPath) {
  outputPath ??= defaultOutputPath(inputPath, '.png')
  ensureDir(dirname(outputPath))

  const markdown = readFileSync(inputPath, 'utf8')
  const svg = buildSvg(markdown)

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1600 },
    background: 'white',
    font: {
      // Use generic system font stack; resvg will pick whatever is available.
      defaultFontFamily: 'Arial, Helvetica, sans-serif',
    },
  })

  writeFileSync(outputPath, resvg.render().asPng())
  console.log(`[mddoc] mindmap → ${outputPath}`)
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const NODE_H       = 38    // node box height (px)
const H_GAP        = 60    // horizontal gap between depth levels
const V_GAP        = 14    // vertical gap between sibling nodes
const FONT_SIZE    = 13    // px — must match SVG text element
const CHAR_W       = 7.5   // approximate px per character at FONT_SIZE
const PADDING_X    = 18    // horizontal padding inside a node box
const MAX_LABEL    = 28    // truncate labels longer than this many chars
const MARGIN       = 32    // canvas margin

// Depth → fill colour (cycles when depth > palette length)
const PALETTE = [
  '#3B82F6', // blue-500    (root)
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EF4444', // red-500
  '#06B6D4', // cyan-500
]

// ---------------------------------------------------------------------------
// SVG builder
// ---------------------------------------------------------------------------

/**
 * Build a left-to-right tree SVG from markmap markdown.
 *
 * @param {string} markdown
 * @returns {string} SVG source
 */
function buildSvg(markdown) {
  const transformer = new Transformer()
  const { root } = transformer.transform(markdown)

  // ── 1. Collect positioned nodes and edges ──────────────────────────────

  /** @type {Array<{x:number, y:number, w:number, label:string, depth:number}>} */
  const nodes = []
  /** @type {Array<{x1:number,y1:number,x2:number,y2:number}>} */
  const edges = []

  /**
   * Count leaf nodes in a subtree (used to proportionally allocate vertical
   * space so that no two nodes overlap).
   */
  function countLeaves(node) {
    if (!node.children?.length) return 1
    return node.children.reduce((sum, c) => sum + countLeaves(c), 0)
  }

  /**
   * Recursively assign (x, y) positions.
   *
   * @param {object} node     markmap INode
   * @param {number} depth    current depth (root = 0)
   * @param {number} centerY  vertical centre allocated to this subtree
   */
  function layout(node, depth, centerY) {
    const label = truncate(stripHtml(node.content ?? ''))
    const w = Math.max(80, Math.ceil(label.length * CHAR_W) + PADDING_X * 2)
    const x = MARGIN + depth * (w + H_GAP)   // NOTE: uses this node's own width
    const y = centerY - NODE_H / 2

    nodes.push({ x, y, w, label, depth })

    const children = node.children ?? []
    if (!children.length) return

    const totalLeaves = countLeaves(node)
    const totalH = totalLeaves * (NODE_H + V_GAP) - V_GAP
    let curY = centerY - totalH / 2

    for (const child of children) {
      const childLeaves = countLeaves(child)
      const childH = childLeaves * (NODE_H + V_GAP) - V_GAP
      const childCenter = curY + childH / 2

      // Edge: from right-centre of parent to left-centre of child.
      // Uses a horizontal cubic bezier for a clean "tree branch" look.
      const ex1 = x + w
      const ey1 = centerY
      const ex2 = MARGIN + (depth + 1) * (w + H_GAP)   // child's x (approx)
      const ey2 = childCenter
      const cx = (ex1 + ex2) / 2
      edges.push({ x1: ex1, y1: ey1, x2: ex2, y2: ey2, cx })

      layout(child, depth + 1, childCenter)
      curY += childH + V_GAP
    }
  }

  const rootLeaves = countLeaves(root)
  const svgH = MARGIN * 2 + rootLeaves * (NODE_H + V_GAP) - V_GAP

  layout(root, 0, MARGIN + (svgH - MARGIN * 2) / 2)

  // ── 2. Compute canvas width from rightmost node ─────────────────────────

  const svgW = Math.max(
    400,
    Math.max(...nodes.map(n => n.x + n.w)) + MARGIN,
  )

  // ── 3. Render SVG ────────────────────────────────────────────────────────

  const edgesSvg = edges.map(({ x1, y1, x2, y2, cx }) =>
    `<path d="M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}"` +
    ` fill="none" stroke="#CBD5E1" stroke-width="1.5"/>`
  ).join('\n  ')

  const nodesSvg = nodes.map(({ x, y, w, label, depth }) => {
    const fill  = PALETTE[depth % PALETTE.length]
    const textX = x + w / 2
    const textY = y + NODE_H / 2 + Math.floor(FONT_SIZE * 0.37)  // optical centre
    const safe  = escapeXml(label)
    return (
      `<rect x="${x}" y="${y}" width="${w}" height="${NODE_H}"` +
        ` rx="6" fill="${fill}"/>` +
      `<text x="${textX}" y="${textY}"` +
        ` text-anchor="middle" font-size="${FONT_SIZE}"` +
        ` font-family="Arial,Helvetica,sans-serif"` +
        ` font-weight="${depth === 0 ? '700' : '400'}" fill="#FFFFFF">${safe}</text>`
    )
  }).join('\n  ')

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">`,
    `  <rect width="${svgW}" height="${svgH}" fill="#FFFFFF"/>`,
    `  ${edgesSvg}`,
    `  ${nodesSvg}`,
    `</svg>`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip HTML tags that markmap-lib injects into node.content */
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').trim()
}

/** Truncate a label to MAX_LABEL chars, adding ellipsis if needed */
function truncate(text) {
  return text.length > MAX_LABEL ? text.slice(0, MAX_LABEL - 1) + '…' : text
}

/** Escape characters that are special in XML/SVG text content */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
