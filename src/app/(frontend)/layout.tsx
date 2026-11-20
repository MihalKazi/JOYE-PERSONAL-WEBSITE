import type { Metadata, Viewport } from 'next'
import { Anek_Bangla, IBM_Plex_Mono, Tiro_Bangla } from 'next/font/google'
import React from 'react'

import { SiteShell } from '@/components/site/SiteShell'
import { Tabs } from '@/components/site/Tabs'
import { WaveFooter } from '@/components/WaveFooter'
import { getSettings } from '@/lib/payload'
import './styles.css'

// Both families are drawn for Bangla and Latin together, so Bangla titles sit in the same voice as the English.
// Tiro Bangla (calligraphic book serif) sets headings; Anek Bangla (variable sans) sets text and labels.
const display = Tiro_Bangla({
  subsets: ['latin', 'latin-ext', 'bengali'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})
const body = Anek_Bangla({ subsets: ['latin', 'latin-ext', 'bengali'], variable: '--font-body', display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })

// Phone browser bar takes the paper colour.
export const viewport: Viewport = { themeColor: '#f6f1e9' }

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  return {
    title: { default: s.name, template: `%s · ${s.name}` },
    description: `${s.name} — ${s.tagline ?? ''}`.trim(),
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Hide animated elements before first paint (motion users only), so they never flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion')",
          }}
        />
      </head>
      <body>
        <SiteShell>
          <Tabs name={settings.name} />
          {children}
          <WaveFooter name={settings.name} />
        </SiteShell>
      </body>
    </html>
  )
}
