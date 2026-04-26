'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, CheckCircle2, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCustomerMode } from '@/context/CustomerModeContext'
import { logScanEvent } from '@/lib/firestore'
import { getInventoryVehicleByVin } from '@/lib/inventoryService'
import { getScannedCarByVin, upsertScannedCar } from '@/lib/scannedCarsStorage'
import type { Vehicle } from '@/lib/types'
import { getCarDetails } from '@/lib/vinLookupService'
import BattleCard from '@/components/BattleCard'
import BottomNav from '@/components/BottomNav'
import PageHeader from '@/components/PageHeader'

function formatPrice(n: number) {
  return '$' + n.toLocaleString('en-US')
}

function formatMileage(n: number) {
  return n.toLocaleString('en-US') + ' miles'
}

function isMeaningful(value: string | number | undefined | null): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'number') return value > 0
  const normalized = value.trim()
  return Boolean(normalized && normalized !== 'N/A' && normalized !== 'Unavailable')
}

function getCompellingFeatures(vehicle: Vehicle): string[] {
  const source = Array.isArray(vehicle.features) ? vehicle.features : []
  const seen = new Set<string>()
  const ranked: { label: string; score: number }[] = []

  function scoreFeature(feature: string) {
    if (/apple carplay|android auto|blind spot|surround view|360|adaptive cruise|heated seats|ventilated seats|premium audio|sunroof|moonroof|third row|tow package|remote start|power liftgate|parking sensors|camera|navigation/i.test(feature)) {
      return 100
    }
    if (/awd|4wd|4x4|sport|technology|driver assistance|leather/i.test(feature)) {
      return 70
    }
    return 30
  }

  for (const feature of source) {
    const normalized = feature.trim()
    const key = normalized.toLowerCase()
    if (!normalized || seen.has(key)) continue
    seen.add(key)
    ranked.push({ label: normalized, score: scoreFeature(normalized) })
  }

  if (isMeaningful(vehicle.drivetrain) && /awd|4wd|4x4/i.test(vehicle.drivetrain!)) {
    ranked.push({ label: `${vehicle.drivetrain} capability`, score: 80 })
  }
  if (isMeaningful(vehicle.wheelSize)) {
    ranked.push({ label: `${vehicle.wheelSize} wheels`, score: 48 })
  }

  return ranked
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, 6)
    .map((item) => item.label)
}

function deriveHighlights(vehicle: Vehicle): string[] {
  const items: string[] = []
  const seen = new Set<string>()

  function add(value: string) {
    const key = value.trim().toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    items.push(value)
  }

  if (isMeaningful(vehicle.mpg)) add(`${vehicle.mpg} fuel economy`)
  if (isMeaningful(vehicle.horsepower)) {
    add(isMeaningful(vehicle.engine) ? `${vehicle.engine} — ${vehicle.horsepower}` : String(vehicle.horsepower))
  } else if (isMeaningful(vehicle.engine)) {
    add(String(vehicle.engine))
  }
  if (isMeaningful(vehicle.drivetrain) && /awd|4wd|4x4/i.test(vehicle.drivetrain!)) {
    add(`${vehicle.drivetrain} — all-weather capable`)
  }
  if (isMeaningful(vehicle.warranty)) add(`Warranty: ${vehicle.warranty}`)
  if (vehicle.daysOnLot > 0) {
    add(vehicle.daysOnLot <= 14 ? `${vehicle.daysOnLot} days on lot — fresh inventory` : `${vehicle.daysOnLot} days on lot`)
  }

  for (const feature of getCompellingFeatures(vehicle)) {
    if (items.length >= 6) break
    add(feature)
  }

  return items
}

function deriveDealAngle(vehicle: Vehicle): string {
  if (vehicle.marketStats?.listingPrice && vehicle.marketStats.medianPrice) {
    const diff = Math.round(vehicle.marketStats.medianPrice - vehicle.marketStats.listingPrice)
    if (diff > 0) return `Priced $${diff.toLocaleString()} below the local median. Lead with value before the buyer asks about price.`
    if (diff < 0) return `Priced $${Math.abs(diff).toLocaleString()} above median. Sell condition, equipment, and availability before numbers.`
    return 'Priced in line with the local market median. Keep the conversation anchored on condition and ownership value.'
  }
  if (vehicle.daysOnLot <= 7) return 'Fresh inventory gives you urgency. Position it as a vehicle buyers need to act on quickly.'
  if (vehicle.daysOnLot >= 45) return 'This unit has aged on the lot. Use pricing flexibility and manager support early to create movement.'
  return 'Use the mix of price, mileage, and equipment to frame this as a smart value buy.'
}

