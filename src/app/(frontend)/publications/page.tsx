import type { Metadata } from 'next'

import { Empty, OutLink, PageHead } from '@/components/site/PageHead'
import { mediaUrl } from '@/lib/media'
import { getAbout, getClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Publications' }

const KIND_LABELS: Record<string, string> = {
  journal: 'Journal article',
  conference: 'Conference paper',
  report: 'Research report',
  thesis: 'Thesis',
  other: 'Other',
}

export default async function PublicationsPage() {
  const payload = await getClient()
  const [about, pubs] = await Promise.all([
    getAbout(),
    payload.find({ collection: 'publications', sort: '-year', limit: 300, depth: 1 }),
  ])

  return (
    <main className="page">
      <PageHead title="Publications" intro={about.intros?.publications} />
      {pubs.docs.length === 0 ? (
        <Empty />
      ) : (
        <div className="rows">
          {pubs.docs.map((p) => {
            const pdf = mediaUrl(p.file)
            return (
              <article key={p.id} className="row">
                <div className="row__meta mono">
                  {p.year}
                  <span className="row__tag">{KIND_LABELS[p.kind] ?? p.kind}</span>
                </div>
                <div>
                  <h3 className="row__title">{p.title}</h3>
                  {p.citation ? (
                    <p className="row__body cite">{p.citation}</p>
                  ) : (
                    (p.authors || p.venue) && <p className="row__sub">{[p.authors, p.venue].filter(Boolean).join(' — ')}</p>
                  )}
                  {(p.link || pdf) && (
                    <div className="row__links">
                      {p.link && <OutLink href={p.link}>Read</OutLink>}
                      {pdf && <OutLink href={pdf}>PDF</OutLink>}
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
