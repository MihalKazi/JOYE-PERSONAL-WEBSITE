'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

type Props = {
  name: string
  email?: string | null
  cvUrl?: string | null
  links?: { label: string; url: string }[]
}

/** Slim footer: drifting wave lines on both sides of the name; waves draw outward when scrolled into view. */
export function WaveFooter({ name, email, cvUrl, links = [] }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-in')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <footer className="foot" ref={ref}>
      <div className="foot__row">
        <div className="wave wave--l" aria-hidden="true" />
        <div className="foot__brand">
          <Link className="foot__name" href="/">
            {name}
          </Link>
          <nav className="foot__links" aria-label="Contact">
            {email && <a href={`mailto:${email}`}>Email</a>}
            {links.map((l) => (
              <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            ))}
            {cvUrl && (
              <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                CV
              </a>
            )}
          </nav>
        </div>
        <div className="wave wave--r" aria-hidden="true" />
      </div>
    </footer>
  )
}
