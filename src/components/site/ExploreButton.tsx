'use client'

import gsap from 'gsap'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { prefersReducedMotion } from '@/lib/noise'
import { prewarmMist } from '../Mist'
import { useSite } from './SiteShell'

type Props = {
  href: string
  label: string
  /** Full photo of the landscape page. */
  full: string | null
  position: string
}

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
)

/**
 * A window onto the landscape page.
 * Hover: a strip of the landscape wipes in behind the label, letters roll, the arrow loops,
 * a light magnetic pull follows the pointer. Click: letters lift away and the same photo
 * grows out of the button into the full-screen page (shared-element transition).
 */
export function ExploreButton({ href, label, full, position }: Props) {
  const { enter, prime } = useSite()
  const router = useRouter()
  const btn = useRef<HTMLButtonElement>(null)
  const [going, setGoing] = useState(false)

  useEffect(() => {
    router.prefetch(href)
    if (full) prime(full)
    // Build the landscape page's fog texture now, in idle time, not during the transition.
    prewarmMist()
  }, [router, href, full, prime])

  useEffect(() => {
    const el = btn.current
    if (!el) return
    let cleanupMagnet = () => {}
    if (!prefersReducedMotion() && window.matchMedia('(pointer:fine)').matches) {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' })
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        xTo((e.clientX - (r.left + r.width / 2)) * 0.12)
        yTo((e.clientY - (r.top + r.height / 2)) * 0.22)
      }
      const leave = () => {
        xTo(0)
        yTo(0)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      cleanupMagnet = () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      }
    }
    return cleanupMagnet
  }, [])

  const go = () => {
    const el = btn.current
    if (!el || !full || prefersReducedMotion()) {
      router.push(href)
      return
    }
    setGoing(true)
    gsap.killTweensOf(el)
    gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power3.out' })
    // Let the letters leave and the photo fill the button, then open the window.
    window.setTimeout(() => {
      enter(href, el, { src: full, position })
    }, 420)
  }

  return (
    <button ref={btn} type="button" className={`explore${going ? ' is-going' : ''}`} data-cursor="none" data-reveal aria-label={label} onClick={go}>
      <span className="explore__window" aria-hidden="true">
        {full && (
          <span className="explore__photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={full} alt="" style={{ objectPosition: position }} />
          </span>
        )}
      </span>
      <span className="explore__label" aria-hidden="true">
        <span className="explore__text">
          {[...label].map((c, i) => (
            <span key={i} className="explore__ch" style={{ '--i': i } as React.CSSProperties}>
              {c === ' ' ? ' ' : c}
            </span>
          ))}
        </span>
      </span>
      <span className="explore__icon" aria-hidden="true">
        <span className="explore__arrows">
          <Arrow />
          <Arrow />
        </span>
      </span>
    </button>
  )
}
