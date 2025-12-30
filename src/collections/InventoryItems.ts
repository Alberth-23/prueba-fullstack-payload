import type { CollectionConfig } from 'payload'
import { checkModuleAccess } from '../access/checkPermission'

export const InventoryItems: CollectionConfig = {
  slug: 'inventory-items',
  labels: {
    singular: 'Item de Inventario',
    plural: 'Inventario',
  },
  admin: {
    useAsTitle: 'nombre',
    group: 'Módulos',
    defaultColumns: ['nombre', 'sku', 'precio', 'stock', 'updatedAt'],
    description: 'Productos del inventario',
    pagination: {
      defaultLimit: 10,
      limits: [10, 25, 50, 100],
    },
  },
  access: {
    read: checkModuleAccess('inventario', 'canRead'),
    create: checkModuleAccess('inventario', 'canCreate'),
    update: checkModuleAccess('inventario', 'canUpdate'),
    delete: checkModuleAccess('inventario', 'canDelete'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'nombre',
          type: 'text',
          label: 'Nombre',
          required: true,
          admin: { width: '70%' },
        },
        {
          name: 'sku',
          type: 'text',
          label: 'SKU',
          required: true,
          unique: true,
          admin: { width: '30%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'precio',
          type: 'number',
          label: 'Precio',
          required: true,
          min: 0,
          admin: { width: '50%' },
        },
        {
          name: 'stock',
          type: 'number',
          label: 'Stock',
          required: true,
          min: 0,
          defaultValue: 0,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'descripcion',
      type: 'textarea',
      label: 'Descripción',
      admin: { rows: 3 },
    },
    {
      name: 'imagen',
      type: 'text',
      label: 'URL de imagen',
      admin: {
        description: 'URL de la imagen del producto (opcional)',
      },
    },
    {
      name: 'activo',
      type: 'checkbox',
      label: 'Activo',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
