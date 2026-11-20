import type { ReactNode } from 'react'

/** A titled band on a long page (home, Explore): title on the left, content on the right. */
export function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string
  title: string
  intro?: string | null
  children: ReactNode
}) {
  return (
    <section className="sec" id={id} aria-labelledby={`${id}-title`}>
      <header className="sec__head">
        <h2 className="sec__title" id={`${id}-title`} data-split>
          {title}
        </h2>
        {intro && (
          <p className="sec__intro" data-reveal>
            {intro}
          </p>
        )}
      </header>
      <div className="sec__body">{children}</div>
    </section>
  )
}
