"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

type Doc = {
  _id: string;
  title: string;
  description?: string;
  category: "governing" | "minutes" | "financial" | "forms" | "other";
  fileUrl: string;
};

type EditableFields = { title: string; description: string; category: Doc["category"] };

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

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<Doc["category"]>("other");
  const [uploading, setUploading] = useState(false);
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

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !newTitle) {
      setError("A title and a file are required");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/documents/upload",
      });

      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || undefined,
          category: newCategory,
          fileUrl: blob.url,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save document");
      setDocs((prev) => [data.document, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("other");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Documents</h2>
      <p className="mt-1 text-sm text-ink/60">
        Upload governing documents, meeting minutes, financials, and forms.
      </p>

      <form onSubmit={handleUpload} className="mt-6 space-y-3 rounded-xl border border-ink/10 p-5">
        <p className="font-display text-lg text-marina">Upload a document</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <select
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as Doc["category"])}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <input
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Description (optional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <input ref={fileInputRef} type="file" required className="text-sm" />
        <button
          type="submit"
          disabled={uploading}
          className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload document"}
        </button>
      </form>

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
