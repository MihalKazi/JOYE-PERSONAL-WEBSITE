import type { CollectionConfig } from 'payload'

import { revalidateHooks } from '../hooks/revalidate'

export const WORK_CATEGORIES = [
  { label: 'Performance', value: 'performance' },
  { label: 'Drawings', value: 'drawings' },
  { label: 'Photography', value: 'photography' },
] as const

export const Works: CollectionConfig = {
  slug: 'works',
  labels: { singular: 'Work', plural: 'Creative portfolio' },
  orderable: true,
  admin: {
    group: 'Portfolio',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'year'],
    description: 'Performances, drawings and photographs shown on the Creative Practice page. Drag rows to change their order.',
  },
  access: {
    read: () => true,
  },
  hooks: revalidateHooks,
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Main image',
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Optional. Shown when someone opens the work.' },
    },
    {
      name: 'moreImages',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'More images (optional)',
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      label: 'Video file (optional)',
      filterOptions: { mimeType: { equals: 'video/mp4' } },
      admin: { description: 'An MP4 that plays when someone opens the work. The main image is used as its cover.' },
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Video link (optional)',
      admin: { description: 'YouTube or Vimeo link, e.g. for a performance.' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [...WORK_CATEGORIES],
      admin: { position: 'sidebar' },
    },
    {
      name: 'year',
      type: 'number',
      admin: { position: 'sidebar' },
    },
  ],
}
