import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Table = ({ className, ...p }: ComponentProps<'table'>) => (
  <table className={cn('w-full border-collapse text-left text-sm', className)} {...p} />
)
export const Th = ({ className, ...p }: ComponentProps<'th'>) => (
  <th scope="col" className={cn('border-b border-border px-3 py-2 font-semibold text-muted-foreground', className)} {...p} />
)
export const Td = ({ className, ...p }: ComponentProps<'td'>) => (
  <td className={cn('border-b border-border px-3 py-2', className)} {...p} />
)
