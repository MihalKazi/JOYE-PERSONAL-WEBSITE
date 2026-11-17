import type { Metadata } from 'next'

import { RESEARCH_STATUS } from '@/collections/Research'
import { Empty, OutLink, PageHead, paragraphs } from '@/components/site/PageHead'
import { getAbout, getClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Research' }

const GROUP_TITLES: Record<string, string> = {
  current: 'Current research',
  completed: 'Completed research',
  future: 'Future research interests',
}

export default async function ResearchPage() {
  const payload = await getClient()
  const [about, items] = await Promise.all([
    getAbout(),
    payload.find({ collection: 'research', sort: '_order', limit: 200 }),
  ])

  const groups = RESEARCH_STATUS.map((s) => ({
    key: s.value,
    title: GROUP_TITLES[s.value],
    docs: items.docs.filter((d) => d.status === s.value),
  })).filter((g) => g.docs.length > 0)

  return (
    <main className="page">
      <PageHead title="Research" intro={about.intros?.research} />
      {groups.length === 0 && <Empty />}
      {groups.map((g) => (
        <section key={g.key} className="group">
          <h2 className="group__title" data-reveal>
            {g.title}
          </h2>
          <div className="rows">
            {g.docs.map((d) => (
              <article key={d.id} className="row">
                <div className="row__meta mono">{d.period}</div>
                <div>
                  <h3 className="row__title">{d.title}</h3>
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
        </section>
      ))}
    </main>
  )
}
