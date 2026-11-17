import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

export const getClient = cache(() => getPayload({ config }))

export const getAbout = cache(async () => {
  const payload = await getClient()
  return payload.findGlobal({ slug: 'about-page', depth: 1 })
})

export const getSettings = cache(async () => {
  const payload = await getClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
})
