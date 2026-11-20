import type { GlobalConfig } from 'payload'

import { revalidateGlobal } from '../hooks/revalidate'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'Home page',
  admin: {
    group: 'Pages',
    description: 'Your greeting, bio and portrait (the first page), and the landscape page behind the Explore button.',
  },
  access: {
    read: () => true,
  },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Landscape page',
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Landscape photo',
              admin: { description: 'Full-screen photo on the landscape page (opened by the round Explore button). Set the focal point so faces stay in view.' },
            },
            {
              name: 'heroSubtitle',
              type: 'text',
              defaultValue: 'archivist · researcher · kathak dancer — Dhaka',
              label: 'Line under your name',
            },
          ],
        },
        {
          label: 'Home',
          fields: [
            // Unused since the home page shows your name as the small red label; kept so no data is lost.
            { name: 'kicker', type: 'text', defaultValue: 'Creative work', label: 'Small red label', admin: { hidden: true } },
            // In the order they appear on the home page.
            { name: 'title', type: 'text', defaultValue: 'About me', label: 'Greeting', admin: { description: 'The big heading, e.g. “Hello, I’m Joye!”. Its last word is set in italic.' } },
            {
              name: 'roles',
              type: 'text',
              label: 'Line under the greeting',
              admin: { description: 'e.g. “Information Science Student, Performing Artist, Digital Rights Activist.”' },
            },
            {
              name: 'intro',
              type: 'textarea',
              label: 'Text under the line',
              admin: { rows: 5, description: 'The short paragraph beside your portrait, above the Explore button.' },
            },
            {
              name: 'bio',
              type: 'textarea',
              required: true,
              label: 'Bio',
              admin: {
                rows: 12,
                description: 'The Bio section further down the page. Leave an empty line between paragraphs.',
              },
            },
            {
              name: 'portrait',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Your drawn portrait, shown on the home page beside the greeting.' },
            },
            {
              name: 'frameImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Photo behind the card',
              // Unused since the home portrait lost its frame; kept so no data is lost.
              admin: { hidden: true },
            },
          ],
        },
        {
          label: 'Page intros',
          fields: [
            { name: 'workTitle', type: 'text', defaultValue: 'Selected work', label: 'Creative Practice heading' },
            { name: 'newsTitle', type: 'text', defaultValue: 'Talks, writing & training', admin: { hidden: true } },
            {
              name: 'intros',
              type: 'group',
              label: 'Short line under each page title (optional)',
              fields: [
                { name: 'research', type: 'textarea', admin: { rows: 2 } },
                { name: 'publications', type: 'textarea', admin: { rows: 2 } },
                { name: 'projects', type: 'textarea', admin: { rows: 2 } },
                { name: 'blog', type: 'textarea', admin: { rows: 2 } },
                { name: 'news', type: 'textarea', admin: { rows: 2 } },
                { name: 'talks', type: 'textarea', admin: { rows: 2 } },
                { name: 'creative', type: 'textarea', label: 'Creative practice', admin: { rows: 2 } },
                { name: 'cv', type: 'textarea', label: 'CV', admin: { rows: 2 } },
                { name: 'training', type: 'textarea', admin: { rows: 2 } },
                { name: 'contact', type: 'textarea', admin: { rows: 2 } },
              ],
            },
          ],
        },
      ],
    },
  ],
}
