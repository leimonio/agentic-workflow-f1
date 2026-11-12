// The gh calls of the PR loop. Scripts post and resolve; the agent only drafts the text.
import { execFileSync } from 'node:child_process'
import { readChecks, type PrStatus, type Thread } from './pr.ts'

const gh = (...a: string[]) => execFileSync('gh', a, { encoding: 'utf8' })
const graphql = (query: string, vars: Record<string, string | number>) =>
  JSON.parse(gh('api', 'graphql', '-f', `query=${query}`, ...Object.entries(vars).flatMap(([k, v]) => [typeof v === 'number' ? '-F' : '-f', `${k}=${v}`]))).data

const THREADS = `query($owner:String!,$name:String!,$n:Int!){repository(owner:$owner,name:$name){pullRequest(number:$n){
  reviewThreads(first:100){nodes{id isResolved path line comments(first:50){nodes{author{login} body url}}}}}}}`
// shortcut: first 100 threads and 50 comments per thread, plenty for a workshop PR; paginate for real repos.

export function fetchPr(ref: string): PrStatus {
  const v = JSON.parse(gh('pr', 'view', ref, '--json', 'number,url,state,headRefName,baseRefName,mergeable,statusCheckRollup'))
  const [owner = '', name = ''] = new URL(v.url).pathname.slice(1).split('/')
  const nodes = graphql(THREADS, { owner, name, n: v.number }).repository.pullRequest.reviewThreads.nodes
  const threads: Thread[] = nodes.map((t: { id: string; isResolved: boolean; path: string; line: number | null; comments: { nodes: { author: { login: string } | null; body: string; url: string }[] } }) => ({
    id: t.id,
    resolved: t.isResolved,
    path: t.path,
    line: t.line,
    author: t.comments.nodes[0]?.author?.login ?? 'ghost',
    body: t.comments.nodes.map((c) => `${c.author?.login ?? 'ghost'}: ${c.body}`).join('\n---\n'),
    url: t.comments.nodes[0]?.url ?? v.url,
    replies: t.comments.nodes.length - 1,
  }))
  return {
    number: v.number,
    url: v.url,
    state: v.state,
    head: v.headRefName,
    base: v.baseRefName,
    mergeable: v.mergeable,
    ...readChecks(v.statusCheckRollup ?? []),
    threads,
    unresolved: threads.filter((t) => !t.resolved).length,
  }
}

export const replyToThread = (threadId: string, body: string) =>
  graphql('mutation($id:ID!,$body:String!){addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$id,body:$body}){comment{url}}}', { id: threadId, body })

export const resolveThread = (threadId: string) => graphql('mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}', { id: threadId })
