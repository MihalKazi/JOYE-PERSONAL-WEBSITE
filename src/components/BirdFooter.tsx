'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'

/** One bird in silhouette: full wings raised in a soft “m”, the body dipping at the centre. */
const BIRD = 'M0 6C6 1 13 1 20 8 27 1 34 1 40 6 34 4.6 28 6 21.4 13.6L20 15.4l-1.4-1.8C12 6 6 4.6 0 6Z'

/**
 * The flock, spread evenly around the loop so birds keep arriving without gaps: each starts a different
 * fraction of the way across (negative delay), so at any moment some are entering, crossing and leaving.
 * Bigger birds are darker and a little faster, so they read as nearer. Seeded, so server and browser agree.
 */
const COUNT = 14
const FLOCK = (() => {
  let s = 11
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
  return Array.from({ length: COUNT }, (_, i) => {
    const near = rand() // 0 far … 1 near
    const dur = 40 - near * 12 // 28–40s to cross
    return {
      top: 6 + rand() * 76,
      size: Math.round(18 + near * 28), // 18–46px wingspan
      dur,
      delay: -dur * ((i + rand() * 0.6) / COUNT),
      flap: 0.3 + near * 0.18,
      o: 0.42 + near * 0.52,
      x: ((i + 0.5) / COUNT) * 100, // resting place when motion is reduced
    }
  })
})()

/**
 * A treeline on the horizon, as in her landscape photo. Each tree is a crown of a few overlapping lumps
 * (so it reads as foliage, not a dome); trees stand in loose clumps along a low ground line with gaps of
 * open field. The outline is the highest lump over each point, sampled every few units and closed down to
 * the bottom. Seeded, so server and browser agree.
 */
type Lump = { cx: number; cy: number; r: number }
const W = 1600
const H = 80

function crown(rand: () => number, cx: number, ground: number, w: number, h: number, n: number): Lump[] {
  const lumps: Lump[] = []
  for (let k = 0; k < n; k++) {
    const t = n === 1 ? 0.5 : k / (n - 1) // across the crown
    const r = w * (0.22 + rand() * 0.16)
    const lift = Math.sin(t * Math.PI) * 0.35 + 0.65 // the middle stands taller
    lumps.push({ cx: cx - w / 2 + t * w + (rand() - 0.5) * r * 0.6, cy: ground - h * lift + r * 0.55, r })
  }
  return lumps
}

function outline(lumps: Lump[], ground: number) {
  let d = `M0 ${H}`
  for (let x = 0; x <= W; x += 3) {
    let y = ground + Math.sin(x / 140) * 1.2
    for (const l of lumps) {
      const dx = x - l.cx
      if (Math.abs(dx) < l.r) y = Math.min(y, l.cy - Math.sqrt(l.r * l.r - dx * dx))
    }
    d += ` L${x} ${y.toFixed(1)}`
  }
  return `${d} L${W} ${H}Z`
}

function treeline(seed: number, ground: number, size: [number, number], gapChance: number) {
  let s = seed
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
  const lumps: Lump[] = []
  for (let x = -30; x < W + 30; ) {
    const w = size[0] + rand() * (size[1] - size[0])
    lumps.push(...crown(rand, x + w / 2, ground, w, w * (0.45 + rand() * 0.4), 3 + Math.floor(rand() * 3)))
    x += w * (0.7 + rand() * 0.4) + (rand() < gapChance ? 40 + rand() * 180 : 0)
  }
  return outline(lumps, ground)
}

/** The lone tree from the photo: a wide umbrella crown (overlapping circles) on a short, visible trunk. */
function loneTree(cx: number, ground: number) {
  let s = 42
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
  const lumps = crown(rand, cx, ground - 30, 50, 8, 7)
  const crownBottom = Math.max(...lumps.map((l) => l.cy)) - 1
  const trunk = `M${cx - 1.8} ${ground} L${cx - 1} ${crownBottom} L${cx + 1.2} ${crownBottom} L${cx + 2} ${ground}Z`
  return { lumps, trunk }
}

const FAR = treeline(5, 70, [7, 16], 0.2)
const NEAR = treeline(19, 74, [10, 24], 0.45)
const LONE = loneTree(980, 75)

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

/** Footer: shadow birds drift over a misty horizon, around her name. They only fly while in view. */
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
        {FLOCK.map((b, i) => (
          <span
            key={i}
            className="bird"
            style={
              {
                '--top': `${b.top.toFixed(1)}%`,
                '--size': `${b.size}px`,
                '--dur': `${b.dur.toFixed(2)}s`,
                '--delay': `${b.delay.toFixed(2)}s`,
                '--flap': `${b.flap.toFixed(2)}s`,
                '--o': b.o.toFixed(2),
                '--x': `${b.x.toFixed(1)}vw`,
              } as CSSProperties
            }
          >
            <svg viewBox="0 0 40 16">
              <path d={BIRD} />
            </svg>
          </span>
        ))}
      </div>
      <div className="foot__horizon" aria-hidden="true">
        <svg viewBox="0 0 1600 80" preserveAspectRatio="xMidYMax slice">
          <path className="foot__trees foot__trees--far" d={FAR} />
          <path className="foot__trees" d={NEAR} />
          <g className="foot__trees foot__trees--lone">
            <path d={LONE.trunk} />
            {LONE.lumps.map((l, i) => (
              <circle key={i} cx={l.cx.toFixed(1)} cy={l.cy.toFixed(1)} r={l.r.toFixed(1)} />
            ))}
          </g>
        </svg>
        <div className="foot__haze" />
      </div>
      <div className="foot__brand">
        <Link className="foot__name" href="/">
          {signature(name)}
        </Link>
      </div>
    </footer>
  )
}
