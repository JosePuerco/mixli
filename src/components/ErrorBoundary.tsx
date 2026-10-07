// Fängt Fehler beim Zeichnen ab. Ohne diese Grenze bliebe bei einem Fehler nur eine leere Seite –
// so steht da, was passiert ist, und die Meldung lässt sich kopieren (zum Melden des Fehlers).
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
  componentStack: string
  copied: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, componentStack: '', copied: false }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? '' })
    console.error(error)
  }

  private details(): string {
    const { error, componentStack } = this.state
    return [
      `${error?.name}: ${error?.message}`,
      `Seite: ${location.hash || '/'}`,
      `Gerät: ${navigator.userAgent}`,
      '',
      error?.stack ?? '',
      componentStack.trim(),
    ].join('\n')
  }

  private copy = async () => {
    try {
      await navigator.clipboard.writeText(this.details())
      this.setState({ copied: true })
    } catch {
      // Kopieren nicht erlaubt: Der Text ist trotzdem markierbar.
    }
  }

  private reload = () => {
    location.hash = '#/zutaten'
    location.reload()
  }

  render() {
    const { error, copied } = this.state
    if (!error) return this.props.children

    return (
      <main className="screen-scroll absolute inset-0 flex flex-col gap-gap-lg">
        <div className="flex flex-col gap-1 px-1">
          <h1 className="text-h1">Da ist etwas schiefgelaufen</h1>
          <p className="text-sm font-medium text-text-muted">
            Deine Daten sind sicher auf dem Gerät gespeichert. Bitte kopiere die Meldung unten und schick sie mir,
            dann lade die App neu.
          </p>
        </div>
        <pre className="max-h-80 overflow-auto rounded-card bg-surface p-gap-lg text-caption break-words whitespace-pre-wrap select-text">
          {this.details()}
        </pre>
        <div className="flex flex-col gap-gap-sm">
          <button
            type="button"
            onClick={this.copy}
            className="h-13 rounded-pill bg-surface text-body font-bold text-text"
          >
            {copied ? 'Kopiert' : 'Fehler kopieren'}
          </button>
          <button
            type="button"
            onClick={this.reload}
            className="h-13 rounded-pill bg-accent text-body font-bold text-on-accent"
          >
            Neu laden
          </button>
        </div>
      </main>
    )
  }
}
