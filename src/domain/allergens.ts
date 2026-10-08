// Die 14 EU-Hauptallergene (Verordnung (EU) Nr. 1169/2011, Anhang II). Fest im Code, Reihenfolge wie in der Oberfläche.
// `dative` ist die Form für den Spuren-Satz auf dem Etikett: „Kann Spuren von Erdnüssen enthalten.“

export const ALLERGENS = [
  { id: 'gluten', label: 'Gluten', dative: 'Gluten' },
  { id: 'crustaceans', label: 'Krebstiere', dative: 'Krebstieren' },
  { id: 'eggs', label: 'Eier', dative: 'Eiern' },
  { id: 'fish', label: 'Fisch', dative: 'Fisch' },
  { id: 'peanuts', label: 'Erdnüsse', dative: 'Erdnüssen' },
  { id: 'soy', label: 'Soja', dative: 'Soja' },
  { id: 'milk', label: 'Milch', dative: 'Milch' },
  { id: 'nuts', label: 'Schalenfrüchte', dative: 'Schalenfrüchten' },
  { id: 'celery', label: 'Sellerie', dative: 'Sellerie' },
  { id: 'mustard', label: 'Senf', dative: 'Senf' },
  { id: 'sesame', label: 'Sesam', dative: 'Sesam' },
  { id: 'sulphites', label: 'Sulfite', longLabel: 'Schwefeldioxid/Sulfite', dative: 'Sulfiten' },
  { id: 'lupin', label: 'Lupinen', dative: 'Lupinen' },
  { id: 'molluscs', label: 'Weichtiere', dative: 'Weichtieren' },
] as const

export type AllergenId = (typeof ALLERGENS)[number]['id']

/** Kurzer Anzeigename, z. B. „Schalenfrüchte“. */
export function allergenLabel(id: AllergenId): string {
  return ALLERGENS.find((a) => a.id === id)?.label ?? id
}

/** Dativ für „Kann Spuren von … enthalten.“, z. B. „Schalenfrüchten“. */
export function allergenDative(id: AllergenId): string {
  return ALLERGENS.find((a) => a.id === id)?.dative ?? id
}
