'use client'

import { useEffect, useRef } from 'react'

import { makeNoise, prefersReducedMotion } from '@/lib/noise'

/**
 * Bundles of nested contour lines (like a topographic map) entering from the
 * screen edges. Each line follows a shared base shape (start → peak → end) plus
 * Perlin noise; neighbouring lines sample nearby noise, so they move almost
 * together while lines far apart drift independently.
 *
 * Colour follows what sits behind the line, not the line itself: ink red over the
 * pale mist, warming through sepia at the horizon, glowing cream over the dark
 * field. Each bundle is drawn on its own layer and faded toward its open end.
 */
type Bundle = {
  from: 'left' | 'right' // edge the lines draw in from
  x0: number // horizontal span, as a fraction of the hero width
  x1: number
  yStart: number // base curve heights, as fractions of the hero height
  yEnd: number
  hump: number // how far the peak rises above the start→end line
  peakAt: number // where along the span the peak sits (0..1)
  lines: number
  gap: number // vertical spacing between lines
  shift: number // horizontal nesting offset per line
  amp: number // noise wobble
  freq: number
  fade: number[] // opacity along x (left → right)
  seed: number
}

const DESKTOP: Bundle[] = [
  {
    from: 'left', x0: -0.02, x1: 0.34, yStart: 0.6, yEnd: 1.06, hump: 0.3, peakAt: 0.32,
    lines: 9, gap: 0.03, shift: 0.008, amp: 0.075, freq: 3.6, seed: 7,
    fade: [1, 1, 0.85, 0],
  },
  {
    from: 'right', x0: 0.74, x1: 1.02, yStart: 0.64, yEnd: 0.54, hump: 0.32, peakAt: 0.36,
    lines: 8, gap: 0.03, shift: -0.006, amp: 0.07, freq: 3.4, seed: 53,
    fade: [0, 0.85, 1, 1],
  },
]

const MOBILE: Bundle[] = [
  { ...DESKTOP[0], x1: 0.62, yStart: 0.66, hump: 0.24, lines: 7, gap: 0.022 },
  { ...DESKTOP[1], x0: 0.48, yStart: 0.6, yEnd: 0.5, hump: 0.22, lines: 7, gap: 0.022 },
]

/** Where the field meets the mist in the hero photo, as a fraction of hero height. */
const HORIZON = 0.74
const INK = [
  [0, '#7a2b25'],
  [HORIZON - 0.1, '#8f3a2f'],
  [HORIZON - 0.03, '#b98466'],
  [HORIZON + 0.02, '#e8d6c0'],
  [1, '#f7efe4'],
] as const

const SPEED = 0.0035 // noise time per frame (~30fps)
const INTRO_DELAY = 500 // ms
const INTRO_DURATION = 2600 // ms

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

export function ContourLines() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const noise = makeNoise()
    const reduce = prefersReducedMotion()
    let bundles = DESKTOP
    let layers: { c: HTMLCanvasElement; x: CanvasRenderingContext2D; ink: CanvasGradient; fade: CanvasGradient }[] = []
    let w = 0
    let h = 0
    let t = Math.random() * 500
    let raf = 0
    let last = 0
    let visible = true
    let start = 0
    // pointer in canvas px; far away when absent
    let px = -9999
    let py = -9999
    let mx = -9999
    let my = -9999

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      bundles = w < 700 ? MOBILE : DESKTOP
      layers = bundles.map((b) => {
        const c = document.createElement('canvas')
        c.width = canvas.width
        c.height = canvas.height
        const x = c.getContext('2d')!
        x.setTransform(dpr, 0, 0, dpr, 0, 0)
        const ink = x.createLinearGradient(0, 0, 0, h)
        INK.forEach(([stop, color]) => ink.addColorStop(stop, color))
        const fade = x.createLinearGradient(b.x0 * w, 0, b.x1 * w, 0)
        b.fade.forEach((a, i) => fade.addColorStop(i / (b.fade.length - 1), `rgba(0,0,0,${a})`))
        return { c, x, ink, fade }
      })
    }

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, w, h)
      // ease the pointer so lines glide rather than snap
      mx += (px - mx) * 0.08
      my += (py - my) * 0.08

      bundles.forEach((b, bi) => {
        const { c, x: lx, ink, fade } = layers[bi]
        lx.globalCompositeOperation = 'source-over'
        lx.clearRect(0, 0, w, h)
        lx.lineWidth = 1.25
        lx.lineJoin = 'round'
        lx.lineCap = 'round'
        lx.strokeStyle = ink

        const n = Math.max(80, Math.round(((b.x1 - b.x0) * w) / 4))
        const k = Math.log(0.5) / Math.log(b.peakAt) // skews the bump so its top lands at peakAt

        for (let j = 0; j < b.lines; j++) {
          // staggered draw-in from the bundle's edge
          const p = easeOut(clamp01(progress * 1.35 - j * 0.045))
          if (p <= 0) continue
          lx.beginPath()
          let started = false
          for (let i = 0; i <= n; i++) {
            const u = i / n
            const visibleU = b.from === 'left' ? u : 1 - u
            if (visibleU > p) continue
            const bump = Math.sin(Math.PI * Math.pow(u, k))
            const x = (b.x0 + (b.x1 - b.x0) * u + j * b.shift) * w
            // two noise octaves: broad sway + smaller ripples, phase-shifted per line
            const tt = t * SPEED + j * 0.17
            const wobble =
              (noise(u * b.freq + b.seed, tt) - 0.5) * 0.65 +
              (noise(u * b.freq * 2.6 + b.seed + 40, tt * 1.6) - 0.5) * 0.35
            let y =
              (b.yStart + (b.yEnd - b.yStart) * u - b.hump * bump + j * b.gap * (1 + 0.25 * Math.sin(j * 1.7)) +
                wobble * 2 * b.amp) *
              h
            // lines lean away from the pointer
            const dx = x - mx
            const dy = y - my
            const d2 = dx * dx + dy * dy
            if (d2 < 40000) y += (dy >= 0 ? 1 : -1) * 22 * Math.exp(-d2 / 9000)
            if (!started) {
              lx.moveTo(x, y)
              started = true
            } else lx.lineTo(x, y)
          }
          lx.globalAlpha = 0.95 - j * 0.04
          lx.stroke()
        }
        lx.globalAlpha = 1

        // soften the open end of the bundle
        lx.globalCompositeOperation = 'destination-in'
        lx.fillStyle = fade
        lx.fillRect(0, 0, w, h)

        ctx.drawImage(c, 0, 0, w, h)
      })
    }

    const loop = (now: number) => {
      if (!start) start = now
      if (visible && !document.hidden && now - last > 30) {
        const progress = clamp01((now - start - INTRO_DELAY) / INTRO_DURATION)
        draw(progress)
        t += 1
        last = now
      }
      raf = requestAnimationFrame(loop)
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      px = e.clientX - r.left
      py = e.clientY - r.top
    }
    const onLeave = () => {
      px = -9999
      py = -9999
    }

    resize()
    const onResize = () => {
      resize()
      if (reduce) draw(1)
    }
    window.addEventListener('resize', onResize)
    const host = canvas.parentElement
    host?.addEventListener('pointermove', onMove)
    host?.addEventListener('pointerleave', onLeave)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(canvas)

    if (reduce) draw(1)
    else raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      host?.removeEventListener('pointermove', onMove)
      host?.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} className="flow" aria-hidden="true" />
}
