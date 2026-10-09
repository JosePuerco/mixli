# Mixli – Design-Vorgabe (Stil B „Weich & ruhig“)

Verbindlich für alle Screens. Werte stehen maschinenlesbar in `tokens.json`, Bilder in `screenshots/`, Referenz-Code in `prototypes/`.

## Charakter

- Clean, minimalistisch, warm. Fühlt sich an wie eine native App, nicht wie eine Webseite.
- Fotos der Zutaten stehen im Mittelpunkt.
- Warmes Off-White als Grund, weiße Karten darauf, Olivgrün als einziger Akzent.
- Nur heller Modus.
- Keine Formularwüsten: Eingaben in Karten gruppiert, große Touch-Ziele, Bottom-Sheets statt Popups.

## Grundlagen

| Element | Vorgabe |
| --- | --- |
| Hintergrund | `#F4F3EF` |
| Karten, Sheets | `#FFFFFF`, Radius 24 px, kein Schatten, kein Rahmen |
| Text / gedämpft | `#1C1C1A` / `#6A6964` |
| Akzent | `#3F5A2E` (Primär-Buttons, aktiver Fortschritt, Haupt-Segment) |
| Schrift | Manrope (selbst gehostet, im Build gebündelt), Zahlen `tabular-nums` |
| Screen-Rand | 16 px, oben 52–56 px Abstand (Safe Area beachten: `env(safe-area-inset-*)`) |
| Abstände | 8 / 12 / 16 px |
| Touch-Ziele | mindestens 44 × 44 px |

## Komponenten

### Schwebende Navigation

- Pille, 64 px hoch, Radius 32, Farbe `#1C1C1A`, 16 px Abstand zu den Seiten, 24 px zum unteren Rand (plus Safe Area).
- Vier Tabs: **Zutaten**, **Mixen**, **Müslis**, **Mehr**.
- Aktiver Tab: helle Pille (`#F4F3EF`) mit Icon und Label. Inaktive Tabs: nur Icon in `#BDBAB0`.
- Icons: dünne Linien-Icons (1,7 px Strich), keine Emojis.

### Zutatenkarte

- Weiße Karte, 8 px Innenabstand, Foto oben (Radius 18, ca. 96–104 px hoch), darunter Name (15/700) und Zusatzzeile (12, gedämpft).
- Im Mixen-Screen zusätzlich: farbiger Punkt oben links im Foto (Segmentfarbe), Anteil in %, Stepper.
- Raster: 2 Spalten, 12 px Abstand.

### Stepper (Menge)

- Graue Pille (`#F4F3EF`) über die Kartenbreite: links „−“, Mitte Grammzahl als weißer Button, rechts „+“.
- ± ändert in 10-g-Schritten. Bei 0 g fliegt die Zutat aus dem Mix.
- Tippen auf die Grammzahl öffnet das **Mengen-Sheet**.

### Mengen-Sheet

- Name der Zutat, große Zahl (56/800) mit „g“.
- Schnellwerte als Pillen: 10 g, 25 g, 50 g.
- Ziffernblock 3 × 4: 1–9, „,“, 0, ⌫ (Tasten 56 px hoch, Radius 18, `#F4F3EF`).
- Maximal 4 Vorkommastellen und 1 Nachkommastelle.
- Button „Übernehmen“ (Akzent, 54 px, volle Breite). Tippen auf den Hintergrund bricht ab.

### Bottom-Sheet (allgemein)

- Weiß, Radius oben 28, Griff-Leiste 40 × 5 px, Hintergrund-Overlay `rgba(28,28,26,.35)`.
- Fährt von unten herein, Overlay blendet ein.

### Chips

- Auswahl-Chips: Pille 36–38 px, weiß; ausgewählt `#1C1C1A` mit weißer Schrift. Tags ausgewählt in Akzentfarbe.
- Allergen-Chips: „enthält“ weiß gefüllt; „Spuren“ mit gestricheltem Rahmen und Präfix „Spuren:“.
- „+ Neu“-Chips: gestrichelter Rahmen `#A8A59B`.

### Buttons

- Primär: Akzent, weiße Schrift, Pille, 52–56 px.
- Sekundär: weiß bzw. `#F4F3EF`, dunkle Schrift.
- Icon-Buttons: Kreis 44 px, weiß.
- FAB (Zutaten): Kreis 60 px, Akzent, Plus-Icon, leichter Schatten, über der Navigation.

### Ring (Zusammensetzung)

- Donut 120 px, Strich 12 px, Grundring `#EDEBE5`.
- Ein Segment pro Zutat in Reihenfolge, Farben aus `segments`, 3 px Lücke zwischen Segmenten.
- In der Mitte Gesamtmenge (24/800) und „gesamt“.

## Motion

| Ereignis | Verhalten |
| --- | --- |
| Karte erscheint | Ploppt mit Federeffekt rein (Skalierung .85 → 1, leicht von unten), ca. 450 ms, gestaffelt um 70 ms |
| Nährwerte, Gesamtmenge ändern sich | Zahlen zählen zum neuen Wert, ca. 480 ms, ease-out |
| Mengen ändern sich | Ring-Segmente gleiten in die neue Größe, ca. 550 ms |
| Sheet öffnet | Fährt von unten hoch (ca. 420 ms), Overlay blendet ein (250 ms) |
| Allergen-Chip kommt dazu | Springt kurz auf (Overshoot 1,08) |
| Schritt im Ablauf wechselt | Inhalt gleitet von rechts herein (28 px, 380 ms) |
| Tab wechselt | Neuer Screen blendet über den alten ein (200 ms), Navigation bleibt stehen |
| Detail öffnet / schließt | Wie ein Schritt: von rechts herein (28 px, 380 ms), zurück von links |
| Fortschrittsbalken | Segmente färben sich weich ein |
| Button gedrückt | Gibt nach (Skalierung .92, 150 ms) |
| Filter schließt Zutat aus | Zeile blendet auf 35 % Deckkraft, nicht wählbar |
| Bewegung reduzieren | Alle Animationen aus, Zustandswechsel sofort |

