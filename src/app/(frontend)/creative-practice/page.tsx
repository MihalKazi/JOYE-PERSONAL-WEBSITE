import type { Metadata } from 'next'

import { WorkGallery, type WorkItem } from '@/components/site/WorkGallery'
import { WORK_CATEGORIES } from '@/collections/Works'
import { asMedia, focalPosition, mediaUrl } from '@/lib/media'
import { getAbout, getClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Creative practice' }

export default async function CreativePracticePage() {
  const payload = await getClient()
  const [about, works] = await Promise.all([
    getAbout(),
    payload.find({ collection: 'works', sort: '_order', limit: 200, depth: 1 }),
  ])

  const bgUrl = mediaUrl(about.heroImage, 'large')

  const workItems: WorkItem[] = works.docs.flatMap((w) => {
    const img = asMedia(w.image)
    if (!img) return []
    return [
      {
        id: w.id,
        title: w.title,
        category: w.category,
        categoryLabel: WORK_CATEGORIES.find((c) => c.value === w.category)?.label ?? w.category,
        year: w.year,
        description: w.description,
        videoUrl: w.videoUrl,
        video: mediaUrl(w.video),
        thumb: mediaUrl(img, 'thumb') ?? '',
        full: mediaUrl(img, 'large') ?? '',
        alt: img.alt || w.title,
        position: focalPosition(img),
        more: (w.moreImages ?? []).flatMap((m) => {
          const mm = asMedia(m)
          const url = mediaUrl(mm, 'large')
          return mm && url ? [{ url, alt: mm.alt || w.title }] : []
        }),
      },
    ]
  })

  return (
    <main className="work">
      <div className="work__bg" aria-hidden="true" style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined} />
      <div className="work__inner">
        <WorkGallery
          works={workItems}
          title={about.workTitle || 'Creative practice'}
          intro={about.intros?.creative || 'Kathak dance, theatre and choreography — with drawings and photographs.'}
        />
      </div>
    </main>
  )
}
