import Image from 'next/image'
import Link from 'next/link'

import { ExploreButton } from '@/components/site/ExploreButton'
import { paragraphs } from '@/components/site/PageHead'
import { asMedia, focalPosition, mediaUrl } from '@/lib/media'
import { getClient, getSettings } from '@/lib/payload'

/** Home = About me (mockup 1). The first thing a visitor sees. */
export default async function AboutPage() {
  const payload = await getClient()
  const [about, settings] = await Promise.all([payload.findGlobal({ slug: 'about-page', depth: 1 }), getSettings()])

  const frameUrl = mediaUrl(about.frameImage ?? about.heroImage, 'large')
  const portraitUrl = mediaUrl(about.portrait, 'large')
  const linkedin = settings.links?.find((l) => /linkedin/i.test(l.label))

  return (
    <main className="about">
      <div className="about__copy">
        {about.kicker && (
          <div className="kicker" data-reveal>
            {about.kicker}
          </div>
        )}
        <h1 data-split>{about.title}</h1>
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
        <div className="minilinks" data-reveal>
          <Link href="/cv">CV</Link>
          <Link href="/news">NEWS</Link>
          {linkedin && (
            <a href={linkedin.url} target="_blank" rel="noopener noreferrer">
              LINKEDIN
            </a>
          )}
        </div>
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
