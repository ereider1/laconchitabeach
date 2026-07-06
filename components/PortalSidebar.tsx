"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const links = [
  { href: "/portal", label: "Dashboard", exact: true },
  { href: "/portal/announcements", label: "Announcements" },
  { href: "/portal/calendar", label: "Calendar" },
  { href: "/portal/directory", label: "Directory" },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/events", label: "Events & RSVPs" },
  { href: "/portal/maintenance", label: "Maintenance requests" },
];

export default function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col justify-between border-r border-ink/10 bg-fog px-5 py-6">
      <div>
        <Link href="/" className="font-display text-lg text-marina">
          La Conchita, California
        </Link>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-dune">
          Resident Intranet
        </p>

        <nav className="mt-8 flex flex-col gap-1">
          {links.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-marina text-fog"
                    : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 border-t border-ink/10 pt-4">
        <UserButton />
        <span className="text-xs text-ink/60">Signed in</span>
      </div>
    </aside>
  );
}
