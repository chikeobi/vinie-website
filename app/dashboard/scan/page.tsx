'use client'

import dynamic from 'next/dynamic'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { getInventoryVehicleByVin } from '@/lib/inventoryService'
import { saveScannedCar } from '@/lib/scannedCarsStorage'
import { getCarDetails } from '@/lib/vinLookupService'
import { isValidVin, isVinFormatValid } from '@/lib/vinValidation'

const ScanCamera = dynamic(() => import('@/components/ScanCamera'), { ssr: false })

export default function ScanPage() {
  const router = useRouter()
  const { currentDealershipId } = useAuth()
  const [vin, setVin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function resolveAndNavigate(rawVin: string) {
    const normalizedVin = rawVin.trim().toUpperCase()
    const inventoryVehicle = await getInventoryVehicleByVin(currentDealershipId, normalizedVin).catch(() => null)
    if (inventoryVehicle) {
      router.push(`/vin/${normalizedVin}`)
      return
    }

    const carDetails = await getCarDetails(normalizedVin)
    await saveScannedCar(carDetails)
    router.push(`/vin/${normalizedVin}`)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const cleaned = vin.trim().toUpperCase()
    if (!isVinFormatValid(cleaned)) {
      setError('VIN must be 17 characters.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await resolveAndNavigate(cleaned)
      setVin('')
    } catch {
      setError('Failed to look up VIN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDetected(rawVin: string) {
    const cleaned = rawVin.trim().toUpperCase()
    if (!isValidVin(cleaned)) {
      setError('Scanned code is not a valid VIN. Enter it manually above.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await resolveAndNavigate(cleaned)
    } catch {
      setError('Could not look up VIN. Enter it manually above.')
      setLoading(false)
    }
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
              disabled={loading || vin.length < 17}
              className="h-[52px] min-w-[52px] rounded-[var(--radius-card)] flex items-center justify-center shrink-0 active:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--purple)', opacity: loading || vin.length < 17 ? 0.4 : 1 }}
              aria-label="Look up VIN"
            >
              <ArrowRight size={20} color="white" />
            </button>
          </form>
          {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
        </div>

        <div>
          <div className="h-[460px]">
            <ScanCamera onDetected={handleDetected} />
          </div>
        </div>
      </div>
    </div>
  )
}
