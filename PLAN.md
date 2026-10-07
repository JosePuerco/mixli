# Mixli – Projektplan

Stand: 07.10.2026

Mixli ist eine Offline-PWA für iOS und Android, mit der ich Müslis aus selbst angelegten Rohzutaten nach Gewicht mische und sofort Nährwerte pro 100 g, Allergene und ein druckbares Etikett bekomme.

## Entscheidungen

| Thema | Festgelegt |
| --- | --- |
| Name | Mixli, Repo `mixli`, URL `<nutzername>.github.io/mixli/` |
| Plattform | PWA, ein Code für iOS und Android, Installation über „Zum Home-Bildschirm“ |
| Daten | Komplett lokal auf dem Gerät (IndexedDB), kein Server, kein Login |
| Offline | Vollständig nach der ersten Installation |
| Hosting | GitHub Pages (Repo öffentlich), Deployment per GitHub Actions bei Push auf `main` |
| Entwicklung | Lokal auf einem Windows-Laptop mit Claude Code |
| Backup | Manueller Export/Import als Datei inkl. Fotos |
| Mischen | Nach Gewicht in Gramm, freie Gesamtmenge |
| Zutatendaten | Selbst eintragen (Barcode/Open Food Facts später optional) |
| Kategorien | Frei anlegbar, umbenennbar, löschbar; App startet ohne Kategorien |
| Rundung | Wie auf Supermarkt-Etiketten (EU-Rundungsregeln), intern exakt |
| Etikett | 70 × 42,3 mm, A4-Etikettenbögen mit 21 Stück, normaler Drucker |
| Design | Stil B „Weich & ruhig“, nur heller Modus, siehe `design/DESIGN.md` |
| Sprache der Oberfläche | Deutsch |

## Funktionsumfang

### Zutaten (Rohzutaten)

- Anlegen, bearbeiten, archivieren (statt löschen, damit gespeicherte Müslis intakt bleiben)
- **Foto** mit der Handykamera oder aus der Galerie; wird überall angezeigt (Liste, Mixen, Detail)
- Name, Marke/Produkt, Kategorie (optional, frei anlegbar)
- Nährwerte pro 100 g wie auf dem Etikett: Energie (kJ und kcal), Fett, davon gesättigte Fettsäuren, Kohlenhydrate, davon Zucker, Ballaststoffe, Eiweiß, Salz. kJ wird aus kcal vorgeschlagen (kcal × 4,184), ist aber überschreibbar.
- Allergene **enthält** und **kann Spuren enthalten**, getrennt, aus der festen Liste der 14 EU-Hauptallergene
- Tags für Vorlieben: vegan, ohne Zuckerzusatz, Bio, eigene Tags
- „Zutat anlegen“ als geführter Ablauf in vier Schritten (Foto → Basisdaten → Nährwerte → Allergene); „Zutat bearbeiten“ zeigt alles auf einer Seite

### Mixen (Konfigurator)

- Zutaten hinzufügen über ein Bottom-Sheet
- Menge per +/− in 10-g-Schritten; Antippen der Grammzahl öffnet ein Sheet mit Ziffernblock und Schnellwerten (10, 25, 50 g) für exakte Werte inkl. Kommastelle
- Bei 0 g fliegt die Zutat aus dem Mix
- Live: Gesamtgewicht, Anteile in %, Nährwerte pro 100 g, gesammelte Allergene und Spuren
- Filter: Allergene ausschließen (wahlweise inkl. Spuren), Tags verlangen; ausgeschlossene Zutaten werden ausgegraut und sind nicht wählbar

### Gespeicherte Müslis

- Name, für wen, Datum, Notiz
- Liste, sortierbar nach „Neueste“ und „A–Z“, Duplizieren als Vorlage
- Detailansicht mit Zusammensetzung, voller Nährwerttabelle, Allergenen und Etikett

### Etikett

- 70 × 42,3 mm: Name, Gesamtmenge, Zutatenliste mit Anteilen (Allergene **fett** hervorgehoben), Herstellungsdatum, Nährwerttabelle pro 100 g, Hinweis „Nährwerte aus Herstellerangaben berechnet“
- Drucken über die Systemdruckfunktion, digital als PDF oder Bild über das Teilen-Menü
- Später optional: Startposition auf dem A4-Bogen wählen (angebrochene Bögen)

