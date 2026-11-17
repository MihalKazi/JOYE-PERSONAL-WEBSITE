'use client'

import { useEffect, useRef } from 'react'

import { makeNoise } from '@/lib/noise'

/** The fog texture is expensive to build (~650k noise samples + PNG encode), so it is made once per visit. */
let fogUrl: string | null = null
let pending: Promise<string | null> | null = null

function buildFog(): string | null {
  const W = 512
  const H = 160
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')
  if (!x) return null
  const noise = makeNoise()
  const img = x.createImageData(W, H)
  const fbm = (px: number, py: number) => {
    let v = 0
    let amp = 0.55
    let f = 1
    for (let o = 0; o < 4; o++) {
      v += noise(px * f, py * f) * amp
      amp *= 0.5
      f *= 2
    }
    return v
  }
  const scale = 1 / 110
  for (let py = 0; py < H; py++) {
    // fade top and bottom of the band so it has no hard edge
    const band = Math.sin((py / H) * Math.PI)
    for (let px = 0; px < W; px++) {
      // blend with a copy one tile-width away → seamless horizontal wrap
      const tx = px / W
      const v = fbm(px * scale, py * scale * 1.8) * (1 - tx) + fbm((px - W) * scale, py * scale * 1.8) * tx
      const a = Math.max(0, (v - 0.42) * 2.4) * band
      const i = (py * W + px) * 4
      img.data[i] = 244
      img.data[i + 1] = 243
      img.data[i + 2] = 240
      img.data[i + 3] = Math.min(255, a * 255)
    }
  }
  x.putImageData(img, 0, 0)
  return c.toDataURL('image/png')
}

const idle = (fn: () => void) => {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 2000 })
  else setTimeout(fn, 200)
}

/** Build the fog texture in idle time (call early, e.g. from the About page) so the landscape page opens without a hitch. */
export function prewarmMist(): Promise<string | null> {
  if (fogUrl) return Promise.resolve(fogUrl)
  pending ??= new Promise((resolve) =>
    idle(() => {
      fogUrl = buildFog()
      resolve(fogUrl)
    }),
  )
  return pending
}

/**
 * Two slow bands of fog drifting along the horizon. The fog texture is generated
 * once on the client (fractal noise, seamless left↔right) and handed to CSS;
 * the drift itself is a transform-only CSS animation, so it costs nothing per frame.
 */
export function Mist() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    const apply = (url: string | null) => {
      const el = ref.current
      if (!alive || !el || !url) return
      el.style.setProperty('--fog', `url(${url})`)
      el.classList.add('is-ready')
    }
    if (fogUrl) apply(fogUrl)
    else prewarmMist().then(apply)
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="mist" ref={ref} aria-hidden="true">
      <div className="mist__layer mist__layer--far" />
      <div className="mist__layer mist__layer--near" />
    </div>
  )
}
