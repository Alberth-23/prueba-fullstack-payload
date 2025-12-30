'use client'

import { useCallback, useState } from 'react'
import type { Cobranza, PaginatedResponse } from '@/types/ventasCobranzas'

interface UseCobranzasReturn {
  items: Cobranza[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalDocs: number
  fetchItems: (opts?: { page?: number; limit?: number; search?: string }) => Promise<void>
  createItem: (data: Partial<Cobranza>) => Promise<{ success: boolean; error?: string }>
  updateEstado: (
    id: string,
    estado: Cobranza['estado'],
  ) => Promise<{ success: boolean; error?: string }>
  deleteItem: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function useCobranzas(): UseCobranzasReturn {
  const [items, setItems] = useState<Cobranza[]>([])
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
        let url = `/api/cobranzas?page=${currentPage}&limit=${limit}&sort=-fechaVencimiento`

        if (search && search.trim()) {
          const s = encodeURIComponent(search.trim())
          url += `&where[or][0][cliente][contains]=${s}&where[or][1][referencia][contains]=${s}`
        }

        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) {
          if (res.status === 403) throw new Error('No tienes permisos para ver Cobranzas')
          throw new Error('Error al cargar Cobranzas')
        }

        const data: PaginatedResponse<Cobranza> = await res.json()
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

  const createItem = useCallback(async (data: Partial<Cobranza>) => {
    try {
      const res = await fetch('/api/cobranzas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        if (res.status === 403)
          return { success: false, error: 'No tienes permisos para crear cobranzas' }
        const body = await res.json().catch(() => null)
        return {
          success: false,
          error: body?.errors?.[0]?.message || 'Error al crear la cobranza',
        }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Error de conexión' }
    }
  }, [])

  const updateEstado = useCallback(async (id: string, estado: Cobranza['estado']) => {
    try {
      const res = await fetch(`/api/cobranzas/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      if (!res.ok) {
        if (res.status === 403)
          return { success: false, error: 'No tienes permisos para actualizar cobranzas' }
        return { success: false, error: 'Error al actualizar la cobranza' }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Error de conexión' }
    }
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/cobranzas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 403)
          return { success: false, error: 'No tienes permisos para eliminar cobranzas' }
        return { success: false, error: 'Error al eliminar la cobranza' }
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
