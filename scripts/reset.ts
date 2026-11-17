/** Deletes all content (keeps logins). Run: pnpm payload run scripts/reset.ts */
import { getPayload } from 'payload'
import config from '../src/payload.config'
const payload = await getPayload({ config })
for (const collection of ['works', 'posts', 'talks', 'trainings', 'media'] as const) {
  try {
    const r = await payload.delete({ collection, where: { id: { exists: true } } })
    console.log(collection, 'deleted', r.docs.length, 'errors', r.errors.length)
  } catch (e) {
    console.log(collection, 'error', (e as Error).message)
  }
}
process.exit(0)
