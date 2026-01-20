import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { AudiologistProfile } from '../types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured. Add .env.local and restart dev server.')
  return db
}

// NEW: shared across logins (same clinic)
function sharedAudiologistsCol() {
  return collection(requireDb(), 'audiologists')
}

// LEGACY: stored per-UID (old behavior)
function legacyAudiologistsCol(uid: string) {
  return collection(requireDb(), 'clinicSettings', uid, 'audiologists')
}

export async function listAudiologistsShared(): Promise<AudiologistProfile[]> {
  const col = sharedAudiologistsCol()
  // Order by name for UX; index usually not required for simple orderBy without where.
  const q = query(col, orderBy('name', 'asc'))
  const res = await getDocs(q)
  return res.docs.map((d) => {
    const data = d.data() as any
    return {
      id: d.id,
      name: data?.name ?? '',
      rciNumber: data?.rciNumber ?? '',
      signatureDataUrl: data?.signatureDataUrl ?? null,
    }
  })
}

export async function createAudiologistShared(input: Omit<AudiologistProfile, 'id'>): Promise<string> {
  const col = sharedAudiologistsCol()
  const res = await addDoc(col, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return res.id
}

export async function updateAudiologistShared(id: string, input: Omit<AudiologistProfile, 'id'>): Promise<void> {
  const ref = doc(requireDb(), 'audiologists', id)
  await setDoc(
    ref,
    {
      ...input,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function deleteAudiologistShared(id: string): Promise<void> {
  const ref = doc(requireDb(), 'audiologists', id)
  await deleteDoc(ref)
}

/**
 * LEGACY helpers: used only for migration.
 * When you log in with the old account once, we can copy its audiologists into the shared collection.
 */
export async function listAudiologistsLegacy(uid: string): Promise<AudiologistProfile[]> {
  const col = legacyAudiologistsCol(uid)
  const q = query(col, orderBy('name', 'asc'))
  const res = await getDocs(q)
  return res.docs.map((d) => {
    const data = d.data() as any
    return {
      id: d.id,
      name: data?.name ?? '',
      rciNumber: data?.rciNumber ?? '',
      signatureDataUrl: data?.signatureDataUrl ?? null,
    }
  })
}

export async function upsertAudiologistSharedWithId(
  id: string,
  input: Omit<AudiologistProfile, 'id'> & { migratedFromUid?: string },
): Promise<void> {
  const ref = doc(requireDb(), 'audiologists', id)
  await setDoc(
    ref,
    {
      ...input,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function listAudiologistsLegacyGroup(): Promise<AudiologistProfile[]> {
  // Reads ALL legacy audiologists across all clinicSettings/<uid>/audiologists/*
  // (works even if the old user is disabled, as long as the docs still exist).
  const q = query(collectionGroup(requireDb(), 'audiologists'), orderBy('name', 'asc'))
  const res = await getDocs(q)
  return res.docs.map((d) => {
    const data = d.data() as any
    return {
      id: d.id,
      name: data?.name ?? '',
      rciNumber: data?.rciNumber ?? '',
      signatureDataUrl: data?.signatureDataUrl ?? null,
    }
  })
}


