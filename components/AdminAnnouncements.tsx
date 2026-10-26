"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { ImagePlus, X } from "lucide-react";
import { getAnnouncementAuthorName } from "@/lib/announcementAuthor";
import AnnouncementMediaCarousel from "@/components/AnnouncementMediaCarousel";

type Announcement = {
  _id: string;
  title: string;
  body: string;
  category: "general" | "safety" | "maintenance" | "event";
  authorName: string;
  pinned: boolean;
  createdAt: string;
  imageDocumentId?: string;
  imageDocumentIds?: string[];
};

type EditableFields = {
  title: string;
  body: string;
  category: Announcement["category"];
  pinned: boolean;
  imageDocumentId?: string;
  imageDocumentIds?: string[];
};

function toEditableFields(a: Announcement): EditableFields {
  return { title: a.title, body: a.body, category: a.category, pinned: a.pinned, imageDocumentId: a.imageDocumentId, imageDocumentIds: a.imageDocumentIds ?? (a.imageDocumentId ? [a.imageDocumentId] : []) };
}

const emptyNew: EditableFields = { title: "", body: "", category: "general", pinned: false, imageDocumentId: undefined, imageDocumentIds: [] };
const categories: Announcement["category"][] = ["general", "safety", "maintenance", "event"];

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState<EditableFields>(emptyNew);
  const [adding, setAdding] = useState(false);
  const [gallery, setGallery] = useState<Array<{ _id: string; title: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load announcements");
      setItems(data.announcements);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function loadGallery() {
    const res = await fetch("/api/admin/documents");
    if (!res.ok) return;
    const data = await res.json();
    setGallery((data.documents ?? []).filter((doc: { category: string; title: string }) => doc.category === "gallery" && /\.(avif|gif|jpe?g|png|webp)$/i.test(doc.title)));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
      void loadGallery();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function uploadAnnouncementImage(file: File): Promise<string | null> {
    if (!file.type.startsWith("image/")) return null;
    setUploadingImage(true);
    try {
      const blob = await upload(file.name, file, { access: "private", handleUploadUrl: "/api/documents/upload" });
      const res = await fetch("/api/admin/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: file.name, category: "gallery", fileUrl: blob.url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to upload image");
      setGallery((current) => [data.document, ...current]);
      return data.document._id as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  function imagePicker(fields: EditableFields, setFields: (fields: EditableFields) => void) {
    const selected = fields.imageDocumentIds ?? (fields.imageDocumentId ? [fields.imageDocumentId] : []);
    const addGalleryImage = (id: string) => setFields({ ...fields, imageDocumentIds: [...selected, id], imageDocumentId: undefined });
    const removeImage = (id: string) => setFields({ ...fields, imageDocumentIds: selected.filter((imageId) => imageId !== id), imageDocumentId: undefined });
    return <div className="rounded-lg border border-ink/10 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-ink">Announcement images</p><div className="flex items-center gap-2"><button type="button" onClick={() => setGalleryOpen((open) => !open)} className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-sand/40">{galleryOpen ? "Hide Photo Gallery" : "Choose from Photo Gallery"}</button><label className="cursor-pointer rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-sand/40"><ImagePlus className="mr-1 inline h-4 w-4" />{uploadingImage ? "Uploading…" : "Upload images"}<input type="file" accept="image/*" multiple className="hidden" disabled={uploadingImage} onChange={async (event) => { const files = Array.from(event.target.files ?? []); const uploaded = [...selected]; for (const file of files) { const id = await uploadAnnouncementImage(file); if (id) uploaded.push(id); } setFields({ ...fields, imageDocumentIds: uploaded, imageDocumentId: undefined }); event.currentTarget.value = ""; }} /></label></div></div>{selected.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">{selected.map((id, index) => <div key={id} className="group relative aspect-square overflow-hidden rounded-lg bg-sand"><Image src={`/api/documents/${id}`} alt={`Selected image ${index + 1}`} fill sizes="96px" className="object-cover" unoptimized /><button type="button" onClick={() => removeImage(id)} aria-label={`Remove image ${index + 1}`} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-coral opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100"><X className="h-3.5 w-3.5" /></button></div>)}</div>}{galleryOpen && <><p className="mt-4 text-xs font-medium text-ink/60">Choose additional images from Photo Gallery</p><div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">{gallery.filter((photo) => !selected.includes(photo._id)).map((photo) => <button key={photo._id} type="button" onClick={() => addGalleryImage(photo._id)} className="relative aspect-square overflow-hidden rounded-lg bg-sand focus:outline-none focus:ring-2 focus:ring-marina"><Image src={`/api/documents/${photo._id}`} alt={`Add ${photo.title}`} fill sizes="80px" className="object-cover transition hover:scale-105" unoptimized /></button>)}</div></>}{selected.length > 0 && <button type="button" onClick={() => setFields({ ...fields, imageDocumentIds: [], imageDocumentId: undefined })} className="mt-3 text-xs text-coral"><X className="mr-1 inline h-3.5 w-3.5" />Remove all</button>}</div>;
  }

  function startEdit(a: Announcement) {
    setEditingId(a._id);
    setDraft(toEditableFields(a));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save changes");
      setItems((prev) => prev.map((a) => (a._id === id ? data.announcement : a)));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete announcement");
      setItems((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post announcement");
      setItems((prev) => [data.announcement, ...prev]);
      setNewItem(emptyNew);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Announcements</h2>
      <p className="mt-1 text-sm text-ink/60">Post, edit, or remove community announcements.</p>

      <form onSubmit={addItem} className="mt-6 space-y-3 rounded-xl border border-ink/10 p-5">
        <p className="font-display text-lg text-marina">New announcement</p>
        <input
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Title"
          value={newItem.title}
          onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
          required
        />
        <textarea
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Body"
          rows={3}
          value={newItem.body}
          onChange={(e) => setNewItem({ ...newItem, body: e.target.value })}
          required
        />
        {imagePicker(newItem, setNewItem)}
        <div className="flex flex-wrap items-center gap-4">
          <select
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value as Announcement["category"] })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={newItem.pinned}
              onChange={(e) => setNewItem({ ...newItem, pinned: e.target.checked })}
            />
            Pin to top
          </label>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
        >
          {adding ? "Posting…" : "Post announcement"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading && <p className="text-sm text-ink/50">Loading…</p>}
        {!loading && items.length === 0 && <p className="text-sm text-ink/50">No announcements yet.</p>}
        {!loading &&
          items.map((a) => {
            const isEditing = editingId === a._id;
            return (
              <div key={a._id} className="rounded-xl border border-ink/10 p-5">
                {isEditing && draft ? (
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    />
                    <textarea
                      className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                      rows={3}
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    />
                    {imagePicker(draft, setDraft)}
                    <div className="flex flex-wrap items-center gap-4">
                      <select
                        className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                        value={draft.category}
                        onChange={(e) => setDraft({ ...draft, category: e.target.value as Announcement["category"] })}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-sm text-ink/70">
                        <input
                          type="checkbox"
                          checked={draft.pinned}
                          onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })}
                        />
                        Pinned
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(a._id)}
                        disabled={saving}
                        className="rounded-full bg-marina px-3 py-1 text-xs font-semibold text-fog disabled:opacity-50"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink/70"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        {(a.imageDocumentIds?.length || a.imageDocumentId) && <div className="w-24 shrink-0"><AnnouncementMediaCarousel announcementId={a._id} imageDocumentIds={a.imageDocumentIds?.length ? a.imageDocumentIds : [a.imageDocumentId as string]} /></div>}
                        <div className="min-w-0">
                        <p className="font-display text-lg text-ink">
                          {a.pinned && <span className="mr-2 text-coral">📌</span>}
                          {a.title}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-dune">
                          {a.category} · {getAnnouncementAuthorName(a.authorName)}
                        </p>
                        <p className="mt-3 text-sm text-ink/70">{a.body}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <button
                          onClick={() => startEdit(a)}
                          className="text-xs font-medium text-marina underline underline-offset-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(a._id)}
                          className="text-xs font-medium text-coral underline underline-offset-4"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
