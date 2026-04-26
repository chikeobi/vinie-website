interface Props {
  number: number
  title: string
  description: string
}

export default function StepCard({ number, title, description }: Props) {
  return (
    <div
      className="flex gap-3 bg-(--card) rounded-[var(--radius-card)] p-4"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[16px] font-bold"
        style={{ backgroundColor: 'rgba(107,71,255,0.1)', color: 'var(--purple)' }}
      >
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[17px] font-bold text-(--text-primary) leading-snug">{title}</p>
        <p className="text-[14px] text-(--text-secondary) mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}
