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

/** PTA stored frequencies; CRM list uses 125 Hz as extra leading slot (null). */
const PTA_AUDIO_FREQS = [250, 500, 1000, 2000, 4000, 8000] as const
const CRM_AUDIOGRAM_FREQS_HZ = [125, 250, 500, 1000, 2000, 4000, 8000] as const
const PTA_FREQ_SET = new Set<number>([...PTA_AUDIO_FREQS])

type CrmAudiogramData = {
  rightAirConduction: (number | null)[]
  leftAirConduction: (number | null)[]
  rightBoneConduction: (number | null)[]
  leftBoneConduction: (number | null)[]
  rightMasking: boolean[]
  leftMasking: boolean[]
  notes?: string
}

type CrmReportRow = {
  id: string
  patientName: string
  viewUrl: string
  embedUrl: string
  audiogramData?: CrmAudiogramData
  createdAt?: string
}

function readAudPoint(
  ear: unknown,
  hz: number,
  cond: 'air' | 'bone',
): { db: number | null; nr: boolean; masked: boolean } | null {
  if (!ear || typeof ear !== 'object') return null
  const slot = (ear as Record<string, unknown>)[String(hz)]
  if (!slot || typeof slot !== 'object') return null
  const p = (slot as Record<string, unknown>)[cond]
  if (!p || typeof p !== 'object') return null
  const o = p as Record<string, unknown>
  const db = typeof o.db === 'number' || o.db === null ? (o.db as number | null) : null
  return { db, nr: Boolean(o.nr), masked: Boolean(o.masked) }
}

function mapEarToCrmAudiogram(ear: unknown) {
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
    const ap = readAudPoint(ear, hz, 'air')
    const bp = readAudPoint(ear, hz, 'bone')
    air.push(ap?.nr ? null : ap?.db ?? null)
    bone.push(bp?.nr ? null : bp?.db ?? null)
    mask.push(Boolean(ap?.masked))
  }
  return { air, bone, mask }
}

function audiogramDataFromFirestore(data: DocumentData | undefined): CrmAudiogramData | undefined {
  const a = data?.audiometry
  if (!a || typeof a !== 'object') return undefined
  const right = (a as Record<string, unknown>).right
  const left = (a as Record<string, unknown>).left
  if (!right || !left) return undefined
  try {
    const r = mapEarToCrmAudiogram(right)
    const l = mapEarToCrmAudiogram(left)
    const diag = data?.diagnosis
    let notes: string | undefined
    if (diag && typeof diag === 'object') {
      const d = diag as Record<string, unknown>
      const parts: string[] = []
      if (typeof d.provisionalDiagnosis === 'string' && d.provisionalDiagnosis.trim())
        parts.push(d.provisionalDiagnosis.trim())
      if (typeof d.recommendations === 'string' && d.recommendations.trim())
        parts.push(d.recommendations.trim())
      if (parts.length) notes = parts.join('\n\n')
    }
    const out: CrmAudiogramData = {
      rightAirConduction: r.air,
      leftAirConduction: l.air,
      rightBoneConduction: r.bone,
      leftBoneConduction: l.bone,
      rightMasking: r.mask,
      leftMasking: l.mask,
    }
    if (notes) out.notes = notes
    return out
  } catch {
    return undefined
  }
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
  const base = origin.replace(/\/$/, '')
  const viewUrl = `${base}/reports/${encodeURIComponent(id)}`
  const embedUrl = `${base}/embed/${encodeURIComponent(id)}`
  if (!isValidViewUrl(viewUrl) || !isValidViewUrl(embedUrl)) return null
  const audiogramData = audiogramDataFromFirestore(data)
  const row: CrmReportRow = {
    id,
    patientName: patientNameFromData(data, id),
    viewUrl,
    embedUrl,
    createdAt: createdAtIso(data),
  }
  if (audiogramData) row.audiogramData = audiogramData
  return row
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
  const viewUrl = `${base}/reports/${encodeURIComponent(id)}`
  const embedUrl = `${base}/embed/${encodeURIComponent(id)}`
  const null7 = (): (number | null)[] => Array.from({ length: 7 }, () => null)
  const false7 = (): boolean[] => Array.from({ length: 7 }, () => false)
  return {
    reports: [
      {
        id,
        patientName: 'Dev (mock) Patient',
        viewUrl,
        embedUrl,
        audiogramData: {
          rightAirConduction: null7(),
          leftAirConduction: null7(),
          rightBoneConduction: null7(),
          leftBoneConduction: null7(),
          rightMasking: false7(),
          leftMasking: false7(),
          notes: 'Dev mock audiogram (empty thresholds)',
        },
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
      if (!r.id || !r.viewUrl || !r.embedUrl) return false
      if (r.viewUrl.startsWith('https://') && r.embedUrl.startsWith('https://')) return true
      return (
        process.env.NODE_ENV === 'development' &&
        r.viewUrl.startsWith('http://') &&
        r.embedUrl.startsWith('http://')
      )
    })
    return res.status(200).json({ reports: valid })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to load reports'
    return jsonError(res, 500, msg)
  }
}
