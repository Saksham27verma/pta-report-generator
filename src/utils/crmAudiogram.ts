import { AUDIO_FREQS, type AudiometryData } from '../types'

/** CRM PureToneAudiogram order: 125, 250, 500, 1k, 2k, 4k, 8k Hz. PTA stores 250–8000 only; 125 is always null / false. */
export const CRM_AUDIOGRAM_FREQS_HZ = [125, 250, 500, 1000, 2000, 4000, 8000] as const

const PTA_FREQ_SET = new Set<number>([...AUDIO_FREQS])

export type CrmAudiogramData = {
  rightAirConduction: (number | null)[]
  leftAirConduction: (number | null)[]
  rightBoneConduction: (number | null)[]
  leftBoneConduction: (number | null)[]
  rightMasking: boolean[]
  leftMasking: boolean[]
  notes?: string
}

function mapEar(ear: AudiometryData['right']) {
  const air: (number | null)[] = []
  const bone: (number | null)[] = []
  const mask: boolean[] = []
  for (const hz of CRM_AUDIOGRAM_FREQS_HZ) {
    if (!PTA_FREQ_SET.has(hz)) {
      air.push(null)
      bone.push(null)
      mask.push(false)
      continue
    }
    const f = hz as (typeof AUDIO_FREQS)[number]
    const ap = ear[f].air
    const bp = ear[f].bone
    air.push(ap.nr ? null : ap.db)
    bone.push(bp.nr ? null : bp.db)
    mask.push(Boolean(ap.masked))
  }
  return { air, bone, mask }
}

/** Maps PTA Firestore audiometry into the shape expected by Hearing Hope CRM. */
export function audiometryToCrmAudiogramData(
  audiometry: AudiometryData | undefined | null,
  notes?: string,
): CrmAudiogramData | undefined {
  if (!audiometry?.right || !audiometry?.left) return undefined
  const r = mapEar(audiometry.right)
  const l = mapEar(audiometry.left)
  const out: CrmAudiogramData = {
    rightAirConduction: r.air,
    leftAirConduction: l.air,
    rightBoneConduction: r.bone,
    leftBoneConduction: l.bone,
    rightMasking: r.mask,
    leftMasking: l.mask,
  }
  if (notes?.trim()) out.notes = notes.trim()
  return out
}
