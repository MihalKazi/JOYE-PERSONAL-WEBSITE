import Link from 'next/link'

import { NEWS_KINDS } from '@/collections/News'
import { Ribbon } from '@/components/Ribbon'
import { paragraphs } from '@/components/site/PageHead'
import { fullDate } from '@/lib/format'
import { getAbout, getClient, getSettings } from '@/lib/payload'

/**
 * Home: her name set large at the bottom left with the ribbon rising above it;
 * on the right, the opening of her bio and the latest news item.
 * Navigation is the shared tab row (layout); outside links are in the footer.
 */
export default async function HomePage() {
  const payload = await getClient()
  const [settings, about, news] = await Promise.all([
    getSettings(),
    getAbout(),
    payload.find({ collection: 'news', sort: '-date', limit: 1, depth: 0 }),
  ])
  // Name set in two staggered lines: first word, then the rest with the last word stepped down under it.
  const words = settings.name.trim().split(/\s+/)
  const first = words.length > 1 ? words.shift()! : null
  const last = words.length > 1 ? words.pop()! : null
  const middle = words.join(' ')
  const roles = (settings.tagline ?? '').split(/\s*[,·|]\s*/).filter(Boolean)
  const intro = paragraphs(about.bio)[0]
  const latest = news.docs[0]

  return (
    <main className="home">
      <Ribbon />
      <div className="home__id">
        {roles.length > 0 && (
          <ul className="home__roles kicker" aria-label="Roles" data-reveal>
            {roles.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        <h1 className={`home__name${first ? ' is-staggered' : ''}`}>
          {first && <span data-split>{first}</span>}{' '}
          <span data-split>{middle}</span>{' '}
          {last && (
            <span className="home__last" data-split>
              {last}
            </span>
          )}
        </h1>
      </div>

      {(intro || latest) && (
        <aside className="home__aside">
          {intro && (
            <div className="home__intro">
              <p className="home__label mono" data-reveal>
                About
              </p>
              <p className="home__excerpt" data-reveal>
                {intro}
              </p>
              <Link className="home__more" href="/about" data-reveal>
                More about me <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
          {latest && (
            <Link className="home__latest" href="/news" data-reveal>
              <span className="home__label mono">
                Latest · {NEWS_KINDS.find((k) => k.value === latest.kind)?.label} · {fullDate(latest.date)}
              </span>
              <span className="home__headline">{latest.title}</span>
            </Link>
          )}
        </aside>
      )}
    </main>
  )
}
