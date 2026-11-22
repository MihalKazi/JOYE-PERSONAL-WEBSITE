import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  // About, News, Talks and the blog list are sections of the home page now; the work sections are
  // sections of Explore.
  async redirects() {
    return [
      { source: '/about', destination: '/', permanent: false },
      { source: '/news', destination: '/#news', permanent: false },
      { source: '/talks', destination: '/#talks', permanent: false },
      // The work sections are one page now: Explore.
      { source: '/research', destination: '/explore#research', permanent: false },
      { source: '/publications', destination: '/explore#publications', permanent: false },
      { source: '/projects', destination: '/explore#projects', permanent: false },
      { source: '/creative-practice', destination: '/creative-portfolio', permanent: true },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
