import type { CollectionConfig, Field } from 'payload'

const moduleGroup = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'canRead',
          type: 'checkbox',
          label: 'Leer',
          defaultValue: false,
          admin: { width: '25%' },
        },
        {
          name: 'canCreate',
          type: 'checkbox',
          label: 'Crear',
          defaultValue: false,
          admin: { width: '25%' },
        },
        {
          name: 'canUpdate',
          type: 'checkbox',
          label: 'Editar',
          defaultValue: false,
          admin: { width: '25%' },
        },
        {
          name: 'canDelete',
          type: 'checkbox',
          label: 'Eliminar',
          defaultValue: false,
          admin: { width: '25%' },
        },
      ],
    },
  ],
})

export const Permissions: CollectionConfig = {
  slug: 'permissions',
  labels: {
    singular: 'Permiso',
    plural: 'Permisos',
  },
  admin: {
    useAsTitle: 'user',
    group: 'Administración',
    description: 'Permisos por módulo para cada usuario',
    hidden: ({ user }) => user?.role !== 'admin',
    defaultColumns: ['user', 'inventario', 'ventas', 'cobranzas'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      label: 'Usuario',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      filterOptions: {
        role: { equals: 'user' },
      },
    },
    {
      type: 'tabs',
      tabs: [
        { label: 'Inventario', fields: [moduleGroup('inventario', 'Inventario')] },
        { label: 'Ventas', fields: [moduleGroup('ventas', 'Ventas')] },
        { label: 'Cobranzas', fields: [moduleGroup('cobranzas', 'Cobranzas')] },
      ],
    },
  ],
  timestamps: true,
}
