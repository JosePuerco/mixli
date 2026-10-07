/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import tokens from './design/tokens.json' with { type: 'json' }

// Die App läuft auf GitHub Pages unter https://<nutzername>.github.io/mixli/
const BASE = '/mixli/'

export default defineConfig({
  base: BASE,
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
