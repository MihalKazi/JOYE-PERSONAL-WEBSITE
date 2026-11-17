import type { CollectionConfig } from 'payload'

import { revalidateHooks } from '../hooks/revalidate'

export const Talks: CollectionConfig = {
  slug: 'talks',
  labels: { singular: 'Talk', plural: 'Talks & presentations' },
  admin: {
    group: 'CV',
    useAsTitle: 'title',
    defaultColumns: ['title', 'event', 'date'],
    description: 'Conferences, panels, workshops and presentations.',
  },
  access: {
    read: () => true,
  },
  hooks: revalidateHooks,
  defaultSort: '-date',
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Session or talk title.' } },
    {
      type: 'row',
      fields: [
        { name: 'role', type: 'text', admin: { description: 'e.g. Panellist, Workshop instructor' } },
        { name: 'event', type: 'text', admin: { description: 'e.g. DRAPAC 2026' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'location', type: 'text' },
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'monthOnly', displayFormat: 'MMM yyyy' } },
        },
      ],
    },
    { name: 'link', type: 'text', label: 'Main link (optional)', admin: { description: 'Event or programme page.' } },
    {
      name: 'photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Photos (optional)',
      filterOptions: { mimeType: { contains: 'image' } },
    },
    {
      name: 'extraLinks',
      type: 'array',
      label: 'Photos, recordings, programmes (optional)',
      labels: { singular: 'Link', plural: 'Links' },
      admin: { initCollapsed: true, components: { RowLabel: '@/components/admin/LinkRowLabel#LinkRowLabel' } },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { description: 'e.g. Recording, Photos' } },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
  ],
}
