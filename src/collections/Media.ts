import type { CollectionConfig } from 'payload'

import { revalidateHooks } from '../hooks/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image, video or file', plural: 'Images, videos & files' },
  admin: {
    group: 'Library',
    description: 'Every photo and file used on the site. You can also upload straight from any page.',
  },
  access: {
    read: () => true,
  },
  hooks: revalidateHooks,
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Short description',
      admin: {
        description: 'A few words about what is in the picture. Helps blind visitors and search engines.',
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'application/pdf', 'video/mp4'],
    adminThumbnail: 'thumb',
    focalPoint: true,
    imageSizes: [
      { name: 'thumb', width: 480, height: 480, position: 'centre' },
      { name: 'large', width: 1600 },
      { name: 'hero', width: 2400 },
    ],
  },
}
