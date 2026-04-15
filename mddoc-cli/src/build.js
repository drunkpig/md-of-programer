/**
 * build.js
 *
 * Scans a project's .mddoc/ directory and (re-)generates PNGs for every
 * .mmd and .d2 source file found.
 *
 * Usage:  mddoc build [projectDir]
 */
import { readdirSync, statSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { renderMindmap } from './mindmap.js'
import { renderArch } from './arch.js'

/**
 * @param {string} projectDir  Root of the project (contains .mddoc/)
 */
export async function buildAll(projectDir) {
  const mddocDir = join(projectDir, '.mddoc')

  let entries
  try {
    entries = readdirSync(mddocDir)
  } catch {
    console.error(`[mddoc] .mddoc/ not found in ${projectDir}`)
    process.exit(1)
  }

  const tasks = entries
    .filter(f => ['.mmd', '.d2'].includes(extname(f)))
    .map(f => join(mddocDir, f))

  if (!tasks.length) {
    console.log('[mddoc] No .mmd or .d2 files found in .mddoc/')
    return
  }

  for (const src of tasks) {
    const ext = extname(src)
    if (ext === '.mmd') await renderMindmap(src)
    else if (ext === '.d2') await renderArch(src)
  }

  console.log(`[mddoc] Done. ${tasks.length} file(s) processed.`)
}
