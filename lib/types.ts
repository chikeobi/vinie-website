export interface Vehicle {
  id: string
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  mileage: number
  price: number
  daysOnLot: number
  imageUrl?: string
  dealershipId: string
  isPinned?: boolean
  isSpecial?: boolean
  hasPriceDrop?: boolean
  isAged?: boolean
  isFresh?: boolean
}

export interface RecentVehicle extends Vehicle {
  scannedAt: number
}

export interface ScanEvent {
  id: string
  vin: string
  vehicleId: string
  scannedAt: number
  userId: string
  dealershipId: string
}
