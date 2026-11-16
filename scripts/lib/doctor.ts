// Pure checks: facts in, findings out. The I/O (running gh, reading files) lives in scripts/doctor.ts.
export interface Finding {
  id: string
  status: 'ok' | 'warn' | 'fail'
  message: string
  /** Shell command that fixes it. `doctor --fix` runs it. */
  fix?: string
}

export const REQUIRED_CHECK = 'gate'

type Tool = 'git' | 'gh' | 'claude'
const INSTALL: Record<Tool, Partial<Record<NodeJS.Platform, string>> & { other: string }> = {
  git: {
    darwin: 'Run: xcode-select --install (or brew install git)',
    linux: 'Run: sudo apt-get install -y git (Debian/Ubuntu), or your distro package manager',
    other: 'Install git: https://git-scm.com/downloads',
  },
  gh: {
    darwin: 'Run: brew install gh && gh auth login',
    linux: 'Install gh: https://github.com/cli/cli/blob/trunk/docs/install_linux.md, then: gh auth login',
    other: 'Install gh: https://cli.github.com, then: gh auth login',
  },
  claude: {
    darwin: 'Run: curl -fsSL https://claude.ai/install.sh | bash',
    linux: 'Run: curl -fsSL https://claude.ai/install.sh | bash',
    other: 'Install Claude Code: https://claude.com/claude-code',
  },
}

/** `installed` = the binary runs; `ready` = it is usable (only gh has a separate login step). */
export function toolFinding(tool: Tool, platform: NodeJS.Platform, installed: boolean, ready = installed): Finding {
  if (!installed) return { id: tool, status: 'fail', message: `${tool} is not installed`, fix: INSTALL[tool][platform] ?? INSTALL[tool].other }
  if (!ready) return { id: tool, status: 'fail', message: `${tool} is installed but not logged in`, fix: 'Run: gh auth login' }
  return { id: tool, status: 'ok', message: `${tool} found` }
}

// The scripts spawn npx, git and sh directly, which native Windows cannot run.
export function platformFinding(platform: NodeJS.Platform): Finding {
  return platform === 'win32'
    ? {
        id: 'os',
        status: 'fail',
        message: 'Native Windows is not supported: the scripts need a POSIX shell',
        fix: 'Run: wsl --install, then clone and work inside WSL (Ubuntu)',
      }
    : { id: 'os', status: 'ok', message: platform === 'darwin' ? 'macOS' : platform }
}

/** Linux needs system libraries for Chromium; installing them needs sudo, so doctor --fix never runs that part. */
export const playwrightFinding = (platform: NodeJS.Platform, launches: boolean): Finding =>
  launches
    ? { id: 'playwright', status: 'ok', message: 'Playwright Chromium installed' }
    : {
        id: 'playwright',
        status: 'fail',
        message: `Playwright Chromium missing or cannot start${platform === 'linux' ? ' (if it is installed, the system libraries are missing: sudo npx playwright install-deps chromium)' : ''}`,
        fix: 'npx playwright install chromium',
      }

export function nodeFinding(version: string, minMajor: number, pinnedMajor: number): Finding {
  const major = Number(version.replace(/^v/, '').split('.')[0])
  if (major < minMajor)
    return {
      id: 'node',
      status: 'fail',
      message: `Node ${version} is too old (need >= ${minMajor}). Run: nvm install ${pinnedMajor} && nvm use (no nvm? https://github.com/nvm-sh/nvm#install--update-script)`,
    }
  if (major !== pinnedMajor) return { id: 'node', status: 'warn', message: `Node ${version} works, the repo pins ${pinnedMajor} (.nvmrc). Run: nvm use` }
  return { id: 'node', status: 'ok', message: `Node ${version}` }
}

export interface RepoFacts {
  slug: string
  allowAutoMerge: boolean
  actionsEnabled: boolean
  /** null = no protection on the default branch */
  requiredChecks: string[] | null
  branch: string
  isPrivate: boolean
}

const PROTECTION = (checks: string[]) =>
  JSON.stringify({
    required_status_checks: { strict: false, contexts: checks },
    enforce_admins: false,
    required_pull_request_reviews: null,
    restrictions: null,
  })

// GitHub Free ignores allow_auto_merge and refuses branch protection on private repos (seen 2026-11-11: PATCH exits 0, nothing changes).
const PRIVATE_HINT = ' (private repo: on GitHub Free this needs the repo to be public, or GitHub Pro)'

export function repoFindings(f: RepoFacts): Finding[] {
  const api = `gh api -X`
  const hint = f.isPrivate ? PRIVATE_HINT : ''
  return [
    f.actionsEnabled
      ? { id: 'actions', status: 'ok', message: 'GitHub Actions enabled' }
      : { id: 'actions', status: 'fail', message: 'GitHub Actions is disabled', fix: `${api} PUT repos/${f.slug}/actions/permissions -F enabled=true` },
    f.allowAutoMerge
      ? { id: 'auto-merge', status: 'ok', message: 'auto-merge allowed' }
      : {
          id: 'auto-merge',
          status: 'fail',
          message: `auto-merge is not allowed (templates do not copy it)${hint}`,
          fix: `${api} PATCH repos/${f.slug} -F allow_auto_merge=true`,
        },
    f.requiredChecks?.includes(REQUIRED_CHECK)
      ? { id: 'branch-protection', status: 'ok', message: `${f.branch} requires the "${REQUIRED_CHECK}" check` }
      : {
          id: 'branch-protection',
          status: 'fail',
          message: `${f.branch} does not require the "${REQUIRED_CHECK}" check (templates do not copy protection)${hint}`,
          fix: `echo '${PROTECTION([...(f.requiredChecks ?? []), REQUIRED_CHECK])}' | ${api} PUT repos/${f.slug}/branches/${f.branch}/protection --input -`,
        },
  ]
}
