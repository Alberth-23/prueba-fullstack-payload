'use client'

import { useCallback, useState } from 'react'
import type { InventoryItem, PaginatedResponse } from '@/types/inventory'

interface UseInventoryReturn {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalDocs: number
  fetchItems: (opts?: { page?: number; limit?: number; search?: string }) => Promise<void>
  getItem: (id: string) => Promise<InventoryItem | null>
  createItem: (data: Partial<InventoryItem>) => Promise<{ success: boolean; error?: string }>
  updateItem: (
    id: string,
    data: Partial<InventoryItem>,
  ) => Promise<{ success: boolean; error?: string }>
  deleteItem: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function useInventory(): UseInventoryReturn {
  const [items, setItems] = useState<InventoryItem[]>([])
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
        let url = `/api/inventory-items?page=${currentPage}&limit=${limit}&sort=-createdAt`

        if (search && search.trim()) {
          const s = encodeURIComponent(search.trim())
          url += `&where[or][0][nombre][contains]=${s}&where[or][1][sku][contains]=${s}`
        }

        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('No tienes permisos para ver el inventario')
          }
          throw new Error('Error al cargar el inventario')
        }

        const data: PaginatedResponse<InventoryItem> = await res.json()
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

  const getItem = useCallback(async (id: string): Promise<InventoryItem | null> => {
    try {
      const res = await fetch(`/api/inventory-items/${id}`, {
        credentials: 'include',
      })
      if (!res.ok) return null
      const data = (await res.json()) as InventoryItem
      return data
    } catch {
      return null
    }
  }, [])

  const createItem = useCallback(async (data: Partial<InventoryItem>) => {
    try {
      const res = await fetch('/api/inventory-items', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        if (res.status === 403) {
          return { success: false, error: 'No tienes permisos para crear items' }
        }
        const body = await res.json().catch(() => null)
        return {
          success: false,
          error: body?.errors?.[0]?.message || 'Error al crear el item',
        }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Error de conexión' }
    }
  }, [])

  const updateItem = useCallback(async (id: string, data: Partial<InventoryItem>) => {
    try {
      const res = await fetch(`/api/inventory-items/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        if (res.status === 403) {
          return { success: false, error: 'No tienes permisos para editar items' }
        }
        return { success: false, error: 'Error al actualizar el item' }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Error de conexión' }
    }
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/inventory-items/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 403) {
          return { success: false, error: 'No tienes permisos para eliminar items' }
        }
        return { success: false, error: 'Error al eliminar el item' }
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
    getItem,
    createItem,
    updateItem,
    deleteItem,
  }
}
