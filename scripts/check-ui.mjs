import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

function files(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? files(file, extension) : file.endsWith(extension) ? [file] : []
  })
}
const main = fs.readFileSync('src/main.tsx', 'utf8')
assert.deepEqual([...main.matchAll(/import\s+['"]([^'"]+\.css)['"]/g)].map(match => match[1]), ['./index.css'], 'Global styles must use the single ordered entry src/index.css')
const stylesheets = files('src', '.css')
for (const file of stylesheets) {
  const css = postcss.parse(fs.readFileSync(file, 'utf8'), { from: file })
  css.walkAtRules('import', rule => {
    const relative = rule.params.match(/^['"]([^'"]+)['"]/)?.[1]
    if (relative?.startsWith('.')) assert(fs.existsSync(path.resolve(path.dirname(file), relative)), `${file}: missing stylesheet ${relative}`)
  })
  css.walkDecls(declaration => {
    if (/^--(?:motion-|ease-)/.test(declaration.prop)) assert.fail(`${file}: motion values belong to src/lib/motion-tokens.ts`)
    if (declaration.prop === 'font-family' && /Universita/.test(declaration.value) && declaration.parent.name !== 'font-face') assert.fail(`${file}: use the explicit content typography role`)
    if (declaration.prop === 'font-family' && declaration.value.includes('--font-content')) assert.equal(file, path.join('src', 'styles', 'typography.css'), `${file}: content typography must use data-typography, not a feature override`)
    for (const match of declaration.value.matchAll(/url\(['"]?(\.[^)'"\s]+)['"]?\)/g)) assert(fs.existsSync(path.resolve(path.dirname(file), match[1])), `${file}: missing local asset ${match[1]}`)
  })
}
const primitives = files(path.join('src', 'components', 'ui'), '.tsx')
for (const file of primitives) {
  const source = fs.readFileSync(file, 'utf8')
  assert(!/\[(?:transition|animation)-(?:duration|timing-function):/.test(source), `${file}: shared motion belongs in styles/motion.css`)
  assert(!/Universita|font-serif/.test(source), `${file}: UI primitives must inherit the UI font`)
}
console.log(`UI architecture passed: ${stylesheets.length} stylesheets, ${primitives.length} primitives.`)
