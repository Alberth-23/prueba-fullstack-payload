'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  AuthContextType,
  User,
  Permissions,
  ModuleName,
  ActionName,
  Role,
  LoginResult,
} from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_PERMISSIONS: Permissions = {
  id: 'admin',
  user: 'admin',
  inventario: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
  ventas: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
  cobranzas: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchPermissions = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/permissions?where[user][equals]=${userId}&limit=1`, {
        credentials: 'include',
      })
      if (!res.ok) return null
      const data = await res.json()
      if (!data.docs?.length) return null
      return data.docs[0] as Permissions
    } catch (e) {
      console.error('Error fetching permissions', e)
      return null
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users/me', {
        credentials: 'include',
      })
      if (!res.ok) {
        setUser(null)
        setPermissions(null)
        return
      }
      const data = await res.json()
      if (!data.user) {
        setUser(null)
        setPermissions(null)
        return
      }

      const u = data.user as User
      setUser(u)

      if (u.role === 'admin') {
        setPermissions(ADMIN_PERMISSIONS)
      } else {
        const perms = await fetchPermissions(u.id)
        setPermissions(perms)
      }
    } catch (e) {
      console.error('Error refreshing auth', e)
      setUser(null)
      setPermissions(null)
    } finally {
      setLoading(false)
    }
  }, [fetchPermissions])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.user) {
        await refreshAuth()
        return { success: true, role: data.user.role as Role }
      }

      return {
        success: false,
        error: data?.errors?.[0]?.message || 'Credenciales inválidas',
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setPermissions(null)
      router.push('/login')
    }
  }

  const hasPermission = useCallback(
    (module: ModuleName, action: ActionName): boolean => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (!permissions) return false
      return permissions[module]?.[action] === true
    },
    [user, permissions],
  )

  const value: AuthContextType = {
    user,
    permissions,
    loading,
    login,
    logout,
    hasPermission,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return ctx
}
