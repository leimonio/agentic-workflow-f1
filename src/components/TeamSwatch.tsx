import { constructorById } from '@/data/season'

// Team colour dot plus name. Colours only, no logos.
export function TeamSwatch({ constructorId }: { constructorId: string }) {
  const c = constructorById(constructorId)
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="size-3 rounded-full" style={{ background: c?.color ?? '#888' }} />
      {c?.name ?? constructorId}
    </span>
  )
}
