import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Permissions } from './collections/Permissions'
import { InventoryItems } from './collections/InventoryItems'
import { Ventas } from './collections/Ventas'
import { Cobranzas } from './collections/Cobranzas'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const mongoUrl = process.env.MONGODB_URI

if (!mongoUrl) {
  throw new Error('MONGODB_URI no está definida en .env')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Permissions, InventoryItems, Ventas, Cobranzas],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: mongoUrl,
  }),
  sharp,
  plugins: [],
})
