export const year = (iso?: string | null) => (iso ? new Date(iso).getFullYear() : '')

export const monthYear = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''

export const fullDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
