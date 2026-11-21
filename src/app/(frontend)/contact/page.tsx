import type { Metadata } from 'next'

import { ContactDetails } from '@/components/site/ContactDetails'
import { PageHead } from '@/components/site/PageHead'
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
      <ContactDetails
        email={settings.email}
        links={(settings.links ?? []).map((l) => ({ label: l.label, url: l.url }))}
        cvUrl={mediaUrl(settings.cv)}
        location={settings.location}
      />
    </main>
  )
}
