'use client'

import type { Vehicle } from '@/lib/types'

const STORAGE_KEY = '@scanned_cars'
const MAX_SAVED_CARS = 10

export type StoredScan = Vehicle & {
  source: 'scan'
  scannedAt: number
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function parseStored(raw: string | null): StoredScan[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(cars: StoredScan[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cars))
}

export async function getScannedCars(): Promise<StoredScan[]> {
  if (!canUseStorage()) return []
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return parseStored(stored)
}

export async function getScannedCarByVin(vin: string): Promise<StoredScan | null> {
  const cars = await getScannedCars()
  return cars.find((car) => car.vin === vin) ?? null
}

export async function saveScannedCar(car: Vehicle): Promise<{ inserted: boolean; message?: string }> {
  const existing = await getScannedCars()
  const duplicate = existing.some((item) => item.vin === car.vin)
  if (duplicate) {
    return { inserted: false, message: 'This VIN has already been scanned.' }
  }

  const updated = [{ ...car, source: 'scan' as const, scannedAt: Date.now() }, ...existing].slice(0, MAX_SAVED_CARS)
  persist(updated)
  return { inserted: true, message: 'VIN scan saved.' }
}

export async function upsertScannedCar(car: Vehicle): Promise<void> {
  const existing = await getScannedCars()
  const filtered = existing.filter((item) => item.vin !== car.vin)
  persist([{ ...car, source: 'scan' as const, scannedAt: Date.now() }, ...filtered].slice(0, MAX_SAVED_CARS))
}

export async function removeScannedCar(vin: string): Promise<void> {
  const existing = await getScannedCars()
  persist(existing.filter((item) => item.vin !== vin))
}
