import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function AboutPage() {
  return (
    <div className="site-frame">
      <SiteHeader />
      <main>
        <section className="subpage-hero">
          <div>
            <p className="eyebrow text-white/75">Since 1962</p>
            <h1 className="mt-3 text-4xl font-bold uppercase tracking-[-0.05em] sm:text-6xl">
              About La Conchita
            </h1>
          </div>
        </section>
        <section className="content-card relative max-w-3xl px-7 py-10 sm:px-12 sm:py-14">
          <p className="eyebrow text-marina">A small place with a big horizon</p>
          <div className="mt-6 space-y-6 text-base leading-8 text-ink/70 sm:text-lg">
            <p>
              La Conchita sits between the coastal bluffs and the Pacific, a
              compact neighborhood shaped by salt air, ocean views, and the
              easy familiarity of people who know the same stretch of beach.
            </p>
            <p>
              The community shares responsibility for the paths, common areas,
              neighborhood gatherings, and the practical work of caring for a
              place this close to the water. Residents are always welcome to
              take part and stay informed.
            </p>
            <p>
              This site is our public front door. Residents have a second,
              private door for directory lookups, community requests, shared
              documents, and the announcements that keep everyday life moving.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
