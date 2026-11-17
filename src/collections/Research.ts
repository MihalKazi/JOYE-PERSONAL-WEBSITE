import type { CollectionConfig } from 'payload'

import { revalidateHooks } from '../hooks/revalidate'

export const RESEARCH_STATUS = [
  { label: 'Current', value: 'current' },
  { label: 'Completed', value: 'completed' },
  { label: 'Future interest', value: 'future' },
] as const

export const Research: CollectionConfig = {
  slug: 'research',
  labels: { singular: 'Research item', plural: 'Research' },
  orderable: true,
  admin: {
    group: 'Research',
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'period'],
    description: 'Thesis, undergraduate research, research assistantships and future interests. Drag rows to change their order.',
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
        { name: 'kind', type: 'text', label: 'Type', admin: { description: "e.g. Master's thesis, Research assistant" } },
        { name: 'institution', type: 'text', admin: { description: 'e.g. University of Dhaka' } },
      ],
    },
    { name: 'summary', type: 'textarea', admin: { rows: 5, description: 'Leave an empty line between paragraphs.' } },
    { name: 'link', type: 'text', label: 'Link (optional)' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'current',
      options: [...RESEARCH_STATUS],
      admin: { position: 'sidebar' },
    },
    {
      name: 'period',
      type: 'text',
      admin: { position: 'sidebar', description: 'e.g. 2024 – present' },
    },
  ],
}
