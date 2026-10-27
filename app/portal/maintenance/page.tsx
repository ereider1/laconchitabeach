"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { COMMUNITY_POST_CATEGORIES } from "@/lib/communityCategories";

type Req = {
  _id: string;
  submittedByName: string;
  address: string;
  description: string;
  category: string;
  status: "open" | "in-progress" | "resolved";
  photoUrl?: string;
  createdAt: string;
};

const MAX_PHOTO_SIZE = 4 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const statusColor: Record<Req["status"], string> = {
  open: "bg-coral/20 text-coral",
  "in-progress": "bg-dune/20 text-dune",
  resolved: "bg-green-100 text-green-700",
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [form, setForm] = useState({ address: "", category: "other", description: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/maintenance");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load requests");
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (window.location.hash !== "#new-community-post") return;
    const frame = window.requestAnimationFrame(() => setShowPostForm(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (showPostForm && window.location.hash === "#new-community-post") {
      document.getElementById("new-community-post")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [showPostForm]);

  useEffect(() => {
    if (!loading && window.location.hash.startsWith("#post-")) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading, requests]);

  function clearPhoto() {
    if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    photoPreviewRef.current = null;
    setPhoto(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let photoUrl: string | undefined;
      if (photo) {
        const extension = PHOTO_TYPES[photo.type];
        if (!extension || photo.size > MAX_PHOTO_SIZE) {
          throw new Error("Choose a JPG, PNG, GIF, WebP, or AVIF image up to 4 MB.");
        }

        const uploadForm = new FormData();
        uploadForm.append("photo", photo, `${crypto.randomUUID()}.${extension}`);
        const uploadResponse = await fetch("/api/maintenance/upload", {
          method: "POST",
          body: uploadForm,
        });
        const uploadData: { url?: string; error?: string } = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadData.url) {
          throw new Error(uploadData.error ?? "Photo upload failed");
        }
        photoUrl = uploadData.url;
      }

      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setForm({ address: "", category: "other", description: "" });
      clearPhoto();
      setShowPostForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-4xl">Community Corner</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base">
        Neighborhood bulletin board
          </p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-marina/10 px-3 py-1.5 text-xs font-semibold text-marina sm:inline-flex">
          {requests.length} {requests.length === 1 ? "post" : "posts"}
        </span>
      </div>

      {showPostForm ? (
        <form id="new-community-post" onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-ink/10 p-4 sm:mt-8 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-lg text-marina">New Post</p>
            <button
              type="button"
              onClick={() => setShowPostForm(false)}
              className="text-sm font-medium text-marina underline underline-offset-4"
            >
              Close
            </button>
          </div>
        <input
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Address or location (e.g. Beach path near Stair 3)"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
        />
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <select
            className="w-full rounded-lg border border-ink/15 px-3 py-3 text-sm sm:w-auto sm:py-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {COMMUNITY_POST_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </div>
        <textarea
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Describe your post"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink" htmlFor="community-photo">
            Add a photo (optional)
          </label>
          <input
            id="community-photo"
            ref={photoInputRef}
            type="file"
            accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-marina/10 file:px-4 file:py-2 file:font-medium file:text-marina"
            onChange={(e) => {
              if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
              const selected = e.target.files?.[0] ?? null;
              const preview = selected ? URL.createObjectURL(selected) : null;
              photoPreviewRef.current = preview;
              setPhoto(selected);
              setPhotoPreview(preview);
            }}
          />
          {photoPreview && (
            <div className="flex items-start gap-3">
              <Image
                src={photoPreview}
                alt="Selected photo preview"
                width={128}
                height={96}
                unoptimized
                className="h-24 w-32 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={clearPhoto}
                className="text-sm font-medium text-coral underline underline-offset-4"
              >
                Remove photo
              </button>
            </div>
          )}
          <p className="text-xs text-ink/50">JPG, PNG, GIF, WebP, or AVIF, up to 4 MB.</p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-marina px-5 py-3 text-sm font-semibold text-fog disabled:opacity-50 sm:w-auto sm:py-2"
        >
          {submitting ? "Submitting…" : "Submit post"}
        </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowPostForm(true)}
          aria-expanded={false}
          aria-controls="new-community-post"
          className="mt-6 w-full rounded-full bg-marina px-5 py-3 text-sm font-semibold text-fog sm:mt-8 sm:w-auto sm:py-2"
        >
          Create New Post
        </button>
      )}

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-6 space-y-3 sm:mt-8">
        {loading && <p className="text-sm text-ink/60">Loading…</p>}
        {!loading && requests.length === 0 && !error && (
          <p className="text-sm text-ink/60">No posts yet.</p>
        )}
        {requests.map((r) => (
          <div id={`post-${r._id}`} key={r._id} className="rounded-2xl border border-ink/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              {r.photoUrl && (
                <Image
                  src={`/api/maintenance/${r._id}/photo`}
                  alt={`Photo attached to post about ${r.address}`}
                  width={128}
                  height={96}
                  unoptimized
                  className="h-20 w-24 shrink-0 rounded-lg object-cover sm:h-24 sm:w-32"
                />
              )}
              <div className="min-w-0">
                <p className="font-medium text-ink">{r.address}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-dune">{r.category}</p>
                <p className="mt-1 text-xs text-ink/50">
                  Posted by {r.submittedByName} on {new Date(r.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[r.status]}`}>
                {r.status}
              </span>
            </div>
            <p className="mt-4 w-full text-sm leading-6 text-ink/70">{r.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
