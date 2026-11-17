/**
 * Copies the local site (joye.db + /media) to production: Turso for the database, Vercel Blob for files.
 *
 *   TURSO_URL=libsql://... TURSO_TOKEN=... BLOB_READ_WRITE_TOKEN=... npx tsx scripts/migrate-to-cloud.ts
 *
 * Flags: --db-only, --media-only, --force (replace tables that already exist in the target database).
 * Safe to re-run for media: files are uploaded under their own names and overwritten.
 */
import { createClient, type InValue } from '@libsql/client'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

const args = new Set(process.argv.slice(2))
const doDb = !args.has('--media-only')
const doMedia = !args.has('--db-only')
const force = args.has('--force')

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
}

async function migrateDb() {
  const url = process.env.TURSO_URL
  const authToken = process.env.TURSO_TOKEN
  if (!url || !authToken) throw new Error('Set TURSO_URL and TURSO_TOKEN')
  const src = createClient({ url: 'file:./joye.db' })
  const dst = createClient({ url, authToken })

  const existing = (await dst.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%'")).rows
  if (existing.length && !force) throw new Error(`Target already has ${existing.length} tables. Re-run with --force to replace them.`)

  const objects = (
    await src.execute(
      "select type, name, sql from sqlite_master where sql is not null and name not like 'sqlite_%' order by case type when 'table' then 0 else 1 end, rowid",
    )
  ).rows as unknown as { type: string; name: string; sql: string }[]
  const tables = objects.filter((o) => o.type === 'table').map((o) => o.name)

  const stmts: { sql: string; args: InValue[] }[] = []
  if (force) for (const t of existing) stmts.push({ sql: `drop table if exists "${t.name as string}"`, args: [] })
  for (const o of objects) stmts.push({ sql: o.sql, args: [] })

  let rows = 0
  for (const t of tables) {
    const data = await src.execute(`select * from "${t}"`)
    if (!data.rows.length) continue
    const cols = data.columns.map((c) => `"${c}"`).join(', ')
    const marks = data.columns.map(() => '?').join(', ')
    for (const r of data.rows) stmts.push({ sql: `insert into "${t}" (${cols}) values (${marks})`, args: data.columns.map((_, i) => r[i] as InValue) })
    rows += data.rows.length
  }

  // migrate() runs everything in one transaction with foreign keys off, so table order does not matter.
  await dst.migrate(stmts)
  console.log(`database: ${tables.length} tables, ${rows} rows copied`)
}

async function migrateMedia() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error('Set BLOB_READ_WRITE_TOKEN')
  const dir = path.resolve('media')
  const files = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile())
  let n = 0
  for (const f of files) {
    const contentType = TYPES[path.extname(f).toLowerCase()] ?? 'application/octet-stream'
    await put(f, fs.readFileSync(path.join(dir, f)), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      token,
    })
    if (++n % 20 === 0) console.log(`  ${n}/${files.length}`)
  }
  console.log(`media: ${n} files uploaded`)
}

if (doDb) await migrateDb()
if (doMedia) await migrateMedia()
process.exit(0)
