import type { CollectionConfig } from 'payload'
import { checkModuleAccess } from '../access/checkPermission'

export const Cobranzas: CollectionConfig = {
  slug: 'cobranzas',
  labels: {
    singular: 'Cobranza',
    plural: 'Cobranzas',
  },
  admin: {
    useAsTitle: 'referencia',
    group: 'Módulos',
    defaultColumns: ['fechaVencimiento', 'cliente', 'referencia', 'monto', 'estado'],
    description: 'Registro de cobranzas',
  },
  access: {
    read: checkModuleAccess('cobranzas', 'canRead'),
    create: checkModuleAccess('cobranzas', 'canCreate'),
    update: checkModuleAccess('cobranzas', 'canUpdate'),
    delete: checkModuleAccess('cobranzas', 'canDelete'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'fechaVencimiento',
          type: 'date',
          label: 'Fecha de vencimiento',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'referencia',
          type: 'text',
          label: 'Referencia / Nº de documento',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'cliente',
      type: 'text',
      label: 'Cliente',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'monto',
          type: 'number',
          label: 'Monto',
          required: true,
          min: 0,
          admin: { width: '50%' },
        },
        {
          name: 'estado',
          type: 'select',
          label: 'Estado',
          required: true,
          defaultValue: 'pendiente',
          options: [
            { label: 'Pendiente', value: 'pendiente' },
            { label: 'Pagada', value: 'pagada' },
            { label: 'Vencida', value: 'vencida' },
          ],
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
  ],
  timestamps: true,
}
