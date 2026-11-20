import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

/**
 * One motion language for the whole site. Call inside a gsap.context so everything
 * (tweens, ScrollTriggers, SplitText) is reverted when the page changes.
 *
 * - [data-split]          words rise out of line masks (headlines)
 * - [data-split="lines"]  lines rise out of masks (paragraphs, intros)
 * - [data-reveal]         soft lift + fade (labels, blocks, buttons)
 * - .rows                 hairline draws across, then each .row lifts in
 * - .project              image wipes up and settles, copy follows
 *
 * What is on screen at load plays as one sequence in reading order;
 * everything below the fold plays as it scrolls in.
 */
export function choreograph(opts: { heroIntro: boolean; viaVeil: boolean }) {
  gsap.registerPlugin(ScrollTrigger, SplitText)

  const EASE = 'expo.out'
  let k = 0 // position in the first-screen sequence
  const inView = (el: Element) => el.getBoundingClientRect().top < innerHeight * 0.94
  const seqDelay = () => 0.12 + Math.min(k++, 9) * 0.09

  /** Run `make(delay)` now if visible, otherwise when scrolled into view. */
  const play = (el: Element, make: (delay: number) => gsap.core.Animation) => {
    if (inView(el)) make(seqDelay())
    else ScrollTrigger.create({ trigger: el, start: 'top 97%', once: true, onEnter: () => make(0) })
  }

  // Landscape page intro: photo settles, name surfaces from blur.
  if (opts.heroIntro) {
    const tl = gsap.timeline({ defaults: { ease: EASE } })
    if (!opts.viaVeil) tl.from('.hero__img', { scale: 1.14, opacity: 0, duration: 2.6, ease: 'power2.out' })
    tl.from('.wordmark > *', { y: 14, opacity: 0, filter: 'blur(6px)', duration: 1.6, stagger: 0.15 }, opts.viaVeil ? 0.9 : 2.2)
    gsap.to('.hero__img', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    })
  }

  const targets = gsap.utils.toArray<HTMLElement>('[data-split], [data-reveal], .rows, .project')

  targets.forEach((el) => {
    // Headlines and paragraphs.
    if (el.hasAttribute('data-split')) {
      const lines = el.dataset.split === 'lines'
      const split = SplitText.create(el, {
        type: lines ? 'lines' : 'lines,words',
        mask: 'lines',
        linesClass: 'split-line',
      })
      gsap.set(el, { visibility: 'visible' })
      const parts = lines ? split.lines : split.words
      gsap.set(parts, { yPercent: 115 })
      play(el, (delay) =>
        gsap.to(parts, {
          yPercent: 0,
          duration: lines ? 1.15 : 1.3,
          ease: EASE,
          stagger: lines ? 0.07 : 0.06,
          delay,
        }),
      )
      return
    }

    // Lists: the top hairline draws, then rows lift in one after another.
    if (el.classList.contains('rows')) {
      const rows = gsap.utils.toArray<HTMLElement>(':scope > .row', el)
      gsap.set(el, { '--draw': 0 })
      gsap.set(rows, { autoAlpha: 0, y: 28 })
      play(el, (delay) =>
        gsap
          .timeline({ delay })
          .to(el, { '--draw': 1, duration: 1.2, ease: 'power3.inOut' })
          .to(rows.filter(inView), { autoAlpha: 1, y: 0, duration: 1, ease: EASE, stagger: 0.08 }, 0.35),
      )
      // Rows further down arrive as they scroll in, in small batches.
      ScrollTrigger.batch(rows.filter((r) => !inView(r)), {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, ease: EASE, stagger: 0.08, overwrite: true }),
      })
      return
    }

    // Project: image wipes up and settles, then the copy lifts in.
    if (el.classList.contains('project')) {
      const img = el.querySelector('.project__img')
      const copy = el.querySelector('.project__copy')
      if (img) gsap.set(img, { clipPath: 'inset(100% 0 0 0)' })
      if (copy) gsap.set(copy, { autoAlpha: 0, y: 30 })
      gsap.set(el, { visibility: 'visible' })
      play(el, (delay) => {
        const tl = gsap.timeline({ delay, defaults: { ease: EASE } })
        if (img) {
          tl.to(img, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'power4.inOut' })
          tl.fromTo(img.querySelector('img'), { scale: 1.25 }, { scale: 1, duration: 2 }, 0)
        }
        if (copy) tl.to(copy, { autoAlpha: 1, y: 0, duration: 1.1 }, img ? 0.5 : 0)
        return tl
      })
      return
    }

    // Everything else: soft lift.
    gsap.set(el, { autoAlpha: 0, y: 22 })
    play(el, (delay) => gsap.to(el, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, delay }))
  })

  // Home portrait: the drawing "draws" itself downward.
  if (document.querySelector('.intro__portrait .ripple')) {
    gsap.fromTo(
      '.intro__portrait .ripple',
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 2.4, ease: 'power2.inOut', delay: 0.3, clearProps: 'clipPath' },
    )
  }

  // Gallery.
  if (document.querySelector('.work__bg')) {
    gsap.to('.work__bg', {
      yPercent: 10,
      ease: 'none',
      scrollTrigger: { trigger: '.work', start: 'top bottom', end: 'bottom top', scrub: true },
    })
  }
  const grid = document.getElementById('grid')
  if (grid) {
    grid.classList.add('anim')
    gsap.from('.tile', {
      y: 70,
      opacity: 0,
      duration: 1.3,
      ease: EASE,
      stagger: 0.08,
      delay: 0.5,
      scrollTrigger: { trigger: grid, start: 'top 95%' },
      clearProps: 'transform,opacity',
      onComplete: () => grid.classList.remove('anim'),
    })
  }

  // Reading progress on long pages.
  if (document.querySelector('.page, .home, .explore-page')) {
    gsap.fromTo(
      '.progress',
      { scaleX: 0 },
      { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.4 } },
    )
  }
}

/** The current page lifts away before the next one loads. */
export function leavePage(onDone: () => void) {
  const main = document.querySelector('.site main')
  if (!main) return onDone()
  gsap.to(main, { autoAlpha: 0, y: -24, duration: 0.45, ease: 'power2.in', onComplete: onDone })
  gsap.to('.progress', { scaleX: 0, duration: 0.45, ease: 'power2.in' })
}
