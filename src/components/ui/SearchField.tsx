// Suchfeld: weiße Pille, 48 px, Lupe links. Filtert live beim Tippen.
import { IconSearch } from '../icons/Icons'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function SearchField({ value, onChange, placeholder }: SearchFieldProps) {
  return (
    <label className="flex h-12 items-center gap-2.5 rounded-pill bg-surface px-4 text-text-muted">
      <IconSearch size={18} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        className="min-w-0 flex-1 bg-transparent text-body-large font-medium text-text outline-none placeholder:text-text-placeholder"
      />
    </label>
  )
}
