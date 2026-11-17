import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Media } from './collections/Media'
import { News } from './collections/News'
import { Projects } from './collections/Projects'
import { Publications } from './collections/Publications'
import { Research } from './collections/Research'
import { Posts } from './collections/Posts'
import { Talks } from './collections/Talks'
import { Trainings } from './collections/Trainings'
import { Users } from './collections/Users'
import { Works } from './collections/Works'
import { AboutPage } from './globals/AboutPage'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || ''

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Joye',
    },
  },
  collections: [Research, Publications, Projects, Posts, News, Talks, Works, Trainings, Media, Users],
  globals: [SiteSettings, AboutPage],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      // Local dev: DATABASE_URL=file:./joye.db. Production (Vercel): only the Turso
      // variables from the Vercel Turso integration are set, so those are used.
      url: dbUrl,
      authToken: dbUrl.startsWith('file:') ? undefined : process.env.TURSO_AUTH_TOKEN,
    },
  }),
  sharp,
  plugins: [
    // Media files live in Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production);
    // without it, uploads fall back to the local /media folder.
    vercelBlobStorage({
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // Keep the same schema with and without the token, so the local DB can be copied to production.
      alwaysInsertFields: true,
      // Upload straight from the browser to Blob, past Vercel's 4.5 MB request limit (videos, scans).
      clientUploads: true,
    }),
  ],
})
