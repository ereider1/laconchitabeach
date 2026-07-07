"use client";

import { useEffect, useState } from "react";

type Resident = {
  _id: string;
  fullName: string;
  address: string;
  email: string;
  phone?: string;
  moveInYear?: number;
  listedInDirectory: boolean;
  clerkUserId: string;
};

type EditableFields = {
  fullName: string;
  address: string;
  email: string;
  phone: string;
  moveInYear: string;
  listedInDirectory: boolean;
};

function toEditableFields(r: Resident): EditableFields {
  return {
    fullName: r.fullName,
    address: r.address,
    email: r.email,
    phone: r.phone ?? "",
    moveInYear: r.moveInYear ? String(r.moveInYear) : "",
    listedInDirectory: r.listedInDirectory,
  };
}

const emptyNewResident = { fullName: "", address: "", email: "", phone: "" };

export default function AdminResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [newResident, setNewResident] = useState(emptyNewResident);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/residents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load residents");
      setResidents(data.residents);
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

  function startEdit(r: Resident) {
    setEditingId(r._id);
    setDraft(toEditableFields(r));
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
      const res = await fetch("/api/admin/residents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          fullName: draft.fullName,
          address: draft.address,
          email: draft.email,
          phone: draft.phone || undefined,
          moveInYear: draft.moveInYear ? Number(draft.moveInYear) : undefined,
          listedInDirectory: draft.listedInDirectory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save changes");
      setResidents((prev) => prev.map((r) => (r._id === id ? data.resident : r)));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this resident's record? This cannot be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/residents?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete resident");
      setResidents((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function addResident(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResident),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add resident");
      setResidents((prev) =>
        [...prev, data.resident].sort((a, b) => a.fullName.localeCompare(b.fullName))
      );
      setNewResident(emptyNewResident);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  const filtered = residents.filter((r) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      r.fullName.toLowerCase().includes(term) ||
      r.address.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <form
        onSubmit={addResident}
        className="mb-8 space-y-3 rounded-xl border border-ink/10 p-5"
      >
        <p className="font-display text-lg text-marina">Add a resident</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="Full name"
            value={newResident.fullName}
            onChange={(e) => setNewResident({ ...newResident, fullName: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="Address"
            value={newResident.address}
            onChange={(e) => setNewResident({ ...newResident, address: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="Email"
            type="email"
            value={newResident.email}
            onChange={(e) => setNewResident({ ...newResident, email: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="Phone (optional)"
            value={newResident.phone}
            onChange={(e) => setNewResident({ ...newResident, phone: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add resident"}
        </button>
      </form>

      <div className="flex items-center justify-between gap-4">
        <input
          className="w-full max-w-sm rounded-lg border border-ink/15 px-4 py-2 text-sm"
          placeholder="Search residents…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="shrink-0 text-xs text-ink/50">
          {residents.length} resident{residents.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-wider text-ink/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Directory</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={6}>Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={6}>No matches.</td></tr>
            )}
            {!loading &&
              filtered.map((r) => {
                const isEditing = editingId === r._id;
                return (
                  <tr key={r._id} className="border-t border-ink/10 align-top">
                    {isEditing && draft ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            className="w-full rounded border border-ink/15 px-2 py-1 text-sm"
                            value={draft.fullName}
                            onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="w-full rounded border border-ink/15 px-2 py-1 text-sm"
                            value={draft.address}
                            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="w-full rounded border border-ink/15 px-2 py-1 text-xs font-mono"
                            placeholder="Email"
                            value={draft.email}
                            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="w-full rounded border border-ink/15 px-2 py-1 text-xs font-mono"
                            placeholder="Phone"
                            value={draft.phone}
                            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <label className="flex items-center gap-2 text-xs text-ink/70">
                            <input
                              type="checkbox"
                              checked={draft.listedInDirectory}
                              onChange={(e) =>
                                setDraft({ ...draft, listedInDirectory: e.target.checked })
                              }
                            />
                            Listed
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(r._id)}
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
                        <td className="px-4 py-3 font-medium text-ink">{r.fullName}</td>
                        <td className="px-4 py-3 text-ink/70">{r.address}</td>
                        <td className="px-4 py-3 font-mono text-xs text-ink/60">{r.email}</td>
                        <td className="px-4 py-3 font-mono text-xs text-ink/60">{r.phone ?? ""}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              r.listedInDirectory
                                ? "bg-marina/10 text-marina"
                                : "bg-ink/5 text-ink/50"
                            }`}
                          >
                            {r.listedInDirectory ? "Listed" : "Hidden"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => startEdit(r)}
                              className="text-xs font-medium text-marina underline underline-offset-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => remove(r._id)}
                              className="text-xs font-medium text-coral underline underline-offset-4"
                            >
                              Remove
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
