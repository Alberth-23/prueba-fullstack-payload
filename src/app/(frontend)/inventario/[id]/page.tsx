'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { useInventory } from '@/hooks/useInventory'
import type { InventoryItem } from '@/types/inventory'

export default function EditarItemPage() {
  return (
    <ProtectedRoute module="inventario" action="canUpdate">
      <AppShell>
        <EditarItemForm />
      </AppShell>
    </ProtectedRoute>
  )
}

function EditarItemForm() {
  const params = useParams()
  const router = useRouter()
  const { getItem, updateItem } = useInventory()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    sku: '',
    precio: '',
    stock: '',
    descripcion: '',
    imagen: '',
  })

  useEffect(() => {
    const load = async () => {
      const id = params.id as string
      const data = await getItem(id)
      if (!data) {
        setError('Item no encontrado')
        setLoading(false)
        return
      }
      setItem(data)
      setForm({
        nombre: data.nombre,
        sku: data.sku,
        precio: String(data.precio),
        stock: String(data.stock),
        descripcion: data.descripcion || '',
        imagen: data.imagen || '',
      })
      setLoading(false)
    }
    load()
  }, [getItem, params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const id = params.id as string
    const result = await updateItem(id, {
      nombre: form.nombre,
      sku: form.sku,
      precio: parseFloat(form.precio),
      stock: parseInt(form.stock || '0', 10),
      descripcion: form.descripcion || undefined,
      imagen: form.imagen || undefined,
    })

    setSaving(false)

    if (!result.success) {
      setError(result.error || 'Error al actualizar el item')
      return
    }

    router.push('/inventario')
  }

  if (loading) {
    return (
      <div className="full-page-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="page-container">
        <p>{error || 'Item no encontrado'}</p>
        <Link href="/inventario">Volver al inventario</Link>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Editar item</h1>
      <p className="page-subtitle">Modificar información del producto</p>

      <form className="inventario-form" onSubmit={handleSubmit}>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="inventario-form__row">
          <label>
            <span>Nombre</span>
            <input name="nombre" required value={form.nombre} onChange={handleChange} />
          </label>
          <label>
            <span>SKU</span>
            <input name="sku" required value={form.sku} onChange={handleChange} />
          </label>
        </div>

        <div className="inventario-form__row">
          <label>
            <span>Precio</span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="precio"
              required
              value={form.precio}
              onChange={handleChange}
            />
          </label>
          <label>
            <span>Stock</span>
            <input
              type="number"
              min="0"
              name="stock"
              required
              value={form.stock}
              onChange={handleChange}
            />
          </label>
        </div>

        <label>
          <span>Descripción</span>
          <textarea name="descripcion" rows={3} value={form.descripcion} onChange={handleChange} />
        </label>

        <label>
          <span>URL de imagen</span>
          <input name="imagen" value={form.imagen} onChange={handleChange} />
        </label>

        <div className="inventario-form__actions">
          <Link href="/inventario">
            <button type="button" className="secondary">
              Cancelar
            </button>
          </Link>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
