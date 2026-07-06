import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

const links = [
  { href: "/about", label: "About the Cove" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-fog/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl tracking-tight text-marina">
          Sandpiper Cove
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink/70 transition hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="rounded-full border border-marina px-4 py-2 text-sm font-medium text-marina transition hover:bg-marina hover:text-fog"
            >
              Resident Login
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-coral px-4 py-2 text-sm font-medium text-ink transition hover:brightness-95"
            >
              Sign Up
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/portal"
              className="rounded-full bg-marina px-4 py-2 text-sm font-medium text-fog transition hover:bg-marina-light"
            >
              Go to Intranet
            </Link>
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
