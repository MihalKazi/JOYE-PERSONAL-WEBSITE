import type { GlobalConfig } from 'payload'

import { revalidateGlobal } from '../hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Name & contact',
  admin: {
    group: 'Pages',
    description: 'Your name, email, profile links and CV — used on the Contact page and footer.',
  },
  access: {
    read: () => true,
  },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    { name: 'name', type: 'text', required: true, defaultValue: 'Iffat Nowshin Joye' },
    {
      name: 'tagline',
      type: 'text',
      defaultValue: 'archivist + researcher + dancer',
      admin: { description: 'Short line under your name on the home page.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'location', type: 'text', defaultValue: 'Dhaka, Bangladesh' },
      ],
    },
    {
      name: 'links',
      type: 'array',
      label: 'Profile links',
      labels: { singular: 'Link', plural: 'Links' },
      admin: {
        description: 'LinkedIn, Google Scholar, ORCID… Shown on the Contact page in this order.',
        initCollapsed: true,
        components: { RowLabel: '@/components/admin/LinkRowLabel#LinkRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { description: 'e.g. LinkedIn' } },
            { name: 'url', type: 'text', required: true, admin: { description: 'Full address, https://…' } },
          ],
        },
      ],
    },
    {
      name: 'cv',
      type: 'upload',
      relationTo: 'media',
      label: 'CV (PDF)',
      filterOptions: { mimeType: { equals: 'application/pdf' } },
      admin: { description: 'Upload a new PDF here whenever your CV changes.' },
    },
  ],
}
