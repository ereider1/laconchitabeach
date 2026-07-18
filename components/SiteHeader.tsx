import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { ChevronDown, Waves } from "lucide-react";

const links = [
  { href: "/about", label: "About La Conchita" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-5 px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-white/10">
            <Waves className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight">La Conchita</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.26em] text-white/70">
              Beach Community
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="rounded-full border border-white/45 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-white hover:text-marina"
            >
              Resident Login
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-marina transition hover:bg-sand"
            >
              Sign Up
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/portal"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-marina transition hover:bg-sand"
            >
              Go to Intranet
            </Link>
            <UserButton />
          </Show>
        </div>
      </div>
      <details className="group border-t border-white/15 md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
          Explore
          <ChevronDown
            className="h-4 w-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <nav className="grid gap-1 bg-ink/20 px-4 pb-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-4 py-3 text-center text-sm font-medium text-white hover:bg-white/10">
              {l.label}
            </Link>
          ))}
        </nav>
      </details>
    </header>
  );
}
