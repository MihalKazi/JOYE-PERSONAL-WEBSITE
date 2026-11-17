'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { DARK_PAGES, NAV, NO_TABS, isActive } from '@/lib/nav'

/** Top tab row (mockup 2) on every page. */
export function Tabs() {
  const pathname = usePathname()
  const [hidden, setHidden] = useState(false)
  const nav = useRef<HTMLElement>(null)

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

  // New page: show the tabs and keep the active one in view on narrow screens.
  useEffect(() => {
    setHidden(false)
    const el = nav.current
    const active = el?.querySelector<HTMLElement>('[aria-current]')
    if (el && active && el.scrollWidth > el.clientWidth) {
      el.scrollTo({ left: active.offsetLeft - 16, behavior: 'smooth' })
    }
  }, [pathname])

  if (NO_TABS.includes(pathname)) return null

  const onLight = !DARK_PAGES.includes(pathname)

  return (
    <nav ref={nav} className={`tabs${onLight ? ' on-light' : ''}${hidden ? ' is-hidden' : ''}`} aria-label="Main">
      {NAV.map((t) => {
        const active = isActive(t.href, pathname)
        return (
          <Link key={t.href} href={t.href} className={`tab${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
