'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { DARK_PAGES, HOME_PAGES, NAV, WORK, inWork, isActive } from '@/lib/nav'

/**
 * Top tabs (mockup 2). Main pages: Home · Explore my works · CV · Contact.
 * Inside "Explore my works" (the landscape page and its sections) the row
 * becomes Home + the sections instead.
 */
export function Tabs() {
  const pathname = usePathname()
  const [hidden, setHidden] = useState(false)
  const row = useRef<HTMLElement>(null)
  const work = inWork(pathname)

  // Headroom: tuck the tabs away while reading downward, bring them back on any upward scroll.
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < 8) return
      setHidden(y > lastY && y > window.innerHeight * 0.4)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // New page: show the tabs and keep the active section in view on narrow screens.
  useEffect(() => {
    setHidden(false)
    const el = row.current
    const active = el?.querySelector<HTMLElement>('[aria-current]')
    if (el && active && el.scrollWidth > el.clientWidth) {
      el.scrollTo({ left: active.offsetLeft - 16, behavior: 'smooth' })
    }
  }, [pathname])

  const onLight = !DARK_PAGES.includes(pathname)

  // Inside "Explore my works": Home + the sections. Everywhere else: the main tabs.
  const items = work ? [{ href: '/', label: 'Home' }, ...WORK] : NAV
  const lit = (href: string) =>
    href === '/explore' ? work : href === '/' ? pathname === '/' || HOME_PAGES.includes(pathname) : isActive(href, pathname)

  return (
    <nav
      ref={row}
      className={`tabs${onLight ? ' on-light' : ''}${hidden ? ' is-hidden' : ''}`}
      aria-label={work ? 'Explore my works' : 'Main'}
    >
      {items.map((t) => {
        const active = lit(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`tab${active ? ' is-active' : ''}`}
            aria-current={active && pathname === t.href ? 'page' : undefined}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
