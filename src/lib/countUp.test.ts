import { describe, expect, it } from 'vitest'
import { countValue } from './countUp'

describe('countValue', () => {
  it('zeigt am Ziel den exakten Wert', () => {
    expect(countValue(12.5, 12.5, 1)).toBe(12.5)
  })

  it('rundet unterwegs auf den Schritt', () => {
    expect(countValue(312.4, 400, 1)).toBe(312)
    expect(countValue(312.6, 400, 1)).toBe(313)
  })

  it('lässt Zwischenwerte ohne Schritt unverändert', () => {
    expect(countValue(7.83, 9)).toBe(7.83)
  })
})
