'use client'

import { useEffect, useState, useMemo, FormEvent } from 'react'
import { Bookmark, Clock3, Eye, EyeOff, LayoutGrid, Search, Sparkles, Star, TrendingDown, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCustomerMode } from '@/context/CustomerModeContext'
import type { Vehicle } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import VehicleCard from '@/components/VehicleCard'
import FilterChip from '@/components/FilterChip'
import { getDealershipInventory, type InventoryVehicle } from '@/lib/inventoryService'
import { getScannedCars, removeScannedCar, type StoredScan } from '@/lib/scannedCarsStorage'
import SwipeableCard from '@/components/SwipeableCard'

type Filter = 'all' | 'pricedrop' | 'specials' | 'aged' | 'pinned' | 'fresh'
type PipelineVehicle = InventoryVehicle | StoredScan

const FILTERS: { id: Filter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <LayoutGrid size={14} /> },
  { id: 'pricedrop', label: 'Price Drop', icon: <TrendingDown size={14} /> },
  { id: 'specials', label: 'Specials', icon: <Star size={14} /> },
  { id: 'aged', label: 'Aged', icon: <Clock3 size={14} /> },
  { id: 'pinned', label: 'Pinned', icon: <Bookmark size={14} /> },
  { id: 'fresh', label: 'Fresh', icon: <Sparkles size={14} /> },
]

export default function InventoryPage() {
  const { currentDealershipId } = useAuth()
  const { customerMode, toggleCustomerMode } = useCustomerMode()
  const [vehicles, setVehicles] = useState<PipelineVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

  useEffect(() => {
    Promise.all([
      getDealershipInventory(currentDealershipId),
      getScannedCars(),
    ]).then(([inventoryCars, scannedCars]) => {
      const merged = new Map<string, PipelineVehicle>()
      inventoryCars.forEach((car) => merged.set(car.vin, car))
      scannedCars.forEach((car) => {
        const existing = merged.get(car.vin)
        if (!existing) {
          merged.set(car.vin, car)
          return
        }
        merged.set(car.vin, {
          ...car,
          ...existing,
          imageUrl: existing.imageUrl || car.imageUrl,
          features: existing.features?.length ? existing.features : car.features,
          marketStats: existing.marketStats ?? car.marketStats,
        })
      })
      const sorted = Array.from(merged.values()).sort((a, b) => {
        const aTs = 'scannedAt' in a ? a.scannedAt : (a.updatedAt ?? a.uploadedAt ?? 0)
        const bTs = 'scannedAt' in b ? b.scannedAt : (b.updatedAt ?? b.uploadedAt ?? 0)
        return bTs - aTs
      })
      setVehicles(sorted)
      setLoading(false)
    })
  }, [currentDealershipId])

  const filtered = useMemo(() => {
    let list = vehicles
    if (activeFilter === 'pricedrop') list = list.filter((v) => v.hasPriceDrop)
    else if (activeFilter === 'specials') list = list.filter((v) => v.isSpecial)
    else if (activeFilter === 'aged') list = list.filter((v) => v.isAged || v.daysOnLot >= 45)
    else if (activeFilter === 'pinned') list = list.filter((v) => v.isPinned)
    else if (activeFilter === 'fresh') list = list.filter((v) => v.isFresh || v.daysOnLot <= 7)
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase()
      list = list.filter(
        (v) =>
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.vin.toLowerCase().includes(q) ||
          String(v.year).includes(q),
      )
    }
    return list
  }, [vehicles, activeFilter, searchInput])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
  }

  async function handleDelete(vin: string) {
    setVehicles((prev) => prev.filter((vehicle) => vehicle.vin !== vin))
    await removeScannedCar(vin)
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        right={
          <button
            onClick={toggleCustomerMode}
            className="relative w-9 h-9 flex items-center justify-center rounded-full"
            style={{ backgroundColor: customerMode ? 'rgba(52,199,89,0.12)' : 'transparent' }}
            aria-label="Toggle customer mode"
          >
            {customerMode ? (
              <Eye size={18} color="#34C759" />
            ) : (
              <EyeOff size={18} color="var(--text-secondary)" />
            )}
            {customerMode && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#34C759]" />
            )}
          </button>
        }
      />

      {/* Search + filters — sticky below header */}
      <div className="sticky z-20 bg-(--bg) px-4 pt-3 pb-2" style={{ top: 'var(--header-height)' }}>
        <form onSubmit={handleSearchSubmit} className="mb-3">
          <div className="flex items-center gap-2.5 h-11 bg-(--card) rounded-[var(--radius-card)] pl-4 pr-1.5 border border-(--border) shadow-[var(--card-shadow)]">
            <Search size={15} color="var(--text-secondary)" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by make, model, VIN..."
              className="flex-1 bg-transparent text-[15px] text-(--text-primary) outline-none placeholder:text-(--text-secondary)"
            />
            {searchInput.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="flex h-7 w-7 items-center justify-center shrink-0"
                aria-label="Clear search"
              >
                <X size={16} color="var(--text-secondary)" />
              </button>
            )}
            <button
              type="submit"
              className="h-8 px-3 rounded-[10px] text-[13px] font-semibold text-white shrink-0"
              style={{ backgroundColor: 'var(--purple)' }}
            >
              Search
            </button>
          </div>
        </form>
        <div className="grid grid-cols-3 gap-2.5">
          {FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              icon={f.icon}
              active={activeFilter === f.id}
              onClick={() => setActiveFilter(f.id)}
            />
          ))}
        </div>
      </div>

      {/* Vehicle list */}
      <div className="px-4 pt-3 space-y-3">
        {loading
          ? [1, 2, 3].map((i) => (
              <div key={i} className="h-[106px] rounded-[var(--radius-card)] animate-pulse" style={{ backgroundColor: 'var(--card)' }} />
            ))
          : filtered.length === 0
            ? <p className="text-center text-(--text-secondary) text-[15px] py-16">No vehicles found</p>
            : filtered.map((v) => (
                'source' in v && v.source === 'scan' ? (
                  <SwipeableCard key={v.vin} onDelete={() => handleDelete(v.vin)}>
                    <VehicleCard vehicle={v} scannedAt={v.scannedAt} showCustomerMode={customerMode} />
                  </SwipeableCard>
                ) : (
                  <VehicleCard key={v.vin} vehicle={v} showCustomerMode={customerMode} />
                )
              ))}
      </div>
    </div>
  )
}
