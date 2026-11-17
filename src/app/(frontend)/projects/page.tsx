import type { Metadata } from 'next'
import Image from 'next/image'

import { Empty, OutLink, PageHead, paragraphs } from '@/components/site/PageHead'
import { asMedia, focalPosition, mediaUrl } from '@/lib/media'
import { getAbout, getClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Projects' }

export default async function ProjectsPage() {
  const payload = await getClient()
  const [about, projects] = await Promise.all([
    getAbout(),
    payload.find({ collection: 'projects', sort: '_order', limit: 100, depth: 1 }),
  ])

  return (
    <main className="page">
      <PageHead title="Projects" intro={about.intros?.projects} />
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
                    <Image src={url} alt={img?.alt || ''} fill sizes="(max-width:900px) 100vw, 45vw" style={{ objectPosition: focalPosition(img) }} />
                  </div>
                )}
                <div className="project__copy">
                  {(p.role || p.period) && <p className="row__meta mono">{[p.period, p.role].filter(Boolean).join(' · ')}</p>}
                  <h2 className="project__title">{p.title}</h2>
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
    </main>
  )
}
