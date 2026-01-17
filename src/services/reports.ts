import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
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
    audiologistId: data?.diagnosis?.audiologistId ?? null,
    audiologistName: data?.diagnosis?.audiologistName ?? '',
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

export async function listReports(): Promise<ReportSummary[]> {
  const col = collection(requireDb(), REPORTS)
  // Avoid composite index requirements by not ordering on a separate field.
  // We'll sort client-side using dateOfTest (string YYYY-MM-DD) where available.
  const res = await getDocs(query(col))
  const items = res.docs.map((d) => toSummary(d.id, d.data()))
  items.sort((a, b) => (b.dateOfTest || '').localeCompare(a.dateOfTest || ''))
  return items
}

// Back-compat: old name used by the dashboard. Now returns all reports for shared-clinic access.
export async function listReportsForUser(_uid: string): Promise<ReportSummary[]> {
  return listReports()
}

export function normalizeTimestamps(report: ReportDoc): ReportDoc {
  const r: any = { ...report }
  // Firestore Timestamp doesn't serialize nicely in state; strip if present.
  if (r.createdAt instanceof Timestamp) delete r.createdAt
  if (r.updatedAt instanceof Timestamp) delete r.updatedAt
  return r
}


