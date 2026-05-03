"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { apiRequest, getToken, setToken } from "./api"

export type User = {
  id: number
  email: string
  name: string | null
  avatar_url: string | null
  is_admin: number | boolean
  balance_usd?: number | string
  created_at?: string
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  setAuthFromToken: (token: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      return
    }
    try {
      const data = await apiRequest<{ user: User }>("/api/auth/me")
      setUser(data.user)
    } catch {
      setToken(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    fetchMe().finally(() => setLoading(false))
  }, [fetchMe])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    })
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const data = await apiRequest<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: { email, password, name },
      auth: false,
    })
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" })
    } catch {
      /* ignore */
    }
    setToken(null)
    setUser(null)
  }, [])

  const setAuthFromToken = useCallback(async (token: string) => {
    setToken(token)
    setLoading(true)
    await fetchMe()
    setLoading(false)
  }, [fetchMe])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refresh: fetchMe, login, register, logout, setAuthFromToken }),
    [user, loading, fetchMe, login, register, logout, setAuthFromToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
