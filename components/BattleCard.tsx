'use client'

import { useEffect, useState } from 'react'
import type { Vehicle } from '@/lib/types'

interface Props {
  vehicle: Vehicle
}

export default function BattleCard({ vehicle }: Props) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchBrief() {
      try {
        const res = await fetch('/api/battle-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vin: vehicle.vin,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            trim: vehicle.trim,
            mileage: vehicle.mileage,
            price: vehicle.price,
            daysOnLot: vehicle.daysOnLot,
          }),
        })

        if (!res.ok || !res.body) throw new Error('Failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        setLoading(false)

        while (true) {
          const { done, value } = await reader.read()
          if (done || cancelled) break
          setContent((prev) => prev + decoder.decode(value))
        }
      } catch {
        if (!cancelled) setError(true)
        setLoading(false)
      }
    }

    fetchBrief()
    return () => {
      cancelled = true
    }
  }, [vehicle])

  return (
    <div
      className="bg-(--card) rounded-[var(--radius-card)] p-4"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      <p
        className="text-[13px] font-bold uppercase tracking-wide mb-3"
        style={{ color: 'var(--purple)' }}
      >
        ⚡ AI Sales Brief
      </p>

      {loading && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-(--border) mt-2 shrink-0 animate-pulse" />
              <div className="flex-1 space-y-1">
                <div
                  className="h-3.5 rounded animate-pulse"
                  style={{ backgroundColor: 'var(--bg)', width: `${75 + i * 8}%` }}
                />
                {i < 3 && (
                  <div
                    className="h-3.5 rounded animate-pulse"
                    style={{ backgroundColor: 'var(--bg)', width: `${50 + i * 10}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-[14px] text-(--text-secondary)">
          Unable to generate brief. Check your Anthropic API key.
        </p>
      )}

      {!loading && !error && (
        <div className="space-y-1.5">
          {content.split('\n').map((line, i) => {
            const trimmed = line.trim()
            if (!trimmed) return null
            const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-')
            return (
              <div key={i} className="flex items-start gap-2">
                {isBullet && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-[6px]"
                    style={{ backgroundColor: 'var(--purple)' }}
                  />
                )}
                <p
                  className="text-[14px] text-(--text-primary) leading-relaxed"
                  style={{ marginLeft: isBullet ? undefined : '14px' }}
                >
                  {isBullet ? trimmed.replace(/^[•\-]\s*/, '') : trimmed}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
