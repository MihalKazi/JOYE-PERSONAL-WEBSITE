import { slugField, type CollectionConfig } from 'payload'

import { revalidateHooks } from '../hooks/revalidate'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Blog post', plural: 'Blog' },
  admin: {
    group: 'Writing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedDate', '_status'],
    description: 'Write a post, then press "Publish". Use "Save draft" to keep working on it privately.',
  },
  versions: {
    drafts: true,
  },
  access: {
    // Visitors only see published posts; logged-in editors see drafts too.
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  hooks: revalidateHooks,
  defaultSort: '-publishedDate',
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Short summary',
      admin: { description: 'One line shown in the list of posts.' },
    },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'Cover image (optional)' },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'publishedDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    slugField({ useAsSlug: 'title' }),
  ],
}
