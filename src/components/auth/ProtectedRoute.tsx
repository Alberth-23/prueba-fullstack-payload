'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { ModuleName, ActionName } from '@/types/auth'

interface Props {
  children: React.ReactNode
  module?: ModuleName
  action?: ActionName
}

export function ProtectedRoute({ children, module, action = 'canRead' }: Props) {
  const { user, loading, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (module && !hasPermission(module, action)) {
      router.replace('/unauthorized')
    }
  }, [user, loading, module, action, hasPermission, router])

  if (loading) {
    return (
      <div className="full-page-center">
        <div className="spinner" />
        <p>Cargando...</p>
      </div>
    )
  }

  if (!user) return null
  if (module && !hasPermission(module, action)) return null

  return <>{children}</>
}
