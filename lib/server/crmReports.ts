import type { DocumentData, Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'

const REPORTS = 'reports'
const RECENT_LIMIT = 100
const FETCH_BUFFER = 150

export type CrmReportRow = {
  id: string
  patientName: string
  viewUrl: string
  createdAt?: string
}

function allowHttpViewUrl(): boolean {
  return process.env.NODE_ENV === 'development'
}

function isValidViewUrl(url: string): boolean {
  if (url.startsWith('https://')) return true
  return allowHttpViewUrl() && url.startsWith('http://')
}

function patientNameFromData(data: DocumentData | undefined, id: string): string {
  const name = typeof data?.patient?.name === 'string' ? data.patient.name.trim() : ''
  return name || id
}

function createdAtIso(data: DocumentData | undefined): string | undefined {
  const ca = data?.createdAt as { toDate?: () => Date } | undefined
  if (ca && typeof ca.toDate === 'function') {
    try {
      return ca.toDate().toISOString()
    } catch {
      /* ignore */
    }
  }
  const dot = data?.patient?.dateOfTest
  if (typeof dot === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dot)) {
    return `${dot}T00:00:00.000Z`
  }
  return undefined
}

function docToRow(id: string, data: DocumentData | undefined, origin: string): CrmReportRow | null {
  if (!id) return null
  const viewUrl = `${origin.replace(/\/$/, '')}/reports/${encodeURIComponent(id)}`
  if (!isValidViewUrl(viewUrl)) return null
  return {
    id,
    patientName: patientNameFromData(data, id),
    viewUrl,
    createdAt: createdAtIso(data),
  }
}

/** Firestore auto-ids are 20 chars; treat long alphanumeric slugs as id candidates. */
function queryLooksLikeReportId(q: string): boolean {
  const t = q.trim()
  if (t.length < 10 || t.length > 128) return false
  if (/\s/.test(t)) return false
  return /^[a-zA-Z0-9_-]+$/.test(t)
}

function sortDocsByRecency(docs: QueryDocumentSnapshot[]): void {
  docs.sort((a, b) => {
    const ta = (a.get('createdAt') as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
    const tb = (b.get('createdAt') as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
    if (tb !== ta) return tb - ta
    const da = typeof a.data()?.patient?.dateOfTest === 'string' ? a.data().patient.dateOfTest : ''
    const db = typeof b.data()?.patient?.dateOfTest === 'string' ? b.data().patient.dateOfTest : ''
    return db.localeCompare(da)
  })
}

async function fetchRecentDocs(db: Firestore): Promise<QueryDocumentSnapshot[]> {
  try {
    const snap = await db.collection(REPORTS).orderBy('createdAt', 'desc').limit(FETCH_BUFFER).get()
    return snap.docs
  } catch {
    const snap = await db.collection(REPORTS).limit(500).get()
    const docs = [...snap.docs]
    sortDocsByRecency(docs)
    return docs.slice(0, FETCH_BUFFER)
  }
}

function nameMatches(patientName: string, q: string): boolean {
  return patientName.toLowerCase().includes(q.trim().toLowerCase())
}

export async function listCrmReports(
  db: Firestore,
  qRaw: string | undefined,
  origin: string,
): Promise<CrmReportRow[]> {
  const q = (qRaw ?? '').trim()

  if (q && queryLooksLikeReportId(q)) {
    const snap = await db.collection(REPORTS).doc(q).get()
    if (snap.exists) {
      const row = docToRow(snap.id, snap.data(), origin)
      return row ? [row] : []
    }
  }

  const docs = await fetchRecentDocs(db)
  const sliced = docs.slice(0, RECENT_LIMIT)

  if (!q) {
    const rows: CrmReportRow[] = []
    for (const d of sliced) {
      const row = docToRow(d.id, d.data(), origin)
      if (row) rows.push(row)
    }
    return rows
  }

  const rows: CrmReportRow[] = []
  for (const d of sliced) {
    const data = d.data()
    const pname = patientNameFromData(data, d.id)
    if (!nameMatches(pname, q) && !d.id.toLowerCase().includes(q.toLowerCase())) continue
    const row = docToRow(d.id, data, origin)
    if (row) rows.push(row)
  }
  return rows
}
