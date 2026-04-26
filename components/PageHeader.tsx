import { ReactNode } from 'react'

interface Props {
  title: string
  left?: ReactNode
  right?: ReactNode
}

export default function PageHeader({ title, left, right }: Props) {
  return (
    <div
      className="sticky top-0 z-30 border-b"
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="h-full flex items-center px-4 gap-3">
        <div className="w-10 flex items-center justify-start shrink-0">{left}</div>
        <h1 className="flex-1 text-[17px] font-bold text-(--text-primary) text-center">
          {title}
        </h1>
        <div className="w-10 flex items-center justify-end shrink-0">{right}</div>
      </div>
    </div>
  )
}
