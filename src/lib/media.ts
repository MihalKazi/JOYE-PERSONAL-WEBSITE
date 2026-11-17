import type { Media } from '@/payload-types'

type Size = 'thumb' | 'large' | 'hero'

export const asMedia = (m: unknown): Media | null =>
  m && typeof m === 'object' && 'url' in m ? (m as Media) : null

/** Best URL for a media item: the requested size if it was generated, else the original. */
export const mediaUrl = (m: unknown, size?: Size): string | null => {
  const media = asMedia(m)
  if (!media) return null
  return (size && media.sizes?.[size]?.url) || media.url || null
}

/** CSS object-position from the focal point the editor set in the admin. */
export const focalPosition = (m: unknown): string => {
  const media = asMedia(m)
  const x = media?.focalX ?? 50
  const y = media?.focalY ?? 50
  return `${x}% ${y}%`
}

export const isExternal = (url: string) => /^https?:\/\//.test(url)
