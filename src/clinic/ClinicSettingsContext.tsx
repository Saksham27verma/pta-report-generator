import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ClinicSettings } from '../types'
import { defaultClinicSettings } from '../utils/clinicSettingsDefaults'
import { getClinicSettings, saveClinicSettings } from '../services/clinicSettings'
import { useAuth } from '../auth/AuthContext'

type ClinicSettingsContextValue = {
  settings: ClinicSettings
  loading: boolean
  error: { message: string; code?: string } | null
  save: (next: ClinicSettings) => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<ClinicSettingsContextValue | undefined>(undefined)

export function ClinicSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<ClinicSettings>(defaultClinicSettings())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)

  async function refresh() {
    if (!user) {
      setSettings(defaultClinicSettings())
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const s = await getClinicSettings(user.uid)
      setSettings(s)
    } catch (e: any) {
      // Common: permission-denied if firestore.rules not updated/published
      setError({ message: e?.message ?? 'Failed to load clinic settings', code: e?.code })
      setSettings(defaultClinicSettings())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const value = useMemo<ClinicSettingsContextValue>(
    () => ({
      settings,
      loading,
      error,
      save: async (next) => {
        if (!user) throw new Error('Not authenticated')
        await saveClinicSettings(user.uid, next)
        setSettings(next)
      },
      refresh,
    }),
    [settings, loading, error, user],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useClinicSettings() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useClinicSettings must be used within ClinicSettingsProvider')
  return v
}


