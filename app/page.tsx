import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HarborBoard from "@/components/HarborBoard";

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-ink/10">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(180deg, #F6F3EA 0%, #EDE6D6 55%, #DCD1B6 100%)",
            }}
          />
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.1fr,0.9fr] md:py-28">
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-dune">
                34.41° N, 119.85° W &middot; Est. 1962
              </p>
              <h1 className="font-display text-5xl leading-[1.05] text-ink md:text-6xl">
                A stretch of California coast that still feels like a
                <em className="text-marina"> small town.</em>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-ink/70">
                La Conchita is 118 households between the bluffs and the
                tideline. This is our front porch — and behind resident
                login, our kitchen table.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/sign-up"
                  className="rounded-full bg-marina px-6 py-3 text-sm font-semibold text-fog transition hover:bg-marina-light"
                >
                  Create resident account
                </Link>
                <Link
                  href="/about"
                  className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/40"
                >
                  About the community
                </Link>
              </div>
            </div>

            <div className="flex items-end">
              <HarborBoard />
            </div>
          </div>
        </section>

        {/* What the intranet does */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-dune">
              For residents
            </p>
            <h2 className="mt-2 font-display text-3xl text-ink">
              One login. Everything the HOA used to email you.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Announcements",
                copy: "Board updates, closures, and safety notices in one feed instead of scattered emails.",
              },
              {
                title: "Resident directory",
                copy: "Look up a neighbor by street or last name — as much or as little as they choose to share.",
              },
              {
                title: "Documents & minutes",
                copy: "CC&Rs, bylaws, budgets, and meeting minutes, always the current version.",
              },
              {
                title: "Bulletin Board",
                copy: "Lost & Found, For Sale, Free Stuff, Maintenance Requests...",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-ink/10 bg-white/60 p-6 transition hover:border-marina/40 hover:bg-white"
              >
                <h3 className="font-display text-lg text-marina">{f.title}</h3>
                <p className="mt-2 text-sm text-ink/70">{f.copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Strip photo-style band */}
        <section className="border-y border-ink/10 bg-marina py-16 text-fog">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl">
                118 households. One beach path. Zero BS.
              </h2>
            </div>
            <Link
              href="/sign-in"
              className="whitespace-nowrap rounded-full bg-coral px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-95"
            >
              Resident login &rarr;
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
