import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Clock3, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="site-frame">
      <SiteHeader />
      <main>
        <section className="subpage-hero">
          <div>
            <p className="eyebrow text-white/75">Get in touch</p>
            <h1 className="mt-3 text-4xl font-bold uppercase tracking-[-0.05em] sm:text-6xl">
              Contact the community
            </h1>
          </div>
        </section>
        <section className="content-card relative max-w-2xl px-7 py-10 sm:px-12 sm:py-14">
          <p className="leading-7 text-ink/65">
            For anything account-related, sign in and use the resident portal —
            it reaches the right person faster. For general inquiries:
          </p>
          <dl className="mt-9 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-sand/55 p-5">
              <dt className="eyebrow flex items-center gap-2 text-marina">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Location
              </dt>
              <dd className="mt-2 text-sm leading-6 text-ink/75">La Conchita, California 93001</dd>
            </div>
            <div className="rounded-2xl bg-sand/55 p-5">
              <dt className="eyebrow flex items-center gap-2 text-marina">
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email
              </dt>
              <dd className="mt-2 text-sm leading-6 text-ink/75">community@laconchitabeach.org</dd>
            </div>
            <div className="rounded-2xl bg-sand/55 p-5 sm:col-span-2">
              <dt className="eyebrow flex items-center gap-2 text-marina">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                Community office hours
              </dt>
              <dd className="mt-2 text-sm leading-6 text-ink/75">Tuesdays &amp; Thursdays, 9am–1pm</dd>
            </div>
          </dl>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
