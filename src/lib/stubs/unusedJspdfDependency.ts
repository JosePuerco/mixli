// Platzhalter für optionale Abhängigkeiten von jsPDF (html2canvas, DOMPurify, canvg). jsPDF lädt sie nur für
// doc.html() und SVG-Bilder – beides nutzt Mixli nicht. Ohne Platzhalter landen sie als ~380 kB im Build
// und im Offline-Speicher. Ersetzt werden sie in vite.config.ts (resolve.alias).
function unused(): never {
  throw new Error('Diese jsPDF-Funktion ist in Mixli nicht eingebaut.')
}

export default unused
export const Canvg = unused
