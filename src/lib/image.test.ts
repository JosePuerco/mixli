import { describe, expect, it } from 'vitest'
import { downscaleSteps, fitWithin } from './image'

describe('fitWithin', () => {
  it('verkleinert Hochformat auf 800 px an der langen Kante', () => {
    expect(fitWithin(3024, 4032)).toEqual({ width: 600, height: 800 })
  })

  it('verkleinert Querformat', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 800, height: 600 })
  })

  it('vergrößert kleine Bilder nicht', () => {
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 })
  })

  it('wird nie kleiner als 1 px', () => {
    expect(fitWithin(10000, 2)).toEqual({ width: 800, height: 1 })
  })
})

describe('downscaleSteps', () => {
  it('halbiert schrittweise und endet genau auf der Zielgröße', () => {
    const steps = downscaleSteps({ width: 4032, height: 3024 }, { width: 800, height: 600 })
    expect(steps).toEqual([
      { width: 2016, height: 1512 },
      { width: 1008, height: 756 },
      { width: 800, height: 600 },
    ])
  })

  it('braucht bei kleinem Unterschied nur einen Schritt', () => {
    expect(downscaleSteps({ width: 1000, height: 750 }, { width: 800, height: 600 })).toEqual([
      { width: 800, height: 600 },
    ])
  })
})
