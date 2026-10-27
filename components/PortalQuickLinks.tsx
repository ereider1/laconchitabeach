"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BookOpen, Gauge, Megaphone, MessageCircle, type LucideIcon } from "lucide-react";

const links: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  bg: string;
}> = [
  { href: "/portal", label: "Dashboard", icon: Gauge, bg: "bg-ink" },
  { href: "/portal/announcements", label: "Announcements", icon: Megaphone, bg: "bg-coral" },
  { href: "/portal/calendar", label: "Events", icon: CalendarDays, bg: "bg-marina" },
  { href: "/portal/maintenance", label: "Community Corner", icon: MessageCircle, bg: "bg-marina-light" },
  { href: "/portal/directory", label: "Directory", icon: BookOpen, bg: "bg-driftwood" },
];

export default function PortalQuickLinks() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/portal" ? pathname === href : pathname.startsWith(href);

  return (
    <nav aria-label="Quick links" className="grid grid-cols-5 gap-2 sm:gap-3">
      {links.map(({ href, label, icon: Icon, bg }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-1 text-center opacity-90 transition hover:opacity-100 sm:min-h-16 sm:gap-1.5 sm:rounded-2xl sm:px-2 sm:py-2 ${bg} ${isActive(href) ? "ring-2 ring-ink/40 ring-offset-2 opacity-100" : ""}`}
        >
          <Icon className="h-5 w-5 text-fog sm:h-6 sm:w-6" strokeWidth={1.8} aria-hidden="true" />
          <span className="hidden font-display text-xs font-semibold leading-tight text-fog sm:block">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
