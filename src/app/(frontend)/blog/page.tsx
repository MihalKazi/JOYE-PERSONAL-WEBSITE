import type { Metadata } from 'next'
import Link from 'next/link'

import { Empty, PageHead } from '@/components/site/PageHead'
import { fullDate } from '@/lib/format'
import { getAbout, getClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Blog' }

export default async function BlogIndex() {
  const payload = await getClient()
  const [about, posts] = await Promise.all([
    getAbout(),
    payload.find({
      collection: 'posts',
      sort: '-publishedDate',
      limit: 200,
      where: { _status: { equals: 'published' } },
      select: { title: true, slug: true, publishedDate: true, excerpt: true },
    }),
  ])

  return (
    <main className="page">
      <PageHead
        title="Blog"
        intro={about.intros?.blog || 'Essays and reflections on research, digital rights, activism, archives and art.'}
      />
      {posts.docs.length === 0 ? (
        <Empty>No posts yet.</Empty>
      ) : (
        <div className="rows">
          {posts.docs.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="row row--link">
              <div className="row__meta mono">{fullDate(p.publishedDate)}</div>
              <div>
                <h2 className="row__title">{p.title}</h2>
                {p.excerpt && <p className="row__body">{p.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
