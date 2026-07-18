"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  FileText,
  Megaphone,
  MessageCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

const tiles: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  bg: string;
}> = [
  { href: "/portal/admin/announcements", label: "Announcements", icon: Megaphone, bg: "bg-coral" },
  { href: "/portal/admin/events", label: "Calendar & Events", icon: CalendarDays, bg: "bg-marina" },
  { href: "/portal/admin/directory", label: "Directory", icon: BookOpen, bg: "bg-driftwood" },
  { href: "/portal/admin/profiles", label: "Profiles", icon: Users, bg: "bg-dune" },
  { href: "/portal/admin/documents", label: "Documents", icon: FileText, bg: "bg-ink" },
  { href: "/portal/admin/community-corner", label: "Community Corner", icon: MessageCircle, bg: "bg-marina-light" },
];

export default function AdminNavGrid() {
  const pathname = usePathname();

  return (
    <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
      {tiles.map((t) => {
        const active = pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-5 text-center transition ${t.bg} ${
              active ? "ring-2 ring-ink/40 ring-offset-2" : "opacity-90 hover:opacity-100"
            }`}
          >
            <Icon className="h-6 w-6 text-fog" strokeWidth={1.8} aria-hidden="true" />
            <span className="font-display text-xs font-semibold leading-tight text-fog">
              {t.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