### Backup

- Export aller Daten inkl. Fotos als eine Datei über das Teilen-Menü (iCloud Drive, Google Drive, Mail)
- Import mit Wahl: alles ersetzen oder zusammenführen
- Hinweis in der App, wenn das letzte Backup älter als 14 Tage ist

## Berechnung

Nährwert pro 100 g = Summe aus (Wert pro 100 g × Gramm der Zutat) ÷ Gesamtgramm, also das nach Gewicht gewichtete Mittel.

Beispiel: 300 g Hafer (13,5 g Eiweiß) + 60 g Mandeln (22 g) + 40 g Rosinen (2,5 g) = (40,5 + 13,2 + 1,0) ÷ 400 × 100 = 13,7 g Eiweiß pro 100 g → angezeigt als **14 g**.

### Rundung (wie im Supermarkt)

Gerechnet wird intern immer mit voller Genauigkeit, gerundet wird nur bei der Anzeige (EU-Leitfaden zu Toleranzen und Rundung von Nährwertangaben, 2012):

| Nährwert | Rundung |
| --- | --- |
| Energie (kJ, kcal) | ganzzahlig |
| Fett, Kohlenhydrate, Zucker, Ballaststoffe, Eiweiß | ab 10 g ganzzahlig; unter 10 g auf 0,1 g; bis 0,5 g als „<0,5 g“ |
| Gesättigte Fettsäuren | ab 10 g ganzzahlig; unter 10 g auf 0,1 g; bis 0,1 g als „<0,1 g“ |
| Salz | ab 1 g auf 0,1 g; unter 1 g auf 0,01 g; bis 0,0125 g als „<0,01 g“ |

Dezimaltrennzeichen in der Anzeige ist das Komma.

## Tech-Stack

| Bereich | Wahl | Wofür |
| --- | --- | --- |
| Grundgerüst | React + TypeScript + Vite | UI und Build |
| Styling | Tailwind CSS | Design-Tokens aus `design/tokens.json` |
| Animation | Motion (früher Framer Motion) | Übergänge, Federeffekte, Sheets |
| Lokale Datenbank | Dexie.js (IndexedDB) | Zutaten, Müslis, Fotos, Kategorien |
| PWA/Offline | vite-plugin-pwa (Workbox) | Service Worker, Installierbarkeit, Updates |
| Validierung | Zod | Eingaben und Backup-Import |
| Etikett | Druck-CSS + html-to-image/jsPDF | Druck, PDF, Bild |
| Fotos | Canvas-Verkleinerung im Browser | ca. 800 px, WebP/JPEG |
| Tests | Vitest | Vor allem Nährwert-, Rundungs- und Allergenlogik |

Die App läuft unter einem Unterpfad (`/mixli/`): `base` in der Vite-Konfiguration sowie `scope` und `start_url` im PWA-Manifest müssen dazu passen.

## Datenmodell

Ein gespeichertes Müsli speichert eine **Kopie (Snapshot)** der Nährwerte und Allergene seiner Zutaten. Ändert sich später eine Zutat, bleibt das Etikett eines alten Müslis korrekt.

### `ingredients`

| Feld | Typ | Hinweis |
| --- | --- | --- |
| id | UUID | |
| name | Text | z. B. „Zarte Haferflocken“ |
| brand | Text, optional | Marke/Produkt, wichtig für Spuren |
| categoryId | Verweis, optional | auf `categories` |
| photoId | Verweis, optional | auf `photos` |
| nutrition | Objekt | kj, kcal, fat, saturatedFat, carbs, sugar, fiber, protein, salt; je pro 100 g |
| allergensContains | Liste | aus den 14 EU-Allergenen |
| allergensTraces | Liste | aus den 14 EU-Allergenen |
| tags | Liste | vegan, ohne Zuckerzusatz, Bio, eigene |
| note | Text, optional | |
| archived | Boolean | statt Löschen |
| createdAt, updatedAt | Datum | |

