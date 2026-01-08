import type { AiDiagnosisAssist, AudiometryData, TuningForkTests } from '../types'

const FREQS = [250, 500, 1000, 2000, 4000, 8000] as const

function todayIso() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function avg(nums: Array<number | null>): number | null {
  const v = nums.filter((n): n is number => typeof n === 'number')
  if (v.length === 0) return null
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length)
}

function ptaFromAc(ear: any): number | null {
  return avg([ear[500].air.db, ear[1000].air.db, ear[2000].air.db])
}

function abgFrom(ear: any): number | null {
  const gaps: Array<number | null> = [500, 1000, 2000].map((f) => {
    const ac = ear[f].air.db
    const bc = ear[f].bone.db
    if (ac == null || bc == null) return null
    return ac - bc
  })
  return avg(gaps)
}

function degreeFromPta(pta: number | null): string {
  if (pta == null) return 'Undetermined (insufficient data)'
  if (pta <= 25) return 'Within normal limits'
  if (pta <= 40) return 'Mild'
  if (pta <= 55) return 'Moderate'
  if (pta <= 70) return 'Moderately Severe'
  if (pta <= 90) return 'Severe'
  return 'Profound'
}

function configurationFromAc(ear: any): string {
  const low = avg([ear[250].air.db, ear[500].air.db])
  const mid = avg([ear[1000].air.db, ear[2000].air.db])
  const high = avg([ear[4000].air.db, ear[8000].air.db])
  if (low == null || high == null) return 'Configuration: Undetermined'
  const diffHigh = high - low
  const diffLow = low - high
  if (diffHigh >= 15) return 'Configuration: High-frequency sloping'
  if (diffLow >= 15) return 'Configuration: Rising (low-frequency worse)'
  if (mid != null && low != null && high != null) {
    // Cookie-bite-ish: mid worse than both ends.
    if (mid - Math.min(low, high) >= 15) return 'Configuration: Mid-frequency emphasis (cookie-bite pattern)'
    // Reverse cookie-bite: mid better than ends.
    if (Math.max(low, high) - mid >= 15) return 'Configuration: U-shaped / trough pattern'
  }
  return 'Configuration: Flat'
}

function typeFrom(ear: any): { type: string; reasoning: string[] } {
  const pta = ptaFromAc(ear)
  const abg = abgFrom(ear)
  const r: string[] = []
  if (pta == null) return { type: 'Type: Undetermined', reasoning: ['Insufficient AC data for PTA.'] }

  if (pta <= 25) {
    r.push(`PTA ~${pta} dB HL (≤25).`)
    return { type: 'Type: Within normal limits', reasoning: r }
  }

  if (abg == null) {
    r.push(`PTA ~${pta} dB HL but bone conduction is incomplete.`)
    return { type: 'Type: Undetermined (needs BC for classification)', reasoning: r }
  }

  r.push(`PTA ~${pta} dB HL.`)
  r.push(`Average Air–Bone Gap (500/1k/2k) ≈ ${abg} dB.`)

  const bcPta = avg([ear[500].bone.db, ear[1000].bone.db, ear[2000].bone.db])
  if (abg >= 15 && (bcPta == null || bcPta <= 25)) {
    r.push('ABG ≥ 15 dB with near-normal BC suggests a conductive component.')
    return { type: 'Type: Conductive hearing loss (likely)', reasoning: r }
  }
  if (abg >= 15 && bcPta != null && bcPta > 25) {
    r.push('ABG ≥ 15 dB with elevated BC suggests mixed loss.')
    return { type: 'Type: Mixed hearing loss (likely)', reasoning: r }
  }
  r.push('ABG < 15 dB with elevated AC suggests sensorineural loss.')
  return { type: 'Type: Sensorineural hearing loss (likely)', reasoning: r }
}

function asymmetryRedFlags(right: any, left: any): string[] {
  const diffs = FREQS.map((f) => {
    const r = right[f].air.db
    const l = left[f].air.db
    if (r == null || l == null) return null
    return { f, d: Math.abs(r - l) }
  }).filter(Boolean) as { f: number; d: number }[]

  const flags: string[] = []
  const over20 = diffs.some((x) => x.d >= 20)
  const over15count = diffs.filter((x) => x.d >= 15).length
  if (over20 || over15count >= 2) {
    flags.push('Asymmetry flag: interaural AC difference ≥15 dB at ≥2 freqs or ≥20 dB at any freq.')
    flags.push('Consider clinical correlation / ENT evaluation if asymmetry is unexplained or progressive.')
  }
  return flags
}

function tuningForkNotes(tf: TuningForkTests): string[] {
  const out: string[] = []
  if (tf.rinneRight) out.push(`Rinne (Right): ${tf.rinneRight}`)
  if (tf.rinneLeft) out.push(`Rinne (Left): ${tf.rinneLeft}`)
  if (tf.weber) out.push(`Weber: ${tf.weber}`)
  if (out.length) out.push('Tuning fork results can support/contrast with audiometry; interpret with clinical context.')
  return out
}

export function generateAiAssist(input: {
  audiometry: AudiometryData
  tuningFork?: TuningForkTests
}): AiDiagnosisAssist {
  const right = input.audiometry.right
  const left = input.audiometry.left

  const rPta = ptaFromAc(right)
  const lPta = ptaFromAc(left)

  const rDeg = degreeFromPta(rPta)
  const lDeg = degreeFromPta(lPta)

  const rType = typeFrom(right)
  const lType = typeFrom(left)

  const rCfg = configurationFromAc(right)
  const lCfg = configurationFromAc(left)

  const redFlags = asymmetryRedFlags(right, left)

  const summary = `Right: ${rDeg}; ${rType.type.replace('Type: ', '')}. Left: ${lDeg}; ${lType.type.replace('Type: ', '')}.`

  const suggestedText = [
    'AI Assist (draft — requires clinician validation):',
    `Right ear: ${rDeg} hearing level; ${rType.type.replace('Type: ', '')}. ${rCfg.replace('Configuration: ', '')}.`,
    `Left ear: ${lDeg} hearing level; ${lType.type.replace('Type: ', '')}. ${lCfg.replace('Configuration: ', '')}.`,
    redFlags.length ? `Notes: ${redFlags.join(' ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const reasoning = [
    'Right ear reasoning:',
    ...rType.reasoning.map((x) => `- ${x}`),
    rCfg ? `- ${rCfg}` : null,
    rPta != null ? `- PTA (AC 500/1k/2k) ≈ ${rPta} dB HL → ${rDeg}` : '- PTA not computable (missing AC at 500/1k/2k)',
    '',
    'Left ear reasoning:',
    ...lType.reasoning.map((x) => `- ${x}`),
    lCfg ? `- ${lCfg}` : null,
    lPta != null ? `- PTA (AC 500/1k/2k) ≈ ${lPta} dB HL → ${lDeg}` : '- PTA not computable (missing AC at 500/1k/2k)',
  ].filter((x): x is string => typeof x === 'string')

  const tf = input.tuningFork ? tuningForkNotes(input.tuningFork) : []
  if (tf.length) {
    reasoning.push('', 'Tuning fork notes:', ...tf.map((x) => `- ${x}`))
  }

  return {
    generatedAtIso: todayIso(),
    summary,
    suggestedText,
    reasoning,
    redFlags,
  }
}


