import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
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


