import type { CollectionConfig } from 'payload'

import { revalidateHooks } from '../hooks/revalidate'

export const Publications: CollectionConfig = {
  slug: 'publications',
  labels: { singular: 'Publication', plural: 'Publications' },
  admin: {
    group: 'Research',
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'year'],
    description: 'Journal articles, conference papers, reports and theses.',
  },
  access: {
    read: () => true,
  },
  hooks: revalidateHooks,
  defaultSort: '-year',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'authors', type: 'text', admin: { description: 'As they appear in the citation, e.g. Joye, I. N., & Rahman, A.' } },
    { name: 'venue', type: 'text', admin: { description: 'Journal, conference or publisher.' } },
    {
      name: 'citation',
      type: 'textarea',
      label: 'Full citation (optional)',
      admin: { rows: 3, description: 'Paste the full reference if you want it shown as written.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'link', type: 'text', label: 'Link (optional)', admin: { description: 'DOI or web address.' } },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          label: 'PDF (optional)',
          filterOptions: { mimeType: { equals: 'application/pdf' } },
        },
      ],
    },
    {
      name: 'kind',
      type: 'select',
      label: 'Type',
      required: true,
      defaultValue: 'journal',
      options: [
        { label: 'Journal article', value: 'journal' },
        { label: 'Conference paper', value: 'conference' },
        { label: 'Research report', value: 'report' },
        { label: 'Thesis', value: 'thesis' },
        { label: 'Other', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'year', type: 'number', required: true, admin: { position: 'sidebar' } },
  ],
}
