import { describe, expect, it } from 'vitest'
import type { IngredientSnapshot, MixItem } from '../db/types'
import type { AllergenId } from './allergens'
import {
  EMPTY_FILTER,
  filterChipLabels,
  filterReasons,
  isFilterActive,
  mixViolations,
  passesFilter,
  reasonLabel,
  reasonsLine,
  toggleAllergen,
  toggleTag,
  type FilterSubject,
  type MixFilter,
} from './filter'

const subject = (contains: AllergenId[] = [], traces: AllergenId[] = [], tags?: string[]): FilterSubject => ({
  allergensContains: contains,
  allergensTraces: traces,
  tags,
})

const filter = (f: Partial<MixFilter>): MixFilter => ({ ...EMPTY_FILTER, ...f })

const oats = subject(['gluten'], ['nuts'], ['vegan', 'Bio'])
const almonds = subject(['nuts'], ['peanuts'], ['vegan'])
const raisins = subject(['sulphites'], [], ['ohne Zuckerzusatz'])

describe('isFilterActive', () => {
  it('ist aus beim leeren Filter', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false)
  })

  it('der Spuren-Schalter allein filtert nichts', () => {
    expect(isFilterActive(filter({ excludeTraces: true }))).toBe(false)
  })

  it('ist an mit Allergen oder Tag', () => {
    expect(isFilterActive(filter({ excludedAllergens: ['nuts'] }))).toBe(true)
    expect(isFilterActive(filter({ requiredTags: ['vegan'] }))).toBe(true)
  })
})

describe('filterReasons', () => {
  it('leerer Filter: alles passt', () => {
    expect(filterReasons(oats, EMPTY_FILTER)).toEqual([])
    expect(passesFilter(subject(), EMPTY_FILTER)).toBe(true)
  })

  it('schließt Zutaten aus, die das Allergen enthalten', () => {
    const f = filter({ excludedAllergens: ['nuts'] })
    expect(filterReasons(almonds, f)).toEqual([{ kind: 'contains', allergen: 'nuts' }])
    expect(passesFilter(raisins, f)).toBe(true)
  })

  it('Spuren zählen nur mit Schalter', () => {
    expect(passesFilter(oats, filter({ excludedAllergens: ['nuts'] }))).toBe(true)
    expect(filterReasons(oats, filter({ excludedAllergens: ['nuts'], excludeTraces: true }))).toEqual([
      { kind: 'traces', allergen: 'nuts' },
    ])
  })

  it('nennt ein Allergen nicht doppelt, wenn es enthalten und als Spur eingetragen ist', () => {
    const both = subject(['nuts'], ['nuts'])
    expect(filterReasons(both, filter({ excludedAllergens: ['nuts'], excludeTraces: true }))).toEqual([
      { kind: 'contains', allergen: 'nuts' },
    ])
  })

  it('verlangt alle gewählten Tags', () => {
    const f = filter({ requiredTags: ['vegan', 'Bio'] })
    expect(passesFilter(oats, f)).toBe(true)
    expect(filterReasons(almonds, f)).toEqual([{ kind: 'missingTag', tag: 'Bio' }])
  })

  it('Tags ohne Rücksicht auf Groß-/Kleinschreibung', () => {
    expect(passesFilter(oats, filter({ requiredTags: ['VEGAN', 'bio'] }))).toBe(true)
  })

  it('ohne bekannte Tags fehlen alle verlangten Tags', () => {
    expect(filterReasons(subject(), filter({ requiredTags: ['vegan'] }))).toEqual([{ kind: 'missingTag', tag: 'vegan' }])
  })

  it('Reihenfolge: enthält, Spuren, Tags; Allergene wie in der festen Liste', () => {
    const x = subject(['nuts', 'gluten'], ['sesame'], [])
    const f = filter({ excludedAllergens: ['sesame', 'nuts', 'gluten'], excludeTraces: true, requiredTags: ['vegan'] })
    expect(filterReasons(x, f)).toEqual([
      { kind: 'contains', allergen: 'gluten' },
      { kind: 'contains', allergen: 'nuts' },
      { kind: 'traces', allergen: 'sesame' },
      { kind: 'missingTag', tag: 'vegan' },
    ])
  })
})

