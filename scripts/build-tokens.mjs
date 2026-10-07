// Erzeugt src/styles/tokens.css (Tailwind-v4-@theme) aus design/tokens.json.
// design/tokens.json ist die einzige Quelle für Farben, Schrift, Radien, Abstände und Motion.
// Läuft automatisch vor dev, build und test (siehe package.json).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = JSON.parse(readFileSync(resolve(root, 'design/tokens.json'), 'utf8'))
const outFile = resolve(root, 'src/styles/tokens.css')

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const px = (n) => `${n}px`
const lines = []
const add = (name, value) => lines.push(`  --${name}: ${value};`)
const section = (title) => lines.push('', `  /* ${title} */`)

// Tailwind-Standardfarben und -Schatten abschalten: es gibt nur, was in tokens.json steht.
lines.push('  --color-*: initial;', '  --shadow-*: initial;')

section('Farben')
for (const [key, value] of Object.entries(tokens.color)) {
  if (Array.isArray(value)) {
    // segments → segment-1 … segment-7, photoPlaceholders → photo-1 … photo-7
    const base = key === 'segments' ? 'segment' : key === 'photoPlaceholders' ? 'photo' : kebab(key)
    value.forEach((v, i) => add(`color-${base}-${i + 1}`, v))
  } else {
    add(`color-${kebab(key)}`, value)
  }
}

section('Schrift')
add('font-sans', `"${tokens.font.family} Variable", "${tokens.font.family}", ${tokens.font.fallback}`)
for (const [key, t] of Object.entries(tokens.type)) {
  const name = `text-${kebab(key)}`
  add(name, px(t.size))
  add(`${name}--font-weight`, t.weight)
  // Zeilenhöhe steht nicht in tokens.json: Überschriften eng, Fließtext normal.
  add(`${name}--line-height`, t.size >= 20 ? '1.15' : '1.4')
  if (t.letterSpacing) add(`${name}--letter-spacing`, t.letterSpacing)
}

section('Radien')
for (const [key, value] of Object.entries(tokens.radius)) add(`radius-${kebab(key)}`, px(value))
add('radius-nav', px(tokens.nav.radius))

section('Abstände und Größen')
const spaceNames = {
  screenPadding: 'screen',
  gapSmall: 'gap-sm',
  gap: 'gap-md',
  gapLarge: 'gap-lg',
  topSafe: 'top-safe',
  touchTarget: 'touch',
  primaryButtonHeight: 'button',
}
for (const [key, value] of Object.entries(tokens.space)) add(`spacing-${spaceNames[key] ?? kebab(key)}`, px(value))
add('spacing-nav', px(tokens.nav.height))
add('spacing-nav-inset-x', px(tokens.nav.insetX))
add('spacing-nav-inset-bottom', px(tokens.nav.insetBottom))

section('Schatten')
for (const [key, value] of Object.entries(tokens.shadow)) add(`shadow-${kebab(key)}`, value)

section('Motion')
add('ease-soft', tokens.motion.easeOut)
add('ease-spring', tokens.motion.spring)
add('ease-spring-strong', tokens.motion.springStrong)

const css = `/* GENERIERT aus design/tokens.json durch scripts/build-tokens.mjs – nicht von Hand ändern. */\n@theme {\n${lines.join('\n')}\n}\n`

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, css)
console.log(`Tokens geschrieben: ${outFile}`)
