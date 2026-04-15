/**
 * arch.js
 *
 * Converts a D2 .d2 file → PNG without using a browser.
 *
 * Pipeline:
 *   d2 CLI         →  SVG   (d2 is a Go binary; native SVG output, no Chrome needed)
 *   @resvg/resvg-js →  PNG   (Rust, pre-built binaries, zero system deps)
 *
 * Why not `d2 file.d2 file.png` directly?
 * d2's PNG export internally uses Playwright + headless Chrome (~300 MB).
 * Going via SVG keeps the toolchain lightweight.
 *
 * Prerequisite: d2 must be installed and on PATH.
 * Install: https://d2lang.com/tour/install
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname, join, basename, extname } from 'node:path'
import { writeFileSync, unlinkSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { ensureDir, defaultOutputPath } from './utils.js'

const execFileAsync = promisify(execFile)

/**
 * @param {string} inputPath    Absolute path to the .d2 source file
 * @param {string} [outputPath] Output .png path (defaults to same dir, same stem)
 * @param {string} [theme]      D2 theme ID (default '0')
 */
export async function renderArch(inputPath, outputPath, theme = '0') {
  outputPath ??= defaultOutputPath(inputPath, '.png')
  ensureDir(dirname(outputPath))

  const svgPath = defaultOutputPath(inputPath, '.svg')

  // ── 1. d2 → SVG (no browser involved) ──────────────────────────────────
  try {
    await execFileAsync('d2', ['--theme', theme, inputPath, svgPath])
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(
        '`d2` not found on PATH.\n' +
        'Install it from https://d2lang.com/tour/install and try again.'
      )
    }
    throw err
  }

  // ── 2. SVG → PNG via @resvg/resvg-js (Rust, zero system deps) ──────────
  try {
    const { readFileSync } = await import('node:fs')
    const svg = readFileSync(svgPath, 'utf8')

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1600 },
      background: 'white',
      font: { defaultFontFamily: 'Arial, Helvetica, sans-serif' },
    })
    writeFileSync(outputPath, resvg.render().asPng())
    console.log(`[mddoc] arch    → ${outputPath}`)
  } finally {
    // Clean up intermediate SVG
    try { unlinkSync(svgPath) } catch {}
  }
}
