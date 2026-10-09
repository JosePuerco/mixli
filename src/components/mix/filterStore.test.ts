import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EMPTY_FILTER, type MixFilter } from '../../domain/filter'
import { getFilter, resetFilters, setFilter, subscribe } from './filterStore'

const nuts: MixFilter = { excludedAllergens: ['nuts'], excludeTraces: false, requiredTags: [] }
const vegan: MixFilter = { excludedAllergens: [], excludeTraces: false, requiredTags: ['vegan'] }

beforeEach(() => resetFilters())

describe('filterStore', () => {
  it('beginnt mit leeren Filtern', () => {
    expect(getFilter('mix')).toEqual(EMPTY_FILTER)
    expect(getFilter('muesli')).toEqual(EMPTY_FILTER)
  })

  it('Mixen und Müslis sind getrennt', () => {
    setFilter('mix', nuts)
    setFilter('muesli', vegan)
    expect(getFilter('mix')).toEqual(nuts)
    expect(getFilter('muesli')).toEqual(vegan)
  })

  it('setzt einzeln oder beide zurück', () => {
    setFilter('mix', nuts)
    setFilter('muesli', vegan)
    resetFilters(['mix'])
    expect(getFilter('mix')).toEqual(EMPTY_FILTER)
    expect(getFilter('muesli')).toEqual(vegan)
    resetFilters()
    expect(getFilter('muesli')).toEqual(EMPTY_FILTER)
  })

  it('meldet Änderungen, bis man sich abmeldet', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)
    setFilter('mix', nuts)
    resetFilters()
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    setFilter('mix', nuts)
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
