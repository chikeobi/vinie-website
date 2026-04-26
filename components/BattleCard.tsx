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

  function computeWarrantySummary(v: Vehicle): string | null {
    const raw = (v.warranty || '').trim()
    if (!raw) return null
    // try to find a term like "3 yr" and optional "/ 36,000 mi"
    const parts = raw.split(/\u2022|\u00B7|\.|\*|\||•|;|,/).map((s) => s.trim()).filter(Boolean)
    const age = new Date().getFullYear() - v.year
    for (const part of parts) {
      const m = part.match(/^(.*?)(?:\b|\s)(\d+)\s*yr(?:s)?(?:\s*\/\s*([0-9,]+)\s*mi)?/i)
      if (m) {
        const years = Number(m[2])
        const miles = m[3] ? Number(m[3].replace(/,/g, '')) : undefined
        const remainingYears = Number.isFinite(years) ? Math.max(0, years - age) : undefined
        const remainingMiles = typeof miles === 'number' ? Math.max(0, miles - v.mileage) : undefined
        if (remainingYears && remainingYears > 0 && remainingMiles && remainingMiles > 0) {
          return `${remainingYears} yr${remainingYears>1? 's':''} / ${remainingMiles.toLocaleString()} mi remaining`
        }
        if (remainingYears && remainingYears > 0) return `${remainingYears} yr${remainingYears>1? 's':''} remaining`
        if (remainingMiles && remainingMiles > 0) return `${remainingMiles.toLocaleString()} mi remaining`
        return 'Expired or likely expired'
      }
    }
    return null
  }

  function generateLocalBrief(v: Vehicle, warrantySummary: string | null): string {
    const bullets: string[] = []
    // 1) Value angle
    if (v.marketStats?.medianPrice) {
      const diff = Math.round(v.marketStats.medianPrice - v.price)
      if (diff > 0) bullets.push(`Priced $${diff.toLocaleString()} below local median — lead with value.`)
      else if (diff < 0) bullets.push(`Priced $${Math.abs(diff).toLocaleString()} above median — highlight condition and equipment.`)
      else bullets.push('Priced in line with local market median — emphasize condition and ownership value.')
    } else {
      bullets.push(`Price: $${v.price.toLocaleString()} — emphasize value relative to mileage (${v.mileage.toLocaleString()} mi).`)
    }

    // 2) Urgency / freshness
    if (v.daysOnLot <= 7) bullets.push('Fresh arrival — create urgency and recommend a quick test drive.')
    else if (v.daysOnLot >= 45) bullets.push('Aged on lot — offer pricing flexibility or manager support early.')
    else bullets.push(`${v.daysOnLot} days on lot — focus on availability and recent maintenance history.`)

    // 3) Warranty or feature
    if (warrantySummary) bullets.push(`Warranty: ${warrantySummary} — use this to reassure buyers.`)
    else if (v.features && v.features.length) bullets.push(`${v.features[0]} stands out — call this out early in the demo.`)
    else bullets.push('Highlight condition and any remaining dealer incentives or service history.')

    return bullets.map((b) => `• ${b}`).join('\n')
  }

  useEffect(() => {
    let cancelled = false

    async function fetchBrief() {
      try {
        const warrantySummary = computeWarrantySummary(vehicle)
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
            warrantySummary,
            marketStats: vehicle.marketStats ?? null,
          }),
        })

        if (!res.ok || !res.body) {
          // use a local fallback brief
          if (!cancelled) {
            setContent(generateLocalBrief(vehicle, warrantySummary))
            setLoading(false)
            setError(true)
          }
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        setLoading(false)

        while (true) {
          const { done, value } = await reader.read()
          if (done || cancelled) break
          setContent((prev) => prev + decoder.decode(value))
        }
      } catch {
        if (!cancelled) {
          const warrantySummary = computeWarrantySummary(vehicle)
          setContent(generateLocalBrief(vehicle, warrantySummary))
          setError(true)
          setLoading(false)
        }
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
