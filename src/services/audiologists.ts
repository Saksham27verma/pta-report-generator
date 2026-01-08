import {
  addDoc,
  collection,
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

function audiologistsCol(uid: string) {
  return collection(requireDb(), 'clinicSettings', uid, 'audiologists')
}

export async function listAudiologists(uid: string): Promise<AudiologistProfile[]> {
  const col = audiologistsCol(uid)
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

export async function createAudiologist(
  uid: string,
  input: Omit<AudiologistProfile, 'id'>,
): Promise<string> {
  const col = audiologistsCol(uid)
  const res = await addDoc(col, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return res.id
}

export async function updateAudiologist(
  uid: string,
  id: string,
  input: Omit<AudiologistProfile, 'id'>,
): Promise<void> {
  const ref = doc(requireDb(), 'clinicSettings', uid, 'audiologists', id)
  await setDoc(
    ref,
    {
      ...input,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function deleteAudiologist(uid: string, id: string): Promise<void> {
  const ref = doc(requireDb(), 'clinicSettings', uid, 'audiologists', id)
  await deleteDoc(ref)
}


