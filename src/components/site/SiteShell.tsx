'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'

import { choreograph, leavePage } from '@/lib/motion'
import { prefersReducedMotion } from '@/lib/noise'

type Enter = (href: string, from: HTMLElement, image: { src: string; position: string }) => void
type Ctx = { pauseScroll: (paused: boolean) => void; enter: Enter; prime: (src: string) => void }

const SiteCtx = createContext<Ctx>({ pauseScroll: () => {}, enter: () => {}, prime: () => {} })

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

/** Resolves once the landscape page's photo has loaded and decoded (or after 2.5s at most). */
const heroReady = () =>
  new Promise<void>((resolve) => {
    const img = document.querySelector<HTMLImageElement>('.hero__img img')
    if (!img) return resolve()
    const done = () => img.decode().catch(() => {}).then(() => resolve())
    if (img.complete && img.naturalWidth) return done()
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', () => resolve(), { once: true })
    setTimeout(resolve, 2500)
  })
export const useSite = () => useContext(SiteCtx)

/**
 * Wraps every page: smooth scroll, the site's motion (rebuilt per page, see lib/motion),
 * page-leave transitions for internal links, the red cursor, reading progress, and the
 * "veil" — the photo that grows out of the Explore button into the landscape page.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const root = useRef<HTMLDivElement>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const lenis = useRef<Lenis | null>(null)
  const arriving = useRef(false)
  const leaving = useRef(false)
  const growDone = useRef<Promise<void>>(Promise.resolve())

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
    const viaVeil = arriving.current
    arriving.current = false

    // Lift the veil only when the grow has finished AND the landscape photo is ready underneath,
    // then fade it on the compositor (CSS) so page start-up work can't make it stutter.
    let lifted: Promise<unknown> = Promise.resolve()
    if (viaVeil && veil.current) {
      const v = veil.current
      lifted = (async () => {
        await growDone.current
        await heroReady()
        await nextFrame()
        v.style.transition = 'opacity 1s cubic-bezier(0.22, 0.8, 0.2, 1)'
        v.style.opacity = '0'
        window.setTimeout(() => {
          v.style.transition = 'none'
          v.style.visibility = 'hidden'
          v.style.opacity = '1'
        }, 1050)
      })()
    }

    if (prefersReducedMotion()) return

    let ctx: gsap.Context | null = null
    let cancelled = false
    const start = () => {
      if (cancelled) return
      ctx = gsap.context(() => choreograph({ heroIntro: !!document.querySelector('.hero'), viaVeil }), root)
      ScrollTrigger.refresh()
    }
    // Wait for web fonts (headline line breaks) and, after the Explore transition, for the veil to lift.
    Promise.all([document.fonts.ready, lifted]).then(start)
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

  // Load and decode the Explore photo ahead of time so the click never waits on it.
  const prime = useCallback((src: string) => {
    const img = veil.current?.querySelector('img')
    if (!img || img.getAttribute('src') === src) return
    img.src = src
    img.decode().catch(() => {})
  }, [])

  const enter = useCallback<Enter>(
    (href, from, image) => {
      const v = veil.current
      const img = v?.querySelector('img')
      if (!v || !img || prefersReducedMotion()) {
        router.push(href)
        return
      }
      const r = from.getBoundingClientRect()
      lenis.current?.stop()
      arriving.current = true
      prime(image.src)

      growDone.current = img
        .decode()
        .catch(() => {})
        .then(
          () =>
            new Promise<void>((resolve) => {
              // FLIP with transforms only: the photo is laid out once at its full-screen size and
              // scaled/translated so that, at the start, it shows exactly the button's crop.
              const nw = img.naturalWidth || 1600
              const nh = img.naturalHeight || 900
              const [px, py] = image.position.split(' ').map((v) => parseFloat(v) / 100)
              const W = innerWidth
              const H = innerHeight * 1.08
              const sf = Math.max(W / nw, H / nh)
              const fx = (W - nw * sf) * px
              const fy = -innerHeight * 0.08 + (H - nh * sf) * py
              const sb = Math.max(r.width / nw, r.height / nh)
              const sx = r.left + (r.width - nw * sb) * px
              const sy = r.top + (r.height - nh * sb) * py

              v.style.transition = 'none'
              gsap.set(v, {
                visibility: 'visible',
                opacity: 1,
                clipPath: `inset(${r.top}px ${W - r.right}px ${innerHeight - r.bottom}px ${r.left}px)`,
              })
              gsap.set(img, { width: nw * sf, height: nh * sf, transformOrigin: '0 0', x: sx, y: sy, scale: sb / sf, force3D: true })

              let pushed = false
              gsap
                .timeline({
                  defaults: { duration: 1.25, ease: 'expo.inOut' },
                  onUpdate() {
                    // Start loading the next page while the photo is still growing.
                    if (!pushed && this.progress() > 0.45) {
                      pushed = true
                      router.push(href)
                    }
                  },
                  onComplete: () => resolve(),
                })
                .to(v, { clipPath: 'inset(0px 0px 0px 0px)' }, 0)
                .to(img, { x: fx, y: fy, scale: 1 }, 0)
            }),
        )
    },
    [router, prime],
  )

  const value = useMemo<Ctx>(
    () => ({ pauseScroll: (paused) => (paused ? lenis.current?.stop() : lenis.current?.start()), enter, prime }),
    [enter, prime],
  )

  return (
    <SiteCtx.Provider value={value}>
      <div className="site" ref={root}>
        <div className="progress" aria-hidden="true" />
        {children}
        <div className="veil" ref={veil} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" />
        </div>
        <div className="cursor" ref={cursor} aria-hidden="true" />
      </div>
    </SiteCtx.Provider>
  )
}