function deriveLikelyObjections(vehicle: Vehicle): string[] {
  const objections: string[] = []
  if (vehicle.price >= 40000) objections.push('The monthly payment may feel high compared to less-equipped options.')
  if (vehicle.mileage > 25000) objections.push('Buyers may ask whether the mileage is too high for the model year.')
  if (vehicle.daysOnLot >= 45) objections.push('A shopper may ask why it has been on the lot longer than newer arrivals.')
  if (isMeaningful(vehicle.drivetrain) && /fwd|rwd/i.test(vehicle.drivetrain!)) {
    objections.push(`Some buyers may want AWD instead of ${vehicle.drivetrain}.`)
  }
  if (!objections.length) {
    objections.push('A buyer may still compare this against similar listings nearby on price and features.')
  }
  return objections
}

function deriveWarrantyItems(vehicle: Vehicle): string[] {
  const items: string[] = []
  if (isMeaningful(vehicle.warranty)) items.push(String(vehicle.warranty))

  const age = new Date().getFullYear() - vehicle.year
  if (age <= 1) items.push('Likely still within the primary factory coverage window.')
  else if (age <= 4) items.push(`${vehicle.year} model — verify remaining factory coverage with the dealer.`)
  else items.push('Factory warranty may be limited or expired. Confirm current coverage status.')

  items.push('Ask about extended coverage or CPO options if warranty confidence matters to the buyer.')
  return items
}

function deriveVehicleHistory(vehicle: Vehicle): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = []
  if (isMeaningful(vehicle.extColor)) items.push({ label: 'Exterior', value: String(vehicle.extColor) })
  if (isMeaningful(vehicle.intColor)) items.push({ label: 'Interior', value: String(vehicle.intColor) })
  if (vehicle.daysOnLot > 0) items.push({ label: 'Days on Lot', value: `${vehicle.daysOnLot} days` })
  if (isMeaningful(vehicle.wheelSize)) items.push({ label: 'Wheels', value: String(vehicle.wheelSize) })
  if (vehicle.marketStats?.activeCount) items.push({ label: 'Similar Nearby', value: `${vehicle.marketStats.activeCount} listings` })
  if (!items.length) items.push({ label: 'History', value: 'Run a vehicle history report for ownership and accident details.' })
  return items
}

