'use client'

import { useEffect, useRef } from 'react'

import { makeNoise, prefersReducedMotion } from '@/lib/noise'

/**
 * A long ribbon of fine parallel lines flowing diagonally across the landing
 * page — in from the left edge, out at the bottom right — bowing gently so it
 * runs between the bio (top right) and the name (bottom left).
 * Noise makes it wave; its width is a signed noise value, so wherever it crosses
 * zero the ribbon twists over itself. A pale grey ribbon trails a moment behind.
 * Lines bend away from the pointer. Static frame for reduced motion.
 */
type Geometry = {
  // 'page': x, y are fractions of width, height.
  // 'width': x, y are fractions of the width, y measured from `top` px — for narrow
  //   screens, where the page is taller than the screen and text sits below a band.
  units: 'page' | 'width'
  top: number
  start: [number, number] // just off the top-left
  ctrl: [number, number] // the path bows toward this point (quadratic curve)
  end: [number, number] // just off the bottom-right
}

type Layer = {
  lines: number
  width: number // max half-width, fraction of the smaller side
  lag: number // noise-time offset: the shadow trails the main ribbon
  offset: number // sideways shift, fraction of the smaller side
  alpha: number
  lineWidth: number
  color: (ctx: CanvasRenderingContext2D, w: number, h: number) => CanvasGradient | string
}

// In from the left edge (below the tabs, above the name), bowing gently, out at the bottom right.
const DESKTOP: Geometry = { units: 'page', top: 0, start: [-0.04, 0.26], ctrl: [0.55, 0.21], end: [1.06, 0.92] }
// Narrow screens: fills the band between the tabs and the name (see .home under 1000px in styles.css).
const MOBILE: Geometry = { units: 'width', top: 40, start: [-0.04, 0.32], ctrl: [0.5, 0.34], end: [1.05, 0.7] }

/** Drawn in order: grey shadow under, red over. */
const LAYERS: Layer[] = [
  {
    lines: 26, width: 0.07, lag: 0.55, offset: 0.065, alpha: 0.45, lineWidth: 0.9,
    color: () => '#cfcac5',
  },
  {
    lines: 52, width: 0.08, lag: 0, offset: 0, alpha: 0.45, lineWidth: 1,
    color: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#c9a98a')
      g.addColorStop(0.3, '#a23a3a')
      g.addColorStop(0.7, '#7d2a2a')
      g.addColorStop(1, '#c47a6a')
      return g
    },
  },
]

const SPEED = 0.0028 // noise time per frame (~30fps)
const INTRO_DELAY = 300 // ms
const INTRO_DURATION = 2400 // ms

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))

