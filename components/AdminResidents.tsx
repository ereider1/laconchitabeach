"use client";

import { useEffect, useState } from "react";

type Resident = {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  address: string;
  alternateAddress?: string;
  email: string;
  phone?: string;
  householdMembers?: string[];
  moveInYear?: number;
  listedInDirectory: boolean;
  isAdmin: boolean;
  registrationStatus: "pending" | "approved" | "denied";
};

type EditableFields = {
  fullName: string;
  address: string;
  email: string;
  phone: string;
  moveInYear: string;
  listedInDirectory: boolean;
  isAdmin: boolean;
};

function toEditableFields(r: Resident): EditableFields {
  return {
    fullName: r.fullName,
    address: r.address,
    email: r.email,
    phone: r.phone ?? "",
    moveInYear: r.moveInYear ? String(r.moveInYear) : "",
    listedInDirectory: r.listedInDirectory,
    isAdmin: r.isAdmin,
  };
}

const emptyNewResident = { firstName: "", lastName: "", address: "", email: "", phone: "" };

function csvCell(value: string | number | boolean | undefined) {
  let text = value === undefined ? "" : String(value);
  if (typeof value === "string" && /^[\s]*[=+\-@]/.test(value)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadResidentsCsv(residents: Resident[]) {
  const columns: { header: string; value: (resident: Resident) => string | number | boolean | undefined }[] = [
    { header: "First Name", value: (resident) => resident.firstName },
    { header: "Last Name", value: (resident) => resident.lastName },
    { header: "Full Name", value: (resident) => resident.fullName },
    { header: "Address", value: (resident) => resident.address },
    { header: "Alternate Address", value: (resident) => resident.alternateAddress },
    { header: "Email", value: (resident) => resident.email },
    { header: "Phone", value: (resident) => resident.phone },
    { header: "Household Members", value: (resident) => resident.householdMembers?.join("; ") },
    { header: "Move-in Year", value: (resident) => resident.moveInYear },
    { header: "Listed in Directory", value: (resident) => resident.listedInDirectory },
    { header: "Registration Status", value: (resident) => resident.registrationStatus },
    { header: "Administrator", value: (resident) => resident.isAdmin },
  ];
  const rows = [
    columns.map(({ header }) => csvCell(header)).join(","),
    ...residents.map((resident) =>
      columns.map(({ value }) => csvCell(value(resident))).join(","),
    ),
  ];
  const blob = new Blob(["\uFEFF", rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `residents-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

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
          isAdmin: draft.isAdmin,
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

  async function reviewRegistration(id: string, registrationStatus: "approved" | "denied") {
    setError(null);
    try {
      const res = await fetch("/api/admin/residents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, registrationStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update registration");
      setResidents((prev) => prev.map((r) => (r._id === id ? data.resident : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this resident's record? This cannot be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/residents?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete resident");
      setResidents((prev) => prev.filter((r) => r._id !== id));
      cancelEdit();
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

  const adminResidents = filtered.filter((r) => r.isAdmin);
  const pendingRegistrations = filtered.filter((r) => r.registrationStatus === "pending");
  const regularResidents = filtered.filter(
    (r) => !r.isAdmin && r.registrationStatus !== "pending"
  );

  function renderPendingRegistrations() {
    return (
      <section className="mt-6 overflow-hidden rounded-xl border border-dune/30">
        <div className="border-b border-dune/20 bg-sand/50 px-4 py-3">
          <h3 className="font-display text-lg text-marina">Registration requests</h3>
          <p className="text-xs text-ink/50">
            {pendingRegistrations.length} request{pendingRegistrations.length === 1 ? "" : "s"} awaiting review
          </p>
        </div>
        {loading ? (
          <p className="px-4 py-4 text-sm text-ink/50">Loading…</p>
        ) : pendingRegistrations.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink/50">No registration requests need review.</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {pendingRegistrations.map((resident) => (
              <li
                key={resident._id}
                className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-ink">{resident.fullName}</p>
                  <p className="mt-1 text-ink/65">{resident.address}</p>
                  <p className="mt-1 break-all font-mono text-xs text-ink/55">
                    {resident.email}{resident.phone ? ` · ${resident.phone}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void reviewRegistration(resident._id, "approved")}
                    className="rounded-full bg-marina px-4 py-2 text-xs font-semibold text-fog"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void reviewRegistration(resident._id, "denied")}
                    className="rounded-full border border-coral/40 px-4 py-2 text-xs font-semibold text-coral"
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  function renderResidentRows(rows: Resident[]) {
    return rows.map((r) => {
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
              <td className="px-4 py-3 text-xs text-ink/60">
                {r.registrationStatus === "denied" ? "Denied" : "Approved"}
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
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-ink/70">
                    <input
                      type="checkbox"
                      checked={draft.isAdmin}
                      onChange={(e) => setDraft({ ...draft, isAdmin: e.target.checked })}
                    />
                    Admin
                  </label>
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
                    <button
                      onClick={() => void remove(r._id)}
                      className="rounded-full border border-coral/30 px-3 py-1 text-xs font-medium text-coral"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </td>
            </>
          ) : (
            <>
              <td className="px-4 py-3 font-medium text-ink">{r.fullName}</td>
              <td className="px-4 py-3 text-ink/70">{r.address}</td>
              <td className="px-4 py-3 font-mono text-xs text-ink/60">{r.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    r.registrationStatus === "denied"
                      ? "bg-coral/10 text-coral"
                      : "bg-marina/10 text-marina"
                  }`}
                >
                  {r.registrationStatus === "denied" ? "Denied" : "Approved"}
                </span>
              </td>
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
                </div>
              </td>
            </>
          )}
        </tr>
      );
    });
  }

  function renderResidentTable(title: string, rows: Resident[], emptyMessage: string) {
    return (
      <section className="mt-6 overflow-hidden rounded-xl border border-ink/10">
        <div className="border-b border-ink/10 bg-sand/30 px-4 py-3">
          <h3 className="font-display text-lg text-marina">{title}</h3>
          <p className="text-xs text-ink/50">{rows.length} resident{rows.length === 1 ? "" : "s"}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="bg-sand/50 text-xs uppercase tracking-wider text-ink/60">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Access</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Directory</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="px-4 py-4 text-ink/50" colSpan={7}>Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td className="px-4 py-4 text-ink/50" colSpan={7}>{emptyMessage}</td></tr>
              )}
              {!loading && renderResidentRows(rows)}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="mb-8 grid gap-5 lg:grid-cols-2">
        <form onSubmit={addResident} className="space-y-3 rounded-xl border border-ink/10 p-5">
          <p className="font-display text-lg text-marina">Add a resident</p>
          <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="First name"
            value={newResident.firstName}
            onChange={(e) => setNewResident({ ...newResident, firstName: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="Last name"
            value={newResident.lastName}
            onChange={(e) => setNewResident({ ...newResident, lastName: e.target.value })}
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
          <button type="submit" disabled={adding} className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50">
            {adding ? "Adding…" : "Add resident"}
          </button>
        </form>

        <section className="space-y-3 rounded-xl border border-ink/10 p-5">
          <div>
            <p className="font-display text-lg text-marina">Export Residents</p>
            <p className="mt-1 text-sm text-ink/60">
              Download the full resident roster as a CSV file.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadResidentsCsv(residents)}
            disabled={loading || residents.length === 0}
            className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export Residents
          </button>
        </section>
      </div>

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

      {renderPendingRegistrations()}
      {renderResidentTable("Administrators", adminResidents, "No administrators match.")}
      {renderResidentTable("Residents", regularResidents, "No residents match.")}
    </div>
  );
}
