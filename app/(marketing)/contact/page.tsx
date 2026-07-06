import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-dune">Get in touch</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Contact the HOA</h1>
        <p className="mt-4 text-ink/70">
          For anything account-related, sign in and use the intranet — it
          reaches the board faster than email does. For general inquiries:
        </p>
        <dl className="mt-8 space-y-4 text-ink/80">
          <div>
            <dt className="text-xs uppercase tracking-wider text-dune">Office</dt>
            <dd>142 Shoreline Lane, Sandpiper Cove, CA 93109</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-dune">Email</dt>
            <dd>board@sandpipercove.example</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-dune">Office hours</dt>
            <dd>Tuesdays &amp; Thursdays, 9am–1pm</dd>
          </div>
        </dl>
      </main>
      <SiteFooter />
    </>
  );
}
