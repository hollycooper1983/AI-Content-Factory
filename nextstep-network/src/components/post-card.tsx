"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { Bookmark, BookmarkCheck, Flag, Lightbulb, MessageCircle, MoreHorizontal, PartyPopper, Repeat2, ThumbsUp, Trash2, HeartHandshake } from "lucide-react";
import { addComment, deletePost, repost, report, toggleReaction, toggleSave } from "@/app/actions/social";
import type { FeedItem } from "@/lib/queries";
import { cn, label, timeAgo } from "@/lib/format";
import { ActionButton, Avatar, FormMessage, SafeImage, SubmitButton } from "./client-ui";
import { Badge, OrgVerified } from "./ui";
import type { ReactionType } from "@/lib/types";

const REACTIONS: { type: ReactionType; label: string; icon: typeof ThumbsUp; color: string }[] = [
  { type: "like", label: "Like", icon: ThumbsUp, color: "text-brand" },
  { type: "celebrate", label: "Celebrate", icon: PartyPopper, color: "text-green-600" },
  { type: "insightful", label: "Insightful", icon: Lightbulb, color: "text-amber-500" },
  { type: "support", label: "Support", icon: HeartHandshake, color: "text-teal-600" },
];

const CAT_TONE: Record<string, "blue" | "teal" | "green" | "amber" | "gray"> = {
  scholarship: "green", college: "blue", internship: "teal", success: "green", advice: "blue", event: "amber", question: "amber", general: "gray",
};

