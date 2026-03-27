import { timingSafeEqual } from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hasFirebaseAdminConfig, getAdminFirestore } from '../../lib/server/firebaseAdmin'
import { listCrmReports } from '../../lib/server/crmReports'

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
