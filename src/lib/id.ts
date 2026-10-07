// IDs für neue Datensätze. crypto.randomUUID gibt es nur in sicheren Kontexten (HTTPS, localhost) –
// beim Testen auf dem Handy über die LAN-Adresse (http://192.168…) fehlt es, daher der Ersatz.

export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40 // Version 4
  b[8] = (b[8] & 0x3f) | 0x80 // Variante
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
