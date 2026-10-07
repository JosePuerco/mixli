// Schritt „Basisdaten“: Karte mit Name und Marke, darunter Kategorie-Chips und Tag-Chips.
// Neue Kategorien werden sofort gespeichert (sie sollen auch in „Mehr“ auftauchen),
// neue Tags hängen nur an dieser Zutat und erscheinen ab dem Speichern überall.
import { useId, useState, type Ref } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AddChip, ChoiceChip } from '../ui/Chip'
import { FieldError } from '../ui/FieldError'
import { TextInputSheet } from '../ui/TextInputSheet'
import { addCategory, listCategories, listTags } from '../../db/repo'
import { DEFAULT_TAGS, mergeTags, normalizeTags, sameName } from '../../domain/ingredient'
import { NAME_MAX_LENGTH, type IngredientFormValues } from '../../domain/ingredientForm'

type BasicsValues = Pick<IngredientFormValues, 'name' | 'brand' | 'categoryId' | 'tags'>

interface BasicsFieldsProps {
  values: BasicsValues
  onChange: (patch: Partial<BasicsValues>) => void
  nameError?: string
  nameRef?: Ref<HTMLInputElement>
}

const inputClasses =
  'w-full bg-transparent py-1 text-body-large font-semibold text-text outline-none placeholder:text-text-placeholder'

export function BasicsFields({ values, onChange, nameError, nameRef }: BasicsFieldsProps) {
  const categories = useLiveQuery(listCategories, [], [])
  const storedTags = useLiveQuery(listTags, [], [...DEFAULT_TAGS])
  // Gespeicherte Tags plus die gerade neu angelegten dieser Zutat.
  const allTags = mergeTags([...storedTags, ...values.tags])
  const [sheet, setSheet] = useState<'category' | 'tag' | null>(null)
  const nameErrorId = useId()
  const categoryHeadingId = useId()
  const tagsHeadingId = useId()

  function toggleTag(tag: string) {
    const on = values.tags.some((t) => sameName(t, tag))
    onChange({ tags: on ? values.tags.filter((t) => !sameName(t, tag)) : [...values.tags, tag] })
  }

  return (
    <div className="flex flex-col gap-4.5">
      <div className="rounded-card bg-surface px-gap-lg py-1.5">
        <label className="flex flex-col gap-0.5 border-b border-divider py-2.5">
          <span className="text-caption font-semibold text-text-muted">Name</span>
          <input
            ref={nameRef}
            type="text"
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="z. B. Zarte Haferflocken"
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            enterKeyHint="next"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? nameErrorId : undefined}
            className={inputClasses}
          />
          {nameError && (
            <FieldError id={nameErrorId} className="pb-1">
              {nameError}
            </FieldError>
          )}
        </label>
        <label className="flex flex-col gap-0.5 py-2.5">
          <span className="text-caption font-semibold text-text-muted">Marke / Produkt (optional)</span>
          <input
            type="text"
            value={values.brand}
            onChange={(e) => onChange({ brand: e.target.value })}
            placeholder="z. B. Vollkorn, Bio"
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            enterKeyHint="done"
            className={inputClasses}
          />
        </label>
      </div>

      <section className="flex flex-col gap-2.5" aria-labelledby={categoryHeadingId}>
        <h2 id={categoryHeadingId} className="px-1 text-label">
          Kategorie
        </h2>
        <div className="flex flex-wrap gap-gap-sm">
          {categories.map((c) => (
            <ChoiceChip
              key={c.id}
              size="lg"
              selected={values.categoryId === c.id}
              onClick={() => onChange({ categoryId: values.categoryId === c.id ? undefined : c.id })}
            >
              {c.name}
            </ChoiceChip>
          ))}
          <AddChip onClick={() => setSheet('category')}>Neue Kategorie</AddChip>
        </div>
      </section>

      <section className="flex flex-col gap-2.5" aria-labelledby={tagsHeadingId}>
        <h2 id={tagsHeadingId} className="px-1 text-label">
          Tags
        </h2>
        <div className="flex flex-wrap gap-gap-sm">
          {allTags.map((t) => (
            <ChoiceChip
              key={t}
              size="lg"
              tone="accent"
              selected={values.tags.some((v) => sameName(v, t))}
              onClick={() => toggleTag(t)}
            >
              {t}
            </ChoiceChip>
          ))}
          <AddChip onClick={() => setSheet('tag')}>Tag</AddChip>
        </div>
      </section>

      <TextInputSheet
        open={sheet === 'category'}
        onClose={() => setSheet(null)}
        title="Neue Kategorie"
        placeholder="z. B. Flocken"
        onSubmit={async (name) => {
          onChange({ categoryId: await addCategory(name) })
          return undefined
        }}
      />
      <TextInputSheet
        open={sheet === 'tag'}
        onClose={() => setSheet(null)}
        title="Neuer Tag"
        placeholder="z. B. glutenfrei"
        onSubmit={(name) => {
          const existing = allTags.find((t) => sameName(t, name))
          if (existing && values.tags.some((t) => sameName(t, existing))) return 'Diesen Tag hat die Zutat schon'
          onChange({ tags: normalizeTags([...values.tags, existing ?? name]) })
          return undefined
        }}
      />
    </div>
  )
}
