'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { useInventory } from '@/hooks/useInventory'
import { useAuth } from '@/context/AuthContext'
import type { InventoryItem } from '@/types/inventory'

export default function InventarioPage() {
  return (
    <ProtectedRoute module="inventario" action="canRead">
      <AppShell>
        <InventarioContent />
      </AppShell>
    </ProtectedRoute>
  )
}

function InventarioContent() {
  const { hasPermission } = useAuth()
  const { items, loading, error, page, totalPages, totalDocs, fetchItems, deleteItem } =
    useInventory()

  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<InventoryItem | null>(null)

  useEffect(() => {
    fetchItems({ page: 1, limit: 10 })
  }, [fetchItems])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchItems({ page: 1, limit: 10, search })
  }

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    fetchItems({ page: newPage, limit: 10, search })
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const res = await deleteItem(deleting.id)
    if (!res.success) {
      alert(res.error)
    }
    setDeleting(null)
    fetchItems({ page, limit: 10, search })
  }

  const canCreate = hasPermission('inventario', 'canCreate')
  const canUpdate = hasPermission('inventario', 'canUpdate')
  const canDelete = hasPermission('inventario', 'canDelete')

  return (
    <div className="page-container">
      <h1 className="page-title">Inventario</h1>
      <p className="page-subtitle">Listado de productos del inventario.</p>

      {/* Barra de búsqueda + botón nuevo */}
      <div className="inventario-toolbar">
        <form onSubmit={handleSearch} className="inventario-toolbar__search">
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>

        {canCreate && (
          <Link href="/inventario/nuevo">
            <button className="primary">Nuevo item</button>
          </Link>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {loading && (
        <div className="full-page-center">
          <div className="spinner" />
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="alert alert--info">
          No hay items en el inventario.
          {canCreate && (
            <>
              {' '}
              <Link href="/inventario/nuevo">Crea el primero.</Link>
            </>
          )}
        </div>
      )}

      {/* Tabla de inventario con imagen */}
      {!loading && !error && items.length > 0 && (
        <>
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Stock</th>
                <th style={{ width: 160 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.imagen ? (
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>Sin imagen</span>
                    )}
                  </td>
                  <td>{item.nombre}</td>
                  <td>{item.sku}</td>
                  <td>${item.precio.toFixed(2)}</td>
                  <td>{item.stock}</td>
                  <td>
                    <div className="inventario-table__actions">
                      {canUpdate && (
                        <Link href={`/inventario/${item.id}`}>
                          <button className="secondary small">Editar</button>
                        </Link>
                      )}
                      {canDelete && (
                        <button className="danger small" onClick={() => setDeleting(item)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="pagination">
            <span>
              Página {page} de {totalPages} ({totalDocs} items)
            </span>
            <div className="pagination__buttons">
              <button onClick={() => changePage(page - 1)} disabled={page <= 1}>
                Anterior
              </button>
              <button onClick={() => changePage(page + 1)} disabled={page >= totalPages}>
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal eliminación */}
      {deleting && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Eliminar item</h3>
            <p>
              ¿Seguro que deseas eliminar <strong>{deleting.nombre}</strong>?
            </p>
            <div className="modal__actions">
              <button onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="danger" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
