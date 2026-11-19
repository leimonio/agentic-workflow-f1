import { describe, expect, it } from 'vitest'
import { repoSlug } from './github.ts'

describe('repoSlug', () => {
  it('reads owner/name from https and ssh remotes', () => {
    expect(repoSlug('https://github.com/me/f1.git\n')).toBe('me/f1')
    expect(repoSlug('https://github.com/me/f1')).toBe('me/f1')
    expect(repoSlug('git@github.com:me/f1.git')).toBe('me/f1')
    expect(repoSlug('ssh://git@github.com/me/f1.git')).toBe('me/f1')
  })

  it('ignores remotes that are not GitHub', () => expect(repoSlug('https://gitlab.com/me/f1.git')).toBeUndefined())
})
