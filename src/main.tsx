import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/manrope'
import './styles/index.css'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { requestPersistentStorage } from './db/db'
import { removeOldFilters } from './db/repo'

// Service Worker: speichert die App für offline und lädt Updates im Hintergrund.
registerSW({ immediate: true })

// Daten dauerhaft behalten, damit der Browser sie nicht von selbst aufräumt.
void requestPersistentStorage()

// Filter gelten nur bis zum Neustart; eine frühere Version hat sie noch dauerhaft gespeichert.
void removeOldFilters()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter (#/zutaten): funktioniert auf GitHub Pages ohne Server-Weiterleitung und offline. */}
    <HashRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HashRouter>
  </StrictMode>,
)
