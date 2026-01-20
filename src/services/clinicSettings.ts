import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { ClinicSettings } from '../types'
import { defaultClinicSettings } from '../utils/clinicSettingsDefaults'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured. Add .env.local and restart dev server.')
  return db
}

const COLLECTION = 'clinicSettings'
const SHARED_DOC_ID = 'shared'

export async function getClinicSettingsShared(): Promise<ClinicSettings> {
  const ref = doc(requireDb(), COLLECTION, SHARED_DOC_ID)
  const snap = await getDoc(ref)
  if (!snap.exists()) return defaultClinicSettings()
  return { ...defaultClinicSettings(), ...(snap.data() as any) } as ClinicSettings
}

export async function saveClinicSettingsShared(settings: ClinicSettings): Promise<void> {
  const ref = doc(requireDb(), COLLECTION, SHARED_DOC_ID)
  await setDoc(
    ref,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

// Legacy per-user settings (old behavior); used only for one-time migration.
export async function getClinicSettingsLegacy(uid: string): Promise<ClinicSettings | null> {
  const ref = doc(requireDb(), COLLECTION, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { ...defaultClinicSettings(), ...(snap.data() as any) } as ClinicSettings
}

export async function findBestLegacyClinicSettings(): Promise<{ uid: string; settings: ClinicSettings } | null> {
  const col = collection(requireDb(), COLLECTION)
  const res = await getDocs(col)
  const def = defaultClinicSettings()

  function score(s: ClinicSettings): number {
    let pts = 0
    if (s.clinicName && s.clinicName !== def.clinicName) pts += 5
    if (s.address && s.address !== def.address) pts += 4
    if (s.phone && s.phone !== def.phone) pts += 2
    if (s.email && s.email !== def.email) pts += 2
    if (s.logoDataUrl) pts += 3
    if (s.footerNote && s.footerNote !== def.footerNote) pts += 2
    if (s.whatsappMessageTemplate && s.whatsappMessageTemplate !== def.whatsappMessageTemplate) pts += 1
    return pts
  }

  let best: { uid: string; settings: ClinicSettings; score: number } | null = null
  for (const d of res.docs) {
    if (d.id === SHARED_DOC_ID) continue
    const s = { ...def, ...(d.data() as any) } as ClinicSettings
    const sc = score(s)
    if (!best || sc > best.score) best = { uid: d.id, settings: s, score: sc }
  }

  if (!best || best.score <= 0) return null
  return { uid: best.uid, settings: best.settings }
}


