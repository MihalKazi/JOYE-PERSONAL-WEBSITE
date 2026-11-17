'use client'

import { useRowLabel } from '@payloadcms/ui'

export const LinkRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ label?: string }>()
  return <span>{data?.label || `Link ${String((rowNumber ?? 0) + 1)}`}</span>
}
