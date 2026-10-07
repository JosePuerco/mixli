# Prototypen (Referenz)

Quellcode der klickbaren Prototypen aus dem Design-Canvas. Jede Datei ist ein Screen.

| Datei | Screen |
| --- | --- |
| `Leer.dc.html` | Erster Start (leerer Zustand) |
| `Zutaten.dc.html` | Zutaten-Übersicht |
| `ZutatNeu.dc.html` | Zutat anlegen (4 Schritte) |
| `Mixen.dc.html` | Mixen inkl. Hinzufügen-Sheet und Mengen-Sheet mit Ziffernblock |
| `Muesli.dc.html` | Müsli-Liste |
| `MuesliDetail.dc.html` | Müsli-Detail inkl. Etikett-Sheet |
| `Einstellungen.dc.html` | Mehr: Backup und Kategorien |
| `Etikett.dc.html` | Etikett in Originalgröße 70 × 42,3 mm |

**Wichtig:** Die Dateien laufen nur im Design-Canvas (eigenes Template-Format mit `<x-dc>`, `{{…}}`-Platzhaltern, `<sc-for>`/`<sc-if>` und einer `DCLogic`-Klasse). Sie sind **nicht** zum Kopieren gedacht, sondern als genaue Referenz für Layout, Abstände, Farben, Texte, Zustände und Animationen (`@keyframes` im `<style>`-Block). Die echte App wird in React + Tailwind + Motion neu gebaut.

Die Beispieldaten (Zutaten, Nährwerte, Kategorien) sind nur Platzhalter. Die echte App startet leer.
