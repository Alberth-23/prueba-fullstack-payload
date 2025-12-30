'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { useCobranzas } from '@/hooks/useCobranzas'
import { useAuth } from '@/context/AuthContext'
import type { Cobranza } from '@/types/ventasCobranzas'

export default function CobranzasPage() {
  return (
    <ProtectedRoute module="cobranzas" action="canRead">
      <AppShell>
        <CobranzasContent />
      </AppShell>
    </ProtectedRoute>
  )
}

function CobranzasContent() {
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
  } = useCobranzas()

  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    fechaVencimiento: '',
    referencia: '',
    cliente: '',
    monto: '',
    descripcion: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Cobranza | null>(null)

  useEffect(() => {
    fetchItems({ page: 1, limit: 10 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Buscar:
   * 1) filtra la tabla (fetchItems con search)
   * 2) hace una petición adicional buscando por referencia (contains)
   *    y si encuentra alguna, rellena el formulario con esa cobranza
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Filtrar tabla
    await fetchItems({ page: 1, limit: 10, search })

    const ref = search.trim()
    if (!ref) return

    // 2. Intentar rellenar el formulario con la primera coincidencia por referencia
    try {
      const encoded = encodeURIComponent(ref)
      const res = await fetch(`/api/cobranzas?limit=1&where[referencia][contains]=${encoded}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        console.error('Error buscando cobranza por referencia:', res.status)
        return
      }

      const data = await res.json()
      if (!data.docs || !data.docs.length) {
        // No hay coincidencias exactas/parciales, no rellenamos nada
        return
      }

      const c: Cobranza = data.docs[0]

      setForm({
        fechaVencimiento: c.fechaVencimiento
          ? c.fechaVencimiento.slice(0, 10) // yyyy-mm-dd para input date
          : '',
        referencia: c.referencia || '',
        cliente: c.cliente || '',
        monto: String(c.monto ?? ''),
        descripcion: c.descripcion || '',
      })
    } catch (err) {
      console.error('Error buscando cobranza por referencia:', err)
    }
  }

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    fetchItems({ page: newPage, limit: 10, search })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await createItem({
      fechaVencimiento: form.fechaVencimiento,
      referencia: form.referencia,
      cliente: form.cliente,
      monto: parseFloat(form.monto || '0'),
      estado: 'pendiente',
      descripcion: form.descripcion || undefined,
    })
    setSaving(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    setForm({
      fechaVencimiento: '',
      referencia: '',
      cliente: '',
      monto: '',
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

  const canCreate = hasPermission('cobranzas', 'canCreate')
  const canUpdate = hasPermission('cobranzas', 'canUpdate')
  const canDelete = hasPermission('cobranzas', 'canDelete')

  return (
    <div className="page-container">
      <h1 className="page-title">Cobranzas</h1>
      <p className="page-subtitle">Registro de cobranzas con control de permisos por usuario.</p>

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

      {/* Formulario de registro / edición rápida */}
      {canCreate && (
        <form className="inventario-form" onSubmit={handleCreate}>
          <h2>Registrar nueva cobranza</h2>
          <div className="inventario-form__row">
            <label>
              <span>Fecha de vencimiento</span>
              <input
                type="date"
                name="fechaVencimiento"
                required
                value={form.fechaVencimiento}
                onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
              />
            </label>
            <label>
              <span>Referencia</span>
              <input
                name="referencia"
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
                name="cliente"
                required
                value={form.cliente}
                onChange={(e) => setForm({ ...form, cliente: e.target.value })}
              />
            </label>
            <label>
              <span>Monto</span>
              <input
                type="number"
                min="0"
                step="0.01"
                name="monto"
                required
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
              />
            </label>
          </div>

          <label>
            <span>Descripción</span>
            <textarea
              rows={2}
              name="descripcion"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </label>

          <div className="inventario-form__actions">
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar cobranza'}
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
                <th>Vencimiento</th>
                <th>Referencia</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Estado</th>
                <th style={{ width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.fechaVencimiento ? new Date(c.fechaVencimiento).toLocaleDateString() : '—'}
                  </td>
                  <td>{c.referencia}</td>
                  <td>{c.cliente}</td>
                  <td>${c.monto.toFixed(2)}</td>
                  <td>{c.estado}</td>
                  <td>
                    <div className="inventario-table__actions">
                      {canUpdate && c.estado !== 'pagada' && (
                        <button
                          className="secondary small"
                          onClick={async () => {
                            const res = await updateEstado(c.id, 'pagada')
                            if (!res.success) alert(res.error)
                            fetchItems({ page, limit: 10, search })
                          }}
                        >
                          Marcar pagada
                        </button>
                      )}
                      {canDelete && (
                        <button className="danger small" onClick={() => setDeleting(c)}>
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
              Página {page} de {totalPages} ({totalDocs} cobranzas)
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
            <h3>Eliminar cobranza</h3>
            <p>
              ¿Seguro que deseas eliminar la cobranza <strong>{deleting.referencia}</strong>?
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
