import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { connectToDatabase } from "@/lib/mongodb";
import Announcement from "@/lib/models/Announcement";
import Event from "@/lib/models/Event";
import Resident from "@/lib/models/Resident";
import AnnouncementMediaCarousel from "@/components/AnnouncementMediaCarousel";
import PortalCalendarPage from "@/app/portal/calendar/page";
import { hasApprovedResidentAccess } from "@/lib/registration";
import ResidentComments from "@/components/ResidentComments";

async function getDashboardData(clerkUserId: string) {
  await connectToDatabase();
  const [hasProfile, announcements, events] = await Promise.all([
    Resident.exists({ clerkUserId }),
    Announcement.find({ status: { $ne: "archived" } }).sort({ createdAt: -1 }).limit(2).lean(),
    Event.find({ startsAt: { $gte: new Date() } }).sort({ startsAt: 1 }).lean(),
  ]);
  return {
    hasProfile: !!hasProfile,
    announcements: JSON.parse(JSON.stringify(announcements.map((announcement) => ({
      ...announcement,
      imageDocumentIds: announcement.imageDocumentIds?.length
        ? announcement.imageDocumentIds
        : announcement.imageDocumentId
          ? [announcement.imageDocumentId]
          : [],
    })))),
    events: JSON.parse(JSON.stringify(events)),
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
    imageDocumentIds: string[];
  }> = [];
  let events: Array<{ _id: string; title: string }> = [];
  let dbError = false;
  let hasProfile = true;

  try {
    const data = await getDashboardData(userId ?? "");
    hasProfile = data.hasProfile;
    announcements = data.announcements;
    events = data.events;
  } catch {
    dbError = true;
  }

  // New residents complete their directory profile before seeing the dashboard.
  if (!dbError && !hasProfile) redirect("/portal/profile");

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-dune">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          timeZone: "America/Los_Angeles",
        })}
      </p>
      <h1 className="mt-2 font-display text-2xl text-ink">Welcome back, {firstName}.</h1>

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
                  <span className="flex items-start justify-between gap-3">
                    <span className="block min-w-0">
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
                    </span>
                    {a.imageDocumentIds.length > 0 && (
                      <span className="relative mt-1 block h-14 w-16 shrink-0 overflow-hidden rounded-md bg-sand">
                        <Image
                          src={`/api/announcements/${a._id}/image?documentId=${encodeURIComponent(a.imageDocumentIds[0])}`}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-ink/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {a.imageDocumentIds.length} {a.imageDocumentIds.length === 1 ? "photo" : "photos"}
                        </span>
                      </span>
                    )}
                  </span>
                </summary>
                <div className="mt-3 border-t border-ink/10 pt-3">
                  <p className="text-sm text-ink/70">{a.body}</p>
                  {a.imageDocumentIds.length > 0 && (
                    <div className="mt-4 max-w-md">
                      <AnnouncementMediaCarousel
                        announcementId={a._id}
                        imageDocumentIds={a.imageDocumentIds}
                      />
                    </div>
                  )}
                  <ResidentComments targetType="announcement" targetId={a._id} />
                </div>
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
              <div key={event._id} className="rounded-lg border border-ink/10 p-4">
                <Link
                  href={`/portal/events#event-${event._id}`}
                  className="block font-medium text-ink transition hover:text-marina"
                >
                  {event.title}
                </Link>
                <ResidentComments targetType="event" targetId={event._id} />
              </div>
            ))}
          </div>
        </section>
        <section className="mt-10 border-t border-ink/10 pt-8">
          <PortalCalendarPage />
        </section>
      </div>
    </div>
  );
}
