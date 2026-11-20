/** Main nav (top row on every page). */
export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore my works' },
  { href: '/cv', label: 'CV' },
  { href: '/contact', label: 'Contact' },
] as const

/** Pages reached from the home page (not listed in Explore my works); the Home tab stays lit on them. */
export const HOME_PAGES = ['/about']

/**
 * Sections inside "Explore my works", in the order of website.pdf, minus what the home page
 * already carries (About me). Shown as a second row on /explore and on these pages.
 */
export const WORK = [
  { href: '/research', label: 'Research' },
  { href: '/publications', label: 'Publications' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/news', label: 'News' },
  { href: '/talks', label: 'Talks' },
  { href: '/creative-practice', label: 'Creative practice' },
  { href: '/training', label: 'Training' },
] as const

/** Pages drawn on a photo or dark ground (tabs drop their hairline ring there). */
export const DARK_PAGES = ['/explore', '/creative-practice']

export const isActive = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

/** True on the landscape page and on every section inside it. */
export const inWork = (pathname: string) => isActive('/explore', pathname) || WORK.some((w) => isActive(w.href, pathname))
