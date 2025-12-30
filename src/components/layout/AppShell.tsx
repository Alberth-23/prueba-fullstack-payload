'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { ModuleName } from '@/types/auth'

interface NavItem {
  label: string
  href: string
  module?: ModuleName
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Inventario', href: '/inventario', module: 'inventario' },
  { label: 'Ventas', href: '/ventas', module: 'ventas' },
  { label: 'Cobranzas', href: '/cobranzas', module: 'cobranzas' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, hasPermission, logout } = useAuth()

  const visibleNav = navigation.filter((item) => {
    if (item.href === '/' && user?.role !== 'admin') return false
    if (!item.module) return true
    return hasPermission(item.module, 'canRead')
  })

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__logo">
          <span className="app-shell__logo-title">Sistema</span>
          <span className="app-shell__logo-subtitle">Payload + Next</span>
        </div>
        <nav className="app-shell__nav">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                'app-shell__nav-link' +
                (pathname === item.href ? ' app-shell__nav-link--active' : '')
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="app-shell__user">
          <div className="app-shell__user-info">
            <div className="app-shell__user-name">{user?.nombre || user?.email}</div>
            <div className="app-shell__user-role">{user?.role}</div>
          </div>
          <button className="app-shell__logout" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  )
}