function Comments({ item }: { item: FeedItem }) {
  const [state, action] = useFormState(addComment, undefined);
  return (
    <div className="space-y-3 border-t border-line px-4 py-3">
      <form action={action} className="flex gap-2" key={item.comments.length}>
        <input type="hidden" name="postId" value={item.post.id} />
        <label htmlFor={`c-${item.post.id}`} className="sr-only">Add a comment</label>
        <input id={`c-${item.post.id}`} name="body" maxLength={1000} placeholder="Add a comment…" className="input rounded-full" />
        <SubmitButton className="btn-primary btn-sm" pendingText="…">Post</SubmitButton>
      </form>
      <FormMessage state={state?.error ? state : undefined} />
      {item.comments.map((c) => (
        <div key={c.id} className="flex gap-2">
          <Avatar src={c.author?.profile?.avatarUrl} name={c.author?.user.name ?? "Member"} size={32} />
          <div className="flex-1 rounded-xl bg-canvas px-3 py-2">
            <p className="text-xs"><span className="font-semibold text-fg">{c.author?.user.name ?? "Member"}</span> <span className="text-muted">· {timeAgo(c.createdAt)}</span></p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-fg">{c.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportForm({ postId, onDone }: { postId: string; onDone: () => void }) {
  const [state, action] = useFormState(report, undefined);
  if (state?.ok) return <p role="status" className="p-3 text-sm text-green-700">{state.ok}</p>;
  return (
    <form action={action} className="space-y-2 p-3">
      <input type="hidden" name="targetType" value="post" />
      <input type="hidden" name="targetId" value={postId} />
      <label htmlFor={`r-${postId}`} className="label text-xs">Why are you reporting this?</label>
      <select id={`r-${postId}`} name="reason" className="input" required defaultValue="">
        <option value="" disabled>Select a reason</option>
        <option>Spam or scam</option><option>Harassment or bullying</option><option>Inappropriate content</option>
        <option>Fake opportunity or misinformation</option><option>Shares private information</option><option>Other</option>
      </select>
      <FormMessage state={state} />
      <div className="flex gap-2"><SubmitButton className="btn-danger btn-sm">Report</SubmitButton><button type="button" className="btn-ghost btn-sm" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

export function PostCard({ item, viewerId, isAdmin }: { item: FeedItem; viewerId: string; isAdmin: boolean }) {
  const { post, author } = item;
  const [showComments, setShowComments] = useState(item.comments.length > 0 && item.comments.length <= 2);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const mine = item.reactions.find((r) => r.userId === viewerId)?.type as ReactionType | undefined;
  const counts = REACTIONS.map((r) => ({ ...r, n: item.reactions.filter((x) => x.type === r.type).length })).filter((r) => r.n > 0);
  const name = item.orgName ?? author?.user.name ?? "Member";
  const verifiedPro = author?.user.verified && ["mentor", "counselor", "employer", "college"].includes(author.user.role);
  const authorHref = item.orgName && post.orgId ? `/organizations/${post.orgId}` : `/profile/${post.authorId}`;
  const isLink = (v: string) => v.startsWith("/");

  return (
    <article className="card" aria-label={`Post by ${name}`}>
      {post.repostOfId && <p className="flex items-center gap-1 border-b border-line px-4 py-2 text-xs text-muted"><Repeat2 className="h-3.5 w-3.5" /> {author?.user.name} reposted</p>}
      <div className="flex gap-3 px-4 pt-4">
        <Link href={authorHref}><Avatar src={item.orgName ? null : author?.profile?.avatarUrl} name={name} size={48} className={item.orgName ? "rounded-lg" : ""} /></Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1 text-sm font-semibold text-fg">
            <Link href={authorHref} className="hover:text-brand hover:underline">{name}</Link>
            {item.orgName ? <OrgVerified verified={item.orgVerified} /> : verifiedPro && <Badge tone="blue">Verified {label(author!.user.role)}</Badge>}
          </p>
          <p className="truncate text-xs text-muted">{item.orgName ? `Posted by ${author?.user.name}` : author?.profile?.headline}</p>
          <p className="text-xs text-muted">{timeAgo(post.createdAt)}{item.groupName && <> · in <Link className="link" href={`/groups/${post.groupId}`}>{item.groupName}</Link></>}</p>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setMenu((m) => !m)} aria-label="Post options" aria-expanded={menu} className="rounded-full p-1.5 text-muted hover:bg-canvas"><MoreHorizontal className="h-5 w-5" /></button>
          {menu && (
            <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-line bg-surface shadow-lg">
              {reporting ? <ReportForm postId={post.id} onDone={() => { setReporting(false); setMenu(false); }} /> : (
                <ul className="py-1 text-sm">
                  <li><button type="button" className="flex w-full items-center gap-2 px-3 py-2 hover:bg-canvas" onClick={() => setReporting(true)}><Flag className="h-4 w-4" /> Report post</button></li>
                  {(post.authorId === viewerId || isAdmin) && (
                    <li><ActionButton className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-canvas" confirm="Delete this post?" action={() => deletePost(post.id)}><Trash2 className="h-4 w-4" /> Delete post</ActionButton></li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-3">
        <Badge tone={CAT_TONE[post.category] ?? "gray"} className="mb-2">{label(post.category === "general" ? "Update" : post.category).replace(/^\w/, (c) => c.toUpperCase())}</Badge>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{post.body}</p>
        {post.link && (
          isLink(post.link)
            ? <Link href={post.link} className="mt-2 block truncate text-sm link">{post.link}</Link>
            : <a href={post.link} target="_blank" rel="noopener noreferrer nofollow ugc" className="mt-2 block truncate text-sm link">{post.link.replace(/^https:\/\//, "")}</a>
        )}
      </div>
      {post.imageUrl && <SafeImage src={post.imageUrl} alt="Image attached to post" className="max-h-[420px] w-full object-cover" />}
      {(counts.length > 0 || item.comments.length > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted">
          <span className="flex items-center gap-1">
            {counts.map(({ type, icon: I, color, n }) => <span key={type} className="flex items-center gap-0.5"><I className={cn("h-3.5 w-3.5", color)} />{n}</span>)}
          </span>
          {item.comments.length > 0 && <button type="button" className="hover:text-brand hover:underline" onClick={() => setShowComments((s) => !s)}>{item.comments.length} comment{item.comments.length === 1 ? "" : "s"}</button>}
        </div>
      )}
      <div className="grid grid-cols-4 border-t border-line px-2 py-1 text-xs font-semibold text-muted sm:text-sm">
        <div className="group relative">
          <ActionButton className={cn("flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 hover:bg-canvas", mine && "text-brand")} action={() => toggleReaction(post.id, mine ?? "like")}>
            {(() => { const R = REACTIONS.find((r) => r.type === mine) ?? REACTIONS[0]; return <><R.icon className="h-4 w-4" /> <span className="hidden sm:inline">{mine ? R.label : "React"}</span></>; })()}
          </ActionButton>
          <div className="invisible absolute bottom-full left-0 z-10 flex gap-1 rounded-full border border-line bg-surface p-1 shadow-lg group-focus-within:visible group-hover:visible">
            {REACTIONS.map((r) => (
              <ActionButton key={r.type} title={r.label} className={cn("rounded-full p-2 hover:bg-canvas", r.color)} action={() => toggleReaction(post.id, r.type)}><r.icon className="h-5 w-5" /><span className="sr-only">{r.label}</span></ActionButton>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => setShowComments((s) => !s)} className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 hover:bg-canvas"><MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">Comment</span></button>
        <ActionButton className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 hover:bg-canvas" action={() => repost(post.id)} confirm="Repost this to your network?"><Repeat2 className="h-4 w-4" /> <span className="hidden sm:inline">Repost</span></ActionButton>
        <ActionButton className={cn("flex items-center justify-center gap-1.5 rounded-lg py-2.5 hover:bg-canvas", item.saved && "text-brand")} action={() => toggleSave("post", post.id)}>
          {item.saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />} <span className="hidden sm:inline">{item.saved ? "Saved" : "Save"}</span>
        </ActionButton>
      </div>
      {showComments && <Comments item={item} />}
    </article>
  );
}
