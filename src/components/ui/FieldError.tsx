// Fehlermeldung unter einem Feld. Es gibt kein Rot in den Tokens: Der Punkt in warningDot
// macht die Meldung sichtbar, der Text bleibt dunkel und damit gut lesbar.

interface FieldErrorProps {
  id: string
  children: string
  className?: string
}

export function FieldError({ id, children, className = '' }: FieldErrorProps) {
  return (
    <span id={id} role="alert" className={`flex items-center gap-1.5 text-caption font-semibold text-text ${className}`}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-pill bg-warning-dot" />
      {children}
    </span>
  )
}
