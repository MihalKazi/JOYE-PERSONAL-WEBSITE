import type { Metadata } from 'next'
import Image from 'next/image'

import { ContourLines } from '@/components/ContourLines'
import { Mist } from '@/components/Mist'
import { asMedia, focalPosition, mediaUrl } from '@/lib/media'
import { getAbout, getSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'Explore' }

/** The landscape page (mockup 2): full-screen photo, drifting mist, contour lines, tab nav. */
export default async function ExplorePage() {
  const [about, settings] = await Promise.all([getAbout(), getSettings()])
  const heroUrl = mediaUrl(about.heroImage, 'hero')

  return (
    <main className="hero">
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
    </main>
  )
}
