"use client";

import { useEffect, useState } from "react";

type Comment = { _id: string; authorName: string; body: string; createdAt: string };
type Props = { targetType: "announcement" | "event" | "community-post"; targetId: string };

export default function ResidentComments({ targetType, targetId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/comments?targetType=${targetType}&targetId=${targetId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not load comments");
    setComments(data.comments);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((e) => setError(e.message)).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [targetType, targetId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setPosting(true); setError(null);
    try {
      const res = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType, targetId, body }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not post comment");
      setComments((current) => [...current, data.comment]); setBody("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not post comment"); }
    finally { setPosting(false); }
  }

  return <section className="mt-5 border-t border-ink/10 pt-4" aria-label="Resident comments">
    <p className="text-sm font-semibold text-marina">Comments {comments.length > 0 && `(${comments.length})`}</p>
    <div className="mt-3 space-y-2">{loading ? <p className="text-xs text-ink/50">Loading comments…</p> : comments.map((comment) => <div key={comment._id} className="rounded-lg bg-sand/50 px-3 py-2"><p className="text-xs font-semibold text-ink">{comment.authorName} <span className="font-normal text-ink/45">· {new Date(comment.createdAt).toLocaleDateString()}</span></p><p className="mt-1 whitespace-pre-wrap text-sm text-ink/70">{comment.body}</p></div>)}</div>
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="Add a comment…" aria-label="Add a comment" className="min-w-0 flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <button disabled={posting || !body.trim()} className="rounded-full bg-marina px-4 py-2 text-sm font-semibold text-fog disabled:opacity-50">{posting ? "Posting…" : "Comment"}</button>
    </form>
    {error && <p className="mt-2 text-xs text-coral">{error}</p>}
  </section>;
}
