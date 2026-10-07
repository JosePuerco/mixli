// Zutaten-Übersicht: Anzahl und Titel, Suchfeld, Kategorie-Chips, Fotoraster, FAB „Neue Zutat“.
// Ohne Zutaten: leerer Zustand. Archivierte Zutaten über „Archiviert (n)“ am Ende der Liste.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SearchField } from '../components/ui/SearchField'
import { ChipScroller, ChoiceChip } from '../components/ui/Chip'
import { Button } from '../components/ui/Button'
import { Fab } from '../components/ui/IconButton'
import { EmptyState } from '../components/ingredient/EmptyState'
import { IngredientCard } from '../components/ingredient/IngredientCard'
import { db } from '../db/db'
import { listCategories } from '../db/repo'
import type { Ingredient } from '../db/types'
import { filterIngredients, ingredientCountLabel } from '../domain/ingredient'

// Welche Zutaten schon einmal gezeigt wurden (für diese Sitzung). Nur neue Karten ploppen herein –
// nicht bei jedem Tab-Wechsel, denn Screens werden dabei neu aufgebaut.
const seenIds = new Set<string>()
let firstListShown = false

/** Ids, die beim Öffnen dieses Screens neu sind. Wird einmal pro Aufbau festgelegt. */
function useFreshIds(all: Ingredient[] | undefined): Set<string> {
  const fresh = useRef<Set<string> | null>(null)
  if (fresh.current === null && all !== undefined) {
    fresh.current = firstListShown ? new Set(all.filter((i) => !seenIds.has(i.id)).map((i) => i.id)) : new Set()
  }
  useEffect(() => {
    if (!all) return
    for (const i of all) seenIds.add(i.id)
    firstListShown = true
  }, [all])
  return fresh.current ?? new Set()
}

export function ZutatenScreen() {
  const navigate = useNavigate()
  const all = useLiveQuery(() => db.ingredients.toArray(), [])
  const categories = useLiveQuery(listCategories, [], [])
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string>()
  const [archiveView, setArchiveView] = useState(false)
  const fresh = useFreshIds(all)

  // Noch nicht geladen: nichts zeigen, damit der leere Zustand nicht kurz aufblitzt.
  if (all === undefined) return null
  if (all.length === 0) {
    return <EmptyState onCreate={() => navigate('/zutaten/neu')} onImport={() => navigate('/mehr')} />
  }

  const archivedCount = all.filter((i) => i.archived).length
  const activeCount = all.length - archivedCount
  const showArchive = archiveView && archivedCount > 0
  // Gelöschte Kategorie ausgewählt? Dann wieder „Alle“.
  const selectedCategory = categories.some((c) => c.id === categoryId) ? categoryId : undefined
  const list = filterIngredients(all, { query, categoryId: selectedCategory, archived: showArchive })
  const freshInList = list.filter((i) => fresh.has(i.id))

  const emptyText =
    query.trim() || selectedCategory
      ? 'Keine Zutat gefunden.'
      : showArchive
        ? 'Keine archivierten Zutaten.'
        : 'Alle Zutaten sind archiviert.'

  return (
    <>
      <Screen>
        {showArchive ? (
          <ScreenHeader
            eyebrow={`${archivedCount} archiviert`}
            title="Archiv"
            action={
              <Button variant="surface" size="compact" onClick={() => setArchiveView(false)}>
                Fertig
              </Button>
            }
          />
        ) : (
          <ScreenHeader eyebrow={ingredientCountLabel(activeCount)} title="Zutaten" />
        )}

        <SearchField value={query} onChange={setQuery} placeholder="Zutat suchen" />

        {categories.length > 0 && (
          <ChipScroller aria-label="Kategorien">
            <ChoiceChip selected={selectedCategory === undefined} onClick={() => setCategoryId(undefined)}>
              Alle
            </ChoiceChip>
            {categories.map((c) => (
              <ChoiceChip
                key={c.id}
                selected={selectedCategory === c.id}
                onClick={() => setCategoryId(selectedCategory === c.id ? undefined : c.id)}
              >
                {c.name}
              </ChoiceChip>
            ))}
          </ChipScroller>
        )}

        {list.length > 0 ? (
          <div className="grid grid-cols-2 gap-gap-md">
            {list.map((i) => {
              const freshIndex = freshInList.indexOf(i)
              return (
                <IngredientCard
                  key={i.id}
                  ingredient={i}
                  appearIndex={freshIndex >= 0 ? freshIndex : undefined}
                  onOpen={() => navigate(`/zutaten/${i.id}`)}
                />
              )
            })}
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-sm font-medium text-text-muted">{emptyText}</p>
        )}

        {!showArchive && archivedCount > 0 && (
          <Button variant="surface" size="compact" className="self-center" onClick={() => setArchiveView(true)}>
            Archiviert ({archivedCount})
          </Button>
        )}
      </Screen>
      {!showArchive && <Fab aria-label="Neue Zutat" onClick={() => navigate('/zutaten/neu')} />}
    </>
  )
}
