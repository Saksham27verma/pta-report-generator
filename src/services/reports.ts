import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { ReportDoc, ReportSummary } from '../types'

const REPORTS = 'reports'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured. Add .env.local and restart dev server.')
  return db
}

function sanitizeForWrite(report: ReportDoc) {
  // Avoid writing client-only fields back into Firestore.
  const { id, createdAt, updatedAt, ...rest } = report as any
  return rest as Omit<ReportDoc, 'id'>
}

function toSummary(id: string, data: any): ReportSummary {
  return {
    id,
    patientName: data?.patient?.name ?? '',
    registrationNumber: data?.patient?.registrationNumber ?? '',
    dateOfTest: data?.patient?.dateOfTest ?? '',
  }
}

export async function createReport(report: ReportDoc): Promise<string> {
  const col = collection(requireDb(), REPORTS)
  const res = await addDoc(col, {
    ...sanitizeForWrite(report),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return res.id
}

export async function updateReport(reportId: string, report: ReportDoc): Promise<void> {
  const ref = doc(requireDb(), REPORTS, reportId)
  await updateDoc(ref, { ...sanitizeForWrite(report), updatedAt: serverTimestamp() })
}

export async function getReport(reportId: string): Promise<ReportDoc | null> {
  const ref = doc(requireDb(), REPORTS, reportId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  return { ...(data as any), id: snap.id } as ReportDoc
}

export async function listReportsForUser(uid: string): Promise<ReportSummary[]> {
  const col = collection(requireDb(), REPORTS)
  const q = query(col, where('createdByUid', '==', uid), orderBy('updatedAt', 'desc'))
  const res = await getDocs(q)
  return res.docs.map((d) => toSummary(d.id, d.data()))
}

export function normalizeTimestamps(report: ReportDoc): ReportDoc {
  const r: any = { ...report }
  // Firestore Timestamp doesn't serialize nicely in state; strip if present.
  if (r.createdAt instanceof Timestamp) delete r.createdAt
  if (r.updatedAt instanceof Timestamp) delete r.updatedAt
  return r
}


