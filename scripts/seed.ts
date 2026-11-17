/**
 * Fills an empty site with starter content (from Joye's CV + mockup images).
 * Run: pnpm seed          (skips if works already exist)
 *      pnpm seed --force  (adds content even if some exists)
 */
import path from 'path'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const assets = path.resolve(process.cwd(), 'seed-assets')
const force = process.argv.includes('--force')

const paragraph = (text: string) => ({
  type: 'paragraph',
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  textFormat: 0,
  textStyle: '',
  children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
})

const richText = (...paras: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paras.map(paragraph),
  },
})

async function run() {
  const payload = await getPayload({ config })

  const existing = await payload.count({ collection: 'works' })
  if (existing.totalDocs > 0 && !force) {
    payload.logger.info('Content already exists — skipping seed. Use --force to add anyway.')
    process.exit(0)
  }

  const upload = (file: string, alt: string, focal?: { focalX: number; focalY: number }) =>
    payload.create({ collection: 'media', data: { alt, ...focal }, filePath: path.join(assets, file) })

  payload.logger.info('Uploading images…')
  const hero = await upload('hero.jpg', 'A figure stands in a misty field near a lone tree', { focalX: 68, focalY: 60 })
  const portrait = await upload('portrait.jpg', 'Red line-drawing self-portrait')
  const cv = await upload('cv.pdf', 'CV of Iffat Nowshin Joye')

  const works = [
    { file: 'w1.jpg', title: 'Study in red', category: 'drawings', year: 2024 },
    { file: 'w2.jpg', title: 'Walls that speak', category: 'photography', year: 2024 },
    { file: 'w3.jpg', title: 'Dhoratol Nritto', category: 'performance', year: 2024 },
    { file: 'w4.jpg', title: 'Faces', category: 'drawings', year: 2024 },
    { file: 'w5.jpg', title: 'Letterform I', category: 'drawings', year: 2023 },
    { file: 'w6.jpg', title: 'Posters, Dhaka', category: 'photography', year: 2023 },
    { file: 'w7.jpg', title: 'Repetition', category: 'photography', year: 2023 },
    { file: 'w8.jpg', title: 'Narir July', category: 'performance', year: 2025 },
  ] as const

  payload.logger.info('Creating works…')
  for (const w of works) {
    const img = await upload(w.file, `${w.title} (placeholder image)`)
    await payload.create({
      collection: 'works',
      data: {
        title: w.title,
        category: w.category,
        year: w.year,
        image: img.id,
        description: 'Placeholder — replace with the real work.',
      },
    })
  }

  payload.logger.info('Creating talks & trainings…')
  const talks = [
    {
      title: 'Designing Feminist Digital Futures: From Harm to Collective Imagination',
      role: 'Workshop instructor',
      event: 'Digital Rights in Asia-Pacific Assembly (DRAPAC) 2026',
      location: 'Philippines',
      date: '2026-02-01',
    },
    {
      title: 'July Persist: Community-Led Archiving and OSINT in Bangladesh',
      role: 'Panellist',
      event: 'Archive and Resist Conclave 2026',
      location: 'Dhaka',
      date: '2026-01-01',
    },
    {
      title: 'Youth Folks, Assemble!!! Digital Activism Content Production',
      role: 'Panellist',
      event: 'Digital Rights in Asia-Pacific Assembly (DRAPAC) 2025',
      location: 'Malaysia',
      date: '2025-02-01',
    },
  ]
  for (const t of talks) await payload.create({ collection: 'talks', data: t })

  const trainings = [
    { title: 'Alternative Futures: Navigating Disinformation and Fact-checking', organisation: 'Goethe-Institut Bangladesh', year: 2024 },
    { title: 'Advanced Research Methodology and Tools Training', organisation: 'Youth Society for Research and Action', year: 2024 },
    { title: 'Python Programming — Code in Place', organisation: 'Stanford University', year: 2023 },
    { title: 'Six-Month Training Program on Machine Learning', organisation: 'Creative IT Institute', year: 2023 },
  ]
  for (const t of trainings) await payload.create({ collection: 'trainings', data: t })

  payload.logger.info('Creating sample blog post…')
  await payload.create({
    collection: 'posts',
    data: {
      title: 'Sample post — edit or delete me',
      slug: 'sample-post',
      excerpt: 'This is where a short summary of the post goes.',
      publishedDate: new Date().toISOString(),
      content: richText(
        'This is a sample post so the blog is not empty. Open it in the admin panel to edit it, or delete it.',
        'Write each paragraph on its own line. Use the toolbar to add headings, links, quotes and images.',
      ),
      _status: 'published',
    },
  })

  payload.logger.info('Filling pages…')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      name: 'Iffat Nowshin Joye',
      tagline: 'archivist + researcher + dancer',
      email: 'iffatnowshin-2020912220@islm.du.ac.bd',
      location: 'Dhaka, Bangladesh',
      links: [
        { label: 'Bangladesh Protest Archive', url: '#' },
        { label: 'LinkedIn', url: '#' },
        { label: 'Github', url: '#' },
      ],
      cv: cv.id,
    },
  })

  await payload.updateGlobal({
    slug: 'about-page',
    data: {
      heroImage: hero.id,
      heroSubtitle: 'archivist · researcher · kathak dancer — Dhaka',
      kicker: 'Creative work',
      title: 'About me',
      bio: [
        'Iffat Nowshin Joye is an audio-visual archivist, researcher and Kathak dancer based in Dhaka.',
        'The work moves between archives and the stage: building a community archive of the July 2024 uprising, studying digital rights and literacy, and choreographing pieces rooted in the dance forms of Greater Bengal. All of it asks who gets remembered, and how.',
      ].join('\n\n'),
      portrait: portrait.id,
      workTitle: 'Selected work',
      newsTitle: 'Talks, writing & training',
    },
  })

  payload.logger.info('Seed complete ✔')
  process.exit(0)
}

try {
  await run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
