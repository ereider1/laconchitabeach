"use client";

import { useEffect, useState } from "react";

type Resident = {
  _id: string;
  fullName: string;
  address: string;
  email: string;
  phone?: string;
  moveInYear?: number;
};

export default function DirectoryPage() {
  const [q, setQ] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/directory?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setResidents(data.residents ?? []);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message ?? "Failed to load directory");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [q]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Resident directory</h1>
      <p className="mt-2 text-ink/60">
        Only residents who&apos;ve opted in to the directory appear here.
      </p>

      <input
        className="mt-6 w-full max-w-sm rounded-lg border border-ink/15 px-4 py-2 text-sm"
        placeholder="Search by name or street…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="mt-6 overflow-hidden rounded-xl border border-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-wider text-ink/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={4}>Loading…</td></tr>
            )}
            {!loading && error && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={4}>Connect MongoDB to load the directory.</td></tr>
            )}
            {!loading && !error && residents.length === 0 && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={4}>No matches.</td></tr>
            )}
            {residents.map((r) => (
              <tr key={r._id} className="border-t border-ink/10">
                <td className="px-4 py-3 font-medium text-ink">{r.fullName}</td>
                <td className="px-4 py-3 text-ink/70">{r.address}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink/60">{r.email}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink/60">{r.phone ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
