// Die 14 EU-Hauptallergene (Verordnung (EU) Nr. 1169/2011, Anhang II). Fest im Code, Reihenfolge wie in der Oberfläche.

export const ALLERGENS = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'crustaceans', label: 'Krebstiere' },
  { id: 'eggs', label: 'Eier' },
  { id: 'fish', label: 'Fisch' },
  { id: 'peanuts', label: 'Erdnüsse' },
  { id: 'soy', label: 'Soja' },
  { id: 'milk', label: 'Milch' },
  { id: 'nuts', label: 'Schalenfrüchte' },
  { id: 'celery', label: 'Sellerie' },
  { id: 'mustard', label: 'Senf' },
  { id: 'sesame', label: 'Sesam' },
  { id: 'sulphites', label: 'Sulfite', longLabel: 'Schwefeldioxid/Sulfite' },
  { id: 'lupin', label: 'Lupinen' },
  { id: 'molluscs', label: 'Weichtiere' },
] as const

export type AllergenId = (typeof ALLERGENS)[number]['id']
