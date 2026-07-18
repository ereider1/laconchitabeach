"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tiles = [
  { href: "/portal/admin/announcements", label: "Announcements", icon: "📣", bg: "bg-coral" },
  { href: "/portal/admin/events", label: "Calendar & Events", icon: "📅", bg: "bg-marina" },
  { href: "/portal/admin/directory", label: "Directory", icon: "📖", bg: "bg-driftwood" },
  { href: "/portal/admin/profiles", label: "Profiles", icon: "👤", bg: "bg-dune" },
  { href: "/portal/admin/documents", label: "Documents", icon: "📄", bg: "bg-ink" },
  { href: "/portal/admin/community-corner", label: "Community Corner", icon: "💬", bg: "bg-marina-light" },
];

export default function AdminNavGrid() {
  const pathname = usePathname();

  return (
    <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
      {tiles.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-5 text-center transition ${t.bg} ${
              active ? "ring-2 ring-ink/40 ring-offset-2" : "opacity-90 hover:opacity-100"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {t.icon}
            </span>
            <span className="font-display text-xs font-semibold leading-tight text-fog">
              {t.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
