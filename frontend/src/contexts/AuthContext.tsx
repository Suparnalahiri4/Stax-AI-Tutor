// ABOUTME: Authentication context for managing user state
// ABOUTME: Provides login, register, logout functionality across the app

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, isDemoMode } from '../services/supabase'
import { api } from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
  isDemoMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo user for testing without Supabase
const createDemoUser = (username: string, email: string): User => ({
  id: 'demo-user-id',
  email,
  username,
  display_name: username,
  created_at: new Date().toISOString(),
  total_xp: 1250,
  current_level: 5,
  streak_days: 7
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // In demo mode, check localStorage for demo user
        if (isDemoMode) {
          const storedUser = localStorage.getItem('demo_user')
          if (storedUser) {
            setUser(JSON.parse(storedUser))
          }
          setLoading(false)
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.access_token) {
          api.setToken(session.access_token)
          const userData = await api.getMe()
          setUser(userData)
        }
      } catch (error) {
        console.error('Session check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Skip auth listener in demo mode
    if (isDemoMode) return

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.access_token) {
          api.setToken(session.access_token)
          try {
            const userData = await api.getMe()
            setUser(userData)
          } catch {
            setUser(null)
          }
        } else {
          api.setToken(null)
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    // Demo mode login
    if (isDemoMode) {
      const demoUser = createDemoUser('DemoUser', email)
      localStorage.setItem('demo_user', JSON.stringify(demoUser))
      setUser(demoUser)
      return
    }

    // Use backend API for login
    const authResponse = await api.login(email, password)
    api.setToken(authResponse.access_token)
    setUser(authResponse.user)
  }

  const register = async (email: string, password: string, username: string) => {
    // Demo mode register
    if (isDemoMode) {
      const demoUser = createDemoUser(username, email)
      localStorage.setItem('demo_user', JSON.stringify(demoUser))
      setUser(demoUser)
      return
    }

    // Use backend API for registration to create both auth user and profile
    const authResponse = await api.register(email, password, username)
    api.setToken(authResponse.access_token)
    setUser(authResponse.user)
  }

  const logout = async () => {
    if (isDemoMode) {
      localStorage.removeItem('demo_user')
      setUser(null)
      return
    }

    await supabase.auth.signOut()
    api.setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
