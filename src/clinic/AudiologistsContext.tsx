import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import type { AudiologistProfile } from '../types'
import {
  createAudiologist,
  deleteAudiologist,
  listAudiologists,
  updateAudiologist,
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
      const res = await listAudiologists(user.uid)
      setItems(res)
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
        await createAudiologist(user.uid, input)
        await refresh()
      },
      update: async (id, input) => {
        if (!user) throw new Error('Not authenticated')
        await updateAudiologist(user.uid, id, input)
        await refresh()
      },
      remove: async (id) => {
        if (!user) throw new Error('Not authenticated')
        await deleteAudiologist(user.uid, id)
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


