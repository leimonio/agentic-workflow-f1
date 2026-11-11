import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Badge = ({ className, ...p }: ComponentProps<'span'>) => (
  <span className={cn('inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium', className)} {...p} />
)
