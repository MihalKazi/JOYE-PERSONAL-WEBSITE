import type { Metadata } from 'next'
import Image from 'next/image'

import { RESEARCH_STATUS } from '@/collections/Research'
import { Empty, OutLink, paragraphs } from '@/components/site/PageHead'
import { Section } from '@/components/site/Section'
import { asMedia, focalPosition, mediaUrl } from '@/lib/media'
import { getAbout, getClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Project' }

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
 * Explore: her research, publications and projects on one page. The tab row jumps between them
 * (ids match lib/nav WORK); Creative practice has its own page.
 */
export default async function ExplorePage() {
  const payload = await getClient()
  const [about, research, pubs, projects] = await Promise.all([
    getAbout(),
    payload.find({ collection: 'research', sort: '_order', limit: 200 }),
    payload.find({ collection: 'publications', sort: '-year', limit: 300, depth: 1 }),
    payload.find({ collection: 'projects', sort: '_order', limit: 100, depth: 1 }),
  ])

  const groups = RESEARCH_STATUS.map((s) => ({
    key: s.value,
    title: RESEARCH_GROUPS[s.value],
    docs: research.docs.filter((d) => d.status === s.value),
  })).filter((g) => g.docs.length > 0)

  return (
    <main className="explore-page">
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
                      <p className="row__sub">
                        {[d.kind, d.institution].filter(Boolean).join(' · ')}
                      </p>
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
                      (p.authors || p.venue) && (
                        <p className="row__sub">
                          {[p.authors, p.venue].filter(Boolean).join(' — ')}
                        </p>
                      )
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
                      <Image
                        src={url}
                        alt={img?.alt || ''}
                        fill
                        sizes="(max-width:900px) 100vw, 35vw"
                        style={{ objectPosition: focalPosition(img) }}
                      />
                    </div>
                  )}
                  <div className="project__copy">
                    {(p.role || p.period) && (
                      <p className="row__meta mono">
                        {[p.period, p.role].filter(Boolean).join(' · ')}
                      </p>
                    )}
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
    </main>
  )
}
