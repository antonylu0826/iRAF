import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { remult } from "remult"
import { EventBus, EVENTS } from "@iraf/core"

export interface AuthUser {
  id: string
  name: string
  roles: string[]
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = "iraf_token"

function applyToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
  // Remult reads Authorization from each request via getUser on server side.
  // On the client, we inject it by overriding the default fetch (remult.apiClient.httpClient).
  remult.apiClient.httpClient = (url, options = {}) => {
    const t = localStorage.getItem(TOKEN_KEY)
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> ?? {}),
    }
    if (t) headers["Authorization"] = `Bearer ${t}`
    return fetch(url, { ...options, headers })
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    applyToken(token)
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user: AuthUser } | null) => {
        if (data?.user) setUser(data.user)
        else applyToken(null)
      })
      .catch(() => applyToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json() as { token?: string; user?: AuthUser; message?: string; code?: string }
    if (!res.ok) {
      const message = data.code ?? data.message ?? "Login failed"
      const err = new Error(message)
      ;(err as any).code = data.code
      throw err
    }
    applyToken(data.token!)
    setUser(data.user!)
    await EventBus.emit(EVENTS.AUTH_LOGIN, { user: data.user! })
  }, [])

  const logout = useCallback(() => {
    applyToken(null)
    setUser(null)
    EventBus.emit(EVENTS.AUTH_LOGOUT, {})
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
