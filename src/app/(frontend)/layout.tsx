import type { Metadata } from 'next'
import { Roboto, Roboto_Mono } from 'next/font/google'
import React from 'react'

import { SiteShell } from '@/components/site/SiteShell'
import { Tabs } from '@/components/site/Tabs'
import { WaveFooter } from '@/components/WaveFooter'
import { mediaUrl } from '@/lib/media'
import { getSettings } from '@/lib/payload'
import './styles.css'

const roboto = Roboto({ subsets: ['latin'], weight: ['300', '400', '500', '700', '900'], variable: '--font-roboto', display: 'swap' })
const mono = Roboto_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })

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
    <html lang="en" className={`${roboto.variable} ${mono.variable}`} suppressHydrationWarning>
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
          <Tabs />
          {children}
          <WaveFooter
            name={settings.name}
            email={settings.email}
            cvUrl={mediaUrl(settings.cv)}
            links={(settings.links ?? []).map((l) => ({ label: l.label, url: l.url }))}
          />
        </SiteShell>
      </body>
    </html>
  )
}
