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
    engine: '2.5L I4',
    horsepower: '203 hp',
    torque: '184 lb-ft',
    transmission: '8-speed automatic',
    drivetrain: 'FWD',
    mpg: '28 city / 39 hwy',
    warranty: 'Basic 3 yr / 36,000 mi • Powertrain 5 yr / 60,000 mi',
    extColor: 'Underground',
    intColor: 'Black',
    wheelSize: '18"',
    features: ['Apple CarPlay', 'Blind Spot Monitor', 'Lane Departure Alert', 'Remote Start', 'Power Moonroof'],
    marketStats: {
      medianPrice: 31200,
      minPrice: 28400,
      maxPrice: 33800,
      avgMiles: 18800,
      activeCount: 21,
      listingPrice: 29995,
    },
    similarCars: [
      { title: '2023 Toyota Camry SE', location: '14 mi away', price: '$31,250' },
      { title: '2023 Toyota Camry XSE', location: '22 mi away', price: '$33,800' },
    ],
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
    engine: '1.5L Turbo I4',
    horsepower: '190 hp',
    torque: '179 lb-ft',
    transmission: 'CVT',
    drivetrain: 'AWD',
    mpg: '27 city / 32 hwy',
    warranty: 'Basic 3 yr / 36,000 mi • Powertrain 5 yr / 60,000 mi',
    extColor: 'Platinum White Pearl',
    intColor: 'Gray',
    wheelSize: '18"',
    features: ['Heated Front Seats', 'Apple CarPlay', 'Power Liftgate', 'Adaptive Cruise Control', 'Blind Spot Monitor'],
    marketStats: {
      medianPrice: 32750,
      minPrice: 29900,
      maxPrice: 35100,
      avgMiles: 24700,
      activeCount: 17,
      listingPrice: 31500,
    },
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
    engine: '3.5L EcoBoost V6',
    horsepower: '400 hp',
    torque: '500 lb-ft',
    transmission: '10-speed automatic',
    drivetrain: '4WD',
    mpg: '18 city / 23 hwy',
    warranty: 'Basic 3 yr / 36,000 mi • Powertrain 5 yr / 60,000 mi',
    extColor: 'Avalanche',
    intColor: 'Black Sport',
    wheelSize: '20"',
    features: ['Tow Package', '360 Camera', 'Pro Trailer Backup Assist', 'Remote Start', 'Heated Seats'],
    marketStats: {
      medianPrice: 46800,
      minPrice: 43800,
      maxPrice: 51900,
      avgMiles: 9400,
      activeCount: 12,
      listingPrice: 44900,
    },
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
    engine: '5.3L V8',
    horsepower: '355 hp',
    torque: '383 lb-ft',
    transmission: '10-speed automatic',
    drivetrain: 'RWD',
    mpg: '15 city / 20 hwy',
    warranty: 'Powertrain coverage likely expired',
    extColor: 'Black',
    intColor: 'Jet Black',
    wheelSize: '20"',
    features: ['Third Row Seating', 'Bose Audio', 'Power Liftgate', 'Leather Seats'],
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
    engine: '2.0L Turbo I4',
    horsepower: '255 hp',
    torque: '295 lb-ft',
    transmission: '8-speed automatic',
    drivetrain: 'RWD',
    mpg: '26 city / 36 hwy',
    warranty: 'Basic 4 yr / 50,000 mi',
    extColor: 'Brooklyn Grey',
    intColor: 'Black Sensatec',
    wheelSize: '19"',
    features: ['Navigation', 'Heated Front Seats', 'Parking Sensors', 'Apple CarPlay', 'Sport Package'],
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
    engine: 'Dual Motor Electric',
    horsepower: '425 hp',
    torque: '475 lb-ft',
    transmission: 'Single-speed',
    drivetrain: 'AWD',
    mpg: '134 city / 126 hwy MPGe',
    warranty: 'Basic 4 yr / 50,000 mi • Battery 8 yr / 120,000 mi',
    extColor: 'Pearl White',
    intColor: 'Black',
    wheelSize: '19"',
    features: ['Autopilot', 'Glass Roof', 'Heated Seats', 'Navigation', 'Premium Audio'],
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
