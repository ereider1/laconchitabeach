"use client";

import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, Search, UsersRound } from "lucide-react";

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
  const [result, setResult] = useState<{
    query: string;
    residents: Resident[];
    error: string | null;
  } | null>(null);
  const currentResult = result?.query === q ? result : null;
  const loading = currentResult === null;
  const residents = currentResult?.residents ?? [];
  const error = currentResult?.error ?? null;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/directory?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setResult({ query: q, residents: data.residents ?? [], error: null });
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setResult({
            query: q,
            residents: [],
            error: err.message ?? "Failed to load directory",
          });
        }
      });
    return () => controller.abort();
  }, [q]);

  return (
    <div>
      <div className="border-b border-ink/10 pb-6 sm:pb-8">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-marina">
          <UsersRound className="h-4 w-4" aria-hidden="true" />
          Community
        </p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Resident directory</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink/60 sm:text-base">
          Only residents who&apos;ve opted in to the directory appear here.
        </p>

        <div className="relative mt-5 max-w-xl sm:mt-6">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search residents by name or street"
            className="w-full rounded-xl border border-ink/15 bg-white py-3 pl-11 pr-4 text-base shadow-sm transition placeholder:text-ink/40 focus:border-marina focus:outline-none focus:ring-2 focus:ring-marina/20"
            placeholder="Search by name or street…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex min-h-6 items-center justify-between gap-3 sm:mt-6">
        <h2 className="text-sm font-semibold text-ink">Neighbors</h2>
        <p className="text-xs text-ink/55" aria-live="polite">
          {loading ? "Loading residents…" : `${residents.length} ${residents.length === 1 ? "resident" : "residents"}`}
        </p>
      </div>

      {!loading && error && (
        <p className="mt-3 rounded-xl border border-ink/10 bg-white/80 p-4 text-sm text-ink/60">
          Connect MongoDB to load the directory.
        </p>
      )}
      {!loading && !error && residents.length === 0 && (
        <p className="mt-3 rounded-xl border border-dashed border-ink/20 bg-white/60 p-6 text-center text-sm text-ink/60">
          No matches. Try another name or street.
        </p>
      )}

      {!loading && !error && residents.length > 0 && (
        <>
          <ul className="mt-3 grid gap-3 xl:hidden">
            {residents.map((r) => (
              <li
                key={r._id}
                className="min-w-0 rounded-xl border border-ink/10 bg-white/90 p-4 shadow-sm sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sand text-sm font-semibold text-marina">
                    {r.fullName
                      .split(/\s+/)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold leading-5 text-ink">{r.fullName}</h3>
                    <p className="mt-1 flex items-start gap-1.5 break-words text-sm leading-5 text-ink/60">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-marina" aria-hidden="true" />
                      {r.address}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 border-t border-ink/10 pt-3 text-sm">
                  <a
                    href={`mailto:${r.email}`}
                    className="flex min-w-0 items-start gap-2 rounded-lg py-1 text-marina underline decoration-marina/30 underline-offset-4"
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="break-all">{r.email}</span>
                  </a>
                  {r.phone && (
                    <a
                      href={`tel:${r.phone}`}
                      className="flex min-w-0 items-center gap-2 rounded-lg py-1 text-ink/70"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-marina" aria-hidden="true" />
                      <span>{r.phone}</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 hidden overflow-hidden rounded-xl border border-ink/10 xl:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-sand/50 text-xs uppercase tracking-wider text-ink/60">
                <tr>
                  <th className="w-[22%] px-4 py-3">Name</th>
                  <th className="w-[24%] px-4 py-3">Address</th>
                  <th className="w-[32%] px-4 py-3">Email</th>
                  <th className="w-[22%] px-4 py-3">Phone</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((r) => (
                  <tr key={r._id} className="border-t border-ink/10">
                    <td className="break-words px-4 py-3 font-medium text-ink">{r.fullName}</td>
                    <td className="break-words px-4 py-3 text-ink/70">{r.address}</td>
                    <td className="break-all px-4 py-3 font-mono text-xs text-ink/60">{r.email}</td>
                    <td className="break-words px-4 py-3 font-mono text-xs text-ink/60">{r.phone ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
