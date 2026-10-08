import { describe, expect, it } from 'vitest'
import { backupStatus, countsText, daysBetween, importResultText } from './status'

const now = new Date(2026, 9, 20, 9, 0)

describe('daysBetween', () => {
  it('zählt Kalendertage, nicht 24-Stunden-Blöcke', () => {
    expect(daysBetween(new Date(2026, 9, 19, 23, 50), new Date(2026, 9, 20, 0, 10))).toBe(1)
    expect(daysBetween(new Date(2026, 9, 20, 0, 10), new Date(2026, 9, 20, 23, 50))).toBe(0)
  })

  it('stimmt über die Zeitumstellung hinweg', () => {
    expect(daysBetween(new Date(2026, 9, 24, 12), new Date(2026, 9, 26, 12))).toBe(2)
  })
})

describe('backupStatus', () => {
  it('ohne Backup: neutral bei leerer App, orange sobald Daten da sind', () => {
    expect(backupStatus(null, false, now)).toEqual({ tone: 'neutral', text: 'Noch kein Backup' })
    expect(backupStatus(null, true, now)).toEqual({ tone: 'warn', text: 'Noch kein Backup erstellt' })
  })

  it('grün bis 13 Tage, orange ab 14 Tagen', () => {
    expect(backupStatus(new Date(2026, 9, 20, 8), true, now)).toEqual({ tone: 'ok', text: 'Letztes Backup heute' })
    expect(backupStatus(new Date(2026, 9, 19), true, now)).toEqual({ tone: 'ok', text: 'Letztes Backup gestern' })
    expect(backupStatus(new Date(2026, 9, 7), true, now)).toEqual({ tone: 'ok', text: 'Letztes Backup vor 13 Tagen' })
    expect(backupStatus(new Date(2026, 9, 6), true, now)).toEqual({ tone: 'warn', text: 'Letztes Backup vor 14 Tagen' })
  })
})

describe('Texte', () => {
  it('zählt mit Einzahl und Mehrzahl', () => {
    expect(countsText({ ingredients: 1, mixes: 0, categories: 2, photos: 1 })).toBe(
      '1 Zutat, 0 Müslis, 2 Kategorien und 1 Foto',
    )
  })

  it('beschreibt das Importergebnis', () => {
    expect(importResultText({ ingredients: 0, mixes: 0, categories: 0, photos: 0, keptNewer: 2, brokenRefs: 1 })).toBe(
      'Import fertig: Es gab nichts Neues. 2 Einträge waren auf diesem Gerät neuer und wurden behalten. ' +
        '1 Verweis auf eine fehlende Kategorie oder ein fehlendes Foto wurde entfernt.',
    )
  })
})
