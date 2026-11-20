'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

import { prefersReducedMotion } from '@/lib/noise'

/**
 * An image whose lines are brushed aside by the pointer, like the lines of the old home ribbon
 * moving out of its way: as the pointer travels over the drawing, the lines near it are dragged
 * along in its direction, then spring back into place once it slows or stops. Nothing changes
 * under a resting pointer and the rest of the drawing stays still.
 * WebGL draws the image; the plain <img> underneath is used for layout, before the canvas is
 * ready, without WebGL and for reduced motion.
 */
const RADIUS = 60 // px, reach of the brush round the pointer
const GAIN = 0.55 // how much of each pointer move the lines follow
const MAX_DRAG = 26 // px, the furthest the lines are dragged
const SPRING = 0.9 // per frame, how much of the drag remains (lower = lines snap back faster)

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_res;    // canvas size, css px
uniform vec2 u_mouse;  // pointer, css px, top left origin (eased)
uniform vec2 u_drag;   // px, how far the lines by the pointer are dragged, and which way
varying vec2 v_uv;
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y) * u_res;
  vec2 dir = p - u_mouse;
  float fall = exp(-dot(dir, dir) / (${RADIUS.toFixed(1)} * ${RADIUS.toFixed(1)})); // soft, no edge
  // show what sat a little behind this pixel, so the lines appear carried along with the pointer
  gl_FragColor = texture2D(u_tex, (p - u_drag * fall) / u_res);
}`

type Props = { src: string; alt: string; width?: number | null; height?: number | null; className?: string }

export function RippleImage({ src, alt, width, height, className }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = wrap.current
    const base = img.current
    const cv = canvas.current
    if (!host || !base || !cv || prefersReducedMotion()) return
    const gl = cv.getContext('webgl', { premultipliedAlpha: false, alpha: true })
    if (!gl || gl.isContextLost()) return
    // If the GPU drops the context, fall back to the plain image underneath.
    const onLost = () => host.classList.remove('is-live')
    cv.addEventListener('webglcontextlost', onLost)

    const compile = (type: number, source: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, source)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')
    const uDrag = gl.getUniformLocation(prog, 'u_drag')

    let w = 0
    let h = 0
    let raf = 0
    let ready = false
    let tx = 0 // pointer
    let ty = 0
    let mx = 0 // eased pointer (centre of the brush)
    let my = 0
    let vx = 0 // drag
    let vy = 0
    let fresh = true // next move is the first after entering: don't count the jump in

    const draw = () => {
      gl.viewport(0, 0, cv.width, cv.height)
      gl.clearColor(1, 1, 1, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(uRes, w, h)
      gl.uniform2f(uMouse, mx, my)
      gl.uniform2f(uDrag, vx, vy)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    // Animate while the lines are still dragged; idle on one still frame otherwise.
    const loop = () => {
      mx += (tx - mx) * 0.25
      my += (ty - my) * 0.25
      vx *= SPRING
      vy *= SPRING
      const settled = Math.hypot(vx, vy) < 0.05
      if (settled) vx = vy = 0
      draw()
      raf = settled ? 0 : requestAnimationFrame(loop)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop)
    }

    const resize = () => {
      const r = base.getBoundingClientRect()
      w = r.width
      h = r.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.max(1, Math.round(w * dpr))
      cv.height = Math.max(1, Math.round(h * dpr))
      if (ready) draw()
    }

    const onMove = (e: PointerEvent) => {
      if (!ready) return
      const r = cv.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (fresh) {
        mx = x
        my = y
        fresh = false
      } else {
        vx += (x - tx) * GAIN
        vy += (y - ty) * GAIN
        const len = Math.hypot(vx, vy)
        if (len > MAX_DRAG) {
          vx *= MAX_DRAG / len
          vy *= MAX_DRAG / len
        }
      }
      tx = x
      ty = y
      kick()
    }
    const onLeave = () => {
      fresh = true
    }

    // Load the texture from its own Image so a decode problem never affects the visible <img>.
    let disposed = false
    let texture: WebGLTexture | null = null
    const tex = new Image()
    tex.crossOrigin = 'anonymous'
    tex.onload = () => {
      if (disposed || gl.isContextLost()) return
      try {
        texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      } catch {
        return // e.g. a cross-origin image without CORS: keep the plain <img>
      }
      ready = true
      resize()
      host.classList.add('is-live')
    }
    tex.src = base.currentSrc || base.src

    const ro = new ResizeObserver(resize)
    ro.observe(base)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)

    // Free what this run made, but keep the context itself: the canvas element (and its one
    // context) is reused if the effect runs again, e.g. React's double run in development.
    return () => {
      disposed = true
      tex.onload = null
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      cv.removeEventListener('webglcontextlost', onLost)
      host.classList.remove('is-live')
      gl.deleteTexture(texture)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    }
  }, [src])

  return (
    <div
      ref={wrap}
      className={`ripple${className ? ` ${className}` : ''}`}
      style={width && height ? ({ '--ar': width / height } as CSSProperties) : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={src} alt={alt} width={width ?? undefined} height={height ?? undefined} />
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  )
}
