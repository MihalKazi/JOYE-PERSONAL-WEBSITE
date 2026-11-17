import type { CollectionConfig } from 'payload'

import { revalidateHooks } from '../hooks/revalidate'

export const Trainings: CollectionConfig = {
  slug: 'trainings',
  labels: { singular: 'Training or certificate', plural: 'Trainings & certificates' },
  admin: {
    group: 'CV',
    useAsTitle: 'title',
    defaultColumns: ['title', 'organisation', 'year'],
  },
  access: {
    read: () => true,
  },
  hooks: revalidateHooks,
  defaultSort: '-year',
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'organisation', type: 'text' },
        { name: 'year', type: 'number', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'link', type: 'text', label: 'Link (optional)' },
        {
          name: 'certificate',
          type: 'upload',
          relationTo: 'media',
          label: 'Certificate (optional)',
          admin: { description: 'PDF or image.' },
        },
      ],
    },
  ],
}
