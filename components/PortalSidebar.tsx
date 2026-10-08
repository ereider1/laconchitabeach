"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import {
  CalendarDays,
  FileText,
  Gauge,
  Menu,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";

const links: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}> = [
  { href: "/portal", label: "Dashboard", icon: Gauge, exact: true },
  { href: "/portal/announcements", label: "Announcements", icon: Megaphone },
  { href: "/portal/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/portal/directory", label: "Directory", icon: UsersRound },
  { href: "/portal/documents", label: "Documents", icon: FileText },
  { href: "/portal/events", label: "Events & RSVPs", icon: Sparkles },
  { href: "/portal/maintenance", label: "Community Corner", icon: MessageCircle },
  { href: "/portal/profile", label: "My profile", icon: UserRound },
];

export default function PortalSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navLinks = [
    ...links.filter((link) => link.href !== "/portal/documents" || isAdmin),
    ...(isAdmin ? [{ href: "/portal/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col justify-between bg-ink px-5 py-4 text-white md:w-64 md:py-6">
      <div className="flex items-center justify-between md:block">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10">
            <Waves className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="font-semibold leading-tight">
            La Conchita
            <span className="block text-[10px] uppercase tracking-[0.2em] text-white/45">California coast</span>
          </span>
        </Link>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white md:hidden"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="portal-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        id="portal-navigation"
        className={`${isMenuOpen ? "mt-5" : "hidden"} md:mt-0 md:block`}
      >
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
          Resident Intranet
        </p>

        <nav className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-3 md:flex md:flex-col">
          {navLinks.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-marina text-white shadow-lg"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
          <UserButton />
          <span className="text-xs text-white/50">Signed in</span>
        </div>
      </div>
    </aside>
  );
}
