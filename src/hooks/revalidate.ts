import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * The site is small, so any content change refreshes every page.
 * revalidatePath throws outside a Next.js request (e.g. the seed script) — safe to ignore there.
 */
const refreshSite = () => {
  try {
    revalidatePath('/', 'layout')
  } catch {
    /* not running inside Next.js */
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  refreshSite()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  refreshSite()
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc }) => {
  refreshSite()
  return doc
}

export const revalidateHooks = {
  afterChange: [revalidateAfterChange],
  afterDelete: [revalidateAfterDelete],
}
