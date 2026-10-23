// Feed ranking: a transparent, bounded scoring function.
// Prioritizes safety, followed organizations, connections, personal interests and freshness.
// The feed is intentionally capped (FEED_LIMIT) with an "all caught up" end state
// rather than infinite scroll.

import type { Post } from "./types";

export const FEED_LIMIT = 25;

export interface RankContext {
  viewerId: string;
  connectionIds: Set<string>;
  followedOrgIds: Set<string>;
  interests: string[];
  verifiedAuthorIds: Set<string>;
  hiddenAuthorIds: Set<string>;
  reportCounts: Map<string, number>;
  now?: number;
}

const EDUCATIONAL: Post["category"][] = ["scholarship", "college", "internship", "advice", "event"];

export function scorePost(p: Post, ctx: RankContext): number {
  if (p.removed) return -Infinity;
  if (ctx.hiddenAuthorIds.has(p.authorId)) return -Infinity;
  const reports = ctx.reportCounts.get(p.id) ?? 0;
  if (reports >= 3) return -Infinity; // held for moderator review

  const now = ctx.now ?? Date.now();
  const ageHours = Math.max(0, (now - new Date(p.createdAt).getTime()) / 36e5);
  let score = 40 * Math.exp(-ageHours / 72); // freshness, ~3-day decay

  if (p.authorId === ctx.viewerId) score += 10;
  if (ctx.connectionIds.has(p.authorId)) score += 20;
  if (p.orgId && ctx.followedOrgIds.has(p.orgId)) score += 18;
  if (ctx.verifiedAuthorIds.has(p.authorId)) score += 6;
  if (EDUCATIONAL.includes(p.category)) score += 8;

  const text = p.body.toLowerCase();
  const hits = ctx.interests.filter((i) => i && text.includes(i.toLowerCase())).length;
  score += Math.min(hits, 3) * 7;

  score -= reports * 10;
  return score;
}

export function rankFeed(posts: Post[], ctx: RankContext, limit = FEED_LIMIT): Post[] {
  return posts
    .map((p) => ({ p, s: scorePost(p, ctx) }))
    .filter((x) => Number.isFinite(x.s))
    .sort((a, b) => b.s - a.s || b.p.createdAt.localeCompare(a.p.createdAt))
    .slice(0, limit)
    .map((x) => x.p);
}
