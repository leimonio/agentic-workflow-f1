import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Card = ({ className, ...p }: ComponentProps<'div'>) => (
  <div className={cn('rounded-lg border border-border bg-card p-6 shadow-sm', className)} {...p} />
)
export const CardTitle = ({ className, ...p }: ComponentProps<'h2'>) => (
  <h2 className={cn('text-lg font-semibold', className)} {...p} />
)
