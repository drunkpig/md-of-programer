/**
 * index.js – programmatic API
 *
 * Allows other Node.js code to use mddoc-cli as a library:
 *
 *   import { renderMindmap, renderArch, buildAll } from 'mddoc-cli'
 */
export { renderMindmap } from './mindmap.js'
export { renderArch } from './arch.js'
export { buildAll } from './build.js'
