import type { CollectionConfig } from 'payload'

import { revalidateHooks } from '../hooks/revalidate'

export const NEWS_KINDS = [
  { label: 'Media coverage', value: 'media' },
  { label: 'Interview', value: 'interview' },
  { label: 'Announcement', value: 'announcement' },
  { label: 'Award', value: 'award' },
  { label: 'Conference', value: 'conference' },
  { label: 'Other', value: 'other' },
] as const

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'News item', plural: 'News' },
  admin: {
    group: 'Writing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'date'],
    description: 'Media coverage, interviews, mentions, announcements and awards.',
  },
  access: {
    read: () => true,
  },
  hooks: revalidateHooks,
  defaultSort: '-date',
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Headline.' } },
    { name: 'source', type: 'text', admin: { description: 'e.g. The Daily Star (optional)' } },
    { name: 'summary', type: 'textarea', admin: { rows: 3 } },
    { name: 'link', type: 'text', label: 'Link (optional)' },
    {
      name: 'kind',
      type: 'select',
      label: 'Type',
      required: true,
      defaultValue: 'media',
      options: [...NEWS_KINDS],
      admin: { position: 'sidebar' },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
    },
  ],
}
