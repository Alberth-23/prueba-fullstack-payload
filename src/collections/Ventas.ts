import type { CollectionConfig } from 'payload'
import { checkModuleAccess } from '../access/checkPermission'

// helper para obtener el id de la relación producto
const getProductoId = (producto: any): string | null => {
  if (!producto) return null
  if (typeof producto === 'string') return producto
  if (typeof producto === 'object' && producto.id) return producto.id
  return null
}

// helper para actualizar stock
const descontarStock = async (payload: any, productoId: string, cantidad: number) => {
  const item = await payload.findByID({
    collection: 'inventory-items',
    id: productoId,
  })

  const stockActual = Number((item as any).stock ?? 0)
  const nuevoStock = stockActual - cantidad

  if (nuevoStock < 0) {
    throw new Error('Stock insuficiente en inventario para realizar la venta')
  }

  await payload.update({
    collection: 'inventory-items',
    id: productoId,
    data: { stock: nuevoStock },
  })
}

export const Ventas: CollectionConfig = {
  slug: 'ventas',
  labels: {
    singular: 'Venta',
    plural: 'Ventas',
  },
  admin: {
    useAsTitle: 'referencia',
    group: 'Módulos',
    defaultColumns: ['fecha', 'cliente', 'referencia', 'producto', 'cantidad', 'total', 'estado'],
    description: 'Registro de ventas',
  },
  access: {
    read: checkModuleAccess('ventas', 'canRead'),
    create: checkModuleAccess('ventas', 'canCreate'),
    update: checkModuleAccess('ventas', 'canUpdate'),
    delete: checkModuleAccess('ventas', 'canDelete'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'fecha',
          type: 'date',
          label: 'Fecha',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'referencia',
          type: 'text',
          label: 'Referencia / Nº de pedido',
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
          name: 'producto',
          type: 'relationship',
          relationTo: 'inventory-items',
          label: 'Producto',
          required: true,
          admin: { width: '70%' },
        },
        {
          name: 'cantidad',
          type: 'number',
          label: 'Cantidad',
          required: true,
          min: 1,
          defaultValue: 1,
          admin: { width: '30%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'total',
          type: 'number',
          label: 'Total',
          required: true,
          min: 0,
          admin: {
            width: '50%',
            readOnly: true,
            description: 'Se calcula a partir del precio del producto x cantidad',
          },
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
            { label: 'Cancelada', value: 'cancelada' },
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
  hooks: {
    // 1) Antes de guardar: calcular total y validar stock
    beforeChange: [
      async ({ data, req }) => {
        const payload = req.payload

        const productoId = getProductoId(data.producto)
        const cantidad = Number(data.cantidad ?? 0)

        if (!productoId || !cantidad || cantidad <= 0) {
          return data
        }

        const producto = await payload.findByID({
          collection: 'inventory-items',
          id: productoId,
        })

        const precio = Number((producto as any).precio ?? 0)
        const stockActual = Number((producto as any).stock ?? 0)

        // calcular total
        data.total = precio * cantidad

        // validar stock suficiente
        if (stockActual < cantidad) {
          throw new Error(
            `Stock insuficiente para el producto "${(producto as any).nombre}". ` +
              `Stock actual: ${stockActual}, solicitado: ${cantidad}`,
          )
        }

        return data
      },
    ],

    // 2) Después de crear: descontar stock en inventario
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return

        const payload = req.payload
        const productoId = getProductoId((doc as any).producto)
        const cantidad = Number((doc as any).cantidad ?? 0)

        if (!productoId || !cantidad || cantidad <= 0) return

        try {
          await descontarStock(payload, productoId, cantidad)
        } catch (e) {
          // Si aquí falla, ya se guardó la venta; en un sistema real
          // podríamos registrar el error o notificar al admin.
          console.error('Error descontando stock tras crear venta:', e)
        }
      },
    ],
  },
  timestamps: true,
}
