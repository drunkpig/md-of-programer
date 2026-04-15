/**
 * arch.js
 *
 * Converts a D2 .d2 file → PNG by shelling out to the `d2` CLI.
 * D2 natively supports PNG output, so no format conversion is needed.
 *
 * Prerequisite: d2 must be installed and on PATH.
 * Install: https://d2lang.com/tour/install
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname } from 'node:path'
import { ensureDir, defaultOutputPath } from './utils.js'

const execFileAsync = promisify(execFile)

/**
 * @param {string} inputPath   Absolute path to the .d2 source file
 * @param {string} [outputPath]  Absolute path for the output .png (optional)
 * @param {string} [theme]     D2 theme ID (default '0')
 */
export async function renderArch(inputPath, outputPath, theme = '0') {
  outputPath ??= defaultOutputPath(inputPath, '.png')
  ensureDir(dirname(outputPath))

  const args = ['--theme', theme, inputPath, outputPath]

  try {
    await execFileAsync('d2', args)
    console.log(`[mddoc] arch    → ${outputPath}`)
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(
        '`d2` not found on PATH.\n' +
        'Install it from https://d2lang.com/tour/install and try again.'
      )
    }
    throw err
  }
}
