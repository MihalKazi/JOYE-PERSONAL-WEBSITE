import Link from 'next/link'

import { NEWS_KINDS } from '@/collections/News'
import { RippleImage } from '@/components/RippleImage'
import { OutLink, paragraphs } from '@/components/site/PageHead'
import { ContactDetails } from '@/components/site/ContactDetails'
import { Section } from '@/components/site/Section'
import { fullDate, monthYear } from '@/lib/format'
import { asMedia, mediaUrl } from '@/lib/media'
import { getClient, getSettings } from '@/lib/payload'

/**
 * Home (her name is in the header bar, see Tabs): her drawn portrait on the left; the greeting, roles,
 * and a short intro on the right;
 * then Contact, News, Talks, Blog and Training. The other sections live under Explore.
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
  const [settings, about, news, talks, posts, trainings] = await Promise.all([
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
    payload.find({ collection: 'trainings', sort: '-year', limit: 300, depth: 1 }),
  ])

  // Home page fields, top to bottom: greeting, line under it, text under that.
  // “Text under the line”: an empty line between paragraphs starts a new one.
  const intro = paragraphs(about.intro)
  const roles = about.roles || settings.tagline
  const portraitUrl = mediaUrl(about.portrait, 'large')

  return (
    <main className="home">
      <section className="intro" id="about" aria-label="About">
        {portraitUrl && (
          <div className="intro__portrait">
            <span className="intro__ghost kicker" aria-hidden="true">
              {settings.name}
            </span>
            <div className="intro__anchor">
              <RippleImage
                src={portraitUrl}
                alt={asMedia(about.portrait)?.alt || 'Portrait'}
                width={asMedia(about.portrait)?.sizes?.large?.width ?? asMedia(about.portrait)?.width}
                height={
                  asMedia(about.portrait)?.sizes?.large?.height ?? asMedia(about.portrait)?.height
                }
              />
            </div>
          </div>
        )}
        <div className="intro__copy">
          <h1 data-split>{greeting(about.title)}</h1>
          {roles && (
            <p className="intro__roles" data-reveal>
              {roles}
            </p>
          )}
          {intro.map((p, i) => (
            <p key={i} className="intro__text" data-split="lines">
              {p}
            </p>
          ))}
        </div>
      </section>

      <Section
        id="contact"
        title="Contact"
        intro={about.intros?.contact || 'For research, opportunities and collaborations.'}
      >
        <ContactDetails
          email={settings.email}
          links={(settings.links ?? []).map((l) => ({ label: l.label, url: l.url }))}
          cvUrl={mediaUrl(settings.cv)}
          location={settings.location}
        />
      </Section>

      {news.docs.length > 0 && (
        <Section id="news" title="News" intro={about.intros?.news}>
          <div className="rows">
            {news.docs.map((n) => (
              <article key={n.id} className="row">
                <div className="row__meta mono">
                  {fullDate(n.date)}
                  <span className="row__tag">
                    {NEWS_KINDS.find((k) => k.value === n.kind)?.label}
                  </span>
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
              const links = [
                ...(t.link ? [{ label: 'Event', url: t.link }] : []),
                ...(t.extraLinks ?? []),
              ]
              return (
                <article key={t.id} className="row">
                  <div className="row__meta mono">
                    {monthYear(t.date)}
                    {t.location && <span className="row__tag">{t.location}</span>}
                  </div>
                  <div>
                    <h3 className="row__title">{t.title}</h3>
                    {(t.role || t.event) && (
                      <p className="row__sub">{[t.role, t.event].filter(Boolean).join(', ')}</p>
                    )}
                    {(t.photos ?? []).length > 0 && (
                      <div className="row__photos">
                        {(t.photos ?? []).map((ph) => {
                          const m = asMedia(ph)
                          const url = mediaUrl(m, 'large')
                          return m && url ? (
                            <a key={m.id} href={url} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={mediaUrl(m, 'thumb') ?? url}
                                alt={m.alt || ''}
                                loading="lazy"
                              />
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

      {trainings.docs.length > 0 && (
        <Section id="training" title="Training & certificates" intro={about.intros?.training}>
          <div className="rows">
            {trainings.docs.map((t) => {
              const cert = mediaUrl(t.certificate)
              return (
                <article key={t.id} className="row">
                  <div className="row__meta mono">{t.year}</div>
                  <div>
                    <h3 className="row__title">{t.title}</h3>
                    {t.organisation && <p className="row__sub">{t.organisation}</p>}
                    {(t.link || cert) && (
                      <div className="row__links">
                        {cert && <OutLink href={cert}>Certificate</OutLink>}
                        {t.link && <OutLink href={t.link}>Course</OutLink>}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </Section>
      )}
    </main>
  )
}
