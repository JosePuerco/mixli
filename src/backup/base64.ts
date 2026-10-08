// Bytes ↔ Base64 für die Fotos in der Backup-Datei. In Stücken, weil String.fromCharCode
// mit sehr vielen Argumenten auf einmal den Stack sprengt (Fotos haben ~100 KB).

const CHUNK = 0x8000

export function bytesToBase64(data: ArrayBuffer): string {
  const bytes = new Uint8Array(data)
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

export function base64ToBytes(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
