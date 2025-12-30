export type EstadoVenta = 'pendiente' | 'pagada' | 'cancelada'
export type EstadoCobranza = 'pendiente' | 'pagada' | 'vencida'

export interface Venta {
  id: string
  fecha: string
  referencia: string
  cliente: string
  producto: any
  cantidad: number
  total: number
  estado: EstadoVenta
  descripcion?: string
  createdAt?: string
  updatedAt?: string
}

export interface Cobranza {
  id: string
  fechaVencimiento: string
  referencia: string
  cliente: string
  monto: number
  estado: EstadoCobranza
  descripcion?: string
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedResponse<T> {
  docs: T[]
  page: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
  hasPrevPage: boolean
}
