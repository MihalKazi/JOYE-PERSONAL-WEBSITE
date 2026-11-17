import type { ReactNode } from 'react'

type Props = { kicker?: string; title: string; intro?: string | null }

/** Shared page title block: small red label, big title, optional intro line. */
export function PageHead({ kicker, title, intro }: Props) {
  return (
    <header className="page-head">
      {kicker && (
        <div className="kicker" data-reveal>
          {kicker}
        </div>
      )}
      <h1 data-split>{title}</h1>
      {intro && (
        <p className="page-head__intro" data-split="lines">
          {intro}
        </p>
      )}
    </header>
  )
}

/** Shown on pages that have nothing in them yet. */
export function Empty({ children = 'Coming soon.' }: { children?: ReactNode }) {
  return (
    <p className="empty" data-reveal>
      {children}
    </p>
  )
}

/** External link with the small arrow, used in row link lists. */
export function OutLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="out" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 11l6-6M6 5h5v5" />
      </svg>
    </a>
  )
}

export const paragraphs = (text?: string | null) => (text || '').split(/\n\s*\n/).filter(Boolean)
