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

      // Auto-migrate (safe):
      // 1) Try current user's legacy audiologists
      // 2) If none (e.g. old user disabled), fall back to collectionGroup across all legacy audiologists
      const legacy = await listAudiologistsLegacy(user.uid)
      const legacyAny = legacy.length ? legacy : await listAudiologistsLegacyGroup()

      if (legacyAny.length) {
        const sharedIds = new Set(shared.map((a) => a.id))
        const toUpsert = legacyAny.filter((a) => !sharedIds.has(a.id))
        if (toUpsert.length) {
          await Promise.all(
            toUpsert.map((a) =>
              upsertAudiologistSharedWithId(a.id, {
                name: a.name,
                rciNumber: a.rciNumber,
                signatureDataUrl: a.signatureDataUrl,
                migratedFromUid: user.uid,
              }),
            ),
          )
          const sharedAfter = await listAudiologistsShared()
          setItems(sharedAfter)
        } else setItems(shared)
      } else setItems(shared)
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


