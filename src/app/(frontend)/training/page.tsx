import type { Metadata } from 'next'

import { Empty, OutLink, PageHead } from '@/components/site/PageHead'
import { mediaUrl } from '@/lib/media'
import { getAbout, getClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Training & certificates' }

/** Every training and certificate, newest first (the home page only links here). */
export default async function TrainingPage() {
  const payload = await getClient()
  const [about, trainings] = await Promise.all([
    getAbout(),
    payload.find({ collection: 'trainings', sort: '-year', limit: 300, depth: 1 }),
  ])

  return (
    <main className="page">
      <PageHead title="Training & certificates" intro={about.intros?.training} />
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
                  <h2 className="row__title">{t.title}</h2>
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
    </main>
  )
}
