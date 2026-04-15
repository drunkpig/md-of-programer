#!/usr/bin/env node
/**
 * mddoc CLI entry point
 *
 * Commands:
 *   mddoc mindmap <file.mmd>   Generate PNG from markmap source
 *   mddoc arch <file.d2>       Generate PNG from D2 source
 *   mddoc build [dir]          Process all .mmd and .d2 files in a directory
 */
import { program } from 'commander'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderMindmap } from '../src/mindmap.js'
import { renderArch } from '../src/arch.js'
import { buildAll } from '../src/build.js'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))

program
  .name('mddoc')
  .description('Generate diagram PNGs from .mmd (markmap) and .d2 source files')
  .version(pkg.version)

program
  .command('mindmap <file>')
  .description('Generate PNG from a markmap .mmd file')
  .option('-o, --output <path>', 'Output PNG path (default: same dir as input)')
  .action(async (file, opts) => {
    await renderMindmap(resolve(file), opts.output)
  })

program
  .command('arch <file>')
  .description('Generate PNG from a D2 .d2 file')
  .option('-o, --output <path>', 'Output PNG path (default: same dir as input)')
  .option('-t, --theme <id>', 'D2 theme ID', '0')
  .action(async (file, opts) => {
    await renderArch(resolve(file), opts.output, opts.theme)
  })

program
  .command('build [dir]')
  .description('Process all .mmd and .d2 files in .mddoc/ (default: current dir)')
  .action(async (dir) => {
    await buildAll(resolve(dir ?? '.'))
  })

program.parse()
