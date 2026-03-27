import { timingSafeEqual } from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import admin from 'firebase-admin'
import type { DocumentData, Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'

// --- Firebase Admin (inlined so Vercel bundles a single function; lib/ is not deployed) ---

function hasFirebaseAdminConfig(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  )
}

function getAdminFirestore(): Firestore {
  if (!admin.apps.length) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
    if (json) {
      const parsed = JSON.parse(json) as admin.ServiceAccount
      admin.initializeApp({ credential: admin.credential.cert(parsed) })
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() })
    } else {
      throw new Error(
        'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (Vercel) or GOOGLE_APPLICATION_CREDENTIALS (local file path).',
      )
    }
  }
  return admin.firestore()
}

// --- CRM report listing (Firestore) ---

const REPORTS = 'reports'
const RECENT_LIMIT = 100
const FETCH_BUFFER = 150

type CrmReportRow = {
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

async function listCrmReports(
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

// --- HTTP handler ---

function jsonError(res: VercelResponse, status: number, message: string) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.json({ error: message })
}

function getBearerToken(req: VercelRequest): string | null {
  const raw = req.headers.authorization
  if (!raw || typeof raw !== 'string') return null
  const m = raw.match(/^Bearer\s+(.+)$/i)
  return m?.[1]?.trim() ?? null
}

function bearerMatches(expected: string, token: string | null): boolean {
  if (token == null) return false
  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(token, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function requireCrmAuth(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.CRM_PTA_API_KEY?.trim()
  if (!expected) return true
  const token = getBearerToken(req)
  if (bearerMatches(expected, token)) return true
  jsonError(res, 401, 'Unauthorized')
  return false
}

/**
 * Public origin for links returned to the CRM (must be HTTPS in production).
 * Prefer NEXT_PUBLIC_APP_URL; on Vercel, VERCEL_URL is set automatically (no protocol).
 */
function getAppOrigin(req: VercelRequest): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (explicit) {
    if (explicit.startsWith('https://')) return explicit
    if (explicit.startsWith('http://')) {
      if (process.env.VERCEL) return `https://${explicit.replace(/^http:\/\//, '')}`
      return explicit
    }
    return `https://${explicit.replace(/^\/+/, '')}`
  }
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '')
    return `https://${host}`
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || 'http'
  const host = req.headers.host || 'localhost:5173'
  return `${proto}://${host}`
}

function ensureHttpsViewBase(origin: string): string {
  if (origin.startsWith('https://')) return origin
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return origin
  if (origin.startsWith('http://')) return `https://${origin.slice('http://'.length)}`
  return origin
}

function devMockReports(origin: string) {
  const base = origin.replace(/\/$/, '')
  const id = 'dev-mock-report'
  const viewUrl = `${base}/reports/${id}`
  return {
    reports: [
      {
        id,
        patientName: 'Dev (mock) Patient',
        viewUrl,
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return jsonError(res, 405, 'Method Not Allowed')
  }

  if (!requireCrmAuth(req, res)) return

  let origin = getAppOrigin(req)
  origin = ensureHttpsViewBase(origin)

  const qParam = req.query.q
  const q = Array.isArray(qParam) ? qParam[0] : qParam

  if (!hasFirebaseAdminConfig()) {
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json(devMockReports(origin))
    }
    return jsonError(
      res,
      503,
      'CRM list API requires Firebase Admin credentials (FIREBASE_SERVICE_ACCOUNT_JSON).',
    )
  }

  try {
    const db = getAdminFirestore()
    const reports = await listCrmReports(db, typeof q === 'string' ? q : undefined, origin)
    const valid = reports.filter((r) => {
      if (!r.id || !r.viewUrl) return false
      if (r.viewUrl.startsWith('https://')) return true
      return process.env.NODE_ENV === 'development' && r.viewUrl.startsWith('http://')
    })
    return res.status(200).json({ reports: valid })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to load reports'
    return jsonError(res, 500, msg)
  }
}
