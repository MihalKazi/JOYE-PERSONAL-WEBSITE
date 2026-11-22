import type { Metadata } from 'next'
import Image from 'next/image'

import { WORK_CATEGORIES } from '@/collections/Works'
import { ContourLines } from '@/components/ContourLines'
import { Mist } from '@/components/Mist'
import { WorkGallery, type WorkItem } from '@/components/site/WorkGallery'
import { asMedia, focalPosition, mediaUrl } from '@/lib/media'
import { getAbout, getClient, getSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'Creative portfolio' }

/**
 * Creative portfolio: the landscape page (full-screen photo, drifting mist, contour lines), then the
 * dark gallery band with filters and lightbox.
 */
export default async function CreativePracticePage() {
  const payload = await getClient()
  const [about, settings, works] = await Promise.all([
    getAbout(),
    getSettings(),
    payload.find({ collection: 'works', sort: '_order', limit: 200, depth: 1 }),
  ])
  const heroUrl = mediaUrl(about.heroImage, 'hero')
  const workBg = mediaUrl(about.heroImage, 'large')

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
    <main className="explore-page creative-page">
      <section className="hero">
        {heroUrl && (
          <div className="hero__img">
            <Image
              src={heroUrl}
              alt={asMedia(about.heroImage)?.alt || ''}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: focalPosition(about.heroImage) }}
            />
          </div>
        )}
        <Mist />
        <div className="hero__fog" />
        <ContourLines />
        <div className="wordmark">
          <h1>{settings.name}</h1>
          {about.heroSubtitle && <p>{about.heroSubtitle}</p>}
        </div>
      </section>

      <section className="work" id="creative-portfolio" aria-label="Creative portfolio">
        <div
          className="work__bg"
          aria-hidden="true"
          style={workBg ? { backgroundImage: `url(${workBg})` } : undefined}
        />
        <div className="work__inner">
          <WorkGallery
            works={workItems}
            title={about.workTitle || 'Creative portfolio'}
            intro={
              about.intros?.creative ||
              'Kathak dance, theatre and choreography — with drawings and photographs.'
            }
          />
        </div>
      </section>
    </main>
  )
}
