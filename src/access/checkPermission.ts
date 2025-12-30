import type { Access } from 'payload'

export type ModuleName = 'inventario' | 'ventas' | 'cobranzas'
export type ActionName = 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete'

export const checkModuleAccess = (module: ModuleName, action: ActionName): Access => {
  return async ({ req }): Promise<boolean> => {
    const { user, payload } = req

    if (!user) return false
    if (user.role === 'admin') return true

    try {
      const result = await payload.find({
        collection: 'permissions',
        where: {
          user: { equals: user.id },
        },
        limit: 1,
        depth: 0,
      })

      if (!result.docs.length) return false

      const perms = result.docs[0] as any
      const modulePerms = perms[module]

      if (!modulePerms) return false

      return modulePerms[action] === true
    } catch (e) {
      console.error('Error comprobando permisos:', e)
      return false
    }
  }
}
