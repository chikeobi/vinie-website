'use client'

interface Option<T extends string> {
  label: string
  value: T
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div
      className="flex bg-(--card) rounded-[12px] p-1 gap-1"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 h-9 rounded-[9px] text-[14px] font-medium transition-colors"
            style={{
              backgroundColor: active ? 'var(--chip-active-bg)' : 'transparent',
              color: active ? 'var(--chip-active-text)' : 'var(--text-secondary)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
