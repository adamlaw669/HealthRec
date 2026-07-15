import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { authAPI, demoMode } from "../api/api"
import { mock } from "../api/mock"

export interface UserProfile {
  name: string
  email: string
}

interface UserContextType {
  user: UserProfile | null
  isLoading: boolean
  error: string | null
  isDemo: boolean
  setUser: (user: UserProfile | null) => void
  signInDemo: () => void
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

function readCachedUser(): UserProfile | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return { name: parsed.name || "", email: parsed.email || parsed.username || "" }
  } catch {
    return null
  }
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(readCachedUser())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState<boolean>(
    typeof window !== "undefined" ? demoMode.isActive() : false
  )

  const setUser = useCallback((next: UserProfile | null) => {
    setUserState(next)
    if (typeof window !== "undefined") {
      if (next) localStorage.setItem("user", JSON.stringify(next))
      else localStorage.removeItem("user")
    }
  }, [])

  const refresh = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token && !demoMode.isActive()) {
      setUserState(null)
      setIsLoading(false)
      return
    }
    try {
      const data = await authAPI.getProfile()
      setUser(data)
      setIsDemo(demoMode.isActive())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user profile")
    } finally {
      setIsLoading(false)
    }
  }, [setUser])

  useEffect(() => {
    refresh()
  }, [refresh])

  const signInDemo = useCallback(() => {
    authAPI.demoLogin()
    setUser(mock.user)
    setIsDemo(true)
    setIsLoading(false)
  }, [setUser])

  const signOut = useCallback(async () => {
    await authAPI.logout()
    setUser(null)
    setIsDemo(false)
  }, [setUser])

  return (
    <UserContext.Provider
      value={{ user, isLoading, error, isDemo, setUser, signInDemo, signOut, refresh }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
