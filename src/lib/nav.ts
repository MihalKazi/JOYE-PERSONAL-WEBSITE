export const HOME = { href: '/', label: 'Home' } as const

/** Main nav: CV · Explore · Creative practice · Contact (Home is added in front everywhere but the home page). */
export const NAV = [
  { href: '/cv', label: 'CV' },
  { href: '/explore', label: 'Explore' },
  { href: '/creative-practice', label: 'Creative practice' },
  { href: '/contact', label: 'Contact' },
] as const

/**
 * The Explore tab row: Explore's sections (each tab jumps to its section — ids in explore/page.tsx)
 * and the Creative practice page,
 * in the order of website.pdf. News, Talks and Blog are on the home page instead.
 */
export const WORK = [
  { href: '/explore#research', label: 'Research' },
  { href: '/explore#publications', label: 'Publications' },
  { href: '/explore#projects', label: 'Projects' },
  { href: '/creative-practice', label: 'Creative practice' }, // its own page: landscape photo + gallery
] as const

export const isActive = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

/** True on Explore and on Creative practice (they share the Explore tab row). */
export const inWork = (pathname: string) =>
  isActive('/explore', pathname) || isActive('/creative-practice', pathname)
