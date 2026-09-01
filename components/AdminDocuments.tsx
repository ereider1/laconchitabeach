"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { FileText, Upload, X } from "lucide-react";

type Doc = {
  _id: string;
  title: string;
  description?: string;
  category: "governing" | "minutes" | "financial" | "forms" | "other";
  fileUrl: string;
};

type EditableFields = { title: string; description: string; category: Doc["category"] };

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  controller: AbortController;
};

const categories: Doc["category"][] = ["governing", "minutes", "financial", "forms", "other"];

function toEditableFields(d: Doc): EditableFields {
  return { title: d.title, description: d.description ?? "", category: d.category };
}

export default function AdminDocuments() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/documents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load documents");
      setDocs(data.documents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(d: Doc) {
    setEditingId(d._id);
    setDraft(toEditableFields(d));
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
      const res = await fetch("/api/admin/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save changes");
      setDocs((prev) => prev.map((d) => (d._id === id ? data.document : d)));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/documents?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete document");
      setDocs((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function updateUploadItem(id: string, update: Partial<UploadItem>) {
    setUploadItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...update } : item)));
  }

  async function uploadOne(item: UploadItem) {
    try {
      const blob = await upload(item.file.name, item.file, {
        access: "private",
        handleUploadUrl: "/api/documents/upload",
        onUploadProgress: ({ percentage }) => {
          updateUploadItem(item.id, { progress: percentage });
        },
        abortSignal: item.controller.signal,
      });

      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.file.name,
          category: "other",
          fileUrl: blob.url,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save document");

      setDocs((prev) => [data.document, ...prev]);
      updateUploadItem(item.id, { progress: 100, status: "completed" });
    } catch (err) {
      if (item.controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Upload failed";
      updateUploadItem(item.id, { status: "error", error: message });
    }
  }

  async function handleFiles(files: File[]) {
    const selected = files.filter((file) => file.size > 0);
    if (selected.length === 0) return;

    const items = selected.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
      file,
      progress: 0,
      status: "uploading" as const,
      controller: new AbortController(),
    }));

    setUploadItems((prev) => [...prev, ...items]);
    setUploading(true);
    setError(null);
    await Promise.all(items.map(uploadOne));
    setUploading(false);
  }

  function removeUploadItem(item: UploadItem) {
    item.controller.abort();
    setUploadItems((prev) => prev.filter((current) => current.id !== item.id));
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Documents</h2>
      <p className="mt-1 text-sm text-ink/60">
        Upload governing documents, meeting minutes, financials, and forms.
      </p>

      <section className="mt-6 rounded-xl border border-ink/10 p-5">
        <h3 className="font-display text-lg text-marina">File Upload</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(16rem,0.9fr)_minmax(20rem,1.1fr)]">
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void handleFiles(Array.from(event.dataTransfer.files));
              }}
              className="flex min-h-56 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink/15 bg-sand/20 px-5 text-center text-ink/60 transition hover:border-marina hover:bg-sand/40"
            >
              <Upload className="mb-3 h-9 w-9 text-marina" aria-hidden="true" />
              <span className="font-medium">Drag files to upload</span>
              <span className="mt-1 text-xs">You can select multiple files</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) void handleFiles(Array.from(event.target.files));
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-4 rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
            >
              Choose Files
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-ink">Uploading</h4>
              {uploadItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUploadItems((prev) => prev.filter((item) => item.status === "uploading"))}
                  className="text-xs text-ink/50 underline underline-offset-4"
                >
                  Clear completed
                </button>
              )}
            </div>
            <div className="mt-2 divide-y divide-ink/10">
              {uploadItems.length === 0 && <p className="py-8 text-sm text-ink/50">No files selected yet.</p>}
              {uploadItems.map((item) => (
                <div key={item.id} className="py-4 first:pt-2 last:pb-2">
                  <div className="flex items-center gap-3">
                    <FileText className="h-7 w-7 shrink-0 text-ink/40" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.file.name}</p>
                      <p className="text-xs text-ink/50">{formatFileSize(item.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUploadItem(item)}
                      className="rounded p-1 text-ink/50 hover:bg-sand hover:text-ink"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className={`h-full transition-[width] ${item.status === "error" ? "bg-coral" : "bg-sky-400"}`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className={`mt-1 text-xs ${item.status === "error" ? "text-coral" : "text-ink/50"}`}>
                    {item.status === "completed" ? "Completed" : item.status === "error" ? item.error : `${Math.round(item.progress)}% done`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-wider text-ink/60">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={4}>Loading…</td></tr>
            )}
            {!loading && docs.length === 0 && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={4}>No documents uploaded yet.</td></tr>
            )}
            {!loading &&
              docs.map((d) => {
                const isEditing = editingId === d._id;
                return (
                  <tr key={d._id} className="border-t border-ink/10 align-top">
                    {isEditing && draft ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            className="w-full rounded border border-ink/15 px-2 py-1 text-sm"
                            value={draft.title}
                            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                          />
                          <input
                            className="mt-1 w-full rounded border border-ink/15 px-2 py-1 text-xs"
                            placeholder="Description"
                            value={draft.description}
                            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className="rounded border border-ink/15 px-2 py-1 text-sm"
                            value={draft.category}
                            onChange={(e) => setDraft({ ...draft, category: e.target.value as Doc["category"] })}
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink/50">Unchanged</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(d._id)}
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
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{d.title}</p>
                          {d.description && <p className="text-xs text-ink/60">{d.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-ink/70">{d.category}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`/api/documents/${d._id}`}
                            className="text-xs font-medium text-marina underline underline-offset-4"
                          >
                            View
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => startEdit(d)}
                              className="text-xs font-medium text-marina underline underline-offset-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => remove(d._id)}
                              className="text-xs font-medium text-coral underline underline-offset-4"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
