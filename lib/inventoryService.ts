'use client'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore'
import type { Vehicle } from '@/lib/types'
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase'
import { getInventory, getVehicleByVin } from '@/lib/firestore'

export type InventoryVehicle = Vehicle & {
  inventoryId: string
  dealershipId: string
  source: 'inventory'
  uploadedAt?: number
  updatedAt?: number
}

function toMillis(value: unknown): number | undefined {
  if (!value) return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  if (typeof value === 'object') {
    const candidate = value as { toMillis?: () => number; seconds?: number }
    if (typeof candidate.toMillis === 'function') return candidate.toMillis()
    if (typeof candidate.seconds === 'number') return candidate.seconds * 1000
  }
  return undefined
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function asOptionalString(value: unknown): string | undefined {
  const normalized = asString(value)
  return normalized || undefined
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function mapInventoryVehicle(id: string, raw: Record<string, unknown>): InventoryVehicle {
  return {
    id,
    inventoryId: id,
    dealershipId: asString(raw.dealershipId, 'demo'),
    source: 'inventory',
    vin: asString(raw.vin, id).toUpperCase(),
    year: parseNumber(raw.year),
    make: asString(raw.make, 'N/A'),
    model: asString(raw.model, 'N/A'),
    trim: asOptionalString(raw.trim),
    mileage: parseNumber(raw.mileage),
    price: parseNumber(raw.marketPrice ?? raw.price),
    daysOnLot: parseNumber(raw.daysInStock ?? raw.daysOnLot),
    imageUrl: asOptionalString(raw.imageUrl),
    engine: asOptionalString(raw.engine),
    horsepower: asOptionalString(raw.horsepower),
    torque: asOptionalString(raw.torque),
    transmission: asOptionalString(raw.transmission),
    drivetrain: asOptionalString(raw.drivetrain),
    mpg: asOptionalString(raw.mpg),
    warranty: asOptionalString(raw.warranty),
    extColor: asOptionalString(raw.extColor),
    intColor: asOptionalString(raw.intColor),
    wheelSize: asOptionalString(raw.wheelSize),
    features: Array.isArray(raw.features) ? raw.features.filter((item): item is string => typeof item === 'string') : [],
    marketStats: typeof raw.marketStats === 'object' && raw.marketStats ? raw.marketStats as Vehicle['marketStats'] : undefined,
    similarCars: Array.isArray(raw.similarCars) ? raw.similarCars as Vehicle['similarCars'] : undefined,
    updatedAt: toMillis(raw.updatedAt),
    uploadedAt: toMillis(raw.uploadedAt),
  }
}

function inventoryFromVehicle(vehicle: Vehicle, dealershipId: string): InventoryVehicle {
  return {
    ...vehicle,
    inventoryId: vehicle.id,
    dealershipId: vehicle.dealershipId || dealershipId,
    source: 'inventory',
  }
}

export async function getDealershipInventory(dealershipId: string): Promise<InventoryVehicle[]> {
  if (isFirebaseConfigured && dealershipId) {
    try {
      const db = getFirebaseDb()
      const snapshot = await getDocs(
        query(
          collection(db, 'dealerships', dealershipId, 'inventory'),
          orderBy('updatedAt', 'desc'),
          limit(150),
        ),
      )
      if (!snapshot.empty) {
        return snapshot.docs.map((docSnap) => mapInventoryVehicle(docSnap.id, docSnap.data()))
      }
    } catch {
      // fall through to flat/mock inventory
    }
  }

  const fallback = await getInventory(dealershipId)
  return fallback.map((vehicle) => inventoryFromVehicle(vehicle, dealershipId))
}

export async function getInventoryVehicleByVin(dealershipId: string, vin: string): Promise<InventoryVehicle | null> {
  const normalizedVin = vin.trim().toUpperCase()

  if (isFirebaseConfigured && dealershipId) {
    try {
      const db = getFirebaseDb()
      const snap = await getDoc(doc(db, 'dealerships', dealershipId, 'inventory', normalizedVin))
      if (snap.exists()) {
        return mapInventoryVehicle(snap.id, snap.data())
      }
    } catch {
      // fall through to flat/mock inventory
    }
  }

  const fallback = await getVehicleByVin(normalizedVin)
  return fallback ? inventoryFromVehicle(fallback, dealershipId) : null
}