export function Ribbon() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const noise = makeNoise()
    const reduce = prefersReducedMotion()
    let w = 0
    let h = 0
    let side = 0
    let mobile = false
    let strokes: (CanvasGradient | string)[] = []
    let t = Math.random() * 100
    let raf = 0
    let last = 0
    let start = 0
    let visible = true
    // pointer, eased; far away when absent
    let px = -9999
    let py = -9999
    let mx = -9999
    let my = -9999

    // The path's centre line (fixed per size) and per-frame buffers.
    let n = 0
    let bx = new Float32Array(0) // base path
    let by = new Float32Array(0)
    let bnx = new Float32Array(0) // base normals
    let bny = new Float32Array(0)
    let sx = new Float32Array(0) // spine after sway
    let sy = new Float32Array(0)
    let nx = new Float32Array(0)
    let ny = new Float32Array(0)
    let sw = new Float32Array(0) // signed width

    const normals = (xs: Float32Array, ys: Float32Array, ox: Float32Array, oy: Float32Array) => {
      for (let i = 0; i <= n; i++) {
        const a = Math.max(0, i - 1)
        const b = Math.min(n, i + 1)
        const dx = xs[b] - xs[a]
        const dy = ys[b] - ys[a]
        const len = Math.hypot(dx, dy) || 1
        ox[i] = -dy / len
        oy[i] = dx / len
      }
    }

    /** Sample the corner-to-corner curve evenly by length. */
    const layout = () => {
      const G = mobile ? MOBILE : DESKTOP
      const yu = G.units === 'width' ? w : h
      const S = [G.start[0] * w, G.top + G.start[1] * yu]
      const C = [G.ctrl[0] * w, G.top + G.ctrl[1] * yu]
      const E = [G.end[0] * w, G.top + G.end[1] * yu]
      const qx = (u: number) => (1 - u) * (1 - u) * S[0] + 2 * (1 - u) * u * C[0] + u * u * E[0]
      const qy = (u: number) => (1 - u) * (1 - u) * S[1] + 2 * (1 - u) * u * C[1] + u * u * E[1]
      const M = 400
      const lut = new Float32Array(M + 1)
      for (let k = 1; k <= M; k++) {
        lut[k] = lut[k - 1] + Math.hypot(qx(k / M) - qx((k - 1) / M), qy(k / M) - qy((k - 1) / M))
      }
      const total = lut[M]
      n = Math.max(160, Math.round(total / 5))
      bx = new Float32Array(n + 1)
      by = new Float32Array(n + 1)
      bnx = new Float32Array(n + 1)
      bny = new Float32Array(n + 1)
      sx = new Float32Array(n + 1)
      sy = new Float32Array(n + 1)
      nx = new Float32Array(n + 1)
      ny = new Float32Array(n + 1)
      sw = new Float32Array(n + 1)
      let k = 1
      for (let i = 0; i <= n; i++) {
        const s = (i / n) * total
        while (k < M && lut[k] < s) k++
        const u = (k - 1 + (s - lut[k - 1]) / (lut[k] - lut[k - 1] || 1)) / M
        bx[i] = qx(u)
        by[i] = qy(u)
      }
      normals(bx, by, bnx, bny)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      mobile = w < 1000 // matches the stacked home layout in styles.css
      // ribbon thickness and sway scale with `side`; capped on narrow layouts so tablets keep it in its band
      side = mobile ? Math.min(w, 520) : Math.min(w, h)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      layout()
      strokes = LAYERS.map((l) => l.color(ctx, w, h))
    }

    /** Wave the centre line with noise and set the signed width, at time `tt`. */
    const build = (tt: number, offset: number) => {
      for (let i = 0; i <= n; i++) {
        const u = i / n
        // a broad swell, a mid wave and a light ripple — wavy, but with room between the waves
        const sway =
          (noise(u * 1.8 + 3, tt) - 0.5) * 0.11 +
          (noise(u * 5 + 17, tt * 1.7) - 0.5) * 0.04 +
          (noise(u * 12 + 29, tt * 2.4) - 0.5) * 0.01
        const k = (sway + offset) * side
        sx[i] = bx[i] + bnx[i] * k
        sy[i] = by[i] + bny[i] * k
        // crossing zero = a twist; a few across the page, not crowded
        const raw = (noise(u * 3 + 61, tt * 0.9) - 0.5) * 4
        sw[i] = clamp(raw, -1, 1)
      }
      normals(sx, sy, nx, ny)
    }

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, w, h)
      mx += (px - mx) * 0.08
      my += (py - my) * 0.08
      const reach = side * (mobile ? 0.18 : 0.14)
      const reach2 = reach * reach
      const push = reach * 0.45
      const end = Math.floor(n * progress)
      if (end < 1) return

      LAYERS.forEach((L, li) => {
        build(t * SPEED - L.lag, L.offset)
        const half = L.width * side
        const lines = mobile ? Math.round(L.lines * 0.75) : L.lines
        ctx.beginPath()
        for (let j = 0; j < lines; j++) {
          const v = j / (lines - 1) - 0.5
          for (let i = 0; i <= end; i++) {
            const off = sw[i] * half * 2 * v
            let x = sx[i] + nx[i] * off
            let y = sy[i] + ny[i] * off
            // bend away from the pointer
            const dx = x - mx
            const dy = y - my
            const d2 = dx * dx + dy * dy
            if (d2 < reach2 * 4) {
              const f = Math.exp(-d2 / reach2) * push
              const d = Math.sqrt(d2) || 1
              x += (dx / d) * f * 0.6
              y += (dy / d) * f * 0.6
            }
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
        }
        ctx.globalAlpha = L.alpha
        ctx.lineWidth = L.lineWidth
        ctx.strokeStyle = strokes[li]
        ctx.stroke()
      })
      ctx.globalAlpha = 1
    }

    const loop = (now: number) => {
      if (!start) start = now
      if (visible && !document.hidden && now - last > 30) {
        draw(easeInOut(clamp((now - start - INTRO_DELAY) / INTRO_DURATION)))
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
    const ro = new ResizeObserver(() => {
      resize()
      if (reduce) draw(1)
    })
    ro.observe(canvas)
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
      ro.disconnect()
      io.disconnect()
      host?.removeEventListener('pointermove', onMove)
      host?.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} className="ribbon" aria-hidden="true" />
}