Umsetzung mit Motion (`motion/react`), Federn statt fester Kurven wo sinnvoll.

## Screens

### 1. Erster Start (leerer Zustand)

- Mittig: illustrierte Schale (Linien-Illustration, schwebt sanft), Flocken rieseln hinein.
- „Willkommen bei Mixli“, kurzer Text, Buttons „Erste Zutat anlegen“ (primär) und „Backup importieren“.
- Wird angezeigt, solange keine Zutaten existieren.

### 2. Zutaten

- Titel „Zutaten“ mit Anzahl darüber.
- Suchfeld (weiße Pille, 48 px), filtert live.
- Kategorie-Chips horizontal scrollbar: „Alle“ + eigene Kategorien. Ohne Kategorien nur „Alle“ bzw. keine Chip-Leiste.
- Fotoraster mit Name, Marke · kcal, ein Allergen-Chip.
- FAB „+“ öffnet „Zutat anlegen“.

### 3. Zutat anlegen (4 Schritte)

Oben: Schließen bzw. Zurück, „Schritt n von 4 · Name“, 4-teiliger Fortschrittsbalken. Unten: „Weiter“ bzw. im letzten Schritt „Zutat speichern“.

1. **Foto:** große Fläche (320 px), Buttons „Kamera“ und „Galerie“ (`<input type="file" accept="image/*" capture="environment">` bzw. ohne `capture`), Bestätigung mit Häkchen-Animation. Überspringbar.
2. **Basisdaten:** Karte mit Name und Marke, darunter Kategorie-Chips (+ Neue Kategorie) und Tag-Chips (+ Tag).
3. **Nährwerte:** eine Karte, 9 Zeilen (Label links, Feld rechtsbündig mit Einheit), „davon“-Zeilen eingerückt und gedämpft. Felder mit `inputmode="decimal"`. kJ zeigt den aus kcal berechneten Wert als Vorschlag.
4. **Allergene:** 14 Kacheln im 2er-Raster. Tippen schaltet um: nicht enthalten → enthält (dunkel gefüllt) → Spuren (gestrichelt) → nicht enthalten. Status steht klein unter dem Namen.

„Zutat bearbeiten“: dieselben Inhalte auf einer scrollbaren Seite.

### 4. Mixen

- Titel „Neue Mischung“ / Name, rechts „Speichern“ (Akzent-Pille).
- Übersichtskarte: Ring links, rechts kcal groß und Eiweiß, Kohlenhydrate, Fett.
- Zutatenkarten im Raster mit Stepper, letzte Kachel „Zutat hinzufügen“ (gestrichelt).
- Allergen-Chips darunter.
- „Zutat hinzufügen“ öffnet Sheet: Filter-Chips oben (z. B. „Ohne Schalenfrüchte“), Liste mit Foto, Name, Allergen-Zeile, kcal, Plus. Neue Zutat startet mit 50 g.

### 5. Müslis

- Titel „Meine Müslis“, Anzahl, Sortier-Umschalter „Neueste | A–Z“.
- Karte je Müsli: Name, „Für … · Datum“, Gesamtmenge rechts, Anteilsbalken, Zutatenzeile; Fußzeile mit Allergenen und „Duplizieren“.
- Antippen öffnet Detail.

### 6. Müsli-Detail

- Zurück, „Bearbeiten“.
- Für wen · Datum, Name groß.
- Karte Zusammensetzung (Balken, Zeilen mit Farbpunkt, Name, %, Gramm).
- Karte Nährwerte pro 100 g (volle Tabelle, gerundet).
- Allergen-Chips.
- Unten: „Duplizieren“ und „Etikett“ (primär). „Etikett“ öffnet Sheet mit Vorschau und „Drucken“, „PDF“, „Als Bild“.

### 7. Mehr

- Karte Backup: Status (orange „Letztes Backup vor X Tagen“ ab 14 Tagen, grün nach Export), Hinweistext, „Exportieren“ / „Importieren“.
- Karte Kategorien: Liste mit Griff (Sortieren), Löschen; Feld + „Hinzufügen“.
- Karte Info: Etikettenformat, Version.

## Etikett

- Format **70 × 42,3 mm** (A4-Bogen, 3 × 7 Etiketten). Druck-CSS mit `@page` A4 und exakten Positionen; Rand des Bogens laut Etikettenhersteller.
- Aufbau: Kopfzeile Name links, Gesamtmenge rechts, Linie darunter. Zwei Spalten:
  - links (ca. 104 px): „Zutaten:“ mit Anteilen in %, Allergene **fett** im Zutatennamen, darunter Herstellungsdatum und „Nährwerte aus Herstellerangaben berechnet.“
  - rechts: Nährwerttabelle „pro 100 g“ mit allen 8 Pflichtwerten, „davon“-Zeilen eingerückt.
- Schrift ca. 7 px (≈ 5 pt), Kopfzeile 11 px fett, nur Schwarz auf Weiß.
- Referenz: `prototypes/Etikett.dc.html` und Screenshot.
