/*
 * Indian registration numbers.
 *   Standard:  MH 12 AB 1234  (state, RTO code, series, number)
 *   BH series: 22 BH 1234 AA  (year, BH, number, letters)
 * A plate is stored with no spaces, in capitals.
 */

const STANDARD_RE = /^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{4})$/
const BH_RE = /^(\d{2})BH(\d{4})([A-HJ-NP-Z]{1,2})$/

/** What people type, as a stored plate. Null if it isn't a registration number. */
export function normalizePlate(input: string): string | null {
  const plate = input.toUpperCase().replace(/[^0-9A-Z]/g, "")
  return STANDARD_RE.test(plate) || BH_RE.test(plate) ? plate : null
}

/** "MH 12 AB 1234", as it is written on the vehicle. */
export function formatPlate(plate: string): string {
  const bh = BH_RE.exec(plate)
  if (bh) return `${bh[1]} BH ${bh[2]} ${bh[3]}`
  const standard = STANDARD_RE.exec(plate)
  if (!standard) return plate
  return standard.slice(1).filter(Boolean).join(" ")
}

/**
 * The plate as a scan page shows it: enough to check you are at the right vehicle, not
 * enough to look the vehicle up. "MH •• 1234", or "BH •• 1234" for the BH series.
 */
export function maskPlate(plate: string): string {
  const bh = BH_RE.exec(plate)
  if (bh) return `BH •• ${bh[2]}`
  const standard = STANDARD_RE.exec(plate)
  return standard ? `${standard[1]} •• ${standard[4]}` : "••••"
}
