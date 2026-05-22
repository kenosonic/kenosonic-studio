/**
 * South African tax year: 1 March – last day of February.
 * e.g. 1 March 2025 → 28 February 2026 is tax year '2025-2026'.
 */
export function getTaxYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year  = d.getFullYear()
  const month = d.getMonth() + 1 // 1-indexed

  // March (3) or later → year starts this calendar year
  if (month >= 3) {
    return `${year}-${year + 1}`
  }
  // Jan or Feb → still in the previous calendar year's tax year
  return `${year - 1}-${year}`
}

/** Returns the current SA tax year string. */
export function currentTaxYear(): string {
  return getTaxYear(new Date())
}

/**
 * Returns all months (as 'YYYY-MM') that fall inside a given tax year.
 * Useful for gap-checking bank statements.
 */
export function taxYearMonths(taxYear: string): string[] {
  const [startYearStr] = taxYear.split('-')
  const startYear = parseInt(startYearStr, 10)
  const months: string[] = []
  // March of startYear through February of startYear+1
  for (let m = 3; m <= 12; m++) {
    months.push(`${startYear}-${String(m).padStart(2, '0')}`)
  }
  for (let m = 1; m <= 2; m++) {
    months.push(`${startYear + 1}-${String(m).padStart(2, '0')}`)
  }
  return months
}
