import Image from 'next/image'
import Link from 'next/link'

import { ExploreButton } from '@/components/site/ExploreButton'
import { paragraphs } from '@/components/site/PageHead'
import { asMedia, focalPosition, mediaUrl } from '@/lib/media'
import { getClient, getSettings } from '@/lib/payload'

export const metadata = { title: 'About me' }

/** About me (mockup 1). */
export default async function AboutPage() {
  const payload = await getClient()
  const [about, settings] = await Promise.all([payload.findGlobal({ slug: 'about-page', depth: 1 }), getSettings()])

  const frameUrl = mediaUrl(about.frameImage ?? about.heroImage, 'large')
  const portraitUrl = mediaUrl(about.portrait, 'large')

  return (
    <main className="about">
      <header className="about__head">
        {about.kicker && (
          <div className="kicker" data-reveal>
            {about.kicker}
          </div>
        )}
        <h1 data-split>{about.title}</h1>
      </header>
      <div className="about__copy">
        {paragraphs(about.bio).map((p, i) => (
          <p key={i} data-split="lines">
            {p}
          </p>
        ))}
        <ExploreButton
          href="/explore"
          label="Explore the work"
          full={mediaUrl(about.heroImage, 'hero')}
          position={focalPosition(about.heroImage)}
        />
        <div className="about__contact" data-reveal>
          <h2>
            <Link href="/contact">Contact</Link>
          </h2>
          {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          {settings.location && <span>{settings.location}</span>}
        </div>
      </div>
      <div className="about__media">
        <div className="frame">
          <div className="frame__back">
            {frameUrl && (
              <Image src={frameUrl} alt="" fill priority sizes="(max-width:900px) 100vw, 50vw" style={{ objectPosition: '88% 70%' }} />
            )}
          </div>
          <div className="frame__card">
            {portraitUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={portraitUrl} alt={asMedia(about.portrait)?.alt || 'Portrait'} />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
