// „Zutat bearbeiten“: dieselben Inhalte wie beim Anlegen, auf einer scrollbaren Seite.
// Dazu Archivieren bzw. Wiederherstellen und Löschen (nur, wenn kein Müsli und nicht der Mix in Arbeit sie enthält).
import { useId, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { FlowLayout } from '../components/ui/FlowLayout'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { ConfirmSheet } from '../components/ui/ConfirmSheet'
import { IconBack } from '../components/icons/Icons'
import { PhotoPicker } from '../components/ingredient/PhotoPicker'
import { BasicsFields } from '../components/ingredient/BasicsFields'
import { NutritionFields } from '../components/ingredient/NutritionFields'
import { AllergenGrid } from '../components/ingredient/AllergenGrid'
import { IngredientInUseSheet } from '../components/ingredient/IngredientInUseSheet'
import { db } from '../db/db'
import { photoToBlob } from '../db/photo'
import {
  deleteIngredient,
  ingredientUsage,
  isUnused,
  saveIngredient,
  setArchived,
  type IngredientUsage,
  type PhotoChange,
} from '../db/repo'
import type { Ingredient } from '../db/types'
import { parseNutritionInput, type NutritionErrors } from '../domain/nutrition'
import {
  formValuesFromIngredient,
  toDraft,
  validateName,
  type IngredientFormValues,
} from '../domain/ingredientForm'

/** Zurück dorthin, wo man herkam (meist die Liste); bei direktem Aufruf zur Liste. */
function useGoBack() {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key === 'default' ? navigate('/zutaten', { replace: true }) : navigate(-1))
}

export function ZutatBearbeitenScreen() {
  const { id = '' } = useParams()
  // undefined = lädt noch, null = gibt es nicht.
  const loaded = useLiveQuery(async () => {
    const ingredient = await db.ingredients.get(id)
    if (!ingredient) return null
    const photo = ingredient.photoId ? await db.photos.get(ingredient.photoId) : undefined
    return { ingredient, photo: photoToBlob(photo) }
  }, [id])

  if (loaded === undefined) return null
  if (loaded === null) return <NotFound />
  // key: Bei einer anderen Zutat das Formular neu aufbauen.
  return <EditForm key={id} ingredient={loaded.ingredient} initialPhoto={loaded.photo} />
}

function NotFound() {
  const goBack = useGoBack()
  return (
    <FlowLayout
      header={<EditHeader onBack={goBack} />}
      footer={
        <Button fullWidth onClick={goBack}>
          Zur Zutatenliste
        </Button>
      }
    >
      <p className="px-1 pt-8 text-center text-sm font-medium text-text-muted">Diese Zutat gibt es nicht mehr.</p>
    </FlowLayout>
  )
}

function EditHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <IconButton aria-label="Zurück" onClick={onBack}>
        <IconBack size={20} strokeWidth={1.8} />
      </IconButton>
      <h1 className="text-label font-semibold text-text-muted">Zutat bearbeiten</h1>
      <span className="w-11" aria-hidden="true" />
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-gap-md">
      <div className="flex items-baseline justify-between gap-gap-md px-1">
        <h2 id={headingId} className="text-h2">
          {title}
        </h2>
        {aside && <span className="text-caption text-text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

interface EditFormProps {
  ingredient: Ingredient
  initialPhoto: Blob | null
}

function EditForm({ ingredient, initialPhoto }: EditFormProps) {
  const goBack = useGoBack()
  const [initial] = useState(() => formValuesFromIngredient(ingredient))
  const [values, setValues] = useState<IngredientFormValues>(initial)
  const [photo, setPhoto] = useState<Blob | null>(initialPhoto)
  const [photoChanged, setPhotoChanged] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const [sheet, setSheet] = useState<'discard' | 'archive' | 'delete' | 'inUse' | null>(null)
  const [usage, setUsage] = useState<IngredientUsage>({ mixes: [], inDraft: false })
  const bodyRef = useRef<HTMLElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const noteId = useId()

  const dirty = photoChanged || JSON.stringify(values) !== JSON.stringify(initial)
  const nameError = showErrors ? validateName(values.name) : undefined
  const nutritionResult = parseNutritionInput(values.nutrition)
  const nutritionErrors: NutritionErrors = showErrors && !nutritionResult.ok ? nutritionResult.errors : {}

  function patch(p: Partial<IngredientFormValues>) {
    setValues((v) => ({ ...v, ...p }))
  }

  function back() {
    if (dirty) setSheet('discard')
    else goBack()
  }

  async function save() {
    const result = toDraft(values)
    if (!result.ok) {
      setShowErrors(true)
      // Zum ersten Fehler springen, sobald die Meldungen gezeichnet sind.
      requestAnimationFrame(() => {
        const first = bodyRef.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')
        first?.focus()
        first?.scrollIntoView({ block: 'center' })
      })
      return
    }
    const change: PhotoChange = !photoChanged ? { kind: 'keep' } : photo ? { kind: 'set', blob: photo } : { kind: 'remove' }
    setSaving(true)
    setSaveError(undefined)
    try {
      await saveIngredient(result.draft, change, ingredient.id)
      goBack()
    } catch {
      setSaveError('Speichern hat nicht geklappt. Bitte noch einmal versuchen.')
      setSaving(false)
    }
  }

  async function archive() {
    await setArchived(ingredient.id, true)
    goBack()
  }

  /** Erst prüfen, ob die Zutat noch verwendet wird: dann Hinweis statt Rückfrage. */
  async function askDelete() {
    const found = await ingredientUsage(ingredient.id)
    setUsage(found)
    setSheet(isUnused(found) ? 'delete' : 'inUse')
  }

  async function remove() {
    // Zwischen Rückfrage und Bestätigen kann die Zutat in den Mix gekommen sein (anderer Tab).
    const result = await deleteIngredient(ingredient.id)
    if (result.deleted) {
      goBack()
    } else {
      setUsage(result.usage)
      setSheet('inUse')
    }
  }

  return (
    <>
      <FlowLayout
        bodyRef={bodyRef}
        header={<EditHeader onBack={back} />}
        footer={
          <div className="flex flex-col gap-gap-sm">
            {saveError && (
              <p role="alert" className="text-center text-caption font-semibold text-text">
                {saveError}
              </p>
            )}
            <Button fullWidth onClick={save} disabled={photoBusy || saving}>
              Änderungen speichern
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-7">
          {ingredient.archived && (
            <div className="flex items-center justify-between gap-gap-md rounded-card bg-warning-bg py-2.5 pr-2.5 pl-gap-lg">
              <p className="text-sm font-semibold">Diese Zutat ist archiviert.</p>
              <Button variant="surface" size="xs" onClick={() => setArchived(ingredient.id, false)}>
                Wiederherstellen
              </Button>
            </div>
          )}

          <Section title="Foto">
            <PhotoPicker
              photo={photo}
              onChange={(p) => {
                setPhoto(p)
                setPhotoChanged(true)
              }}
              onBusyChange={setPhotoBusy}
            />
          </Section>

          <Section title="Basisdaten">
            <BasicsFields values={values} onChange={patch} nameError={nameError} nameRef={nameRef} />
          </Section>

          <Section title="Nährwerte" aside="pro 100 g">
            <NutritionFields
              values={values.nutrition}
              onChange={(key, value) => patch({ nutrition: { ...values.nutrition, [key]: value } })}
              errors={nutritionErrors}
            />
          </Section>

          <Section title="Allergene" aside="tippen: enthält → Spuren">
            <AllergenGrid
              values={values.allergens}
              onChange={(aid, state) => patch({ allergens: { ...values.allergens, [aid]: state } })}
            />
          </Section>

          <Section title="Notiz">
            <label htmlFor={noteId} className="sr-only">
              Notiz (optional)
            </label>
            <textarea
              id={noteId}
              value={values.note}
              onChange={(e) => patch({ note: e.target.value })}
              placeholder="Optional, z. B. wo gekauft"
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-card bg-surface px-gap-lg py-3.5 text-body-large font-medium text-text outline-none placeholder:text-text-placeholder"
            />
          </Section>

          <div className="flex flex-col gap-gap-sm">
            {!ingredient.archived && (
              <Button variant="surface" size="md" fullWidth onClick={() => setSheet('archive')}>
                Zutat archivieren
              </Button>
            )}
            <Button variant="surface" size="md" fullWidth onClick={askDelete}>
              Zutat löschen
            </Button>
          </div>
        </div>
      </FlowLayout>

      <ConfirmSheet
        open={sheet === 'discard'}
        onClose={() => setSheet(null)}
        title="Änderungen verwerfen?"
        text="Deine Änderungen an dieser Zutat gehen verloren."
        confirmLabel="Verwerfen"
        cancelLabel="Weiter bearbeiten"
        onConfirm={goBack}
      />
      <ConfirmSheet
        open={sheet === 'archive'}
        onClose={() => setSheet(null)}
        title="Zutat archivieren?"
        text={
          'Sie verschwindet aus der Liste und beim Mixen. Gespeicherte Müslis behalten sie, ' +
          'und du kannst sie jederzeit wiederherstellen.' +
          (dirty ? ' Nicht gespeicherte Änderungen gehen verloren.' : '')
        }
        confirmLabel="Archivieren"
        onConfirm={archive}
      />
      <ConfirmSheet
        open={sheet === 'delete'}
        onClose={() => setSheet(null)}
        title="Zutat löschen?"
        text={
          `„${ingredient.name}“ wird${ingredient.photoId ? ' mit Foto' : ''} endgültig gelöscht. ` +
          'Das lässt sich nicht rückgängig machen.' +
          (dirty ? ' Nicht gespeicherte Änderungen gehen verloren.' : '')
        }
        confirmLabel="Löschen"
        onConfirm={remove}
      />
      <IngredientInUseSheet open={sheet === 'inUse'} onClose={() => setSheet(null)} usage={usage} />
    </>
  )
}
