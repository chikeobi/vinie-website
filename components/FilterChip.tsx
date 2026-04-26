'use client'

import { ReactNode } from 'react'

interface Props {
  label: string
  icon?: ReactNode
  active: boolean
  onClick: () => void
}

export default function FilterChip({ label, icon, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 h-10 px-3 rounded-[14px] border transition-colors text-[14px] font-medium"
      style={{
        backgroundColor: active ? 'var(--chip-active-bg)' : 'var(--card)',
        color: active ? 'var(--chip-active-text)' : 'var(--text-primary)',
        borderColor: active ? 'var(--chip-active-bg)' : 'var(--border)',
      }}
    >
      {icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{icon}</span>}
      {label}
    </button>
  )
}
