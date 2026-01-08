import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { auth } from '../firebase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  loginWithEmail: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setUser(null)
      setLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      loginWithEmail: async (email, password) => {
        if (!auth) throw new Error('Firebase is not configured. Add .env.local and restart dev server.')
        await signInWithEmailAndPassword(auth, email, password)
      },
      loginWithGoogle: async () => {
        if (!auth) throw new Error('Firebase is not configured. Add .env.local and restart dev server.')
        const provider = new GoogleAuthProvider()
        await signInWithPopup(auth, provider)
      },
      logout: async () => {
        if (!auth) return
        await signOut(auth)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


