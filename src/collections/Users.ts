import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Login', plural: 'Logins' },
  admin: {
    group: 'Library',
    useAsTitle: 'email',
    description: 'People who can sign in and edit the site.',
  },
  auth: true,
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
