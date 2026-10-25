# Changelog

Alle Änderungen an Mixli, neueste oben. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionsnummern nach [Semantic Versioning](https://semver.org/lang/de/) (`MAJOR.MINOR.PATCH`):

- **PATCH** – Fehlerbehebungen und kleine Anpassungen ohne neue Funktion
- **MINOR** – neue Funktionen, alte Daten und Backups passen weiter
- **MAJOR** – Änderungen, bei denen etwas nicht mehr zusammenpasst (z. B. alte Backups lassen sich nicht mehr einlesen)

Jede Version hat in Git einen Tag `vX.Y.Z`; der Ablauf steht in `CLAUDE.md` unter „Versionen“.

## [1.0.1] – 2026-10-25

### Behoben

- Backup-Export auf Android: Chrome teilt keine JSON-Dateien, der Knopf wechselte nur auf „Backup teilen“. Das Backup wird dort jetzt als Download gespeichert.
- Etikett „Als Bild“: Scheitert auch der zweite Tipp, wird das Bild heruntergeladen statt erneut zu warten.

### Geändert

- Kein Zwei-Finger-Zoom und kein Zoom per Doppeltippen mehr – die App verhält sich wie eine native App.

## [1.0.0] – 2026-10-09

Erste produktive Version.

### Neu

- Zutaten mit Foto, Nährwerten pro 100 g, Allergenen („enthält“ und „Spuren“) und Kategorien
- Mixen nach Gewicht mit Nährwerten pro 100 g, Speichern als Müsli mit Snapshot der Zutatenwerte
- Etikett 70 × 42,3 mm: Drucken auf A4-Bogen (3 × 7), als Bild teilen
- Filter nach Kategorien und Allergenen
- Backup aller Daten inkl. Fotos als Datei, Import mit „Zusammenführen“ oder „Alles ersetzen“
- Offline-PWA mit App-Icon und Startbildern

[1.0.1]: https://github.com/JosePuerco/mixli/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/JosePuerco/mixli/releases/tag/v1.0.0