describe('reasonLabel / reasonsLine', () => {
  it('formuliert die Gründe auf Deutsch', () => {
    expect(reasonLabel({ kind: 'contains', allergen: 'nuts' })).toBe('enthält Schalenfrüchte')
    expect(reasonLabel({ kind: 'traces', allergen: 'sesame' })).toBe('Spuren: Sesam')
    expect(reasonLabel({ kind: 'missingTag', tag: 'vegan' })).toBe('nicht „vegan“')
    expect(
      reasonsLine([
        { kind: 'contains', allergen: 'gluten' },
        { kind: 'missingTag', tag: 'Bio' },
      ]),
    ).toBe('enthält Gluten · nicht „Bio“')
  })
})

describe('mixViolations', () => {
  const snap = (name: string, contains: AllergenId[] = [], traces: AllergenId[] = []): IngredientSnapshot => ({
    name,
    nutrition: { kj: 0, kcal: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, fiber: 0, protein: 0, salt: 0 },
    allergensContains: contains,
    allergensTraces: traces,
  })
  const items: MixItem[] = [
    { ingredientId: 'a', grams: 300, snapshot: snap('Haferflocken', ['gluten']) },
    { ingredientId: 'b', grams: 60, snapshot: snap('Mandeln', ['nuts']) },
    { ingredientId: 'c', grams: 40, snapshot: snap('Rosinen', [], ['nuts']) },
  ]
  const current = new Map([
    ['a', { tags: ['vegan'] }],
    ['b', { tags: ['vegan'] }],
    ['c', { tags: [] }],
  ])

  it('leerer Filter: keine Verstöße', () => {
    expect(mixViolations(items, current, EMPTY_FILTER)).toEqual([])
  })

  it('prüft Allergene aus dem Snapshot', () => {
    expect(mixViolations(items, current, filter({ excludedAllergens: ['nuts'] }))).toEqual([
      { ingredientId: 'b', name: 'Mandeln', reasons: [{ kind: 'contains', allergen: 'nuts' }] },
    ])
  })

  it('Snapshot zählt, nicht die aktuelle Zutat', () => {
    // Die aktuelle Zutat hätte inzwischen andere Allergene; geprüft wird trotzdem der Snapshot.
    const changed = new Map<string, { tags: string[]; allergensContains?: AllergenId[] }>([
      ...current,
      ['a', { tags: ['vegan'], allergensContains: ['nuts'] }],
    ])
    expect(mixViolations(items.slice(0, 1), changed, filter({ excludedAllergens: ['nuts'] }))).toEqual([])
  })

  it('prüft Tags an der aktuellen Zutat, fehlende Zutat erfüllt keine Tags', () => {
    const withoutA = new Map([...current].filter(([id]) => id !== 'a'))
    expect(mixViolations(items, withoutA, filter({ requiredTags: ['vegan'] })).map((v) => v.ingredientId)).toEqual([
      'a',
      'c',
    ])
  })

  it('ignoriert Zeilen mit 0 g', () => {
    const zero: MixItem[] = [{ ...items[1], grams: 0 }]
    expect(mixViolations(zero, current, filter({ excludedAllergens: ['nuts'] }))).toEqual([])
  })
})

describe('filterChipLabels', () => {
  it('zeigt Allergene in fester Reihenfolge, Spuren-Hinweis und Tags', () => {
    const f = filter({ excludedAllergens: ['nuts', 'gluten'], excludeTraces: true, requiredTags: ['vegan'] })
    expect(filterChipLabels(f)).toEqual(['Ohne Gluten', 'Ohne Schalenfrüchte', 'inkl. Spuren', 'vegan'])
  })

  it('kein Spuren-Hinweis ohne ausgeschlossene Allergene', () => {
    expect(filterChipLabels(filter({ excludeTraces: true }))).toEqual([])
  })
})

describe('toggleAllergen / toggleTag', () => {
  it('schaltet Allergene an und aus', () => {
    const on = toggleAllergen(EMPTY_FILTER, 'nuts')
    expect(on.excludedAllergens).toEqual(['nuts'])
    expect(toggleAllergen(on, 'nuts').excludedAllergens).toEqual([])
  })

  it('schaltet Tags an und aus, ohne Rücksicht auf Groß-/Kleinschreibung', () => {
    const on = toggleTag(EMPTY_FILTER, 'vegan')
    expect(on.requiredTags).toEqual(['vegan'])
    expect(toggleTag(on, 'Vegan').requiredTags).toEqual([])
  })
})
