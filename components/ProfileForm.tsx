"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Defaults = {
  fullName: string;
  address: string;
  email: string;
  phone: string;
  moveInYear: string;
  listedInDirectory: boolean;
};

export default function ProfileForm({
  defaults,
  isNewProfile,
}: {
  defaults: Defaults;
  isNewProfile: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          moveInYear: form.moveInYear ? Number(form.moveInYear) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save profile");
      setSaved(true);
      if (isNewProfile) router.push("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-ink/10 p-5">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-ink/60">
          Full name
        </label>
        <input
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-ink/60">
          Address
        </label>
        <input
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-ink/60">
            Email
          </label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-ink/60">
            Phone (optional)
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-ink/60">
          Move-in year (optional)
        </label>
        <input
          className="mt-1 w-full max-w-[8rem] rounded-lg border border-ink/15 px-3 py-2 text-sm"
          value={form.moveInYear}
          onChange={(e) => setForm({ ...form, moveInYear: e.target.value })}
          inputMode="numeric"
        />
      </div>

      <div className="rounded-lg bg-sand/40 p-4">
        <label className="flex items-start gap-3 text-sm text-ink/80">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.listedInDirectory}
            onChange={(e) => setForm({ ...form, listedInDirectory: e.target.checked })}
          />
          Allow my information to be seen in the Resident Directory
        </label>
        <p className="mt-2 text-xs text-ink/50">
          The directory is still private — even if you opt in, only signed-in La Conchita
          residents can see it. It&apos;s never public on the internet.
        </p>
      </div>

      {error && <p className="text-sm text-coral">{error}</p>}
      {saved && !isNewProfile && (
        <p className="text-sm text-marina">Profile saved.</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
      >
        {saving ? "Saving…" : isNewProfile ? "Save and continue" : "Save changes"}
      </button>
    </form>
  );
}
