import { describe, expect, it } from 'vitest'
import type { IngredientSnapshot, MixItem, Nutrition } from '../db/types'
import { NBSP } from '../lib/format'
import type { AllergenId } from './allergens'
import { buildLabel, joinGerman, labelFileName, type LabelData } from './label'

const zero: Nutrition = {
  kj: 0, kcal: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, fiber: 0, protein: 0, salt: 0,
}

function snap(
  name: string,
  nutrition: Partial<Nutrition>,
  contains: AllergenId[] = [],
  traces: AllergenId[] = [],
): IngredientSnapshot {
  return { name, nutrition: { ...zero, ...nutrition }, allergensContains: contains, allergensTraces: traces }
}

const item = (ingredientId: string, grams: number, snapshot: IngredientSnapshot): MixItem => ({ ingredientId, grams, snapshot })

const oats = snap('Haferflocken', { kcal: 372, kj: 1574, fat: 7, saturatedFat: 1.3, carbs: 58.7, sugar: 0.7, fiber: 10, protein: 13.5, salt: 0.01 }, ['gluten'])
const almonds = snap('Mandeln', { kcal: 600, kj: 2510, fat: 52, saturatedFat: 4, carbs: 6, sugar: 4, fiber: 12, protein: 22, salt: 0.02 }, ['nuts'], ['peanuts'])
const raisins = snap('Rosinen', { kcal: 300, kj: 1270, fat: 0.5, saturatedFat: 0.1, carbs: 69, sugar: 65, fiber: 4, protein: 2.5, salt: 0.05 }, [], ['nuts'])

const createdAt = new Date(2026, 9, 7, 12, 0)

/** Beispiel aus PLAN.md („Berechnung“), absichtlich nicht nach Gewicht sortiert. */
const planMix = {
  name: 'Frühstück Basic',
  createdAt,
  items: [item('r', 40, raisins), item('o', 300, oats), item('m', 60, almonds)],
}

/** Geschützte Leerzeichen als normale, damit die Erwartungen lesbar bleiben. */
const plain = (s: string) => s.replaceAll(NBSP, ' ')

function label(mix = planMix): LabelData {
  const data = buildLabel(mix)
  if (!data) throw new Error('Etikett erwartet')
  return data
}

describe('joinGerman', () => {
  it('verbindet mit Komma und „und“', () => {
    expect(joinGerman([])).toBe('')
    expect(joinGerman(['Sesam'])).toBe('Sesam')
    expect(joinGerman(['Milch', 'Sesam'])).toBe('Milch und Sesam')
    expect(joinGerman(['Eiern', 'Milch', 'Sesam'])).toBe('Eiern, Milch und Sesam')
  })
})

describe('buildLabel', () => {
  it('übernimmt Name und Gesamtmenge', () => {
    const l = label()
    expect(l.name).toBe('Frühstück Basic')
    expect(plain(l.total)).toBe('400 g')
  })

  it('sortiert die Zutaten absteigend nach Gewicht, mit Anteilen', () => {
    expect(label().ingredients.map((i) => [i.name, plain(i.share)])).toEqual([
      ['Haferflocken', '75 %'],
      ['Mandeln', '15 %'],
      ['Rosinen', '10 %'],
    ])
  })

  it('lässt gleich schwere Zutaten in der Reihenfolge des Mixes', () => {
    const l = label({ ...planMix, items: [item('m', 50, almonds), item('o', 50, oats)] })
    expect(l.ingredients.map((i) => i.name)).toEqual(['Mandeln', 'Haferflocken'])
  })

  it('nennt die enthaltenen Allergene je Zutat in der festen Reihenfolge', () => {
    const mixed = snap('Nussmix', {}, ['sesame', 'nuts', 'milk'])
    const l = label({ ...planMix, items: [...planMix.items, item('n', 10, mixed)] })
    expect(l.ingredients.map((i) => i.allergens)).toEqual([
      ['Gluten'],
      ['Schalenfrüchte'],
      [],
      ['Milch', 'Schalenfrüchte', 'Sesam'],
    ])
  })

  it('bildet den Spuren-Satz ohne Allergene, die schon enthalten sind', () => {
    // Spuren: Erdnüsse (Mandeln) und Schalenfrüchte (Rosinen) – Schalenfrüchte stecken aber schon in den Mandeln.
    expect(label().traces).toBe('Kann Spuren von Erdnüssen enthalten.')
  })

  it('nennt mehrere Spuren im Dativ, verbunden mit „und“', () => {
    const s = snap('Schoko', {}, [], ['milk', 'eggs', 'sulphites'])
    expect(label({ ...planMix, items: [item('s', 10, s)] }).traces).toBe(
      'Kann Spuren von Eiern, Milch und Sulfiten enthalten.',
    )
  })

  it('hat ohne Spuren keinen Spuren-Satz', () => {
    expect(label({ ...planMix, items: [item('o', 100, oats)] }).traces).toBeNull()
  })

  it('nennt das Herstellungsdatum (Tag des ersten Speicherns)', () => {
    expect(label().madeOn).toBe('Hergestellt am 07.10.2026.')
  })

  it('zeigt die Nährwerte pro 100 g gerundet wie im Supermarkt', () => {
    // Rechnung siehe PLAN.md: z. B. Eiweiß 13,7 g → „14 g“, Salz 0,0155 g → „0,02 g“.
    expect(label().nutrition.map((r) => [r.label, plain(r.value), r.sub])).toEqual([
      ['Energie', '1684 kJ / 399 kcal', false],
      ['Fett', '13 g', false],
      ['davon gesättigte Fetts.', '1,6 g', true],
      ['Kohlenhydrate', '52 g', false],
      ['davon Zucker', '7,6 g', true],
      ['Ballaststoffe', '9,7 g', false],
      ['Eiweiß', '14 g', false],
      ['Salz', '0,02 g', false],
    ])
  })

  it('ignoriert Zeilen mit 0 g', () => {
    const l = label({ ...planMix, items: [item('o', 100, oats), item('m', 0, almonds)] })
    expect(l.ingredients.map((i) => i.name)).toEqual(['Haferflocken'])
    expect(l.traces).toBeNull()
  })

  it('liefert null für ein Müsli ohne Menge', () => {
    expect(buildLabel({ ...planMix, items: [] })).toBeNull()
    expect(buildLabel({ ...planMix, items: [item('o', 0, oats)] })).toBeNull()
  })
})

describe('labelFileName', () => {
  it('macht aus dem Namen einen Dateinamen ohne Umlaute und Sonderzeichen', () => {
    expect(labelFileName('Frühstück Basic', 'pdf')).toBe('mixli-etikett-fruehstueck-basic.pdf')
    expect(labelFileName('Crème & Nüsse / Größe XL!', 'png')).toBe('mixli-etikett-creme-nuesse-groesse-xl.png')
  })

  it('kommt ohne verwertbaren Namen aus', () => {
    expect(labelFileName('  ?!  ', 'png')).toBe('mixli-etikett.png')
  })

  it('kürzt sehr lange Namen', () => {
    const name = labelFileName('Sehr '.repeat(30), 'pdf')
    expect(name.length).toBeLessThanOrEqual('mixli-etikett-.pdf'.length + 60)
    expect(name).not.toMatch(/-\.pdf$/)
  })
})
