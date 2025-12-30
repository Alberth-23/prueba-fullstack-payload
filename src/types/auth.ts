export type Role = 'admin' | 'user'

export type ModuleName = 'inventario' | 'ventas' | 'cobranzas'
export type ActionName = 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete'

export interface User {
  id: string
  email: string
  nombre: string
  role: Role
}

export interface ModulePermissions {
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface Permissions {
  id: string
  user: string | User
  inventario?: ModulePermissions
  ventas?: ModulePermissions
  cobranzas?: ModulePermissions
}

export interface LoginResult {
  success: boolean
  error?: string
  role?: Role
}

export interface AuthContextType {
  user: User | null
  permissions: Permissions | null
  loading: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  hasPermission: (module: ModuleName, action: ActionName) => boolean
  refreshAuth: () => Promise<void>
}
