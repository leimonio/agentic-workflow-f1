import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { openWorktree, removeWorktree, worktreeChanges } from './worktree.ts'

describe('item worktree', () => {
  it('opens on a branch without moving the main checkout, reports changes, reopens and removes', () => {
    const root = mkdtempSync(join(tmpdir(), 'wt-'))
    const git = (...a: string[]) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim()
    git('init', '-q', '-b', 'main')
    writeFileSync(join(root, '.gitignore'), 'node_modules\n.agent/\n')
    mkdirSync(join(root, 'node_modules'))
    git('add', '.')
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'init')

    const dir = openWorktree('t1', 'main', 'agent/t1', root)
    expect(git('branch', '--show-current')).toBe('main')
    expect(execFileSync('git', ['-C', dir, 'branch', '--show-current'], { encoding: 'utf8' }).trim()).toBe('agent/t1')
    expect(worktreeChanges('t1', root)).toBe('')
    writeFileSync(join(dir, 'new.ts'), 'x')
    expect(worktreeChanges('t1', root)).toContain('new.ts')

    openWorktree('t1', 'main', undefined, root)
    expect(worktreeChanges('t1', root)).toBe('')
    removeWorktree('t1', root)
    expect(existsSync(dir)).toBe(false)
    expect(worktreeChanges('t1', root)).toBe('')
  })
})
