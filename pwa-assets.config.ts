import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'
import tokens from './design/tokens.json' with { type: 'json' }

// Erzeugt die PWA-Icons aus public/favicon.svg: npm run icons
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: tokens.color.background } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: tokens.color.background } },
  },
  images: ['public/favicon.svg'],
})