function deriveSimilarCars(vehicle: Vehicle): Array<{ vehicle: string; detail: string; price: string }> {
  if (vehicle.similarCars?.length) {
    return vehicle.similarCars.map((row) => ({
      vehicle: row.title,
      detail: row.location,
      price: row.price,
    }))
  }

  if (vehicle.marketStats?.activeCount) {
    return [{
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      detail: `${vehicle.marketStats.activeCount} active listings nearby`,
      price: `$${Math.round(vehicle.marketStats.medianPrice).toLocaleString()} median`,
    }]
  }

  return [{
    vehicle: `${vehicle.make} ${vehicle.model} comparables`,
    detail: 'Local comparable data unavailable',
    price: '—',
  }]
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

    ;(async () => {
      let resolved: Vehicle | null = null

      const inventoryVehicle = await getInventoryVehicleByVin(currentDealershipId, vin).catch(() => null)
      if (inventoryVehicle) {
        resolved = inventoryVehicle
      } else {
        const cachedVehicle = await getScannedCarByVin(vin)
        if (cachedVehicle) {
          resolved = cachedVehicle
        } else {
          try {
            const marketVehicle = await getCarDetails(vin)
            await upsertScannedCar(marketVehicle)
            resolved = marketVehicle
          } catch {
            resolved = null
          }
        }
      }

      if (!resolved) {
        setNotFound(true)
      } else {
        setVehicle(resolved)
        if (user) {
          logScanEvent(vin, resolved.id, user.uid, currentDealershipId)
        }
      }
      setLoading(false)
    })()
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
  const highlights = deriveHighlights(vehicle)
  const performanceItems = [
    { label: 'Engine', value: vehicle.engine },
    { label: 'Horsepower', value: vehicle.horsepower },
    { label: 'Torque', value: vehicle.torque },
    { label: 'MPG', value: vehicle.mpg },
    { label: 'Drivetrain', value: vehicle.drivetrain },
    { label: 'Transmission', value: vehicle.transmission },
  ].filter((item) => isMeaningful(item.value))
  const features = getCompellingFeatures(vehicle)
  const objections = deriveLikelyObjections(vehicle)
  const warrantyItems = deriveWarrantyItems(vehicle)
  const historyItems = deriveVehicleHistory(vehicle)
  const similarCars = deriveSimilarCars(vehicle)

  return (
    <div
      className="max-w-[430px] mx-auto min-h-dvh flex flex-col bg-(--bg) border-x"
      style={{
        borderColor: 'var(--border)',
        paddingBottom: 'calc(var(--dock-height) + 42px + env(safe-area-inset-bottom))',
      }}
    >
      <PageHeader
        title="Car Intel"
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
        <div className="relative w-full h-[220px] rounded-[12px] overflow-hidden bg-(--card)">
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
          className="flex items-center justify-between bg-(--card) rounded-[12px] px-4 py-3"
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

        <AccordionSection title="💡 Highlights" defaultOpen>
          <div className="space-y-4">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 size={18} color="#34C759" className="mt-0.5 shrink-0" />
                <p className="text-[15px] leading-relaxed text-(--text-primary)">{item}</p>
              </div>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection title="⚡ Performance" defaultOpen>
          <div className="space-y-0">
            {performanceItems.length ? (
              performanceItems.map((item) => (
                <InfoRow key={item.label} label={item.label} value={String(item.value)} />
              ))
            ) : (
              <p className="text-[14px] text-(--text-secondary)">Performance data is unavailable for this vehicle.</p>
            )}
          </div>
        </AccordionSection>

        <AccordionSection title="★ Features">
          <div className="space-y-3">
            {features.length ? (
              features.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={18} color="var(--purple)" className="mt-0.5 shrink-0" />
                  <p className="text-[15px] leading-relaxed text-(--text-primary)">{item}</p>
                </div>
              ))
            ) : (
              <p className="text-[14px] text-(--text-secondary)">No feature data is available for this vehicle yet.</p>
            )}
          </div>
        </AccordionSection>

        <AccordionSection title="🎯 Deal Angle">
          <p className="text-[15px] leading-relaxed text-(--text-primary)">{deriveDealAngle(vehicle)}</p>
        </AccordionSection>

        <AccordionSection title="⚠️ Likely Objections">
          <div className="space-y-3">
            {objections.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-[2px] text-[20px] leading-none" style={{ color: '#FF9500' }}>•</span>
                <p className="text-[15px] leading-relaxed text-(--text-primary)">{item}</p>
              </div>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection title="🛡 Warranty Left">
          <div className="space-y-0">
            {warrantyItems.map((item) => (
              <InfoRow key={item} label={item} value="" />
            ))}
          </div>
        </AccordionSection>

        <AccordionSection title="📋 Vehicle History">
          <div className="grid grid-cols-1 gap-3">
            {historyItems.map((item) => (
              <div
                key={item.label}
                className="rounded-[10px] border p-3"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="text-[12px] font-semibold uppercase tracking-wide text-(--text-secondary)">{item.label}</p>
                <p className="mt-1 text-[15px] font-medium text-(--text-primary)">{item.value}</p>
              </div>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection title="📊 Market Insight">
          <div className="space-y-0">
            <InfoRow label="Listing Price" value={formatPrice(price)} />
            <InfoRow
              label="Median Market Price"
              value={vehicle.marketStats?.medianPrice ? `$${Math.round(vehicle.marketStats.medianPrice).toLocaleString()}` : '—'}
            />
            <InfoRow
              label="Active Listings"
              value={vehicle.marketStats?.activeCount ? String(vehicle.marketStats.activeCount) : '—'}
            />
            <InfoRow
              label="Average Comparable Miles"
              value={vehicle.marketStats?.avgMiles ? `${Math.round(vehicle.marketStats.avgMiles).toLocaleString()} mi` : '—'}
            />
          </div>
        </AccordionSection>

        <AccordionSection title="🔍 Similar Vehicles Nearby">
          <div className="space-y-3">
            {similarCars.map((row, index) => (
              <div
                key={`${row.vehicle}-${index}`}
                className="grid grid-cols-[1.3fr_1fr_auto] gap-3 rounded-[10px] border p-3"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
              >
                <p className="text-[14px] font-semibold text-(--text-primary)">{row.vehicle}</p>
                <p className="text-[13px] text-(--text-secondary)">{row.detail}</p>
                <p className="text-[14px] font-semibold text-(--text-primary)">{row.price}</p>
              </div>
            ))}
          </div>
        </AccordionSection>
      </div>

      <BottomNav />
    </div>
  )
}

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className="overflow-hidden rounded-[12px] border bg-(--card)"
      style={{ borderColor: 'var(--border)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-[54px] w-full items-center justify-between px-4 text-left"
      >
        <span className="text-[17px] font-bold text-(--text-primary)">{title}</span>
        <ChevronDown
          size={18}
          style={{
            color: 'var(--text-primary)',
            transform: `rotate(${open ? '180deg' : '0deg'})`,
            transition: 'transform 180ms ease',
          }}
        />
      </button>
      {open && (
        <div className="border-t px-4 py-4" style={{ borderColor: 'var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <p className="text-[15px] font-medium text-(--text-primary)">{label}</p>
      {value ? <p className="text-[15px] text-(--text-secondary) text-right">{value}</p> : null}
    </div>
  )
}
