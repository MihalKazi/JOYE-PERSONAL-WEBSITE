import type { Metadata } from 'next'

import { Empty, PageHead } from '@/components/site/PageHead'
import { mediaUrl } from '@/lib/media'
import { getAbout, getSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'CV' }

export default async function CvPage() {
  const [about, settings] = await Promise.all([getAbout(), getSettings()])
  const cvUrl = mediaUrl(settings.cv)

  return (
    <main className="page">
      <PageHead
        title="Curriculum vitae"
        intro={about.intros?.cv || 'Education, research, experience, talks, fellowships, skills and achievements.'}
      />
      {!cvUrl ? (
        <Empty />
      ) : (
        <>
          <div className="cv-actions" data-reveal>
            <a className="btn btn--solid" href={cvUrl} download>
              Download PDF
            </a>
            <a className="btn" href={cvUrl} target="_blank" rel="noopener noreferrer">
              Open in new tab
            </a>
          </div>
          <div className="cv-embed" data-reveal>
            <iframe src={`${cvUrl}#view=FitH`} title={`${settings.name} — CV`} loading="lazy" />
          </div>
        </>
      )}
    </main>
  )
}
