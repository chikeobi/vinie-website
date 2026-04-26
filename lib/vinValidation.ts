'use client'

const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
}

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

export function isVinFormatValid(rawVin: string): boolean {
  const vin = rawVin.trim().toUpperCase()
  if (vin.length !== 17) return false
  if (/[^A-HJ-NPR-Z0-9]/.test(vin)) return false
  return true
}

export function isValidVin(rawVin: string): boolean {
  const vin = rawVin.trim().toUpperCase()
  if (!isVinFormatValid(vin)) return false

  let sum = 0
  for (let i = 0; i < vin.length; i++) {
    const value = VIN_TRANSLITERATION[vin[i]]
    if (value === undefined) return false
    sum += value * VIN_WEIGHTS[i]
  }

  const computed = sum % 11
  const expectedCheckDigit = vin[8]
  const computedCheckDigit = computed === 10 ? 'X' : String(computed)

  return expectedCheckDigit === computedCheckDigit
}
