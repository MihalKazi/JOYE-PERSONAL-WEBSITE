/** Site pages, in the order of website.pdf. About me is the home page. */
export const NAV = [
  { href: '/', label: 'About me' },
  { href: '/research', label: 'Research' },
  { href: '/publications', label: 'Publications' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/news', label: 'News' },
  { href: '/talks', label: 'Talks' },
  { href: '/creative-practice', label: 'Creative practice' },
  { href: '/cv', label: 'CV' },
  { href: '/training', label: 'Training' },
  { href: '/contact', label: 'Contact' },
] as const

/** Pages drawn on a photo or dark ground (tabs drop their hairline ring there). */
export const DARK_PAGES = ['/explore', '/creative-practice']

/** Pages without the tab row: About me opens on its own, with the Explore button as the way in. */
export const NO_TABS = ['/']

export const isActive = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
