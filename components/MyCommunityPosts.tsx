"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Copy, Pencil, Trash2, X } from "lucide-react";

type Post = {
  _id: string;
  address: string;
  category: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  photoUrl?: string;
  createdAt: string;
};

type Draft = Pick<Post, "address" | "category" | "description">;

const categories = [
  "common-area",
  "beach-access",
  "landscaping",
  "lighting",
  "Lost & Found",
  "for sale",
  "looking for",
  "free",
  "other",
];

export default function MyCommunityPosts({ posts: initialPosts }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);

  function startEdit(post: Post) {
    setEditingId(post._id);
    setDraft({
      address: post.address,
      category: post.category,
      description: post.description,
    });
    setMessage(null);
  }

  async function saveEdit(id: string) {
    if (!draft) return;

    setBusyId(id);
    setMessage(null);
    try {
      const response = await fetch("/api/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...draft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update post.");

      setPosts((current) => current.map((post) => (post._id === id ? data.request : post)));
      setEditingId(null);
      setDraft(null);
      setMessage("Post updated.");
      setMessageIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update post.");
      setMessageIsError(true);
    } finally {
      setBusyId(null);
    }
  }

  async function sharePost(post: Post) {
    setMessage(null);
    try {
      const link = new URL(`/portal/maintenance#post-${post._id}`, window.location.origin).toString();
      await navigator.clipboard.writeText(link);
      setMessage("Post link copied to clipboard.");
      setMessageIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not copy post link.");
      setMessageIsError(true);
    }
  }

  async function deletePost(post: Post) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;

    setBusyId(post._id);
    setMessage(null);
    try {
      const response = await fetch(`/api/maintenance?id=${encodeURIComponent(post._id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete post.");

      setPosts((current) => current.filter((item) => item._id !== post._id));
      setMessage("Post deleted.");
      setMessageIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete post.");
      setMessageIsError(true);
    } finally {
      setBusyId(null);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-ink/10 p-4">
        <p className="text-sm text-ink/60">You haven’t shared any posts yet.</p>
        <Link href="/portal/maintenance" className="mt-2 inline-block text-sm font-medium text-marina underline underline-offset-4">
          Visit Community Corner
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {message && (
        <p className={`text-sm ${messageIsError ? "text-coral" : "text-marina"}`} role="status">
          {message}
        </p>
      )}
      {posts.map((post) => {
        const isEditing = editingId === post._id && draft;
        const busy = busyId === post._id;

        return (
          <article key={post._id} className="rounded-xl border border-ink/10 p-4">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  aria-label="Post address or location"
                  value={draft.address}
                  onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                  required
                />
                <select
                  className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  aria-label="Post category"
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <textarea
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  aria-label="Post description"
                  rows={3}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => saveEdit(post._id)}
                    disabled={busy}
                    className="rounded-full bg-marina px-4 py-2 text-sm font-semibold text-fog disabled:opacity-50"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setDraft(null);
                    }}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/70"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                {post.photoUrl && (
                  <Image
                    src={`/api/maintenance/${post._id}/photo`}
                    alt={`Photo attached to post about ${post.address}`}
                    width={128}
                    height={96}
                    unoptimized
                    className="h-24 w-32 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{post.address}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-dune">{post.category}</p>
                      <p className="mt-1 text-xs text-ink/50">
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })} · {post.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(post)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 text-xs font-medium text-marina underline underline-offset-4"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => sharePost(post)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-marina underline underline-offset-4"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        Share
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePost(post)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 text-xs font-medium text-coral underline underline-offset-4 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-ink/70">{post.description}</p>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
