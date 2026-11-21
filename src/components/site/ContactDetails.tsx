'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Props = {
  email?: string | null
  links?: { label: string; url: string }[]
  cvUrl?: string | null
  location?: string | null
}

const Arrow = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 11l6-6M6 5h5v5" />
  </svg>
)

/** Her time zone, when the location says she is in Bangladesh. */
const zoneFor = (location?: string | null) => (location && /dhaka|bangladesh/i.test(location) ? 'Asia/Dhaka' : null)

/** "4:32 pm" in her time zone, ticking each minute. Rendered after mount so server and browser agree. */
function LocalTime({ zone }: { zone: string }) {
  const [now, setNow] = useState<string | null>(null)
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: zone })
    const tick = () => setNow(fmt.format(new Date()).replace(' ', ' '))
    tick()
    const id = window.setInterval(tick, 20_000)
    return () => window.clearInterval(id)
  }, [zone])
  if (!now) return null
  return <span className="reach__time mono">{now} there now</span>
}

/**
 * Contact block (home Contact section and the Contact page): slim rows — email with a copy button,
 * her profiles, the CV, and where she is with her local time.
 */
export function ContactDetails({ email, links = [], cvUrl, location }: Props) {
  const [copied, setCopied] = useState(false)
  const [canCopy, setCanCopy] = useState(false)
  useEffect(() => setCanCopy(!!navigator.clipboard), [])

  const copy = async () => {
    if (!email) return
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      /* clipboard blocked: the mailto link still works */
    }
  }

  const [local, domain] = email ? email.split('@') : []
  const zone = zoneFor(location)

  return (
    <dl className="reach" data-reveal>
      {email && (
        <div className="reach__row">
          <dt className="mono">Email</dt>
          <dd>
            <a className="reach__email" href={`mailto:${email}`}>
              {local}
              <wbr />@{domain}
            </a>
            {canCopy && (
              <button type="button" className="reach__copy" onClick={copy} aria-label={`Copy ${email}`}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
                  {copied ? <path d="M3 8.5l3 3 7-7" strokeLinecap="round" /> : <><rect x="5" y="5" width="8" height="8" rx="1" /><path d="M3 10.5V4a1 1 0 0 1 1-1h6.5" /></>}
                </svg>
                <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </dd>
        </div>
      )}
      {links.length > 0 && (
        <div className="reach__row">
          <dt className="mono">Elsewhere</dt>
          <dd className="reach__links">
            {links.map((l) => (
              <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label}
                <Arrow />
              </a>
            ))}
          </dd>
        </div>
      )}
      {cvUrl && (
        <div className="reach__row">
          <dt className="mono">CV</dt>
          <dd className="reach__links">
            <Link href="/cv">
              Read the CV
              <Arrow />
            </Link>
            <a href={cvUrl} download>
              Download PDF
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 3v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10" />
              </svg>
            </a>
          </dd>
        </div>
      )}
      {location && (
        <div className="reach__row">
          <dt className="mono">Based in</dt>
          <dd>
            {location}
            {zone && <LocalTime zone={zone} />}
          </dd>
        </div>
      )}
    </dl>
  )
}
