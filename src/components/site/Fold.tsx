'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Children, useId, useRef, useState, type ReactNode } from 'react'

import { prefersReducedMotion } from '@/lib/noise'

import { useSite } from './SiteShell'

/** Items shown while folded (styles.css hides the rest: `.is-folded > :nth-child(n + 4)`). */
const LIMIT = 3

/**
 * A list that shows its first few items and folds the rest away behind “Show all N …”, so long
 * sections don't stretch the page. Every item is still in the HTML (search engines, find-in-page once
 * opened); folded ones are only hidden. With three or fewer items it is a plain list.
 */
export function Fold({
  children,
  className,
  noun,
}: {
  children: ReactNode
  /** the list's own class (rows / projects), kept so its styles and motion still apply */
  className: string
  /** what the items are, for the button: “Show all 9 news items” */
  noun: string
}) {
  const items = Children.toArray(children)
  const [open, setOpen] = useState(false)
  const list = useRef<HTMLDivElement>(null)
  const id = useId()
  const { scrollToSection } = useSite()

  if (items.length <= LIMIT) return <div className={className}>{children}</div>

  const toggle = () => {
    const el = list.current
    const next = !open
    setOpen(next)
    requestAnimationFrame(() => {
      if (!el) return
      const still = prefersReducedMotion() // no site motion then (and no ScrollTrigger running)
      if (!still) ScrollTrigger.refresh() // the page below moved
      if (next) {
        // the newly shown items lift in, as the first ones did (their scroll reveal never ran while hidden)
        const shown = Array.from(el.children).slice(LIMIT) as HTMLElement[]
        if (still) gsap.set(shown, { clearProps: 'all' })
        else gsap.fromTo(shown, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05, overwrite: true })
      } else {
        // folding from far down would leave the reader somewhere else: go back to the section's top
        const sec = el.closest('section[id]')
        if (sec && sec.getBoundingClientRect().top < 0) scrollToSection(sec.id)
      }
    })
  }

  return (
    <>
      <div ref={list} id={id} className={`${className}${open ? '' : ' is-folded'}`}>
        {children}
      </div>
      <button type="button" className="fold" aria-expanded={open} aria-controls={id} onClick={toggle}>
        {open ? 'Show fewer' : `Show all ${items.length} ${noun}`}
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
    </>
  )
}
