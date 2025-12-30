'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { useVentas } from '@/hooks/useVentas'
import { useAuth } from '@/context/AuthContext'
import type { Venta } from '@/types/ventasCobranzas'

interface ProductoInventario {
  id: string
  nombre: string
  precio: number
}

export default function VentasPage() {
  return (
    <ProtectedRoute module="ventas" action="canRead">
      <AppShell>
        <VentasContent />
      </AppShell>
    </ProtectedRoute>
  )
}

function VentasContent() {
  const { hasPermission } = useAuth()
  const {
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
  } = useVentas()

  const [productos, setProductos] = useState<ProductoInventario[]>([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    fecha: '',
    referencia: '',
    cliente: '',
    productoId: '',
    cantidad: '1',
    descripcion: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Venta | null>(null)

  useEffect(() => {
    fetchItems({ page: 1, limit: 10 })
    fetchProductos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProductos = async () => {
    try {
      const res = await fetch(
        '/api/inventory-items?limit=100&where[activo][equals]=true&sort=nombre',
        { credentials: 'include' },
      )
      if (!res.ok) return
      const data = await res.json()
      const prods: ProductoInventario[] = data.docs.map((d: any) => ({
        id: d.id,
        nombre: d.nombre,
        precio: d.precio,
      }))
      setProductos(prods)
    } catch (e) {
      console.error('Error cargando productos para ventas', e)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchItems({ page: 1, limit: 10, search })
  }

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    fetchItems({ page: newPage, limit: 10, search })
  }

  const selectedProduct = productos.find((p) => p.id === form.productoId)
  const cantidadNum = Number(form.cantidad || '0')
  const totalEstimado =
    selectedProduct && cantidadNum > 0 ? selectedProduct.precio * cantidadNum : 0

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productoId) {
      alert('Selecciona un producto')
      return
    }
    setSaving(true)
    const res = await createItem({
      fecha: form.fecha,
      referencia: form.referencia,
      cliente: form.cliente,
      producto: form.productoId,
      cantidad: cantidadNum || 1,
      estado: 'pendiente',
      descripcion: form.descripcion || undefined,
    })
    setSaving(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    setForm({
      fecha: '',
      referencia: '',
      cliente: '',
      productoId: '',
      cantidad: '1',
      descripcion: '',
    })
    fetchItems({ page, limit: 10, search })
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const res = await deleteItem(deleting.id)
    if (!res.success) alert(res.error)
    setDeleting(null)
    fetchItems({ page, limit: 10, search })
  }

  const canCreate = hasPermission('ventas', 'canCreate')
  const canUpdate = hasPermission('ventas', 'canUpdate')
  const canDelete = hasPermission('ventas', 'canDelete')

  const getNombreProducto = (venta: Venta) => {
    const p: any = venta.producto
    if (!p) return '—'
    if (typeof p === 'string') {
      const local = productos.find((prod) => prod.id === p)
      return local?.nombre ?? p
    }
    return p.nombre ?? '—'
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Ventas</h1>
      <p className="page-subtitle">Registro de ventas asociadas a productos del inventario.</p>

      {/* Barra de búsqueda */}
      <div className="inventario-toolbar">
        <form onSubmit={handleSearch} className="inventario-toolbar__search">
          <input
            type="text"
            placeholder="Buscar por cliente o referencia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {loading && (
        <div className="full-page-center">
          <div className="spinner" />
        </div>
      )}

      {/* Formulario */}
      {canCreate && (
        <form className="inventario-form" onSubmit={handleCreate}>
          <h2>Registrar nueva venta</h2>

          <div className="inventario-form__row">
            <label>
              <span>Fecha</span>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </label>
            <label>
              <span>Referencia</span>
              <input
                required
                value={form.referencia}
                onChange={(e) => setForm({ ...form, referencia: e.target.value })}
              />
            </label>
          </div>

          <div className="inventario-form__row">
            <label>
              <span>Cliente</span>
              <input
                required
                value={form.cliente}
                onChange={(e) => setForm({ ...form, cliente: e.target.value })}
              />
            </label>
            <label>
              <span>Producto</span>
              <select
                required
                value={form.productoId}
                onChange={(e) => setForm({ ...form, productoId: e.target.value })}
              >
                <option value="">Selecciona un producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (${p.precio.toFixed(2)})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="inventario-form__row">
            <label>
              <span>Cantidad</span>
              <input
                type="number"
                min="1"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                required
              />
            </label>
            <label>
              <span>Total estimado</span>
              <input disabled value={totalEstimado > 0 ? `$${totalEstimado.toFixed(2)}` : '—'} />
            </label>
          </div>

          <label>
            <span>Descripción</span>
            <textarea
              rows={2}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </label>

          <div className="inventario-form__actions">
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar venta'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      {!loading && !error && items.length > 0 && (
        <>
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Referencia</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{ width: 200 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id}>
                  <td>{new Date(v.fecha).toLocaleDateString()}</td>
                  <td>{v.referencia}</td>
                  <td>{v.cliente}</td>
                  <td>{getNombreProducto(v)}</td>
                  <td>{v.cantidad}</td>
                  <td>${v.total.toFixed(2)}</td>
                  <td>{v.estado}</td>
                  <td>
                    <div className="inventario-table__actions">
                      {canUpdate && v.estado !== 'pagada' && (
                        <button
                          className="secondary small"
                          onClick={async () => {
                            const res = await updateEstado(v.id, 'pagada')
                            if (!res.success) alert(res.error)
                            fetchItems({ page, limit: 10, search })
                          }}
                        >
                          Marcar pagada
                        </button>
                      )}
                      {canDelete && (
                        <button className="danger small" onClick={() => setDeleting(v)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <span>
              Página {page} de {totalPages} ({totalDocs} ventas)
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

      {/* Modal de eliminación */}
      {deleting && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Eliminar venta</h3>
            <p>
              ¿Seguro que deseas eliminar la venta <strong>{deleting.referencia}</strong>?
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
