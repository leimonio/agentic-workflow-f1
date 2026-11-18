// The item's own checkout. dispatch builds and babysit fixes there, so your branch and working tree never move.
import { execFileSync } from 'node:child_process'
import { existsSync, symlinkSync } from 'node:fs'
import path from 'node:path'

const git = (root: string, ...a: string[]) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim()

export const worktreeDir = (id: string, root = process.cwd()) => path.join(root, '.agent', 'worktrees', id)

/** Uncommitted changes left in the item's worktree, e.g. by an escalated build. Empty when clean or absent. */
export const worktreeChanges = (id: string, root = process.cwd()) => {
  const dir = worktreeDir(id, root)
  return existsSync(dir) ? git(dir, 'status', '--porcelain') : ''
}

/** A fresh worktree at `start`: on `branch` (created or reset), or detached without it. Replaces an old one. */
export function openWorktree(id: string, start: string, branch?: string, root = process.cwd()): string {
  const dir = worktreeDir(id, root)
  removeWorktree(id, root)
  git(root, 'worktree', 'prune') // a .agent folder deleted by hand leaves a stale registration
  git(root, 'worktree', 'add', '-q', ...(branch ? ['-B', branch] : ['--detach']), dir, start)
  symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'))
  return dir
}

export function removeWorktree(id: string, root = process.cwd()) {
  const dir = worktreeDir(id, root)
  if (existsSync(dir)) git(root, 'worktree', 'remove', '--force', dir)
}
