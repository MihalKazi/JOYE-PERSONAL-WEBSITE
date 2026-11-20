'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'

import { choreograph, leavePage } from '@/lib/motion'
import { prefersReducedMotion } from '@/lib/noise'

type Ctx = {
  pauseScroll: (paused: boolean) => void
  /** Smooth-scroll to a section on this page (by id), clear of the fixed header, and put it in the URL. */
  scrollToSection: (id: string) => void
}

const SiteCtx = createContext<Ctx>({ pauseScroll: () => {}, scrollToSection: () => {} })

/** Height of the fixed header bar, if this page has one. */
const headerOffset = () => document.querySelector<HTMLElement>('.masthead')?.offsetHeight ?? 0

export const useSite = () => useContext(SiteCtx)

/**
 * Wraps every page: smooth scroll, the site's motion (rebuilt per page, see lib/motion),
 * page-leave transitions for internal links, the red cursor and reading progress.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const root = useRef<HTMLDivElement>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const lenis = useRef<Lenis | null>(null)
  const leaving = useRef(false)

  // Smooth scroll lives for the whole visit.
  useEffect(() => {
    if (prefersReducedMotion()) return
    gsap.registerPlugin(ScrollTrigger)
    const l = new Lenis({ lerp: 0.09, anchors: { duration: 1.6 } })
    lenis.current = l
    l.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => l.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      l.destroy()
      lenis.current = null
    }
  }, [])

  // Page choreography: rebuilt whenever the page changes.
  useEffect(() => {
    leaving.current = false
    // A reused <main> (e.g. one blog post to another) must not stay faded out.
    gsap.set('.site main', { clearProps: 'opacity,visibility,transform' })
    lenis.current?.scrollTo(0, { immediate: true, force: true })
    lenis.current?.start()

    if (prefersReducedMotion()) return

    let ctx: gsap.Context | null = null
    let cancelled = false
    const start = () => {
      if (cancelled) return
      ctx = gsap.context(() => choreograph({ heroIntro: !!document.querySelector('.hero') }), root)
      ScrollTrigger.refresh()
      // Links like /#blog: the page was reset to the top above, so go to the section now.
      let target: HTMLElement | null = null
      try {
        target = location.hash ? document.querySelector<HTMLElement>(decodeURIComponent(location.hash)) : null
      } catch {
        /* not a valid selector */
      }
      // (offset: keep the section title clear of the fixed header bar)
      if (target) lenis.current?.scrollTo(target, { immediate: true, force: true, offset: -headerOffset() })
    }
    // Wait for web fonts (headline line breaks).
    document.fonts.ready.then(start)
    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [pathname])

  // Internal links: let the current page lift away, then navigate.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement).closest('a')
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin || /^\/(api|admin)(\/|$)/.test(url.pathname)) return
      if (url.pathname === location.pathname) return
      if (prefersReducedMotion()) return
      e.preventDefault()
      e.stopPropagation()
      if (leaving.current) return
      leaving.current = true
      lenis.current?.stop()
      leavePage(() => router.push(url.pathname + url.search + url.hash))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [router])

  // Red ring cursor (mouse only).
  useEffect(() => {
    const el = cursor.current
    if (!el || !window.matchMedia('(pointer:fine)').matches) return
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let cx = x
    let cy = y
    let raf = 0
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      el.style.opacity = '1'
    }
    const over = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      const tile = target.closest('.tile')
      const own = target.closest('[data-cursor="none"]')
      const link = target.closest('a,button')
      el.classList.toggle('is-view', !!tile)
      el.classList.toggle('is-off', !!own)
      el.textContent = tile ? 'view' : ''
      el.classList.toggle('is-link', !tile && !own && !!link)
    }
    const tick = () => {
      cx += (x - cx) * 0.2
      cy += (y - cy) * 0.2
      el.style.transform = `translate(${cx}px,${cy}px)`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerover', over)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
    }
  }, [])

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    history.replaceState(null, '', `#${id}`)
    if (lenis.current) lenis.current.scrollTo(el, { duration: 1.4, offset: -headerOffset() })
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerOffset() })
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      pauseScroll: (paused) => (paused ? lenis.current?.stop() : lenis.current?.start()),
      scrollToSection,
    }),
    [scrollToSection],
  )

  return (
    <SiteCtx.Provider value={value}>
      <div className="site" ref={root}>
        <div className="progress" aria-hidden="true" />
        {children}
        <div className="cursor" ref={cursor} aria-hidden="true" />
      </div>
    </SiteCtx.Provider>
  )
}
