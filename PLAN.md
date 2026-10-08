# Mixli – Projektplan

Stand: 08.10.2026

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
- Datum ist der Tag des ersten Speicherns (`createdAt`), nicht änderbar; es wird später das Herstellungsdatum auf dem Etikett
- **Bearbeiten:** Zutaten behalten ihre Snapshots von damals; nur neu hinzugefügte bekommen aktuelle Werte. Datum bleibt.
- **Duplizieren:** Zutaten und Mengen landen als neuer, ungespeicherter Mix in „Mixen“, mit den aktuellen Werten der Zutaten
- Der Mix in Arbeit wird laufend auf dem Gerät gespeichert (übersteht Tab-Wechsel und App-Neustart), aber nicht ins Backup übernommen

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

id, Bild als Bytes (`data`, ArrayBuffer) mit Bildtyp (`type`, z. B. `image/webp`), verkleinert, Erstellungsdatum. Getrennt gespeichert, damit Listen schnell laden. Bewusst kein Blob: Safari hatte damit wiederholt Probleme in IndexedDB.

### `categories`

id, Name, Reihenfolge. Beim Löschen werden betroffene Zutaten auf „ohne Kategorie“ gesetzt.

### `settings`

letztes Backup, Standardfilter.

### Backup-Datei

JSON mit `app: "mixli"`, `formatVersion`, `exportedAt`, allen Tabellen und den Fotos als Base64. Aufbau und Prüfung in `src/backup/format.ts`, Migrationen alter Formate in `src/backup/migrate.ts`. Das Datum des letzten Backups gehört zum Gerät und steht nicht in der Datei.

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

### Phase 1 – Zutaten mit Foto ✓ (abgenommen 08.10.2026)

- [x] Zutat anlegen (4 Schritte) und bearbeiten (eine Seite), archivieren
- [x] Foto aufnehmen oder auswählen, verkleinern, speichern, anzeigen
- [x] Zutaten-Übersicht mit Suche und Kategorie-Chips; Kategorien verwalten
  - [x] Übersicht mit Suche, Kategorie-Chips und Archiv („Archiviert (n)“, Wiederherstellen in „Zutat bearbeiten“)
  - [x] Kategorien verwalten in „Mehr“ (umbenennen, sortieren, löschen)
- [x] Leerer Zustand beim ersten Start

### Phase 2 – Backup ✓ (abgenommen 08.10.2026)

- [x] Export als Datei über das Teilen-Menü (Download, wo Teilen fehlt)
- [x] Import mit Prüfung (Zod) und Wahl „ersetzen“ oder „zusammenführen“
  - Zusammenführen streng über die id: Zutaten und Müslis mit neuerem `updatedAt` gewinnen; Kategorien, Fotos und Einstellungen nur ergänzen
- [x] Erinnerung bei Backup älter als 14 Tage (Status in der Backup-Karte)
- [x] Auf dem iPhone testen: Export in iCloud Drive, Import beider Varianten

### Phase 3 – Mixen und Speichern (MVP fertig) ✓ (abgenommen 08.10.2026)

- [x] Zutaten hinzufügen, +/−, Mengen-Sheet mit Ziffernblock
  - [x] Mixen-Screen mit Ring, Übersicht, Zutatenkarten mit Stepper, Allergen-Chips, Hinzufügen-Sheet und Mengen-Sheet (erste Ziffer ersetzt den vorgegebenen Wert)
- [x] Live-Berechnung inkl. Rundung (mit Tests)
  - [x] Berechnung und Anzeige-Rundung als reine Funktionen mit Tests (`src/domain/mix.ts`, `src/domain/rounding.ts`)
- [x] Müsli mit Snapshot speichern, Liste, Detail, Duplizieren
  - [x] Entwurf, Speichern, Bearbeiten, Duplizieren, Löschen in der Datenbank mit Tests (`src/domain/mixDraft.ts`, `src/db/repo.ts`)
  - [x] Speichern-Sheet (Name, für wen, Notiz) und „Verwerfen“ mit Rückfrage im Mixen-Screen
  - [x] Müsli-Liste („Neueste | A–Z“, Duplizieren) und Detail (Zusammensetzung, Nährwerttabelle, Allergene, Notiz, Bearbeiten, Duplizieren, Löschen); vor Bearbeiten/Duplizieren Rückfrage, wenn in „Mixen“ etwas in Arbeit ist
- [x] Auf dem iPhone testen: Mischen, Mengen-Sheet, Speichern, Liste, Detail, Bearbeiten, Duplizieren, Löschen

### Phase 4 – Etikett

- [x] Etikett-Layout in 70 × 42,3 mm
  - [x] Inhalt als reine Funktion mit Tests (`src/domain/label.ts`): Zutaten absteigend nach Gewicht mit Anteilen, enthaltene Allergene fett in Klammern („Haferflocken (**Gluten**) 75 %“), Satz „Kann Spuren von … enthalten.“, Herstellungsdatum, Nährwerttabelle
  - [x] Etikett-Komponente in mm, Schrift wird bei vielen Zutaten bis 5,5 px kleiner (sonst Hinweis); Etikett-Sheet mit Vorschau im Müsli-Detail
- [x] Drucken, PDF, Bild teilen
  - [x] Druck-CSS: A4 ohne Seitenrand, 3 × 7 Etiketten an festen mm-Positionen (`src/domain/labelSheet.ts`, Standardmaße: seitlich randlos, oben/unten je 0,45 mm)
  - [x] „PDF“ = A4-Bogen mit 21 Etiketten, „Als Bild“ = ein Etikett als PNG in 600 dpi; über das Teilen-Menü (sonst Download), Bibliotheken werden erst beim Antippen geladen
- [ ] Auf dem iPhone testen: Vorschau, Fettschrift im Etikett und im Bild, Drucken aus der installierten App (Ränder!), PDF und Bild teilen

### Phase 5 – Filter

- [ ] Allergene ausschließen, Schalter „Spuren auch ausschließen“
- [ ] Nach Tags filtern
- [ ] Warnung, wenn ein gespeichertes Müsli den Filter verletzt

### Phase 6 – Feinschliff

- [ ] Motion-Feinschliff, animierte Zahlen, Übergänge
- [ ] App-Icon, Splashscreen
- [ ] Später optional: Barcode-Scan mit Open Food Facts
