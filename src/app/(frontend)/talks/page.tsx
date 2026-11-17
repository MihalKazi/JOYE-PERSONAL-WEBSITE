import type { Metadata } from 'next'

import { Empty, OutLink, PageHead } from '@/components/site/PageHead'
import { monthYear } from '@/lib/format'
import { asMedia, mediaUrl } from '@/lib/media'
import { getAbout, getClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Talks & presentations' }

export default async function TalksPage() {
  const payload = await getClient()
  const [about, talks] = await Promise.all([
    getAbout(),
    payload.find({ collection: 'talks', sort: '-date', limit: 300, depth: 1 }),
  ])

  return (
    <main className="page">
      <PageHead title="Talks & presentations" intro={about.intros?.talks} />
      {talks.docs.length === 0 ? (
        <Empty />
      ) : (
        <div className="rows">
          {talks.docs.map((t) => {
            const links = [...(t.link ? [{ label: 'Event', url: t.link }] : []), ...(t.extraLinks ?? [])]
            return (
              <article key={t.id} className="row">
                <div className="row__meta mono">
                  {monthYear(t.date)}
                  {t.location && <span className="row__tag">{t.location}</span>}
                </div>
                <div>
                  <h3 className="row__title">{t.title}</h3>
                  {(t.role || t.event) && <p className="row__sub">{[t.role, t.event].filter(Boolean).join(', ')}</p>}
                  {(t.photos ?? []).length > 0 && (
                    <div className="row__photos">
                      {(t.photos ?? []).map((ph) => {
                        const m = asMedia(ph)
                        const url = mediaUrl(m, 'large')
                        return m && url ? (
                          <a key={m.id} href={url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mediaUrl(m, 'thumb') ?? url} alt={m.alt || ''} loading="lazy" />
                          </a>
                        ) : null
                      })}
                    </div>
                  )}
                  {links.length > 0 && (
                    <div className="row__links">
                      {links.map((l) => (
                        <OutLink key={l.url + l.label} href={l.url}>
                          {l.label}
                        </OutLink>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
