import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-dune">
          Since 1962
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">About Sandpiper Cove</h1>
        <div className="prose prose-p:text-ink/75 mt-8 space-y-5 text-lg">
          <p>
            Sandpiper Cove sits on a half-mile of bluff-top and beach-level
            lots south of the harbor. It was platted in the early 1960s as a
            summer-cottage colony and has since become a full-time
            neighborhood of 118 households, a handful of short-term rentals,
            and a lot of opinions about parking.
          </p>
          <p>
            The Homeowners Association maintains the private beach path,
            the bluff stairs, common landscaping, and the little park at the
            end of Shoreline Lane. Day to day, that means mowing, lighting,
            erosion control, and a monthly board meeting that residents are
            always welcome to attend.
          </p>
          <p>
            This site is the public front door. Residents get a second,
            private door — the intranet — for directory lookups,
            maintenance requests, HOA documents, and the announcements that
            used to get lost in email.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
