'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'

/** One bird in silhouette: full wings raised in a soft “m”, the body dipping at the centre. */
const BIRD = 'M0 6C6 1 13 1 20 8 27 1 34 1 40 6 34 4.6 28 6 21.4 13.6L20 15.4l-1.4-1.8C12 6 6 4.6 0 6Z'

/**
 * Wave lines drawn by small birds. Each strand is a string of birds that fly the same path across the
 * footer, right to left, rising and falling as they go; spaced evenly in time along that path, together
 * they trace a gentle wave that keeps flowing past her name. A bird's rise and fall shares its crossing's
 * delay, so every bird on a strand sits on the same curve. Seeded, so server and browser agree.
 */
type Strand = { top: number; amp: number; dur: number; bob: number; count: number; size: [number, number]; o: number }
const STRANDS: Strand[] = [
  { top: 26, amp: 20, dur: 40, bob: 13, count: 30, size: [11, 15], o: 0.8 },
  { top: 70, amp: 15, dur: 50, bob: 15, count: 30, size: [9, 13], o: 0.55 },
]

const FLOCK = (() => {
  let s = 11
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
  return STRANDS.flatMap((st, k) =>
    Array.from({ length: st.count }, (_, i) => {
      const f = i / st.count // where along the strand
      return {
        key: `${k}-${i}`,
        top: st.top + (rand() - 0.5) * 2, // a little loose, not a ruled line
        amp: st.amp,
        size: Math.round(st.size[0] + rand() * (st.size[1] - st.size[0])),
        dur: st.dur,
        delay: -st.dur * f,
        bob: st.bob / 2, // one way; the animation runs back and forth
        flap: 0.26 + rand() * 0.14,
        o: st.o,
        alt: i % 2 === 1, // dropped on small screens, where the strand is shorter
        x: (1 - f) * 100, // resting place when motion is reduced
        ry: Math.sin(f * Math.PI * 6 + k) * st.amp,
      }
    }),
  )
})()

/** Her name with the last word in italic, like the greeting on the home page. */
const signature = (name: string) => {
  const m = name.match(/^(.*\s)(\S+)$/)
  return m ? (
    <>
      {m[1]}
      <em>{m[2]}</em>
    </>
  ) : (
    name
  )
}

/** Footer: wave lines of small birds flowing past her name. They only fly while in view. */
export function BirdFooter({ name }: { name: string }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      el.classList.toggle('is-in', entry.isIntersecting) // birds fly only while in view
      if (entry.isIntersecting) el.classList.add('was-in') // the name, once shown, stays
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <footer className="foot" ref={ref}>
      <div className="foot__sky" aria-hidden="true">
        {FLOCK.map((b) => (
          <span
            key={b.key}
            className={b.alt ? 'bird bird--alt' : 'bird'}
            style={
              {
                '--top': `${b.top.toFixed(1)}%`,
                '--size': `${b.size}px`,
                '--dur': `${b.dur}s`,
                '--delay': `${b.delay.toFixed(2)}s`,
                '--amp': `${b.amp}px`,
                '--bob': `${b.bob.toFixed(2)}s`,
                '--flap': `${b.flap.toFixed(2)}s`,
                '--o': b.o,
                '--x': `${b.x.toFixed(1)}vw`,
                '--ry': `${b.ry.toFixed(1)}px`,
              } as CSSProperties
            }
          >
            <span className="bird__bob">
              <svg viewBox="0 0 40 16">
                <path d={BIRD} />
              </svg>
            </span>
          </span>
        ))}
      </div>
      <div className="foot__brand">
        <Link className="foot__name" href="/">
          {signature(name)}
        </Link>
      </div>
    </footer>
  )
}
