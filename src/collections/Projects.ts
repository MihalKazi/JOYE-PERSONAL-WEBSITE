import type { CollectionConfig } from 'payload'

import { revalidateHooks } from '../hooks/revalidate'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Project', plural: 'Projects' },
  orderable: true,
  admin: {
    group: 'Research',
    useAsTitle: 'title',
    defaultColumns: ['title', 'role', 'period'],
    description: 'Community archiving, digital rights, technology and advocacy work. Drag rows to change their order.',
  },
  access: {
    read: () => true,
  },
  hooks: revalidateHooks,
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'role', type: 'text', admin: { description: 'e.g. Audio-visual archivist' } },
        { name: 'period', type: 'text', admin: { description: 'e.g. 2024 – present' } },
      ],
    },
    { name: 'summary', type: 'textarea', admin: { rows: 5, description: 'Leave an empty line between paragraphs.' } },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Image (optional)' },
    { name: 'link', type: 'text', label: 'Link (optional)' },
  ],
}
