import { describe, expect, it } from 'vitest'
import { bezier, cardIn, chipIn } from './motion'

describe('bezier', () => {
  it('liest cubic-bezier-Werte aus den Tokens', () => {
    expect(bezier('cubic-bezier(.2, .9, .3, 1.2)')).toEqual([0.2, 0.9, 0.3, 1.2])
  })

  it('lehnt unvollständige Angaben ab', () => {
    expect(() => bezier('cubic-bezier(.2, .9)')).toThrow()
  })
})

describe('cardIn', () => {
  it('staffelt Karten um 70 ms', () => {
    expect(cardIn(0).transition.delay).toBe(0)
    expect(cardIn(3).transition.delay).toBeCloseTo(0.21)
  })
})

describe('chipIn', () => {
  it('springt mit Überschwinger aus den Tokens auf', () => {
    expect(chipIn().animate.scale).toEqual([0.6, 1.08, 1])
    expect(chipIn().transition.scale.duration).toBeCloseTo(0.35)
  })

  it('gibt der Deckkraft einen eigenen Übergang ohne Zwischenzeitpunkte', () => {
    // Sonst gelten die drei Skalierungs-Zeitpunkte auch für die Deckkraft und der Chip blinkt.
    const { opacity, scale } = chipIn().transition
    expect(scale.times).toHaveLength(3)
    expect(opacity).not.toHaveProperty('times')
  })
})
