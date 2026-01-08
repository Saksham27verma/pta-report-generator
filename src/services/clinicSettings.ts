import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { ClinicSettings } from '../types'
import { defaultClinicSettings } from '../utils/clinicSettingsDefaults'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured. Add .env.local and restart dev server.')
  return db
}

const COLLECTION = 'clinicSettings'

export async function getClinicSettings(uid: string): Promise<ClinicSettings> {
  const ref = doc(requireDb(), COLLECTION, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return defaultClinicSettings()
  return { ...defaultClinicSettings(), ...(snap.data() as any) } as ClinicSettings
}

export async function saveClinicSettings(uid: string, settings: ClinicSettings): Promise<void> {
  const ref = doc(requireDb(), COLLECTION, uid)
  await setDoc(
    ref,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}


