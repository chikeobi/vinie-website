'use client'

import { useEffect, useState } from 'react'
import { useCustomerMode } from '@/context/CustomerModeContext'
import { getScannedCars, removeScannedCar, type StoredScan } from '@/lib/scannedCarsStorage'
import PageHeader from '@/components/PageHeader'
import VehicleCard from '@/components/VehicleCard'
import SwipeableCard from '@/components/SwipeableCard'

export default function RecentsPage() {
  const { customerMode } = useCustomerMode()
  const [vehicles, setVehicles] = useState<StoredScan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getScannedCars().then((v) => {
      setVehicles(v)
      setLoading(false)
    })
  }, [])

  async function handleDelete(vin: string) {
    setVehicles((prev) => prev.filter((vehicle) => vehicle.vin !== vin))
    await removeScannedCar(vin)
  }

  return (
    <div>
      <PageHeader title="Recents" />

      <div className="px-4 pt-4">
        <p
          className="text-[11px] font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          Last 5 Scanned Vehicles
        </p>

        <div className="space-y-3">
          {loading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="h-[106px] rounded-[var(--radius-card)] animate-pulse" style={{ backgroundColor: 'var(--card)' }} />
              ))
            : vehicles.length === 0
              ? (
                <div className="py-16 text-center">
                  <p className="text-(--text-secondary) text-[15px]">No recent scans</p>
                  <p className="text-[13px] text-(--text-secondary) mt-1">Scan a VIN barcode to get started</p>
                </div>
              )
              : vehicles.map((v) => (
                  <SwipeableCard key={v.id} onDelete={() => handleDelete(v.vin)}>
                    <VehicleCard vehicle={v} scannedAt={v.scannedAt} showCustomerMode={customerMode} />
                  </SwipeableCard>
                ))}
        </div>
      </div>
    </div>
  )
}
