import Link from "next/link";
import Image from "next/image";
import { Show, UserButton } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";

const links = [
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-5 px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 md:h-10 md:w-10">
            <Image
              src="/favicon/favicon-64x64.png"
              alt=""
              width={48}
              height={48}
              className="md:h-10 md:w-10"
              priority
            />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight">La Conchita</span>
            <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 md:tracking-[0.26em]">
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
          </Show>
          <Show when="signed-in">
            <Link
              href="/portal"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-marina transition hover:bg-sand"
            >
              Dashboard
            </Link>
            <UserButton
              userProfileProps={{
                appearance: {
                  elements: {
                    navbarButton__apiKeys: { display: "none" },
                  },
                },
              }}
            />
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
