import type { AudiometryData } from '../types'

function avg3(a: number | null, b: number | null, c: number | null): number | null {
  if (a == null || b == null || c == null) return null
  return Math.round((a + b + c) / 3)
}

export function calculatePtaFromAudiometry(a: AudiometryData): { right: number | null; left: number | null } {
  const r = a.right
  const l = a.left
  return {
    right: avg3(r[500].air.db, r[1000].air.db, r[2000].air.db),
    left: avg3(l[500].air.db, l[1000].air.db, l[2000].air.db),
  }
}


