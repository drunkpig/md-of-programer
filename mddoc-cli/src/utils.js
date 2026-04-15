/**
 * utils.js – shared helpers
 */
import { mkdirSync } from 'node:fs'
import { dirname, join, basename, extname } from 'node:path'

/**
 * Ensure a directory exists (mkdir -p).
 * @param {string} dir
 */
export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true })
}

/**
 * Derive the default output path: same directory as input, same stem, new ext.
 * e.g. /project/.mddoc/overview.mmd → /project/.mddoc/overview.png
 *
 * @param {string} inputPath
 * @param {string} newExt   e.g. '.png'
 * @returns {string}
 */
export function defaultOutputPath(inputPath, newExt) {
  const stem = basename(inputPath, extname(inputPath))
  return join(dirname(inputPath), stem + newExt)
}
