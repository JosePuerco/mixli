// Preis des Mixes (Mixen-Screen und Müsli-Detail): Gesamtpreis groß, rechts Preis pro kg.
// Fehlt bei einer Zeile der Preis, nur „Preis unvollständig“ mit den Zutaten. Nie auf dem Etikett.
import { formatEuros, formatEurosPerKg, type MixPrice } from '../../domain/price'
import { Card, CardTitle } from '../ui/Card'

export function MixPriceCard({ price }: { price: MixPrice }) {
  return (
    <Card className="flex flex-col gap-gap-sm">
      <CardTitle aside="nur für dich, nicht auf dem Etikett">Preis</CardTitle>
      {price.complete ? (
        <p className="flex items-baseline justify-between gap-gap-md">
          <span className="text-h2 font-extrabold">{formatEuros(price.total)}</span>
          <span className="text-sm font-medium text-text-muted">{formatEurosPerKg(price.perKg)}</span>
        </p>
      ) : (
        <p className="text-sm font-medium text-text-muted">
          Preis unvollständig, ohne Preis: {price.missing.join(', ')}
        </p>
      )}
    </Card>
  )
}
