import Link from 'next/link'

import { NEWS_KINDS } from '@/collections/News'
import { RippleImage } from '@/components/RippleImage'
import { ExploreButton } from '@/components/site/ExploreButton'
import { OutLink, paragraphs } from '@/components/site/PageHead'
import { Section } from '@/components/site/Section'
import { fullDate, monthYear } from '@/lib/format'
import { asMedia, focalPosition, mediaUrl } from '@/lib/media'
import { getClient, getSettings } from '@/lib/payload'

/**
 * Home (her name is in the header bar, see Tabs): her drawn portrait on the left; the greeting, roles,
 * a short intro and contact on the right;
 * then the Bio, News, Talks and Blog sections. The other sections live under Explore.
 */
/** The greeting's last word (her name) is set in italic: "Hello, I’m <em>Joye!</em>" */
const greeting = (title?: string | null) => {
  if (!title) return null
  const m = title.match(/^(.*\s)(\S+)$/)
  return m ? (
    <>
      {m[1]}
      <em>{m[2]}</em>
    </>
  ) : (
    title
  )
}

export default async function HomePage() {
  const payload = await getClient()
  const [settings, about, news, talks, posts] = await Promise.all([
    getSettings(),
    payload.findGlobal({ slug: 'about-page', depth: 1 }),
    payload.find({ collection: 'news', sort: '-date', limit: 300 }),
    payload.find({ collection: 'talks', sort: '-date', limit: 300, depth: 1 }),
    payload.find({
      collection: 'posts',
      sort: '-publishedDate',
      limit: 200,
      where: { _status: { equals: 'published' } },
      select: { title: true, slug: true, publishedDate: true, excerpt: true },
    }),
  ])

  // First paragraph sits under the greeting; the rest is the Bio section.
  const [intro, ...bio] = paragraphs(about.bio)
  const portraitUrl = mediaUrl(about.portrait, 'large')

  return (
    <main className="home">
      <section className="intro">
        {portraitUrl && (
          <div className="intro__portrait">
            <RippleImage
              src={portraitUrl}
              alt={asMedia(about.portrait)?.alt || 'Portrait'}
              width={asMedia(about.portrait)?.sizes?.large?.width ?? asMedia(about.portrait)?.width}
              height={asMedia(about.portrait)?.sizes?.large?.height ?? asMedia(about.portrait)?.height}
            />
          </div>
        )}
        <div className="intro__copy">
          <h1 data-split>{greeting(about.title)}</h1>
          {settings.tagline && (
            <p className="intro__roles" data-reveal>
              {settings.tagline}
            </p>
          )}
          {intro && (
            <p className="intro__text" data-split="lines">
              {intro}
            </p>
          )}
          <ExploreButton
            href="/explore"
            label="Explore the work"
            full={mediaUrl(about.heroImage, 'hero')}
            position={focalPosition(about.heroImage)}
          />
        </div>
        <div className="intro__contact" data-reveal>
          <h2>
            <Link href="/contact">Contact</Link>
          </h2>
          {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          {settings.location && <span>{settings.location}</span>}
        </div>
      </section>

      {bio.length > 0 && (
        <Section id="bio" title="Bio">
          <div className="bio">
            {bio.map((p, i) => (
              <p key={i} data-split="lines">
                {p}
              </p>
            ))}
          </div>
        </Section>
      )}

      {news.docs.length > 0 && (
        <Section id="news" title="News" intro={about.intros?.news}>
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
        </Section>
      )}

      {talks.docs.length > 0 && (
        <Section id="talks" title="Talks" intro={about.intros?.talks}>
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
        </Section>
      )}

      {posts.docs.length > 0 && (
        <Section id="blog" title="Blog" intro={about.intros?.blog}>
          <div className="rows">
            {posts.docs.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="row row--link">
                <div className="row__meta mono">{fullDate(p.publishedDate)}</div>
                <div>
                  <h3 className="row__title">{p.title}</h3>
                  {p.excerpt && <p className="row__body">{p.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </main>
  )
}
