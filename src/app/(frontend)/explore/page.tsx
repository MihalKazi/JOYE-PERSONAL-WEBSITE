import type { Metadata } from 'next'
import Image from 'next/image'

import { RESEARCH_STATUS } from '@/collections/Research'
import { WORK_CATEGORIES } from '@/collections/Works'
import { ContourLines } from '@/components/ContourLines'
import { Mist } from '@/components/Mist'
import { Empty, OutLink, paragraphs } from '@/components/site/PageHead'
import { Section } from '@/components/site/Section'
import { WorkGallery, type WorkItem } from '@/components/site/WorkGallery'
import { asMedia, focalPosition, mediaUrl } from '@/lib/media'
import { getAbout, getClient, getSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'Explore' }

const RESEARCH_GROUPS: Record<string, string> = {
  current: 'Current research',
  completed: 'Completed research',
  future: 'Future research interests',
}

const PUBLICATION_KINDS: Record<string, string> = {
  journal: 'Journal article',
  conference: 'Conference paper',
  report: 'Research report',
  thesis: 'Thesis',
  other: 'Other',
}

/**
 * Explore: the landscape page (full-screen photo, drifting mist, contour lines), then every
 * section of her work on one page — Research, Publications, Projects, Creative practice (the dark
 * gallery band) and Training. The tab row jumps between them (ids match lib/nav WORK).
 */
export default async function ExplorePage() {
  const payload = await getClient()
  const [about, settings, research, pubs, projects, works, trainings] = await Promise.all([
    getAbout(),
    getSettings(),
    payload.find({ collection: 'research', sort: '_order', limit: 200 }),
    payload.find({ collection: 'publications', sort: '-year', limit: 300, depth: 1 }),
    payload.find({ collection: 'projects', sort: '_order', limit: 100, depth: 1 }),
    payload.find({ collection: 'works', sort: '_order', limit: 200, depth: 1 }),
    payload.find({ collection: 'trainings', sort: '-year', limit: 300, depth: 1 }),
  ])
  const heroUrl = mediaUrl(about.heroImage, 'hero')
  const workBg = mediaUrl(about.heroImage, 'large')

  const groups = RESEARCH_STATUS.map((s) => ({
    key: s.value,
    title: RESEARCH_GROUPS[s.value],
    docs: research.docs.filter((d) => d.status === s.value),
  })).filter((g) => g.docs.length > 0)

  const workItems: WorkItem[] = works.docs.flatMap((w) => {
    const img = asMedia(w.image)
    if (!img) return []
    return [
      {
        id: w.id,
        title: w.title,
        category: w.category,
        categoryLabel: WORK_CATEGORIES.find((c) => c.value === w.category)?.label ?? w.category,
        year: w.year,
        description: w.description,
        videoUrl: w.videoUrl,
        video: mediaUrl(w.video),
        thumb: mediaUrl(img, 'thumb') ?? '',
        full: mediaUrl(img, 'large') ?? '',
        alt: img.alt || w.title,
        position: focalPosition(img),
        more: (w.moreImages ?? []).flatMap((m) => {
          const mm = asMedia(m)
          const url = mediaUrl(mm, 'large')
          return mm && url ? [{ url, alt: mm.alt || w.title }] : []
        }),
      },
    ]
  })

  return (
    <main className="explore-page">
      <section className="hero">
        {heroUrl && (
          <div className="hero__img">
            <Image
              src={heroUrl}
              alt={asMedia(about.heroImage)?.alt || ''}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: focalPosition(about.heroImage) }}
            />
          </div>
        )}
        <Mist />
        <div className="hero__fog" />
        <ContourLines />
        <div className="wordmark">
          <h1>{settings.name}</h1>
          {about.heroSubtitle && <p>{about.heroSubtitle}</p>}
        </div>
      </section>

      <Section id="research" title="Research" intro={about.intros?.research}>
        {groups.length === 0 && <Empty />}
        {groups.map((g) => (
          <div key={g.key} className="group">
            <h3 className="group__title" data-reveal>
              {g.title}
            </h3>
            <div className="rows">
              {g.docs.map((d) => (
                <article key={d.id} className="row">
                  <div className="row__meta mono">{d.period}</div>
                  <div>
                    <h4 className="row__title">{d.title}</h4>
                    {(d.kind || d.institution) && (
                      <p className="row__sub">{[d.kind, d.institution].filter(Boolean).join(' · ')}</p>
                    )}
                    {paragraphs(d.summary).map((p, i) => (
                      <p key={i} className="row__body">
                        {p}
                      </p>
                    ))}
                    {d.link && (
                      <div className="row__links">
                        <OutLink href={d.link}>More</OutLink>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section id="publications" title="Publications" intro={about.intros?.publications}>
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
                    <span className="row__tag">{PUBLICATION_KINDS[p.kind] ?? p.kind}</span>
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
      </Section>

      <Section id="projects" title="Projects" intro={about.intros?.projects}>
        {projects.docs.length === 0 ? (
          <Empty />
        ) : (
          <div className="projects">
            {projects.docs.map((p) => {
              const img = asMedia(p.image)
              const url = mediaUrl(img, 'large')
              return (
                <article key={p.id} className={`project${url ? '' : ' project--text'}`}>
                  {url && (
                    <div className="project__img">
                      <Image src={url} alt={img?.alt || ''} fill sizes="(max-width:900px) 100vw, 35vw" style={{ objectPosition: focalPosition(img) }} />
                    </div>
                  )}
                  <div className="project__copy">
                    {(p.role || p.period) && <p className="row__meta mono">{[p.period, p.role].filter(Boolean).join(' · ')}</p>}
                    <h3 className="project__title">{p.title}</h3>
                    {paragraphs(p.summary).map((t, i) => (
                      <p key={i} className="row__body">
                        {t}
                      </p>
                    ))}
                    {p.link && (
                      <div className="row__links">
                        <OutLink href={p.link}>Visit project</OutLink>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </Section>

      {/* Creative practice keeps its own dark band with the gallery and lightbox. */}
      <section className="work" id="creative-practice" aria-label="Creative practice">
        <div className="work__bg" aria-hidden="true" style={workBg ? { backgroundImage: `url(${workBg})` } : undefined} />
        <div className="work__inner">
          <WorkGallery
            works={workItems}
            title={about.workTitle || 'Creative practice'}
            intro={about.intros?.creative || 'Kathak dance, theatre and choreography — with drawings and photographs.'}
          />
        </div>
      </section>

      <Section id="training" title="Training & certificates" intro={about.intros?.training}>
        {trainings.docs.length === 0 ? (
          <Empty />
        ) : (
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
        )}
      </Section>
    </main>
  )
}
