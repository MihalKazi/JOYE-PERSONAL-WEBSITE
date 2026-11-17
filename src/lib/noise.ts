/** Classic 2D Perlin noise, returns 0..1. Each call to makeNoise() gets its own random permutation. */
export function makeNoise() {
  const P = new Uint8Array(512)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255]

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const grad = (h: number, x: number, y: number) => (h & 1 ? -x : x) + (h & 2 ? -y : y)

  return (x: number, y: number) => {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = fade(x)
    const v = fade(y)
    const a = P[X] + Y
    const b = P[X + 1] + Y
    return (
      (lerp(
        lerp(grad(P[a], x, y), grad(P[b], x - 1, y), u),
        lerp(grad(P[a + 1], x, y - 1), grad(P[b + 1], x - 1, y - 1), u),
        v,
      ) +
        1) /
      2
    )
  }
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