### `mixes`

| Feld | Typ | Hinweis |
| --- | --- | --- |
| id | UUID | |
| name | Text | |
| forWhom | Text, optional | |
| items | Liste | je: ingredientId, grams, Snapshot (Name, Nährwerte, Allergene, Spuren) |
| note | Text, optional | |
| createdAt, updatedAt | Datum | |

Gesamtmenge, Nährwerte und Allergene werden aus `items` berechnet, nicht gespeichert.

### `photos`

id, Bild als Blob (verkleinert), Erstellungsdatum. Getrennt gespeichert, damit Listen schnell laden.

### `categories`

id, Name, Reihenfolge. Beim Löschen werden betroffene Zutaten auf „ohne Kategorie“ gesetzt.

### `settings`

letztes Backup, Standardfilter.

### Backup-Datei

JSON mit `formatVersion`, `exportedAt`, allen Tabellen und den Fotos als Base64.

### Die 14 EU-Hauptallergene

Gluten, Krebstiere, Eier, Fisch, Erdnüsse, Soja, Milch, Schalenfrüchte, Sellerie, Senf, Sesam, Schwefeldioxid/Sulfite, Lupinen, Weichtiere.

## Phasenplan

Nach Phase 3 ist die App im Alltag nutzbar. Das Backup kommt bewusst früh, weil ab da echte Daten auf dem Handy liegen.

### Phase 0 – Fundament

- [x] Projekt aufsetzen: Vite + React + TypeScript + Tailwind + Motion + Dexie + vite-plugin-pwa
- [x] Design-System aus `design/` umsetzen: Tokens, Schrift, Karten, Buttons, Chips, Bottom-Sheet, schwebende Navigation
  - [x] Tokens (generiert aus `design/tokens.json`), Schrift Manrope lokal, schwebende Navigation mit vier leeren Screens
  - [x] Feste App-Hülle (kein Federn des Dokuments, nur Screens scrollen), Karten, Buttons, Icon-Buttons, FAB
  - [x] Chips (Auswahl, „+ Neu“, Allergene, Sortier-Umschalter), Bottom-Sheet (Wegziehen, Escape, Fokus); Übersicht unter `#/komponenten`
- [x] GitHub Pages per GitHub Actions, App auf dem iPhone installieren und offline testen

### Phase 1 – Zutaten mit Foto

- [x] Zutat anlegen (4 Schritte) und bearbeiten (eine Seite), archivieren
- [x] Foto aufnehmen oder auswählen, verkleinern, speichern, anzeigen
- [ ] Zutaten-Übersicht mit Suche und Kategorie-Chips; Kategorien verwalten
  - [x] Übersicht mit Suche, Kategorie-Chips und Archiv („Archiviert (n)“, Wiederherstellen in „Zutat bearbeiten“)
  - [ ] Kategorien verwalten in „Mehr“ (umbenennen, sortieren, löschen)
- [x] Leerer Zustand beim ersten Start

### Phase 2 – Backup

- [ ] Export als Datei über das Teilen-Menü
- [ ] Import mit Prüfung (Zod) und Wahl „ersetzen“ oder „zusammenführen“
- [ ] Erinnerung bei Backup älter als 14 Tage

### Phase 3 – Mixen und Speichern (MVP fertig)

- [ ] Zutaten hinzufügen, +/−, Mengen-Sheet mit Ziffernblock
- [ ] Live-Berechnung inkl. Rundung (mit Tests)
- [ ] Müsli mit Snapshot speichern, Liste, Detail, Duplizieren

### Phase 4 – Etikett

- [ ] Etikett-Layout in 70 × 42,3 mm
- [ ] Drucken, PDF, Bild teilen

### Phase 5 – Filter

- [ ] Allergene ausschließen, Schalter „Spuren auch ausschließen“
- [ ] Nach Tags filtern
- [ ] Warnung, wenn ein gespeichertes Müsli den Filter verletzt

### Phase 6 – Feinschliff

- [ ] Motion-Feinschliff, animierte Zahlen, Übergänge
- [ ] App-Icon, Splashscreen
- [ ] Später optional: Barcode-Scan mit Open Food Facts
