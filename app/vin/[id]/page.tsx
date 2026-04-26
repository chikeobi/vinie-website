'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCustomerMode } from '@/context/CustomerModeContext'
import { getVehicleByVin, logScanEvent } from '@/lib/firestore'
import type { Vehicle } from '@/lib/types'
import BattleCard from '@/components/BattleCard'
import PageHeader from '@/components/PageHeader'

function formatPrice(n: number) {
  return '$' + n.toLocaleString('en-US')
}

function formatMileage(n: number) {
  return n.toLocaleString('en-US') + ' miles'
}

export default function VinDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, currentDealershipId } = useAuth()
  const { customerMode, toggleCustomerMode } = useCustomerMode()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    const vin = decodeURIComponent(id).toUpperCase()

    getVehicleByVin(vin).then((v) => {
      if (!v) {
        setNotFound(true)
      } else {
        setVehicle(v)
        if (user) {
          logScanEvent(vin, v.id, user.uid, currentDealershipId)
        }
      }
      setLoading(false)
    })
  }, [id, user, currentDealershipId])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-(--bg)">
        <div className="w-8 h-8 rounded-full border-2 border-(--purple) border-t-transparent animate-spin" />
      </div>
    )
  }

  if (notFound || !vehicle) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-(--bg) px-8">
        <p className="text-[17px] font-bold text-(--text-primary)">Vehicle not found</p>
        <p className="text-[14px] text-(--text-secondary) text-center">
          VIN {id} doesn't match any vehicle in the system.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-2 text-(--purple) text-[15px] font-semibold"
        >
          Go back
        </button>
      </div>
    )
  }

  const { year, make, model, trim, mileage, price, daysOnLot, imageUrl } = vehicle

  return (
    <div
      className="max-w-[430px] mx-auto min-h-dvh flex flex-col bg-(--bg)"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <PageHeader
        title="VIN Intelligence"
        left={
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--card)' }}
            aria-label="Back"
          >
            <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
          </button>
        }
        right={
          <button
            onClick={toggleCustomerMode}
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--card)' }}
            aria-label="Toggle customer mode"
          >
            {customerMode ? (
              <Eye size={18} style={{ color: '#34C759' }} />
            ) : (
              <EyeOff size={18} style={{ color: 'var(--text-secondary)' }} />
            )}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-4">
        <div className="relative w-full h-[220px] rounded-[var(--radius-card)] overflow-hidden bg-(--card)">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${year} ${make} ${model}`}
              fill
              className="object-cover"
              sizes="430px"
              priority
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-(--text-secondary) text-[15px]">No photo available</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-[22px] font-bold text-(--text-primary) leading-tight">
              {year} {make} {model}
              {trim ? ` ${trim}` : ''}
            </h2>
            {!customerMode && (
              <span
                className="text-[13px] font-semibold px-3 py-1 rounded-full shrink-0 mt-1"
                style={{
                  backgroundColor: 'rgba(184,134,11,0.12)',
                  color: 'var(--amber)',
                }}
              >
                {daysOnLot}d on lot
              </span>
            )}
          </div>

          <p className="text-[12px] font-mono text-(--text-secondary) mt-1">
            {vehicle.vin}
          </p>
        </div>

        <div
          className="flex items-center justify-between bg-(--card) rounded-[var(--radius-card)] px-4 py-3"
          style={{ boxShadow: 'var(--card-shadow)' }}
        >
          <div>
            <p className="text-[11px] text-(--text-secondary) font-semibold uppercase tracking-wide">
              Mileage
            </p>
            <p className="text-[17px] font-bold text-(--text-primary)">
              {mileage > 0 ? formatMileage(mileage) : 'New'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-(--text-secondary) font-semibold uppercase tracking-wide">
              Price
            </p>
            <p className="text-[18px] font-bold text-(--text-primary)">
              {formatPrice(price)}
            </p>
          </div>
        </div>

        <BattleCard vehicle={vehicle} />
      </div>
    </div>
  )
}
