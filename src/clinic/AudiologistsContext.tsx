import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import type { AudiologistProfile } from '../types'
import {
  createAudiologistShared,
  deleteAudiologistShared,
  listAudiologistsLegacy,
  listAudiologistsLegacyGroup,
  listAudiologistsShared,
  updateAudiologistShared,
  upsertAudiologistSharedWithId,
} from '../services/audiologists'

type AudiologistsContextValue = {
  items: AudiologistProfile[]
  loading: boolean
  error: { message: string; code?: string } | null
  refresh: () => Promise<void>
  create: (input: Omit<AudiologistProfile, 'id'>) => Promise<void>
  update: (id: string, input: Omit<AudiologistProfile, 'id'>) => Promise<void>
  remove: (id: string) => Promise<void>
}

const Ctx = createContext<AudiologistsContextValue | undefined>(undefined)

export function AudiologistsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<AudiologistProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)

  async function refresh() {
    if (!user) {
      setItems([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const shared = await listAudiologistsShared()

      // If shared already has items, use it (this is the new source of truth).
      if (shared.length) {
        setItems(shared)
        return
      }

      // If shared is empty, show legacy audiologists immediately (so UI works even if migration can't run).
      let legacyAny: AudiologistProfile[] = []
      try {
        const legacy = await listAudiologistsLegacy(user.uid)
        legacyAny = legacy.length ? legacy : await listAudiologistsLegacyGroup()
      } catch {
        legacyAny = []
      }

      if (legacyAny.length) {
        setItems(legacyAny)
        // Best-effort background migration to shared (don't block UI).
        void Promise.all(
          legacyAny.map((a) =>
            upsertAudiologistSharedWithId(a.id, {
              name: a.name,
              rciNumber: a.rciNumber,
              signatureDataUrl: a.signatureDataUrl,
              migratedFromUid: user.uid,
            }),
          ),
        ).catch(() => {})
        return
      }

      setItems([])
    } catch (e: any) {
      setError({ message: e?.message ?? 'Failed to load audiologists', code: e?.code })
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const value = useMemo<AudiologistsContextValue>(
    () => ({
      items,
      loading,
      error,
      refresh,
      create: async (input) => {
        if (!user) throw new Error('Not authenticated')
        await createAudiologistShared(input)
        await refresh()
      },
      update: async (id, input) => {
        if (!user) throw new Error('Not authenticated')
        await updateAudiologistShared(id, input)
        await refresh()
      },
      remove: async (id) => {
        if (!user) throw new Error('Not authenticated')
        await deleteAudiologistShared(id)
        await refresh()
      },
    }),
    [items, loading, error, user],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAudiologists() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAudiologists must be used within AudiologistsProvider')
  return v
}


