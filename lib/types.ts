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
  engine?: string
  horsepower?: string
  torque?: string
  transmission?: string
  drivetrain?: string
  mpg?: string
  warranty?: string
  extColor?: string
  intColor?: string
  wheelSize?: string
  features?: string[]
  marketStats?: {
    medianPrice: number
    minPrice: number
    maxPrice: number
    avgMiles: number
    activeCount: number
    listingPrice: number
  }
  similarCars?: Array<{
    title: string
    location: string
    price: string
  }>
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
