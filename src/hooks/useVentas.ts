'use client'

import { useCallback, useState } from 'react'
import type { Venta, PaginatedResponse } from '@/types/ventasCobranzas'

interface UseVentasReturn {
  items: Venta[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalDocs: number
  fetchItems: (opts?: { page?: number; limit?: number; search?: string }) => Promise<void>
  createItem: (data: Partial<Venta>) => Promise<{ success: boolean; error?: string }>
  updateEstado: (
    id: string,
    estado: Venta['estado'],
  ) => Promise<{ success: boolean; error?: string }>
  deleteItem: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function useVentas(): UseVentasReturn {
  const [items, setItems] = useState<Venta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)

  const fetchItems = useCallback(
    async (opts?: { page?: number; limit?: number; search?: string }) => {
      const currentPage = opts?.page ?? 1
      const limit = opts?.limit ?? 10
      const search = opts?.search

      setLoading(true)
      setError(null)

      try {
        let url = `/api/ventas?page=${currentPage}&limit=${limit}&sort=-fecha&depth=1`

        if (search && search.trim()) {
          const s = encodeURIComponent(search.trim())
          url += `&where[or][0][cliente][contains]=${s}&where[or][1][referencia][contains]=${s}`
        }

        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) {
          if (res.status === 403) throw new Error('No tienes permisos para ver Ventas')
          throw new Error('Error al cargar Ventas')
        }

        const data: PaginatedResponse<Venta> = await res.json()
        setItems(data.docs)
        setPage(data.page)
        setTotalPages(data.totalPages)
        setTotalDocs(data.totalDocs)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido')
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const createItem = useCallback(async (data: Partial<Venta>) => {
    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        if (res.status === 403)
          return { success: false, error: 'No tienes permisos para crear ventas' }
        const body = await res.json().catch(() => null)
        return {
          success: false,
          error: body?.errors?.[0]?.message || 'Error al crear la venta',
        }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Error de conexión' }
    }
  }, [])

  const updateEstado = useCallback(async (id: string, estado: Venta['estado']) => {
    try {
      const res = await fetch(`/api/ventas/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      if (!res.ok) {
        if (res.status === 403)
          return { success: false, error: 'No tienes permisos para actualizar ventas' }
        return { success: false, error: 'Error al actualizar la venta' }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Error de conexión' }
    }
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ventas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 403)
          return { success: false, error: 'No tienes permisos para eliminar ventas' }
        return { success: false, error: 'Error al eliminar la venta' }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Error de conexión' }
    }
  }, [])

  return {
    items,
    loading,
    error,
    page,
    totalPages,
    totalDocs,
    fetchItems,
    createItem,
    updateEstado,
    deleteItem,
  }
}
