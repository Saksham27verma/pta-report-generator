import admin from 'firebase-admin'

export function hasFirebaseAdminConfig(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  )
}

export function getAdminFirestore(): admin.firestore.Firestore {
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
