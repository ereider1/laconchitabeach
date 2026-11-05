import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HarborBoard from "@/components/HarborBoard";
import CustomPageSections from "@/components/CustomPageSections";
import {
  WeatherDisclosureButton,
  WeatherDisclosurePanel,
  WeatherDisclosureProvider,
} from "@/components/WeatherDisclosure";
import { ArrowRight, CloudRain, ExternalLink, TriangleAlert } from "lucide-react";
import { defaultCommunityPreparednessContent } from "@/lib/communityPreparedness";
import { defaultHomePageContent, isHomePageContent } from "@/lib/homePageContent";
import { connectToDatabase } from "@/lib/mongodb";
import GlobalSettings from "@/lib/models/GlobalSettings";
import { hasApprovedResidentAccess } from "@/lib/registration";



export default async function HomePage() {
  const { userId } = await auth();
  let isResident = false;
  if (userId) {
    try {
      isResident = await hasApprovedResidentAccess(userId);
    } catch (error) {
      console.error("Failed to verify homepage resident access:", error);
    }
  }

  let preparedness = defaultCommunityPreparednessContent;
  let homePageContent = defaultHomePageContent;
  try {
    await connectToDatabase();
    const setting = await GlobalSettings.findOne({ key: "community-preparedness-content" }).lean();
    if (setting?.value && typeof setting.value === "object") {
      preparedness = { ...defaultCommunityPreparednessContent, ...(setting.value as Partial<typeof defaultCommunityPreparednessContent>) };
    }
    const homePageSetting = await GlobalSettings.findOne({ key: "home-page-content" }).lean();
    if (homePageSetting?.value) {
      if (isHomePageContent(homePageSetting.value)) {
        homePageContent = homePageSetting.value;
      } else {
        console.error("Saved homepage content has an invalid shape; using defaults.");
      }
    }
  } catch (error) {
    console.error("Failed to load homepage content:", error);
  }

  return (
    <div className="site-frame">
      <SiteHeader content={homePageContent} />

      <main>
        <WeatherDisclosureProvider>
          <section
            className="hero-beach"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(3, 30, 44, 0.68), rgba(3, 55, 73, 0.5) 46%, rgba(3, 35, 48, 0.68)), url("${homePageContent.heroImageUrl}")`,
            }}
          >
            <div className="mx-auto flex min-h-[620px] max-w-6xl flex-col items-center justify-center px-6 py-16 text-center text-white">
              <div className="max-w-3xl">
                <p className="eyebrow text-white/80">{homePageContent.heroEyebrow}</p>
                <h1 className="mt-4 text-5xl font-bold uppercase leading-[0.92] tracking-[-0.055em] drop-shadow-md sm:text-7xl md:text-8xl">
                  {homePageContent.heroTitle}
                  <span className="block text-white/95">{homePageContent.heroSubtitle}</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/90 drop-shadow sm:text-lg">
                  {homePageContent.heroDescription}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <WeatherDisclosureButton label={homePageContent.heroWeatherLabel} />
                  <Link
                    href={homePageContent.heroLinkHref}
                    className="rounded-full border border-white/55 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur transition hover:bg-white/20"
                  >
                    {homePageContent.heroLinkText}
                  </Link>
                </div>
              </div>
              <WeatherDisclosurePanel>
                <div className="mt-12 mb-12 w-full max-w-5xl">
                  <HarborBoard />
                </div>
              </WeatherDisclosurePanel>
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
        </WeatherDisclosureProvider>

        <CustomPageSections slot="below-hero" isLoggedIn={!!userId} isResident={isResident} />

        <section className="bg-white px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="eyebrow text-marina">{homePageContent.servicesEyebrow}</p>
              <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">{homePageContent.servicesTitle}</h2>
              <p className="mt-4 text-ink/60">
                {homePageContent.servicesDescription}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {homePageContent.services.map((service, index) => (
                <Link
                  key={`${service.title}-${index}`}
                  href={service.href}
                  data-mark={String(index + 1).padStart(2, "0")}
                  className="service-card rounded-2xl p-6 transition hover:-translate-y-1 hover:border-marina/35 hover:shadow-xl"
                >
                  <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-ink">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/60">{service.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-marina">
                    {service.actionText}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <CustomPageSections slot="below-services" isLoggedIn={!!userId} isResident={isResident} />

        <section className="preparedness-section px-6 py-20 sm:px-10" aria-labelledby="preparedness-heading">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow text-white/75">{preparedness.eyebrow}</p>
              <h2 id="preparedness-heading" className="mt-3 text-4xl font-bold uppercase tracking-[-0.05em] text-white sm:text-5xl">{preparedness.title}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-white/80">{preparedness.intro}</p>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <article className="rounded-[1.75rem] bg-white p-7 shadow-xl shadow-deep-ocean/10 sm:p-9">
                <h3 className="text-2xl font-bold tracking-[-0.04em] text-marina sm:text-3xl">{preparedness.historyTitle}</h3>
                {preparedness.historyParagraphs.map((paragraph) => <p key={paragraph} className="mt-4 leading-7 text-ink/70">{paragraph}</p>)}
                <div className="mt-7 border-t border-marina/10 pt-6">
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-marina">{preparedness.concernsTitle}</h3>
                  {preparedness.concernsParagraphs.map((paragraph) => <p key={paragraph} className="mt-3 leading-7 text-ink/70">{paragraph}</p>)}
                  <p className="mt-4 font-bold text-marina">{preparedness.warning}</p>
                </div>
              </article>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <article className="rounded-[1.75rem] bg-white p-7 shadow-xl shadow-deep-ocean/10">
                  <div className="flex items-start justify-between gap-4"><div><h3 className="text-2xl font-bold tracking-[-0.04em] text-marina">{preparedness.rainfallTitle}</h3><p className="mt-2 text-ink/65">{preparedness.rainfallIntro}</p></div><CloudRain className="h-10 w-10 shrink-0 text-ocean" aria-hidden="true" /></div>
                  <ul className="mt-5 space-y-2 text-sm font-bold text-marina">{preparedness.rainfallThresholds.map((threshold, index) => <li key={threshold} className={index === 0 ? "flex items-center gap-2" : "pl-6"}>{index === 0 && <TriangleAlert className="h-4 w-4 text-coral" aria-hidden="true" />}{threshold}</li>)}</ul>
                </article>
                <article className="rounded-[1.75rem] bg-white p-7 shadow-xl shadow-deep-ocean/10">
                  <h3 className="text-2xl font-bold tracking-[-0.04em] text-marina">{preparedness.contactsTitle}</h3>
                  <ul className="mt-5 space-y-4 text-sm leading-6 text-ink/70">{preparedness.contacts.map((contact) => <li key={contact} className="whitespace-pre-line">{contact}</li>)}</ul>
                </article>
              </div>
            </div>
            <article className="mt-5 rounded-[1.75rem] bg-white p-7 shadow-xl shadow-deep-ocean/10 sm:p-9">
              <h3 className="text-2xl font-bold tracking-[-0.04em] text-marina sm:text-3xl">{preparedness.resourcesTitle}</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">{preparedness.resources.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="resource-link"><span className="text-lg font-bold">{resource.title}</span><span className="mt-1 text-sm text-ink/60">{resource.subtitle}</span><ExternalLink className="mt-3 h-4 w-4" aria-hidden="true" /></a>)}</div>
            </article>
          </div>
        </section>

        <section className="grid bg-sand md:grid-cols-2">
          <div className="min-h-[360px] bg-cover bg-center" style={{ backgroundImage: `url("${homePageContent.lifeImageUrl}")` }} />
          <div className="flex items-center px-8 py-16 sm:px-14">
            <div className="max-w-lg">
              <p className="eyebrow text-marina">{homePageContent.lifeEyebrow}</p>
              <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">
                {homePageContent.lifeTitle}
              </h2>
              <p className="mt-5 leading-7 text-ink/65">{homePageContent.lifeDescription}</p>
              <Link
                href={homePageContent.lifeButtonHref}
                className="mt-7 inline-flex rounded-full bg-marina px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-marina-light"
              >
                {homePageContent.lifeButtonText}
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-marina py-14 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
            <div>
              <p className="eyebrow text-white/65">{homePageContent.communityEyebrow}</p>
              <h2 className="mt-2 text-3xl font-bold uppercase tracking-[-0.04em]">
                {homePageContent.communityTitle}
              </h2>
            </div>
            <Link
              href={homePageContent.communityButtonHref}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-marina transition hover:bg-sand"
            >
              {homePageContent.communityButtonText}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>


        <section className="grid bg-sand md:grid-cols-2">
          <div className="flex items-center px-8 py-16 sm:px-14">
            <div className="max-w-lg">
              <p className="eyebrow text-marina">{homePageContent.aboutEyebrow}</p>
              <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">{homePageContent.aboutTitle}</h2>
              {homePageContent.aboutParagraphs.map((paragraph, index) => <p key={`home-about-${index}`} className={`${index === 0 ? "mt-5" : "mt-4"} text-ink/60`}>{paragraph}</p>)}
            </div>
          </div>
          <div className="min-h-[360px] bg-cover bg-center" style={{ backgroundImage: `url("${homePageContent.aboutImageUrl}")` }} />
        </section>

        <CustomPageSections slot="above-footer" isLoggedIn={!!userId} isResident={isResident} />

      </main>

      <SiteFooter content={homePageContent} />
    </div>
  );
}
