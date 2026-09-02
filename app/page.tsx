import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HarborBoard from "@/components/HarborBoard";
import { ArrowRight, CloudRain, ExternalLink, TriangleAlert } from "lucide-react";



export default function HomePage() {
  const services = [
    {
      mark: "01",
      title: "Announcements",
      copy: "Board updates, closures, and safety notices in one clear community feed.",
      href: "/sign-in",
    },
    {
      mark: "02",
      title: "Resident directory",
      copy: "Find a neighbor by name or street, with privacy controlled by each resident.",
      href: "/sign-in",
    },
    {
      mark: "03",
      title: "Documents",
      copy: "Bylaws, budgets, meeting minutes, and community forms in one organized place.",
      href: "/sign-in",
    },
    {
      mark: "04",
      title: "Community corner",
      copy: "Lost and found, local listings, maintenance requests, and neighbor-to-neighbor help.",
      href: "/sign-in",
    },
  ];



  return (
    <div className="site-frame">
      <SiteHeader />

      <main>
        <section className="hero-beach">
          <div className="mx-auto flex min-h-[620px] max-w-6xl flex-col items-center justify-center px-6 py-16 text-center text-white">
            <div className="max-w-3xl">
              <p className="eyebrow text-white/80">Welcome to the coast</p>
              <h1 className="mt-4 text-5xl font-bold uppercase leading-[0.92] tracking-[-0.055em] drop-shadow-md sm:text-7xl md:text-8xl">
                La Conchita
                <span className="block text-white/95">Beach</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/90 drop-shadow sm:text-lg">
                A close-knit California beach community between the bluffs and the Pacific —
                where neighbors share news, lend a hand, and meet at the water&apos;s edge.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/sign-up"
                  className="rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-marina shadow-lg transition hover:-translate-y-0.5"
                >
                  Join the community
                </Link>
                <Link
                  href="/about"
                  className="rounded-full border border-white/55 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur transition hover:bg-white/20"
                >
                  Discover La Conchita
                </Link>
              </div>
            </div>
            <div className="mt-12 w-full max-w-4xl">
              <HarborBoard />
            </div>
          </div>
          <div className="hero-wave-divider pt-10" aria-hidden="true">
            <svg
            
              viewBox="0 0 1440 150"
              preserveAspectRatio="none"
              focusable="false"
            >
              <path
                className="hero-wave-divider__back"
                d="M0 89C112 34 203 125 322 91C446 55 493 5 607 48C711 87 766 121 878 70C1001 14 1067 95 1178 78C1284 62 1340 23 1440 65V150H0Z"
              />
              <path
                className="hero-wave-divider__middle"
                d="M0 105C104 65 182 132 294 106C402 81 467 39 576 78C689 119 765 132 871 93C978 53 1041 50 1146 96C1250 142 1347 65 1440 92V150H0Z"
              />
              <path
                className="hero-wave-divider__front"
                d="M0 121C101 92 198 139 303 119C411 98 493 75 600 105C706 135 794 143 904 116C1013 89 1106 100 1210 124C1307 147 1376 107 1440 111V150H0Z"
              />
            </svg>
          </div>
        </section>





        <section className="bg-white px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="eyebrow text-marina">Resident services</p>
              <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">
                Everything close to home
              </h2>
              <p className="mt-4 text-ink/60">
                One simple place for the information, resources, and small moments that keep
                our beach community connected.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <Link
                  key={service.title}
                  href={service.href}
                  data-mark={service.mark}
                  className="service-card rounded-2xl p-6 transition hover:-translate-y-1 hover:border-marina/35 hover:shadow-xl"
                >
                  <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-ink">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/60">{service.copy}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-marina">
                    Open portal
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>






        <section className="preparedness-section px-6 py-20 sm:px-10" aria-labelledby="preparedness-heading">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow text-white/75">town hall</p>
              <h2 id="preparedness-heading" className="mt-3 text-4xl font-bold uppercase tracking-[-0.05em] text-white sm:text-5xl">Community preparedness</h2>
              <p className="mx-auto mt-4 max-w-2xl text-white/80">Understanding La Conchita&apos;s hillside, rainfall patterns, and emergency resources helps us stay ready together.</p>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <article className="rounded-[1.75rem] bg-white p-7 shadow-xl shadow-deep-ocean/10 sm:p-9">
                <h3 className="text-2xl font-bold tracking-[-0.04em] text-marina sm:text-3xl">History of a hillside</h3>
                <p className="mt-4 leading-7 text-ink/70">La Conchita&apos;s hillside has been active for thousands of years. Long before the area was first settled in the 1920s, slide activity had been commonly reported in the press since 1865. Major slide events in 1889 and 1909 interrupted railroad service along the coast.</p>
                <p className="mt-4 leading-7 text-ink/70">Modern studies show the bluff is part of an ancient, slow-moving landslide system that can become unstable after periods of heavy rain.</p>
                <div className="mt-7 border-t border-marina/10 pt-6">
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-marina">Ongoing concerns</h3>
                  <p className="mt-3 leading-7 text-ink/70">The potential for landslide and debris flow activity continues to be a concern, particularly when wet weather patterns are anticipated. Situational awareness is key. Land movement indicators include changes in hillside appearance, loud noises, cracks, bulging at the base, leaning trees, and water drainage.</p>
                  <p className="mt-4 font-bold text-marina">If the situation looks or feels dangerous…LEAVE!</p>
                </div>
              </article>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <article className="rounded-[1.75rem] bg-white p-7 shadow-xl shadow-deep-ocean/10">
                  <div className="flex items-start justify-between gap-4"><div><h3 className="text-2xl font-bold tracking-[-0.04em] text-marina">Rainfall thresholds</h3><p className="mt-2 text-ink/65">Stay alert when it rains. Historically, these thresholds are linked to land movement:</p></div><CloudRain className="h-10 w-10 shrink-0 text-ocean" aria-hidden="true" /></div>
                  <ul className="mt-5 space-y-2 text-sm font-bold text-marina"><li className="flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-coral" aria-hidden="true" />1 inch of rain per hour</li><li className="pl-6">8 inches of rain within two weeks</li><li className="pl-6">15 inches of rain within 30 days</li></ul>
                </article>
                <article className="rounded-[1.75rem] bg-white p-7 shadow-xl shadow-deep-ocean/10">
                  <h3 className="text-2xl font-bold tracking-[-0.04em] text-marina">Key contacts &amp; hotlines</h3>
                  <ul className="mt-5 space-y-4 text-sm leading-6 text-ink/70">
                    <li><strong className="text-ink">Incident Information Hotline:</strong><br />(805) 465-6650</li>
                    <li><strong className="text-ink">Sheriff Emergency Services Business Line:</strong><br />(805) 322-4679</li>
                    <li><strong className="text-ink">VC Alert Help / Registration:</strong> Register online via <a href="https://ready.venturacounty.gov/" target="_blank" rel="noreferrer" className="font-bold text-marina underline underline-offset-4">Ready Ventura County</a> or call (888) 772-4482.</li>
                    <li><strong className="text-ink">Ventura County Fire Department:</strong><br />(805) 389-9710</li>
                  </ul>
                </article>
              </div>
            </div>
            <article className="mt-5 rounded-[1.75rem] bg-white p-7 shadow-xl shadow-deep-ocean/10 sm:p-9">
              <h3 className="text-2xl font-bold tracking-[-0.04em] text-marina sm:text-3xl">Resources</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <a href="https://readyventuracounty.org" target="_blank" rel="noreferrer" className="resource-link"><span className="text-lg font-bold">Get Ready, Stay Ready</span><span className="mt-1 text-sm text-ink/60">Ready Ventura County</span><ExternalLink className="mt-3 h-4 w-4" aria-hidden="true" /></a>
                <a href="https://vcalert.org" target="_blank" rel="noreferrer" className="resource-link"><span className="text-lg font-bold">Stay Informed</span><span className="mt-1 text-sm text-ink/60">VC Alert emergency notifications</span><ExternalLink className="mt-3 h-4 w-4" aria-hidden="true" /></a>
                <a href="https://vcemergency.com" target="_blank" rel="noreferrer" className="resource-link"><span className="text-lg font-bold">Emergency information</span><span className="mt-1 text-sm text-ink/60">Ventura County emergency services</span><ExternalLink className="mt-3 h-4 w-4" aria-hidden="true" /></a>
              </div>
            </article>
          </div>
        </section>

        <section className="grid bg-sand md:grid-cols-2">
          <div className="min-h-[360px] bg-[url('/beach-cleanup-1536x880.jpg')] bg-cover bg-center" />
          <div className="flex items-center px-8 py-16 sm:px-14">
            <div className="max-w-lg">
              <p className="eyebrow text-marina">Life by the water</p>
              <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">
                More than a place on the map
              </h2>
              <p className="mt-5 leading-7 text-ink/65">
                Beach cleanups, neighborhood gatherings, shared resources, and everyday
                check-ins make La Conchita feel like home. The resident portal keeps all of
                it within easy reach.
              </p>
              <Link
                href="/events"
                className="mt-7 inline-flex rounded-full bg-marina px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-marina-light"
              >
                See what&apos;s happening
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-marina py-14 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
            <div>
              <p className="eyebrow text-white/65">For neighbors</p>
              <h2 className="mt-2 text-3xl font-bold uppercase tracking-[-0.04em]">
                Your community is one login away.
              </h2>
            </div>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-marina transition hover:bg-sand"
            >
              Resident login
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>


        <section className="grid bg-sand md:grid-cols-2">		  
          <div className="flex items-center px-8 py-16 sm:px-14">
            <div className="max-w-lg">
              <p className="eyebrow text-marina">About La Conchita</p>
              <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">A small place with a big horizon</h2>
              <p className="mt-5 text-ink/60">La Conchita sits between the coastal bluffs and the Pacific, a compact neighborhood shaped by salt air, ocean views, and the easy familiarity of people who know the same stretch of beach.</p>
              <p className="mt-4 text-ink/60">The community shares responsibility for the paths, common areas, neighborhood gatherings, and the practical work of caring for a place this close to the water. Residents are always welcome to take part and stay informed.</p>
              <p className="mt-4 text-ink/60">This site is our public front door. Residents have a second, private door for directory lookups, community requests, shared documents, and the announcements that keep everyday life moving.</p>
            </div>
          </div>
          <div className="min-h-[360px] bg-[url('/beach-access.png')] bg-cover bg-center" />
		  
        </section>


      </main>

      <SiteFooter />
    </div>
  );
}
