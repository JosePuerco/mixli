// „Zutat anlegen“ als geführter Ablauf in vier Schritten: Foto → Basisdaten → Nährwerte → Allergene.
// Geprüft wird beim Tippen auf „Weiter“; danach aktualisieren sich die Meldungen beim Tippen live.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { FlowLayout, FlowTitle } from '../components/ui/FlowLayout'
import { Button } from '../components/ui/Button'
import { ConfirmSheet } from '../components/ui/ConfirmSheet'
import { WizardHeader } from '../components/ingredient/WizardHeader'
import { PhotoPicker } from '../components/ingredient/PhotoPicker'
import { BasicsFields } from '../components/ingredient/BasicsFields'
import { NutritionFields } from '../components/ingredient/NutritionFields'
import { AllergenGrid } from '../components/ingredient/AllergenGrid'
import { stepIn } from '../design/motion'
import { saveIngredient } from '../db/repo'
import { parseNutritionInput, type NutritionErrors } from '../domain/nutrition'
import {
  emptyFormValues,
  hasInput,
  toDraft,
  validateName,
  type IngredientFormValues,
} from '../domain/ingredientForm'

const STEPS = ['Foto', 'Basisdaten', 'Nährwerte', 'Allergene'] as const
const LAST = STEPS.length - 1

export function ZutatNeuScreen() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [values, setValues] = useState<IngredientFormValues>(emptyFormValues)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  // Fehler erst zeigen, nachdem „Weiter“ einmal versucht wurde.
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const bodyRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const firstRender = useRef(true)

  // Neuer Schritt: nach oben scrollen und den Titel fokussieren (Screenreader liest ihn vor).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    bodyRef.current?.scrollTo({ top: 0 })
    titleRef.current?.focus({ preventScroll: true })
  }, [step])

  const nameError = showErrors ? validateName(values.name) : undefined
  const nutritionResult = parseNutritionInput(values.nutrition)
  const nutritionErrors: NutritionErrors = showErrors && !nutritionResult.ok ? nutritionResult.errors : {}

  function patch(p: Partial<IngredientFormValues>) {
    setValues((v) => ({ ...v, ...p }))
  }

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1)
    setShowErrors(false)
    setStep(next)
  }

  function close() {
    if (hasInput(values) || photo) setConfirmDiscard(true)
    else leave()
  }

  function leave() {
    navigate('/zutaten', { replace: true })
  }

  async function next() {
    if (step === 1 && validateName(values.name)) {
      setShowErrors(true)
      nameRef.current?.focus()
      return
    }
    if (step === 2 && !nutritionResult.ok) {
      setShowErrors(true)
      // Zum ersten fehlerhaften Feld springen – erst im nächsten Frame, wenn die Fehler gezeichnet sind.
      requestAnimationFrame(() =>
        bodyRef.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus(),
      )
      return
    }
    if (step < LAST) {
      goTo(step + 1)
      return
    }

    const result = toDraft(values)
    if (!result.ok) {
      // Sollte nicht vorkommen (Schritte sind geprüft) – zur Sicherheit zum betroffenen Schritt.
      goTo(result.errors.name ? 1 : 2)
      setShowErrors(true)
      return
    }
    setSaving(true)
    setSaveError(undefined)
    try {
      await saveIngredient(result.draft, photo ? { kind: 'set', blob: photo } : { kind: 'keep' })
      leave()
    } catch {
      setSaveError('Speichern hat nicht geklappt. Bitte noch einmal versuchen.')
      setSaving(false)
    }
  }

  return (
    <>
      <FlowLayout
        bodyRef={bodyRef}
        header={<WizardHeader step={step} stepNames={STEPS} onClose={close} onBack={() => goTo(step - 1)} />}
        footer={
          <div className="flex flex-col gap-gap-sm">
            {saveError && (
              <p role="alert" className="text-center text-caption font-semibold text-text">
                {saveError}
              </p>
            )}
            <Button fullWidth onClick={next} disabled={photoBusy || saving}>
              {step < LAST ? 'Weiter' : 'Zutat speichern'}
            </Button>
          </div>
        }
      >
        <motion.div key={step} {...(reduceMotion ? {} : stepIn(direction))} className="flex flex-col gap-gap-lg">
          {step === 0 && (
            <>
              <FlowTitle titleRef={titleRef} title="Foto" text="Damit du die Zutat überall sofort erkennst." />
              <PhotoPicker photo={photo} onChange={setPhoto} onBusyChange={setPhotoBusy} />
            </>
          )}
          {step === 1 && (
            <>
              <FlowTitle titleRef={titleRef} title="Basisdaten" text="Name und Marke, so wie auf der Packung." />
              <BasicsFields values={values} onChange={patch} nameError={nameError} nameRef={nameRef} />
            </>
          )}
          {step === 2 && (
            <>
              <FlowTitle titleRef={titleRef} title="Nährwerte" text="Pro 100 g, von der Packung abtippen." />
              <NutritionFields
                values={values.nutrition}
                onChange={(key, value) => patch({ nutrition: { ...values.nutrition, [key]: value } })}
                errors={nutritionErrors}
              />
              <p className="px-1 text-caption text-text-muted">
                kJ wird aus kcal vorgeschlagen, falls die Packung nur einen Wert nennt.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <FlowTitle
                titleRef={titleRef}
                title="Allergene"
                text="Einmal tippen: enthält. Zweimal: kann Spuren enthalten."
              />
              <AllergenGrid
                values={values.allergens}
                onChange={(id, state) => patch({ allergens: { ...values.allergens, [id]: state } })}
              />
            </>
          )}
        </motion.div>
      </FlowLayout>

      <ConfirmSheet
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Zutat verwerfen?"
        text="Deine Eingaben gehen verloren."
        confirmLabel="Verwerfen"
        cancelLabel="Weiter bearbeiten"
        onConfirm={leave}
      />
    </>
  )
}
