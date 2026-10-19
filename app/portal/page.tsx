import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Announcement from "@/lib/models/Announcement";
import Event from "@/lib/models/Event";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
import Resident from "@/lib/models/Resident";
import MyCommunityPosts from "@/components/MyCommunityPosts";
import { hasApprovedResidentAccess } from "@/lib/registration";

async function getDashboardData(clerkUserId: string) {
  await connectToDatabase();
  const [hasProfile, announcements, events, myPosts] = await Promise.all([
    Resident.exists({ clerkUserId }),
    Announcement.find().sort({ createdAt: -1 }).limit(2).lean(),
    Event.find({ startsAt: { $gte: new Date() } }).sort({ startsAt: 1 }).lean(),
    MaintenanceRequest.find({ submittedByClerkId: clerkUserId }).sort({ createdAt: -1 }).lean(),
  ]);
  return {
    hasProfile: !!hasProfile,
    announcements: JSON.parse(JSON.stringify(announcements)),
    events: JSON.parse(JSON.stringify(events)),
    myPosts: JSON.parse(JSON.stringify(myPosts)),
  };
}

export default async function PortalDashboard() {
  const { userId } = await auth();
  if (userId && !(await hasApprovedResidentAccess(userId))) return null;
  const user = await currentUser();
  const firstName = user?.firstName ?? "neighbor";

  let announcements: Array<{
    _id: string;
    title: string;
    body: string;
    category: string;
    createdAt: string;
  }> = [];
  let events: Array<{ _id: string; title: string }> = [];
  let myPosts: Array<{
    _id: string;
    address: string;
    category: string;
    description: string;
    status: "open" | "in-progress" | "resolved";
    photoUrl?: string;
    createdAt: string;
  }> = [];
  let dbError = false;
  let hasProfile = true;

  try {
    const data = await getDashboardData(userId ?? "");
    hasProfile = data.hasProfile;
    announcements = data.announcements;
    events = data.events;
    myPosts = data.myPosts;
  } catch {
    dbError = true;
  }

  // New residents complete their directory profile before seeing the dashboard.
  if (!dbError && !hasProfile) redirect("/portal/profile");

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-dune">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          timeZone: "America/Los_Angeles",
        })}
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink">Welcome back, {firstName}.</h1>

      {dbError && (
        <p className="mt-6 rounded-lg border border-dune/30 bg-sand/40 p-4 text-sm text-ink/60">
          Connect MongoDB (see .env.example) to see live announcements and requests here.
        </p>
      )}

      <div className="mt-5">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-marina">Latest announcements</h2>
            <Link href="/portal/announcements" className="text-sm text-marina underline underline-offset-4">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {announcements.length === 0 && !dbError && (
              <p className="text-sm text-ink/60">Nothing posted yet.</p>
            )}
            {announcements.map((a) => (
              <details key={a._id} className="group rounded-lg border border-ink/10 p-4">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="block font-medium text-ink">{a.title}</span>
                  <span className="mt-1 block text-xs text-ink/50">
                    Posted {new Date(a.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="mt-1 hidden text-sm text-ink/60 group-open:hidden sm:line-clamp-2 sm:block">{a.body}</span>
                  <span className="mt-2 inline-block text-xs font-semibold text-marina underline underline-offset-4 group-open:hidden">
                    Read full announcement
                  </span>
                  <span className="mt-2 hidden text-xs font-semibold text-marina underline underline-offset-4 group-open:inline-block">
                    Show less
                  </span>
                </summary>
                <p className="mt-3 border-t border-ink/10 pt-3 text-sm text-ink/70">{a.body}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-marina">Upcoming events</h2>
            <Link href="/portal/events" className="text-sm text-marina underline underline-offset-4">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {events.length === 0 && !dbError && (
              <p className="text-sm text-ink/60">No upcoming events.</p>
            )}
            {events.map((event) => (
              <Link
                key={event._id}
                href={`/portal/events#event-${event._id}`}
                className="block rounded-lg border border-ink/10 p-4 font-medium text-ink transition hover:border-marina/30 hover:text-marina"
              >
                {event.title}
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg text-marina">My Community Corner Posts</h2>
          {dbError ? (
            <p className="text-sm text-ink/60">Could not load your posts right now.</p>
          ) : (
            <MyCommunityPosts posts={myPosts} />
          )}
        </section>
      </div>
    </div>
  );
}
