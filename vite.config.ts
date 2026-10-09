/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import tokens from './design/tokens.json' with { type: 'json' }

// Die App läuft auf GitHub Pages unter https://<nutzername>.github.io/mixli/
const BASE = '/mixli/'

const unusedJspdfDependency = fileURLToPath(new URL('./src/lib/stubs/unusedJspdfDependency.ts', import.meta.url))

export default defineConfig({
  base: BASE,
  resolve: {
    // Optionale Pakete von jsPDF, die Mixli nicht braucht (siehe src/lib/stubs/unusedJspdfDependency.ts).
    alias: {
      html2canvas: unusedJspdfDependency,
      dompurify: unusedJspdfDependency,
      canvg: unusedJspdfDependency,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Neue Versionen werden im Hintergrund geladen und beim nächsten Start aktiv.
      registerType: 'autoUpdate',
      // Registrierung erfolgt selbst in src/main.tsx (virtual:pwa-register).
      injectRegister: false,
      // Icons erfasst bereits workbox.globPatterns (das Manifest fügt das Plugin selbst hinzu).
      includeManifestIcons: false,
      manifest: {
        id: BASE,
        name: 'Mixli',
        short_name: 'Mixli',
        description: 'Müslis aus eigenen Zutaten mischen – mit Nährwerten, Allergenen und Etikett.',
        lang: 'de',
        dir: 'ltr',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: tokens.color.background,
        theme_color: tokens.color.background,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Alles, was der Build erzeugt, wird beim Installieren vorab gespeichert → voll offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // iOS-Startbilder lädt das iPhone nur beim Hinzufügen zum Home-Bildschirm – nicht offline vorhalten.
        globIgnores: ['**/apple-splash-*.png'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
