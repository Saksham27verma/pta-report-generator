import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ClinicSettings } from '../types'
import { defaultClinicSettings } from '../utils/clinicSettingsDefaults'
import {
  getClinicSettingsLegacy,
  getClinicSettingsShared,
  findBestLegacyClinicSettings,
  saveClinicSettingsShared,
} from '../services/clinicSettings'
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

  function mergeLegacyIntoShared(shared: ClinicSettings, legacy: ClinicSettings): ClinicSettings {
    const def = defaultClinicSettings()
    // If shared values are still defaults, prefer legacy values.
    const pick = <K extends keyof ClinicSettings>(k: K): ClinicSettings[K] => {
      const s = shared[k]
      const l = legacy[k]
      const d = def[k]
      const isDefaultish = JSON.stringify(s) === JSON.stringify(d)
      return (isDefaultish ? l : s) as ClinicSettings[K]
    }

    return {
      ...shared,
      clinicName: pick('clinicName'),
      tagline: pick('tagline'),
      address: pick('address'),
      phone: pick('phone'),
      email: pick('email'),
      website: pick('website'),
      logoDataUrl: pick('logoDataUrl'),
      primaryColor: pick('primaryColor'),
      accentColor: pick('accentColor'),
      footerNote: pick('footerNote'),
      whatsappMessageTemplate: pick('whatsappMessageTemplate'),
      settingsAccess: shared.settingsAccess ?? legacy.settingsAccess ?? null,
    }
  }

  function isSharedStillDefaultish(shared: ClinicSettings): boolean {
    const def = defaultClinicSettings()
    const keys: (keyof ClinicSettings)[] = [
      'clinicName',
      'tagline',
      'address',
      'phone',
      'email',
      'website',
      'logoDataUrl',
      'primaryColor',
      'accentColor',
      'footerNote',
      'whatsappMessageTemplate',
    ]
    // If most fields are still defaults, treat shared as not yet set.
    let defaultCount = 0
    for (const k of keys) {
      if (JSON.stringify(shared[k]) === JSON.stringify(def[k])) defaultCount++
    }
    return defaultCount >= Math.ceil(keys.length * 0.7)
  }

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
      const shared = await getClinicSettingsShared()

      // If shared is still basically empty, try to promote legacy settings (even if old user is disabled).
      if (isSharedStillDefaultish(shared)) {
        const candidateForNewUser = await findBestLegacyClinicSettings()
        if (candidateForNewUser) {
          const merged = mergeLegacyIntoShared(shared, candidateForNewUser.settings)
          // Show immediately
          setSettings(merged)
          // Best-effort persist (don’t block UI if it fails)
          void saveClinicSettingsShared(merged).catch(() => {})
          return
        }
      }

      // Migration/merge: if this user has legacy settings, merge them into shared
      // but only overwrite shared fields that are still "default-ish".
      const legacy = await getClinicSettingsLegacy(user.uid)
      if (legacy) {
        const merged = mergeLegacyIntoShared(shared, legacy)
        if (JSON.stringify(merged) !== JSON.stringify(shared)) {
          setSettings(merged)
          void saveClinicSettingsShared(merged).catch(() => {})
        } else {
          setSettings(shared)
        }
      } else {
        setSettings(shared)
      }
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
        await saveClinicSettingsShared(next)
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


