'use client'

import gsap from 'gsap'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { ArrowUpRightIcon, CloseIcon } from '../icons'
import { useSite } from './SiteShell'

export type Filter = 'all' | 'performance' | 'drawings' | 'photography'

export type WorkItem = {
  id: number | string
  title: string
  category: Exclude<Filter, 'all'>
  categoryLabel: string
  year?: number | null
  description?: string | null
  videoUrl?: string | null
  /** Uploaded MP4, played in the lightbox. */
  video?: string | null
  thumb: string
  full: string
  alt: string
  position: string
  more: { url: string; alt: string }[]
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'performance', label: 'Performance' },
  { value: 'drawings', label: 'Drawings' },
  { value: 'photography', label: 'Photography' },
]

export function WorkGallery({ works, title, intro }: { works: WorkItem[]; title: string; intro?: string | null }) {
  const { pauseScroll } = useSite()
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<WorkItem | null>(null)
  // Which picture of the open work is shown large (main image or one of its extra images).
  const [shown, setShown] = useState<{ url: string; alt: string } | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const root = document.documentElement
    root.style.overflow = 'hidden'
    closeBtn.current?.focus({ preventScroll: true })
    pauseScroll(true)
    const fig = box.current?.querySelector('figure')
    if (box.current) gsap.fromTo(box.current, { opacity: 0 }, { opacity: 1, duration: 0.35 })
    if (fig) gsap.fromTo(fig, { y: 30, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out' })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      root.style.overflow = ''
      pauseScroll(false)
      opener?.focus({ preventScroll: true })
    }
  }, [open, pauseScroll])

  return (
    <>
      <div className="work__head">
        <div>
          <h1 data-split>{title}</h1>
          {intro && (
            <p className="work__intro" data-split="lines">
              {intro}
            </p>
          )}
        </div>
        <div className="filters" data-reveal>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`chip${filter === f.value ? ' is-active' : ''}`}
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {works.length === 0 ? (
        <p className="work__empty">Coming soon.</p>
      ) : (
        <div className="grid" id="grid">
          {works.map((w) => (
            <figure
              key={w.id}
              className={`tile${filter !== 'all' && w.category !== filter ? ' is-dim' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`Open ${w.title}`}
              onClick={() => {
                setShown(null)
                setOpen(w)
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                setShown(null)
                setOpen(w)
              }}
            >
              <Image src={w.thumb} alt={w.alt} fill sizes="(max-width:900px) 50vw, 25vw" style={{ objectPosition: w.position }} />
              {(w.video || w.more.length > 0) && (
                <span className="tile__badge" aria-hidden="true">
                  {w.video ? '▶ Video' : `+${w.more.length}`}
                </span>
              )}
              <figcaption>
                <span>{w.title}</span>
                <small>{w.categoryLabel}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {open && (
        <div
          className="lightbox is-open"
          ref={box}
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        >
          <button type="button" className="lightbox__close" ref={closeBtn} onClick={() => setOpen(null)}>
            Close <CloseIcon />
          </button>
          <figure>
            {open.video && !shown ? (
              <video className="lightbox__player" src={open.video} poster={open.full} controls playsInline preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shown?.url ?? open.full} alt={shown?.alt ?? open.alt} />
            )}
            <figcaption>
              <span>
                {open.title}
                {open.year ? `, ${open.year}` : ''}
              </span>
              <small>{open.categoryLabel}</small>
            </figcaption>
            {open.description && <p className="lightbox__desc">{open.description}</p>}
            {open.videoUrl && (
              <a className="lightbox__video" href={open.videoUrl} target="_blank" rel="noopener noreferrer">
                Watch video <ArrowUpRightIcon />
              </a>
            )}
            {open.more.length > 0 && (
              <div className="lightbox__more">
                {[{ url: open.full, alt: open.alt }, ...open.more].map((m, i) => {
                  const active = (shown?.url ?? (open.video ? null : open.full)) === m.url
                  return (
                    <button
                      key={m.url}
                      type="button"
                      className={`lightbox__thumb${active ? ' is-active' : ''}`}
                      aria-label={`Show picture ${i + 1}`}
                      aria-pressed={active}
                      onClick={() => setShown(i === 0 && open.video ? null : m)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt="" loading="lazy" />
                    </button>
                  )
                })}
              </div>
            )}
          </figure>
        </div>
      )}
    </>
  )
}
