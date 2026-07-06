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
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-dune">Community calendar</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Public events</h1>
        <p className="mt-4 text-ink/70">
          Open-to-everyone gatherings. Residents see the full calendar,
          including HOA meetings and RSVP counts, in the intranet.
        </p>

        <div className="mt-10 space-y-4">
          {dbError && (
            <p className="rounded-lg border border-dune/30 bg-white/60 p-4 text-sm text-ink/60">
              Connect a MongoDB database to show live events here.
            </p>
          )}
          {!dbError && events.length === 0 && (
            <p className="rounded-lg border border-dune/30 bg-white/60 p-4 text-sm text-ink/60">
              Nothing on the public calendar right now — check back soon.
            </p>
          )}
          {events.map((e) => (
            <div key={e._id} className="rounded-xl border border-ink/10 bg-white/60 p-6">
              <p className="font-mono text-xs uppercase tracking-wider text-dune">
                {new Date(e.startsAt).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <h3 className="mt-1 font-display text-xl text-marina">{e.title}</h3>
              <p className="mt-1 text-sm text-ink/70">{e.location}</p>
              <p className="mt-3 text-sm text-ink/70">{e.description}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
