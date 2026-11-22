export const HOME = { href: '/', label: 'Home' } as const

/** Main nav: CV · Project · Creative portfolio · Blog (Home is added in front everywhere but the home page). */
export const NAV = [
  { href: '/cv', label: 'CV' },
  { href: '/explore', label: 'Project' },
  { href: '/creative-portfolio', label: 'Creative portfolio' },
  { href: '/blog', label: 'Blog' },
] as const

/**
 * The Explore tab row: Explore's sections (each tab jumps to its section — ids in explore/page.tsx)
 * and the Creative portfolio page,
 * in the order of website.pdf. News, Talks and Blog are on the home page instead.
 */
export const WORK = [
  { href: '/explore#research', label: 'Research' },
  { href: '/explore#publications', label: 'Publications' },
  { href: '/explore#projects', label: 'Projects' },
  { href: '/creative-portfolio', label: 'Creative portfolio' }, // its own page: landscape photo + gallery
] as const

export const isActive = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

/** True on Project (/explore) and on Creative portfolio (they share the Explore tab row). */
export const inWork = (pathname: string) =>
  isActive('/explore', pathname) || isActive('/creative-portfolio', pathname)
