# Prompts für Claude Code

Diese Datei musst du nicht im Repo behalten. Einfach den passenden Block in Claude Code einfügen.

## Phase 0 – Start

```
Lies CLAUDE.md, PLAN.md und alles in design/ (auch die Screenshots).

Aufgabe jetzt nur Phase 0 aus PLAN.md:
1. Schlage die Ordnerstruktur vor und wie du die Design-Tokens aus design/tokens.json in Tailwind übernimmst. Warte auf mein OK.
2. Danach: Projekt mit Vite + React + TypeScript aufsetzen, Tailwind, Motion, Dexie, vite-plugin-pwa und Vitest einrichten. PWA so konfigurieren, dass sie unter /mixli/ installierbar ist und offline funktioniert. Manrope lokal bündeln.
3. Die schwebende Bottom-Navigation mit den vier Tabs (Zutaten, Mixen, Müslis, Mehr) und vier leeren Screens bauen, exakt nach design/DESIGN.md.
4. Deployment auf GitHub Pages per GitHub Actions einrichten und mir erklären, was ich in den Repo-Einstellungen aktivieren muss.

Erkläre mir kurz, was du tust und warum.
```

## Phase 1 – Zutaten mit Foto

```
Phase 0 ist fertig. Starte Phase 1 aus PLAN.md: Zutaten mit Foto.
Halte dich an design/DESIGN.md (Screens 1–3) und die Prototypen Leer, Zutaten und ZutatNeu.
Zeig mir zuerst das Dexie-Schema und die Komponentenliste, dann warte auf mein OK.
```

## Phase 2 – Backup

```
Starte Phase 2 aus PLAN.md: Backup-Export und -Import inkl. Fotos, mit formatVersion und Zod-Prüfung, sowie die Backup-Karte im Screen „Mehr“ laut design/DESIGN.md.
Zeig mir zuerst das Dateiformat, dann warte auf mein OK.
```

## Phase 3 – Mixen und Speichern

```
Starte Phase 3 aus PLAN.md: Mixen, Mengen-Sheet, Live-Berechnung, Speichern mit Snapshot, Müsli-Liste und Detail.
Schreib zuerst die Berechnungs- und Rundungsfunktionen mit Vitest-Tests (Rundungstabelle in PLAN.md, inkl. Grenzfälle wie 10 g, 0,5 g, 0,0125 g Salz) und zeig mir die Tests, bevor du die Oberfläche baust.
```

## Phase 4 – Etikett

```
Starte Phase 4 aus PLAN.md: Etikett 70 × 42,3 mm laut design/DESIGN.md und Prototyp Etikett.
Druck-CSS für A4-Bögen mit 3 × 7 Etiketten, dazu PDF und Bild über das Teilen-Menü.
```

## Phase 5 und 6

```
Starte Phase 5 (bzw. 6) aus PLAN.md. Zeig mir zuerst deinen Plan.
```
