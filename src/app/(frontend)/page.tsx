'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/context/AuthContext'
import type { ModuleName } from '@/types/auth'
import { VentasChart } from '@/components/ventas/VentasChart'
import { useDashboardStats } from '@/hooks/useDashboardStats'

const MODULES: ModuleName[] = ['inventario', 'ventas', 'cobranzas']

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats(30) // últimos 30 días

  // Si no es admin, redirigir a inventario
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/inventario')
    }
  }, [user, router])

  if (!user || user.role !== 'admin') return null

  return (
    <AppShell>
      <div className="page-container">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Bienvenido, {user?.nombre || user?.email}</p>

        {/* === KPIs rápidos === */}
        <section className="dashboard-section">
          <h2>Resumen últimos 30 días</h2>

          {statsError && <div className="alert alert--error">{statsError}</div>}

          <div className="dashboard-kpis">
            <div className="dashboard-kpi-card">
              <p className="dashboard-kpi-label">Total vendido</p>
              <p className="dashboard-kpi-value">
                {statsLoading || !stats ? '—' : `$${stats.salesTotalAmount.toFixed(2)}`}
              </p>
              <p className="dashboard-kpi-footnote">Suma de todas las ventas registradas.</p>
            </div>

            <div className="dashboard-kpi-card">
              <p className="dashboard-kpi-label">Número de ventas</p>
              <p className="dashboard-kpi-value">
                {statsLoading || !stats ? '—' : stats.salesCount}
              </p>
              <p className="dashboard-kpi-footnote">Ventas creadas en los últimos 30 días.</p>
            </div>

            <div className="dashboard-kpi-card">
              <p className="dashboard-kpi-label">Cobranzas pendientes</p>
              <p className="dashboard-kpi-value warning">
                {statsLoading || !stats ? '—' : stats.pendingCobranzasCount}
              </p>
              <p className="dashboard-kpi-footnote">Incluye todas las cobranzas no pagadas.</p>
            </div>

            <div className="dashboard-kpi-card">
              <p className="dashboard-kpi-label">Cobranzas vencidas</p>
              <p className="dashboard-kpi-value danger">
                {statsLoading || !stats ? '—' : stats.overdueCobranzasCount}
              </p>
              <p className="dashboard-kpi-footnote">Pendientes con fecha de vencimiento pasada.</p>
            </div>

            <div className="dashboard-kpi-card">
              <p className="dashboard-kpi-label">Productos con stock bajo</p>
              <p className="dashboard-kpi-value warning">
                {statsLoading || !stats ? '—' : stats.lowStockCount}
              </p>
              <p className="dashboard-kpi-footnote">Stock menor a 5 unidades.</p>
            </div>
          </div>
        </section>

        {/* === Gráfico de ventas === */}
        <section className="dashboard-section">
          <VentasChart />
        </section>

        {/* === Permisos por módulo === */}
        <section className="dashboard-section">
          <h2>Permisos por módulo</h2>
          <div className="dashboard-permissions">
            {MODULES.map((module) => (
              <div key={module} className="dashboard-permissions__card">
                <h3 className="dashboard-permissions__title">
                  {module.charAt(0).toUpperCase() + module.slice(1)}
                </h3>
                <ul className="dashboard-permissions__list">
                  <li className={hasPermission(module, 'canRead') ? 'ok' : 'no'}>
                    {hasPermission(module, 'canRead') ? '✓' : '✗'} Leer
                  </li>
                  <li className={hasPermission(module, 'canCreate') ? 'ok' : 'no'}>
                    {hasPermission(module, 'canCreate') ? '✓' : '✗'} Crear
                  </li>
                  <li className={hasPermission(module, 'canUpdate') ? 'ok' : 'no'}>
                    {hasPermission(module, 'canUpdate') ? '✓' : '✗'} Editar
                  </li>
                  <li className={hasPermission(module, 'canDelete') ? 'ok' : 'no'}>
                    {hasPermission(module, 'canDelete') ? '✓' : '✗'} Eliminar
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
