interface ToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span className="min-w-0">
        <span className="block text-xs font-medium text-zinc-200">{label}</span>
        <span className="block text-[11px] text-zinc-500">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-zinc-700'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  )
}
