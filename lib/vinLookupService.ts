'use client'

import { httpsCallable } from 'firebase/functions'
import type { Vehicle } from '@/lib/types'
import { getFirebaseFunctions, isFirebaseConfigured } from '@/lib/firebase'
import { getVehicleByVin } from '@/lib/firestore'

interface RemoteCarDetails {
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  mileage?: string
  engine?: string
  horsepower?: string
  torque?: string
  transmission?: string
  drivetrain?: string
  wheelSize?: string
  extColor?: string
  intColor?: string
  warranty?: string
  mpg?: string
  marketPrice?: string
  daysInStock?: number
  imageUrl?: string
  features?: string[]
  marketStats?: Vehicle['marketStats']
  similarCars?: Vehicle['similarCars']
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

function toVehicle(details: RemoteCarDetails): Vehicle {
  return {
    id: details.vin,
    vin: details.vin.trim().toUpperCase(),
    year: details.year || 0,
    make: details.make || 'N/A',
    model: details.model || 'N/A',
    trim: details.trim,
    mileage: parseNumber(details.mileage),
    price: parseNumber(details.marketPrice),
    daysOnLot: details.daysInStock || 0,
    imageUrl: details.imageUrl,
    dealershipId: 'market',
    engine: details.engine,
    horsepower: details.horsepower,
    torque: details.torque,
    transmission: details.transmission,
    drivetrain: details.drivetrain,
    mpg: details.mpg,
    warranty: details.warranty,
    extColor: details.extColor,
    intColor: details.intColor,
    wheelSize: details.wheelSize,
    features: details.features || [],
    marketStats: details.marketStats,
    similarCars: details.similarCars,
  }
}

export async function getCarDetails(vin: string): Promise<Vehicle> {
  const normalizedVin = vin.trim().toUpperCase()

  if (isFirebaseConfigured) {
    const callable = httpsCallable<{ vin: string }, { car: RemoteCarDetails }>(
      getFirebaseFunctions(),
      'getCachedCarDetails',
    )

    const result = await callable({ vin: normalizedVin })
    return toVehicle(result.data.car)
  }

  const fallback = await getVehicleByVin(normalizedVin)
  if (fallback) return fallback
  throw new Error('VIN lookup failed')
}
