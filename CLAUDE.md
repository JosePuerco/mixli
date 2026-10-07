# Mixli – Hinweise für Claude Code

Mixli ist eine Offline-PWA (React + TypeScript + Vite) zum Mischen von Müslis aus eigenen Zutaten, mit Nährwerten pro 100 g, Allergenen und Etikett-Druck.

## Lies zuerst

- `PLAN.md` – Entscheidungen, Funktionsumfang, Datenmodell, Rundungsregeln, Phasenplan
- `design/DESIGN.md` – verbindliche Design-Vorgabe (Stil B), Komponenten, Motion, Screen-Verhalten
- `design/tokens.json` – Farben, Schrift, Radien, Abstände, Motion-Werte
- `design/screenshots/` – Bilder aller Screens (visuelle Referenz)
- `design/prototypes/` – Quellcode der klickbaren Prototypen als Referenz für Layout und Verhalten (nicht 1:1 kopieren, eigenes Format)

## Feste Regeln

- **Oberfläche komplett auf Deutsch**, Dezimalkomma, Einheiten mit Leerzeichen („14 g“, „399 kcal“).
- **Keine Server, kein Login, kein Tracking.** Alle Daten nur in IndexedDB (Dexie). Keine externen Requests zur Laufzeit außer Schriftarten, die beim Build gebündelt werden.
- **Offline-first:** Die App muss nach der Installation ohne Netz vollständig funktionieren.
- **Nährwerte intern exakt rechnen, nur bei der Anzeige runden** – nach der Rundungstabelle in `PLAN.md`. Berechnung und Rundung als reine Funktionen in eigenem Modul, mit Vitest-Tests.
- **Allergene:** Immer „enthält“ und „Spuren“ getrennt führen. Die Liste der 14 EU-Allergene ist fest im Code.
- **Snapshots:** Ein gespeichertes Müsli speichert die Werte seiner Zutaten mit, damit alte Etiketten korrekt bleiben.
- **Design:** Nur Tokens aus `design/tokens.json` verwenden, keine frei erfundenen Farben. Nur heller Modus. Touch-Ziele mindestens 44 px. `prefers-reduced-motion` respektieren.
- **Deployment:** GitHub Pages unter `/mixli/` – `base` in Vite und `scope`/`start_url` im Manifest müssen passen.
- **Backup-Format** hat eine `formatVersion`. Bei Änderungen am Datenmodell eine Migration für alte Backups mitliefern.

## Arbeitsweise

- Ich lerne Claude Code mit diesem Projekt. Erkläre kurz, was du tust und warum.
- Arbeite **phasenweise** nach `PLAN.md`. Vor größeren Änderungen einen kurzen Plan zeigen und auf mein OK warten.
- Frag nach, wenn etwas unklar ist, statt zu raten.
- Nach jedem abgeschlossenen Schritt: Tests laufen lassen, dann einen Commit mit aussagekräftiger Nachricht vorschlagen.
- Hake erledigte Punkte im Phasenplan in `PLAN.md` ab.
- Entwicklung auf Windows: Befehle so wählen, dass sie in PowerShell bzw. Git Bash funktionieren.
