import { describe, expect, it } from 'vitest'
import { bezier, cardIn } from './motion'

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
