// Karte „Kategorien“ in „Mehr“: Liste mit Griff (Sortieren), Umbenennen per Tipp auf den Namen,
// Löschen mit Rückfrage; darunter Feld + „Hinzufügen“. Gelöschte Kategorien setzen ihre Zutaten
// auf „ohne Kategorie“ (repo.deleteCategory).
import { useId, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { Reorder, useDragControls, useReducedMotion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { FieldError } from '../ui/FieldError'
import { ConfirmSheet } from '../ui/ConfirmSheet'
import { TextInputSheet } from '../ui/TextInputSheet'
import { IconGrip, IconTrash } from '../icons/Icons'
import { db } from '../../db/db'
import { addCategory, deleteCategory, listCategories, renameCategory, reorderCategories } from '../../db/repo'
import type { Category } from '../../db/types'
import { sameName } from '../../domain/ingredient'
import { ease } from '../../design/motion'

function categoryCountLabel(n: number) {
  return n === 1 ? '1 Kategorie' : `${n} Kategorien`
}

export function CategoryManager() {
  const categories = useLiveQuery(listCategories, [], [])
  // Während des Ziehens die Reihenfolge lokal halten, gespeichert wird beim Loslassen.
  const [dragOrder, setDragOrder] = useState<Category[] | null>(null)
  const [draft, setDraft] = useState('')
  const [addError, setAddError] = useState<string>()
  const [justAdded, setJustAdded] = useState<string>()
  const [renaming, setRenaming] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const addErrorId = useId()

  const items = dragOrder ?? categories
  const deleteCount = useLiveQuery(
    () => (deleting ? db.ingredients.where('categoryId').equals(deleting.id).count() : 0),
    [deleting?.id],
    0,
  )

  async function persistOrder(order: Category[]) {
    await reorderCategories(order.map((c) => c.id))
    setDragOrder(null)
  }

  /** Mit der Tastatur verschieben: Pfeil hoch/runter auf dem Griff. */
  function moveBy(c: Category, delta: number) {
    const from = items.findIndex((x) => x.id === c.id)
    const to = from + delta
    if (to < 0 || to >= items.length) return
    const next = [...items]
    next.splice(to, 0, ...next.splice(from, 1))
    void persistOrder(next)
  }

  async function add(e: FormEvent) {
    e.preventDefault()
    const name = draft.trim()
    if (!name) {
      setAddError('Bitte einen Namen eingeben')
      return
    }
    if (categories.some((c) => sameName(c.name, name))) {
      setAddError('Diese Kategorie gibt es schon')
      return
    }
    setJustAdded(await addCategory(name))
    setDraft('')
  }

  return (
    <Card className="flex flex-col gap-gap-sm">
      <CardTitle aside={categoryCountLabel(categories.length)}>Kategorien</CardTitle>

      {items.length === 0 ? (
        <p className="py-2 text-sm font-medium text-text-muted">
          Noch keine Kategorien. Sie helfen, die Zutatenliste zu filtern.
        </p>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={setDragOrder} className="flex flex-col">
          {items.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              appear={c.id === justAdded}
              onDragEnd={() => dragOrder && void persistOrder(dragOrder)}
              onMove={(delta) => moveBy(c, delta)}
              onRename={() => setRenaming(c)}
              onDelete={() => setDeleting(c)}
            />
          ))}
        </Reorder.Group>
      )}

      <form onSubmit={add} className="flex flex-col gap-gap-sm pt-1">
        <div className="flex gap-gap-sm">
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setAddError(undefined)
            }}
            placeholder="Neue Kategorie"
            aria-label="Neue Kategorie"
            aria-invalid={addError ? true : undefined}
            aria-describedby={addError ? addErrorId : undefined}
            maxLength={40}
            autoComplete="off"
            enterKeyHint="done"
            className="h-11 min-w-0 flex-1 rounded-input bg-surface-muted px-4 text-body-large font-medium text-text outline-none placeholder:text-text-placeholder"
          />
          <Button type="submit" variant="dark" size="xs">
            Hinzufügen
          </Button>
        </div>
        {addError && (
          <FieldError id={addErrorId} className="px-1">
            {addError}
          </FieldError>
        )}
      </form>

      <TextInputSheet
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Kategorie umbenennen"
        placeholder="Name der Kategorie"
        submitLabel="Speichern"
        initialValue={renaming?.name}
        onSubmit={async (name) => {
          if (!renaming) return undefined
          return (await renameCategory(renaming.id, name)) ? undefined : 'Diese Kategorie gibt es schon'
        }}
      />
      <ConfirmSheet
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`„${deleting?.name ?? ''}“ löschen?`}
        text={
          deleteCount === 0
            ? 'Keine Zutat ist dieser Kategorie zugeordnet.'
            : `${deleteCount === 1 ? '1 Zutat steht' : `${deleteCount} Zutaten stehen`} danach ohne Kategorie da. Die Zutaten selbst bleiben erhalten.`
        }
        confirmLabel="Löschen"
        onConfirm={async () => {
          if (deleting) await deleteCategory(deleting.id)
          setDeleting(null)
        }}
      />
    </Card>
  )
}

interface CategoryRowProps {
  category: Category
  appear: boolean
  onDragEnd: () => void
  onMove: (delta: number) => void
  onRename: () => void
  onDelete: () => void
}

function CategoryRow({ category: c, appear, onDragEnd, onMove, onRename, onDelete }: CategoryRowProps) {
  const controls = useDragControls()
  const reduceMotion = useReducedMotion()

  function onGripKey(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      onMove(e.key === 'ArrowUp' ? -1 : 1)
    }
  }

  return (
    <Reorder.Item
      value={c}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      // Neue Zeile gleitet kurz von oben herein (wie im Prototyp, 300 ms).
      initial={appear && !reduceMotion ? { opacity: 0, y: -6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: ease.out }}
      // Beim Ziehen über den anderen Zeilen liegen und nicht durchscheinen.
      whileDrag={{ zIndex: 1 }}
      className="relative flex h-12 items-center gap-1 border-b border-divider bg-surface last:border-b-0"
    >
      <button
        type="button"
        aria-label={`${c.name} verschieben`}
        aria-description="Pfeiltasten hoch und runter verschieben die Kategorie"
        onPointerDown={(e: PointerEvent) => controls.start(e)}
        onKeyDown={onGripKey}
        className="-ml-2 flex size-touch shrink-0 cursor-grab touch-none items-center justify-center text-text-placeholder active:cursor-grabbing"
      >
        <IconGrip size={16} />
      </button>
      <button
        type="button"
        onClick={onRename}
        aria-label={`${c.name} umbenennen`}
        className="h-full min-w-0 flex-1 truncate text-left text-body"
      >
        {c.name}
      </button>
      <IconButton variant="ghost" aria-label={`${c.name} löschen`} onClick={onDelete} className="-mr-2">
        <IconTrash size={18} />
      </IconButton>
    </Reorder.Item>
  )
}
