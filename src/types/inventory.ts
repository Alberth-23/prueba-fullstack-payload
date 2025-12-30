export interface InventoryItem {
  id: string
  nombre: string
  sku: string
  precio: number
  stock: number
  descripcion?: string
  imagen?: string
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
