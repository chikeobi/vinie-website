'use client'

import dynamic from 'next/dynamic'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

const ScanCamera = dynamic(() => import('@/components/ScanCamera'), { ssr: false })

export default function ScanPage() {
  const router = useRouter()
  const [vin, setVin] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const cleaned = vin.trim().toUpperCase()
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(cleaned)) {
      setError('Please enter a valid 17-character VIN.')
      return
    }
    router.push(`/vin/${cleaned}`)
  }

  return (
    <div>
      <PageHeader title="Scan" />

      <div className="px-4 pt-4 space-y-3">
        <div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={vin}
              onChange={(e) => { setVin(e.target.value); setError('') }}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              className="flex-1 h-[52px] bg-(--bg) rounded-[var(--radius-card)] px-4 text-[15px] text-(--text-primary) border border-(--border) outline-none focus:border-(--purple) transition-colors placeholder:text-(--text-secondary)"
            />
            <button
              type="submit"
              className="h-[52px] min-w-[52px] rounded-[var(--radius-card)] flex items-center justify-center shrink-0 active:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--purple)' }}
              aria-label="Look up VIN"
            >
              <ArrowRight size={20} color="white" />
            </button>
          </form>
          {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
        </div>

        <div>
          <div className="h-[460px]">
            <ScanCamera />
          </div>
        </div>
      </div>
    </div>
  )
}
