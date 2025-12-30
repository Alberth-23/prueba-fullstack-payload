'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { useInventory } from '@/hooks/useInventory'

export default function NuevoItemPage() {
  return (
    <ProtectedRoute module="inventario" action="canCreate">
      <AppShell>
        <NuevoItemForm />
      </AppShell>
    </ProtectedRoute>
  )
}

function NuevoItemForm() {
  const router = useRouter()
  const { createItem } = useInventory()
  const [form, setForm] = useState({
    nombre: '',
    sku: '',
    precio: '',
    stock: '',
    descripcion: '',
    imagen: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const result = await createItem({
      nombre: form.nombre,
      sku: form.sku,
      precio: parseFloat(form.precio),
      stock: parseInt(form.stock || '0', 10),
      descripcion: form.descripcion || undefined,
      imagen: form.imagen || undefined,
    })

    setSaving(false)

    if (!result.success) {
      setError(result.error || 'Error al crear el item')
      return
    }

    router.push('/inventario')
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Nuevo item</h1>
      <p className="page-subtitle">Crear un nuevo producto en el inventario</p>

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
          <span>URL de imagen (opcional)</span>
          <input name="imagen" value={form.imagen} onChange={handleChange} />
        </label>

        <div className="inventario-form__actions">
          <Link href="/inventario">
            <button type="button" className="secondary">
              Cancelar
            </button>
          </Link>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
