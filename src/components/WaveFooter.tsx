'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

/** Slim footer: drifting wave lines on both sides of her name; waves draw outward when scrolled into view. */
export function WaveFooter({ name }: { name: string }) {
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
        </div>
        <div className="wave wave--r" aria-hidden="true" />
      </div>
    </footer>
  )
}
