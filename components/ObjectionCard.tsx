interface Props {
  objection: string
  response: string
}

export default function ObjectionCard({ objection, response }: Props) {
  return (
    <div
      className="bg-(--card) rounded-[var(--radius-card)] p-4"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      <p className="text-[17px] font-bold text-(--text-primary) leading-snug">{objection}</p>
      <p className="text-[14px] text-(--text-secondary) mt-1.5 leading-relaxed">{response}</p>
    </div>
  )
}
