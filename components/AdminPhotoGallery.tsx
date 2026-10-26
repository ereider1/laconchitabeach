"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Grid2X2, Images, List, Search, Trash2, Upload, X } from "lucide-react";

type Photo = { _id: string; title: string; fileUrl: string; createdAt: string };
type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  controller: AbortController;
};

export default function AdminPhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [preview, setPreview] = useState<Photo | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPhotos = photos.filter((photo) =>
    photo.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  async function loadPhotos() {
    try {
      const response = await fetch("/api/admin/documents");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load photos");
      setPhotos((data.documents as Photo[]).filter((photo) => photo.title.match(/\.(avif|gif|jpe?g|png|webp)$/i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load photos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPhotos(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!preview) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPreview(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [preview]);

  function updateItem(id: string, update: Partial<UploadItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...update } : item)));
  }

  async function uploadOne(item: UploadItem) {
    try {
      const blob = await upload(item.file.name, item.file, {
        access: "private",
        handleUploadUrl: "/api/documents/upload",
        onUploadProgress: ({ percentage }) => updateItem(item.id, { progress: percentage }),
        abortSignal: item.controller.signal,
      });
      const response = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: item.file.name, category: "gallery", fileUrl: blob.url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save photo");
      setPhotos((current) => [data.document, ...current]);
      updateItem(item.id, { progress: 100, status: "completed" });
    } catch (err) {
      if (!item.controller.signal.aborted) updateItem(item.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed" });
    }
  }

  async function handleFiles(files: File[]) {
    const selected = files.filter((file) => file.size > 0 && file.type.startsWith("image/"));
    if (!selected.length) {
      setError("Please choose one or more image files.");
      return;
    }
    setError(null);
    const newItems = selected.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
      file,
      progress: 0,
      status: "uploading" as const,
      controller: new AbortController(),
    }));
    setItems((current) => [...current, ...newItems]);
    await Promise.all(newItems.map(uploadOne));
  }

  async function deletePhoto(photo: Photo) {
    if (!window.confirm(`Delete ${photo.title}? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/documents?id=${photo._id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete photo");
      setPhotos((current) => current.filter((item) => item._id !== photo._id));
      setSelectedIds((current) => current.filter((id) => id !== photo._id));
      if (preview?._id === photo._id) setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete photo");
    }
  }

  async function deleteSelected() {
    const selected = photos.filter((photo) => selectedIds.includes(photo._id));
    if (!selected.length || !window.confirm(`Delete ${selected.length} selected photo${selected.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    await Promise.all(selected.map(async (photo) => {
      const response = await fetch(`/api/admin/documents?id=${photo._id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Could not delete ${photo.title}`);
    }));
    setPhotos((current) => current.filter((photo) => !selectedIds.includes(photo._id)));
    setSelectedIds([]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Photo Gallery</h2>
      <p className="mt-1 text-sm text-ink/60">Upload and manage photos for the La Conchita community.</p>

      <section className="mt-6 rounded-xl border border-ink/10 p-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void handleFiles(Array.from(event.dataTransfer.files)); }}
          className={`flex min-h-52 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 text-center transition ${dragging ? "border-marina bg-marina/10" : "border-ink/15 bg-sand/20 hover:border-marina hover:bg-sand/40"}`}
        >
          <Upload className="mb-3 h-9 w-9 text-marina" aria-hidden="true" />
          <span className="font-medium text-ink">Drag photos here to upload</span>
          <span className="mt-1 text-xs text-ink/60">or click to choose multiple image files</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { if (event.target.files) void handleFiles(Array.from(event.target.files)); event.currentTarget.value = ""; }} />
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog transition hover:bg-marina/90"
          >
            Choose Images
          </button>
        </div>

        {items.length > 0 && (
          <div className="mt-5 divide-y divide-ink/10">
            {items.map((item) => (
              <div key={item.id} className="py-3 first:pt-0">
                <div className="flex items-center gap-3 text-sm"><Images className="h-5 w-5 text-marina" aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{item.file.name}</span><span className="text-ink/50">{item.status === "completed" ? "Uploaded" : item.status === "error" ? item.error : `${Math.round(item.progress)}%`}</span><button type="button" onClick={() => { item.controller.abort(); setItems((current) => current.filter((entry) => entry.id !== item.id)); }} aria-label={`Remove ${item.file.name}`}><X className="h-4 w-4 text-ink/50" /></button></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className={`h-full ${item.status === "error" ? "bg-coral" : "bg-marina"}`} style={{ width: `${item.progress}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <label className="relative block min-w-56 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search photos"
            aria-label="Search photos"
            className="w-full rounded-full border border-ink/15 py-2 pl-9 pr-4 text-sm outline-none ring-marina/30 focus:ring-2"
          />
        </label>
        <div className="flex rounded-full border border-ink/15 p-1" aria-label="Gallery view mode">
          <button type="button" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={`rounded-full p-2 ${view === "grid" ? "bg-marina text-fog" : "text-ink/50 hover:text-ink"}`}>
            <Grid2X2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={`rounded-full p-2 ${view === "list" ? "bg-marina text-fog" : "text-ink/50 hover:text-ink"}`}>
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink/70">
        <label className="flex items-center gap-2"><input type="checkbox" checked={filteredPhotos.length > 0 && filteredPhotos.every((photo) => selectedIds.includes(photo._id))} onChange={(event) => setSelectedIds(event.target.checked ? filteredPhotos.map((photo) => photo._id) : [])} /> Select all</label>
        {selectedIds.length > 0 && <button type="button" onClick={() => void deleteSelected()} className="rounded-full bg-coral px-4 py-1.5 text-xs font-semibold text-white hover:bg-coral/90">Delete selected ({selectedIds.length})</button>}
      </div>

      {loading ? <p className="py-8 text-sm text-ink/50">Loading photos…</p> : filteredPhotos.length === 0 ? <p className="py-8 text-sm text-ink/50">{photos.length === 0 ? "No photos uploaded yet." : "No photos match your search."}</p> : view === "grid" ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredPhotos.map((photo) => <div key={photo._id} className="group relative aspect-square overflow-hidden rounded-xl bg-sand"><button type="button" onClick={() => setPreview(photo)} className="absolute inset-0 text-left focus:outline-none focus:ring-2 focus:ring-marina focus:ring-inset"><Image src={`/api/documents/${photo._id}`} alt={photo.title} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition duration-200 group-hover:scale-105" unoptimized /></button><input type="checkbox" checked={selectedIds.includes(photo._id)} onChange={() => toggleSelected(photo._id)} aria-label={`Select ${photo.title}`} className="absolute left-2 top-2 h-4 w-4 accent-marina" /><button type="button" onClick={() => void deletePhoto(photo)} aria-label={`Delete ${photo.title}`} className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-coral opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>)}
        </div>
      ) : (
        <div className="mt-4 divide-y divide-ink/10 rounded-xl border border-ink/10">
          {filteredPhotos.map((photo) => <div key={photo._id} className="flex items-center gap-4 p-3"><input type="checkbox" checked={selectedIds.includes(photo._id)} onChange={() => toggleSelected(photo._id)} aria-label={`Select ${photo.title}`} className="h-4 w-4 accent-marina" /><button type="button" onClick={() => setPreview(photo)} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-sand focus:outline-none focus:ring-2 focus:ring-marina"><Image src={`/api/documents/${photo._id}`} alt="" fill sizes="64px" className="object-cover" unoptimized /></button><button type="button" onClick={() => void deletePhoto(photo)} aria-label={`Delete ${photo.title}`} className="order-last rounded-full p-2 text-coral hover:bg-sand"><Trash2 className="h-4 w-4" aria-hidden="true" /></button><button type="button" onClick={() => setPreview(photo)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-medium text-ink">{photo.title}</p><p className="mt-1 text-xs text-ink/50">Uploaded {new Date(photo.createdAt).toLocaleDateString()}</p></button></div>)}
        </div>
      )}

      {preview && (
        <div role="dialog" aria-modal="true" aria-label={`Preview of ${preview.title}`} className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={() => setPreview(null)}>
          <div className="relative h-[min(80vh,48rem)] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <Image src={`/api/documents/${preview._id}`} alt={preview.title} fill sizes="100vw" className="object-contain" unoptimized />
            <button type="button" onClick={() => setPreview(null)} aria-label="Close preview" className="absolute right-0 top-0 rounded-full bg-white/90 p-2 text-ink shadow-lg hover:bg-white"><X className="h-5 w-5" aria-hidden="true" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
