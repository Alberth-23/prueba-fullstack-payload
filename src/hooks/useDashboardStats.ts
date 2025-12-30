'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Venta, Cobranza, PaginatedResponse as PCobr } from '@/types/ventasCobranzas'
import type { InventoryItem, PaginatedResponse as PInv } from '@/types/inventory'

export interface DashboardLowStockItem {
  id: string
  nombre: string
  stock: number
}

export interface DashboardCobranzaItem {
  id: string
  cliente: string
  referencia: string
  monto: number
  fechaVencimiento?: string
  estado: string
}

export interface DashboardStats {
  salesTotalAmount: number
  salesCount: number
  pendingCobranzasCount: number
  overdueCobranzasCount: number
  lowStockCount: number
  lowStockItems: DashboardLowStockItem[]
  importantCobranzas: DashboardCobranzaItem[]
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Stats para el dashboard admin:
 * - Ventas últimos N días (monto total + cantidad)
 * - Cobranzas pendientes / vencidas + top 5 para mostrar
 * - Productos con stock bajo (< 5) + top 5
 */
export function useDashboardStats(rangeDays: number = 30): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const now = new Date()
      const start = new Date(now)
      start.setDate(now.getDate() - rangeDays)
      const startISO = start.toISOString().slice(0, 10) // yyyy-mm-dd

      // 1) Ventas últimos N días
      const ventasRes = await fetch(
        `/api/ventas?limit=1000&where[fecha][greater_than_or_equal]=${startISO}&depth=0`,
        { credentials: 'include' },
      )
      if (!ventasRes.ok) {
        throw new Error('No se pudieron cargar las ventas para el dashboard')
      }
      const ventasData: PCobr<Venta> = await ventasRes.json()
      const salesCount = ventasData.docs.length
      const salesTotalAmount = ventasData.docs.reduce((sum, v) => sum + Number(v.total ?? 0), 0)

      // 2) Cobranzas pendientes (todas)
      const cobranzasRes = await fetch(
        `/api/cobranzas?limit=1000&where[estado][equals]=pendiente&depth=0`,
        { credentials: 'include' },
      )
      if (!cobranzasRes.ok) {
        throw new Error('No se pudieron cargar las cobranzas para el dashboard')
      }
      const cobranzasData: PCobr<Cobranza> = await cobranzasRes.json()
      const pendingCobranzasCount = cobranzasData.docs.length

      const today = new Date()
      const overdueCobranzasCount = cobranzasData.docs.filter((c) => {
        if (!c.fechaVencimiento) return false
        const d = new Date(c.fechaVencimiento)
        return d < today
      }).length

      // Ordenar cobranzas pendientes por fecha de vencimiento ascendente
      const importantCobranzas = [...cobranzasData.docs]
        .sort((a, b) => {
          const da = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Infinity
          const db = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Infinity
          return da - db
        })
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          cliente: c.cliente,
          referencia: c.referencia,
          monto: c.monto,
          fechaVencimiento: c.fechaVencimiento,
          estado: c.estado,
        }))

      // 3) Productos con stock bajo (< 5)
      const lowStockRes = await fetch(
        `/api/inventory-items?limit=1000&where[stock][less_than]=5&depth=0`,
        { credentials: 'include' },
      )
      if (!lowStockRes.ok) {
        throw new Error('No se pudo cargar el inventario para el dashboard')
      }
      const lowStockData: PInv<InventoryItem> = await lowStockRes.json()
      const lowStockCount = lowStockData.docs.length

      const lowStockItems = [...lowStockData.docs]
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5)
        .map((p) => ({
          id: p.id,
          nombre: p.nombre,
          stock: p.stock,
        }))

      setStats({
        salesTotalAmount,
        salesCount,
        pendingCobranzasCount,
        overdueCobranzasCount,
        lowStockCount,
        lowStockItems,
        importantCobranzas,
      })
    } catch (e) {
      console.error('Error cargando stats de dashboard:', e)
      setError(e instanceof Error ? e.message : 'Error desconocido al cargar estadísticas')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [rangeDays])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    reload: fetchStats,
  }
}
