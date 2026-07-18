import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { connectToDatabase } from "@/lib/mongodb";
import Event from "@/lib/models/Event";

async function getPublicEvents() {
  await connectToDatabase();
  const events = await Event.find({ isPublic: true, startsAt: { $gte: new Date() } })
    .sort({ startsAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(events));
}

export default async function EventsPage() {
  let events: Array<{ _id: string; title: string; description: string; location: string; startsAt: string }> = [];
  let dbError = false;

  try {
    events = await getPublicEvents();
  } catch {
    // No MONGODB_URI configured yet, or DB unreachable — show empty state
    // instead of crashing the page.
    dbError = true;
  }

  return (
    <div className="site-frame">
      <SiteHeader />
      <main>
        <section className="subpage-hero">
          <div>
            <p className="eyebrow text-white/75">Community calendar</p>
            <h1 className="mt-3 text-4xl font-bold uppercase tracking-[-0.05em] sm:text-6xl">
              Events by the sea
            </h1>
          </div>
        </section>
        <section className="content-card relative max-w-3xl px-7 py-10 sm:px-12 sm:py-14">
          <p className="leading-7 text-ink/65">
            Open-to-everyone gatherings. Residents see the full calendar,
            including community meetings and RSVP counts, in the portal.
          </p>
          <div className="mt-8 space-y-4">
          {dbError && (
            <p className="rounded-xl border border-marina/15 bg-sand/40 p-5 text-sm text-ink/60">
              Connect a MongoDB database to show live events here.
            </p>
          )}
          {!dbError && events.length === 0 && (
            <p className="rounded-xl border border-marina/15 bg-sand/40 p-5 text-sm text-ink/60">
              Nothing on the public calendar right now — check back soon.
            </p>
          )}
          {events.map((e) => (
            <div key={e._id} className="rounded-2xl border border-marina/15 bg-white p-6 shadow-sm">
              <p className="eyebrow text-marina">
                {new Date(e.startsAt).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <h3 className="mt-2 text-xl font-bold uppercase tracking-tight text-ink">{e.title}</h3>
              <p className="mt-1 text-sm text-ink/70">{e.location}</p>
              <p className="mt-3 text-sm text-ink/70">{e.description}</p>
            </div>
          ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
