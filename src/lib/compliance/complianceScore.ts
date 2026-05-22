export interface ComplianceScore {
  score: number
  done: number
  pending: number
  total: number
}

export function computeComplianceScore(
  items: Array<{ status: string }>,
): ComplianceScore {
  const eligible = items.filter(i => i.status !== 'na')
  const done     = eligible.filter(i => i.status === 'done').length
  const pending  = eligible.filter(i => i.status === 'pending').length
  const total    = eligible.length
  const score    = total === 0 ? 0 : Math.round((done / total) * 100)
  return { score, done, pending, total }
}
