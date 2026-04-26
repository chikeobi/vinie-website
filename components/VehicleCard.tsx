'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Vehicle } from '@/lib/types'

interface Props {
  vehicle: Vehicle
  scannedAt?: number
  showCustomerMode?: boolean
}

function formatPrice(n: number) {
  return '$' + n.toLocaleString('en-US')
}

function formatMileage(n: number) {
  return n.toLocaleString('en-US') + ' mi'
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function VehicleCard({ vehicle, scannedAt, showCustomerMode }: Props) {
  const { id, vin, year, make, model, trim, mileage, price, daysOnLot, imageUrl } = vehicle

  return (
    <Link href={`/vin/${vin}`} className="block">
      <div
        className="flex gap-3 bg-(--card) rounded-[var(--radius-card)] p-4 active:opacity-80 transition-opacity"
        style={{ boxShadow: 'var(--card-shadow)' }}
      >
        {/* Thumbnail */}
        <div className="relative shrink-0 w-[110px] h-[82px] rounded-[10px] overflow-hidden bg-(--bg)">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${year} ${make} ${model}`}
              fill
              className="object-cover"
              sizes="110px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-(--bg) flex items-center justify-center">
              <span className="text-(--text-secondary) text-xs">No photo</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Top row */}
          <div className="flex items-start justify-between gap-1">
            <p className="text-[17px] font-bold leading-tight text-(--text-primary) truncate">
              {year} {make} {model}
            </p>
            {scannedAt !== undefined && (
              <span className="text-[12px] text-(--text-secondary) shrink-0 mt-0.5">
                {timeAgo(scannedAt)}
              </span>
            )}
          </div>

          {/* Mileage */}
          {mileage > 0 && (
            <p className="text-[14px] text-(--text-secondary)">{formatMileage(mileage)}</p>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-bold text-(--text-primary)">
              {formatPrice(price)}
            </span>
            {!showCustomerMode && (
              <span className="text-[14px] font-semibold" style={{ color: 'var(--amber)' }}>
                {daysOnLot}d on lot
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
