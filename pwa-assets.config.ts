import { AllAppleDeviceNames, createAppleSplashScreens, defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'
import tokens from './design/tokens.json' with { type: 'json' }

// Erzeugt die PWA-Icons und iOS-Startbilder aus public/favicon.svg: npm run icons
// Danach die ausgegebenen <link rel="apple-touch-startup-image">-Zeilen in index.html übernehmen.
const background = tokens.color.background
// Volle Qualität: Die Standard-Palette (quality 60) verfälscht die Token-Farben und rastert die Rosinen.
const png = { compressionLevel: 9, quality: 100 }

export default defineConfig({
  headLinkOptions: { basePath: '/mixli/' },
  preset: {
    ...minimal2023Preset,
    png,
    // Ohne Zusatzrand: favicon.svg hat seinen Rand schon und liegt im sicheren Kreis für maskierbare Icons.
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background } },
    // Schlichter Startbildschirm: Hintergrundfarbe, Icon-Motiv klein in der Mitte (ca. 35 % der Breite).
    // Nur iPhones; Android baut den Startbildschirm selbst aus Manifest-Icon und background_color.
    appleSplashScreens: createAppleSplashScreens(
      { padding: 0.65, png, resizeOptions: { background, fit: 'contain' }, linkMediaOptions: { log: true, addMediaScreen: true, xhtml: false } },
      AllAppleDeviceNames.filter((name) => name.startsWith('iPhone')),
    ),
  },
  images: ['public/favicon.svg'],
})
