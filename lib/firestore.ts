'use client'

import {
  collection,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { getFirebaseDb } from './firebase'
import type { Vehicle, RecentVehicle, ScanEvent } from './types'

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'mock-1',
    vin: '1HGBH41JXMN109186',
    year: 2023,
    make: 'Toyota',
    model: 'Camry',
    trim: 'SE',
    mileage: 12450,
    price: 29995,
    daysOnLot: 15,
    imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&q=80',
    dealershipId: 'demo',
    hasPriceDrop: true,
  },
  {
    id: 'mock-2',
    vin: '19XFC2F59KE011244',
    year: 2022,
    make: 'Honda',
    model: 'CR-V',
    trim: 'EX',
    mileage: 22100,
    price: 31500,
    daysOnLot: 48,
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
    dealershipId: 'demo',
    isAged: true,
  },
  {
    id: 'mock-3',
    vin: '1FTFW1ET5DFC10312',
    year: 2024,
    make: 'Ford',
    model: 'F-150',
    trim: 'XLT',
    mileage: 5200,
    price: 44900,
    daysOnLot: 3,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    dealershipId: 'demo',
    isFresh: true,
    isSpecial: true,
  },
  {
    id: 'mock-4',
    vin: '1GNSCKKC4FR600141',
    year: 2021,
    make: 'Chevrolet',
    model: 'Tahoe',
    trim: 'LT',
    mileage: 38000,
    price: 48750,
    daysOnLot: 67,
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80',
    dealershipId: 'demo',
    isAged: true,
  },
  {
    id: 'mock-5',
    vin: 'WBA5R1C5XKA844922',
    year: 2023,
    make: 'BMW',
    model: '3 Series',
    trim: '330i',
    mileage: 8750,
    price: 42995,
    daysOnLot: 28,
    imageUrl: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=400&q=80',
    dealershipId: 'demo',
    isPinned: true,
  },
  {
    id: 'mock-6',
    vin: '5YJ3E1EA7KF352842',
    year: 2022,
    make: 'Tesla',
    model: 'Model 3',
    trim: 'Long Range',
    mileage: 19200,
    price: 38500,
    daysOnLot: 5,
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80',
    dealershipId: 'demo',
    isFresh: true,
    hasPriceDrop: true,
  },
]

const MOCK_RECENTS: RecentVehicle[] = [
  { ...MOCK_VEHICLES[0], scannedAt: Date.now() - 1000 * 60 * 5 },
  { ...MOCK_VEHICLES[2], scannedAt: Date.now() - 1000 * 60 * 30 },
  { ...MOCK_VEHICLES[4], scannedAt: Date.now() - 1000 * 60 * 60 * 2 },
  { ...MOCK_VEHICLES[1], scannedAt: Date.now() - 1000 * 60 * 60 * 5 },
  { ...MOCK_VEHICLES[5], scannedAt: Date.now() - 1000 * 60 * 60 * 24 },
]

export async function getInventory(dealershipId: string): Promise<Vehicle[]> {
  try {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'vehicles'),
      where('dealershipId', '==', dealershipId),
      orderBy('daysOnLot', 'desc'),
      limit(50),
    )
    const snap = await getDocs(q)
    if (snap.empty) return MOCK_VEHICLES
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vehicle))
  } catch {
    return MOCK_VEHICLES
  }
}

export async function getVehicleByVin(vin: string): Promise<Vehicle | null> {
  try {
    const db = getFirebaseDb()
    const q = query(collection(db, 'vehicles'), where('vin', '==', vin), limit(1))
    const snap = await getDocs(q)
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Vehicle
    }
  } catch {
    // fall through to mock
  }
  return MOCK_VEHICLES.find((v) => v.vin === vin) ?? null
}

export async function getRecentScans(
  userId: string,
  dealershipId: string,
): Promise<RecentVehicle[]> {
  try {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'scans'),
      where('userId', '==', userId),
      where('dealershipId', '==', dealershipId),
      orderBy('scannedAt', 'desc'),
      limit(5),
    )
    const snap = await getDocs(q)
    if (snap.empty) return MOCK_RECENTS

    const recents = await Promise.all(
      snap.docs.map(async (scanDoc) => {
        const scan = scanDoc.data() as ScanEvent
        const vehicle = await getVehicleByVin(scan.vin)
        if (!vehicle) return null
        return { ...vehicle, scannedAt: scan.scannedAt }
      }),
    )
    return recents.filter(Boolean) as RecentVehicle[]
  } catch {
    return MOCK_RECENTS
  }
}

export async function logScanEvent(
  vin: string,
  vehicleId: string,
  userId: string,
  dealershipId: string,
): Promise<void> {
  try {
    const db = getFirebaseDb()
    await addDoc(collection(db, 'scans'), {
      vin,
      vehicleId,
      userId,
      dealershipId,
      scannedAt: Date.now(),
      createdAt: serverTimestamp(),
    })
  } catch {
    // non-fatal
  }
}

export async function deleteRecentScan(
  vin: string,
  userId: string,
  dealershipId: string,
): Promise<void> {
  try {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'scans'),
      where('vin', '==', vin),
      where('userId', '==', userId),
      where('dealershipId', '==', dealershipId),
    )
    const snap = await getDocs(q)
    await Promise.all(snap.docs.map((doc) => deleteDoc(doc.ref)))
  } catch {
    // non-fatal
  }
}
