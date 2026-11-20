export const HOME = { href: '/', label: 'Home' } as const

/** Main nav: CV · Explore · Contact (Home is added in front everywhere but the home page). */
export const NAV = [
  { href: '/cv', label: 'CV' },
  { href: '/explore', label: 'Explore' },
  { href: '/contact', label: 'Contact' },
] as const

/**
 * Sections of the Explore page (one page; each tab jumps to its section — ids in explore/page.tsx),
 * in the order of website.pdf. Bio, News, Talks and Blog are on the home page instead.
 */
export const WORK = [
  { href: '/explore#research', label: 'Research' },
  { href: '/explore#publications', label: 'Publications' },
  { href: '/explore#projects', label: 'Projects' },
  { href: '/explore#creative-practice', label: 'Creative practice' },
  { href: '/explore#training', label: 'Training' },
] as const

export const isActive = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

/** True on the Explore page. */
export const inWork = (pathname: string) => isActive('/explore', pathname)
