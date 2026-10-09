import { describe, expect, it } from 'vitest'
import { bezier, cardIn, chipIn, screenChange, screenIn, stepIn } from './motion'

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

describe('stepIn', () => {
  it('gleitet vorwärts von rechts und zurück von links herein (28 px, 380 ms)', () => {
    expect(stepIn(1).initial.x).toBe(28)
    expect(stepIn(-1).initial.x).toBe(-28)
    expect(stepIn().transition.duration).toBeCloseTo(0.38)
  })
})

describe('screenChange', () => {
  it('blendet zwischen Tabs über', () => {
    expect(screenChange('/zutaten', '/mixen')).toBe('fade')
  })

  it('gleitet in ein Detail vorwärts und heraus zurück', () => {
    expect(screenChange('/muesli', '/muesli/abc')).toBe('forward')
    expect(screenChange('/zutaten', '/zutaten/neu')).toBe('forward')
    expect(screenChange('/muesli/abc', '/mixen')).toBe('back')
  })
})

describe('screenIn', () => {
  it('blendet Tabs ohne Bewegung in 200 ms ein', () => {
    const t = screenIn('fade')
    expect(t.initial.x).toBe(0)
    expect(t.animate.transition.duration).toBeCloseTo(0.2)
  })

  it('gleitet vorwärts von rechts, zurück von links (380 ms)', () => {
    expect(screenIn('forward').initial.x).toBe(28)
    expect(screenIn('back').initial.x).toBe(-28)
    expect(screenIn('back').animate.transition.duration).toBeCloseTo(0.38)
  })

  it('lässt den alten Screen stehen, bis der neue fertig ist', () => {
    expect(screenIn('fade').exit.transition.opacity.delay).toBeCloseTo(0.38)
  })
})
