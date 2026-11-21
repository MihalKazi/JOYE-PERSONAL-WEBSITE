'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type MouseEvent } from 'react'

import { HOME, NAV, WORK, inWork, isActive } from '@/lib/nav'
import { useSite } from './SiteShell'

const sectionId = (href: string) => href.split('#')[1] ?? ''

/**
 * Site navigation: a white header bar that stays put on every page — her name on the left, the tabs
 * on the right. Main pages: CV · Explore · Contact (Home in front off the home page).
 * Explore (one long page): Home + its sections; they scroll to their section, and the one being
 * read is lit.
 */
export function Tabs({ name }: { name: string }) {
  const pathname = usePathname()
  const { scrollToSection } = useSite()
  const [scrolled, setScrolled] = useState(false)
  const [current, setCurrent] = useState('') // Explore: id of the section being read
  const row = useRef<HTMLElement>(null)
  const work = inWork(pathname)
  const onExplore = pathname === '/explore' // the page whose sections the hash tabs scroll to

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 8)
      if (onExplore) {
        // the last section whose top has passed a third of the way down the screen
        const line = window.innerHeight * 0.35
        let id = ''
        for (const w of WORK) {
          const el = document.getElementById(sectionId(w.href))
          if (el && el.getBoundingClientRect().top <= line) id = el.id
        }
        setCurrent(id)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onExplore])

  // Keep the lit tab in view when the row scrolls sideways (narrow screens).
  useEffect(() => {
    const el = row.current
    const active = el?.querySelector<HTMLElement>('.is-active')
    if (el && active && el.scrollWidth > el.clientWidth) {
      el.scrollTo({ left: active.offsetLeft - 16, behavior: 'smooth' })
    }
  }, [pathname, current])

  const items = work ? [HOME, ...WORK] : pathname === '/' ? NAV : [HOME, ...NAV]
  const lit = (href: string) => {
    if (href.includes('#')) return onExplore && sectionId(href) === current
    return href === '/explore' ? onExplore : isActive(href, pathname)
  }
  // On Explore, section tabs scroll smoothly within the page instead of navigating (elsewhere they navigate).
  const jump = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!onExplore || !href.includes('#') || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
      return
    e.preventDefault()
    scrollToSection(sectionId(href))
  }

  const links = items.map((t) => {
    const active = lit(t.href)
    return (
      <Link
        key={t.href}
        href={t.href}
        className={`tab${active ? ' is-active' : ''}`}
        aria-current={
          active
            ? t.href.includes('#')
              ? 'location'
              : pathname === t.href
                ? 'page'
                : undefined
            : undefined
        }
        onClick={(e) => jump(e, t.href)}
      >
        {t.label}
      </Link>
    )
  })

  return (
    <header
      className={`masthead${work ? ' masthead--explore' : ''}${scrolled ? ' is-scrolled' : ''}`}
    >
      <div className="masthead__in">
        <Link href="/" className="masthead__name kicker">
          {name}
        </Link>
        <nav ref={row} className="masthead__nav" aria-label={work ? 'Project' : 'Main'}>
          {links}
        </nav>
      </div>
    </header>
  )
}
