import type { Metadata } from 'next'

import { NEWS_KINDS } from '@/collections/News'
import { Empty, OutLink, PageHead } from '@/components/site/PageHead'
import { fullDate } from '@/lib/format'
import { getAbout, getClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'News' }

export default async function NewsPage() {
  const payload = await getClient()
  const [about, news] = await Promise.all([
    getAbout(),
    payload.find({ collection: 'news', sort: '-date', limit: 300 }),
  ])

  return (
    <main className="page">
      <PageHead title="News" intro={about.intros?.news} />
      {news.docs.length === 0 ? (
        <Empty />
      ) : (
        <div className="rows">
          {news.docs.map((n) => (
            <article key={n.id} className="row">
              <div className="row__meta mono">
                {fullDate(n.date)}
                <span className="row__tag">{NEWS_KINDS.find((k) => k.value === n.kind)?.label}</span>
              </div>
              <div>
                <h3 className="row__title">{n.title}</h3>
                {n.source && <p className="row__sub">{n.source}</p>}
                {n.summary && <p className="row__body">{n.summary}</p>}
                {n.link && (
                  <div className="row__links">
                    <OutLink href={n.link}>Read</OutLink>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
