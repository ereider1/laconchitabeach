"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Bell,
  CalendarDays,
  FileText,
  Mail,
  Images,
  Megaphone,
  MessageCircle,
  Users,
  LayoutTemplate,
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
  { href: "/portal/admin/page-builder", label: "Page Builder", icon: LayoutTemplate, bg: "bg-dune" },
  { href: "/portal/admin/emails", label: "Emails", icon: Mail, bg: "bg-marina" },
  { href: "/portal/admin/photo-gallery", label: "Photo Gallery", icon: Images, bg: "bg-coral" },
];

export default function AdminNavGrid({ pendingRegistrationCount = 0 }: { pendingRegistrationCount?: number }) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(pendingRegistrationCount);

  useEffect(() => {
    let isActive = true;

    async function refreshPendingCount() {
      try {
        const response = await fetch("/api/admin/residents/pending-count");
        const result: { count?: number } = await response.json();
        if (response.ok && typeof result.count === "number" && isActive) {
          setPendingCount(result.count);
        }
      } catch {
        // Keep the server-rendered count when a refresh is temporarily unavailable.
      }
    }

    const intervalId = window.setInterval(() => void refreshPendingCount(), 60_000);
    window.addEventListener("focus", refreshPendingCount);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshPendingCount);
    };
  }, []);

  return (
    <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-9">
      {tiles.map((t) => {
        const active = pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative flex flex-col items-center gap-2 rounded-2xl px-2 py-5 text-center transition ${t.bg} ${
              active ? "ring-2 ring-ink/40 ring-offset-2" : "opacity-90 hover:opacity-100"
            }`}
          >
            {t.href === "/portal/admin/profiles" && pendingCount > 0 && (
              <span
                className="absolute right-2 top-2 inline-flex min-w-6 items-center justify-center gap-1 rounded-full bg-coral px-1.5 py-1 text-[10px] font-bold leading-none text-white shadow-sm"
                aria-label={`${pendingCount} pending registration${pendingCount === 1 ? "" : "s"}`}
                title={`${pendingCount} pending registration${pendingCount === 1 ? "" : "s"}`}
              >
                <Bell className="h-3 w-3" aria-hidden="true" />
                {pendingCount}
              </span>
            )}
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
