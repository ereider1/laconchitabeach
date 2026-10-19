"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Community Corner</h1>
      <p className="mt-2 text-ink/60">
        Browse posts from neighbors and share maintenance requests, lost &amp; found, and local listings.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border border-ink/10 p-5">
        <p className="font-display text-lg text-marina">New Post</p>
        <input
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Address or location (e.g. Beach path near Stair 3)"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="common-area">Common area</option>
            <option value="beach-access">Beach access</option>
            <option value="landscaping">Landscaping</option>
            <option value="lighting">Lighting</option>
            <option value="Lost & Found">Lost & Found</option>
            <option value="for sale">For Sale</option>
            <option value="looking for">Looking For</option>
            <option value="free">Free</option>
            <option value="other">Other</option>
          </select>
        </div>
        <textarea
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Describe your post"
          rows={3}
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
          className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit post"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-8 space-y-3">
        {loading && <p className="text-sm text-ink/60">Loading…</p>}
        {!loading && requests.length === 0 && !error && (
          <p className="text-sm text-ink/60">No posts yet.</p>
        )}
        {requests.map((r) => (
          <div key={r._id} className="flex items-start justify-between rounded-xl border border-ink/10 p-4">
            <div>
              <p className="font-medium text-ink">{r.address}</p>
              <p className="text-sm text-ink/70">{r.description}</p>
              {r.photoUrl && (
                <Image
                  src={r.photoUrl}
                  alt={`Photo attached to post about ${r.address}`}
                  width={160}
                  height={128}
                  unoptimized
                  className="mt-3 h-32 w-40 rounded-lg object-cover"
                />
              )}
              <p className="mt-1 text-xs uppercase tracking-wider text-dune">{r.category}</p>
              <p className="mt-1 text-xs text-ink/50">
                Posted by {r.submittedByName} on {new Date(r.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[r.status]}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
