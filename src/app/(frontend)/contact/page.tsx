import type { Metadata } from 'next'
import Link from 'next/link'

import { OutLink, PageHead } from '@/components/site/PageHead'
import { mediaUrl } from '@/lib/media'
import { getAbout, getSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'Contact' }

export default async function ContactPage() {
  const [about, settings] = await Promise.all([getAbout(), getSettings()])
  const cvUrl = mediaUrl(settings.cv)

  return (
    <main className="page">
      <PageHead
        title="Contact"
        intro={about.intros?.contact || 'For research, opportunities and collaborations.'}
      />
      <div className="contact">
        {settings.email && (
          <div className="contact__block" data-reveal>
            <h2 className="group__title">Email</h2>
            <a className="contact__email" href={`mailto:${settings.email}`}>
              {settings.email}
            </a>
            {settings.location && <p className="contact__place">{settings.location}</p>}
          </div>
        )}
        {(settings.links ?? []).length > 0 && (
          <div className="contact__block" data-reveal>
            <h2 className="group__title">Profiles</h2>
            <ul className="contact__links">
              {settings.links!.map((l) => (
                <li key={l.url + l.label}>
                  <OutLink href={l.url}>{l.label}</OutLink>
                </li>
              ))}
            </ul>
          </div>
        )}
        {cvUrl && (
          <div className="contact__block" data-reveal>
            <h2 className="group__title">CV</h2>
            <Link className="out" href="/cv">
              View or download CV
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
