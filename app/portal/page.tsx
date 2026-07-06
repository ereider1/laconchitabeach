import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Announcement from "@/lib/models/Announcement";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
import Resident from "@/lib/models/Resident";

async function getDashboardData(clerkUserId: string) {
  await connectToDatabase();
  const [hasProfile, announcements, myRequests] = await Promise.all([
    Resident.exists({ clerkUserId }),
    Announcement.find().sort({ pinned: -1, createdAt: -1 }).limit(3).lean(),
    MaintenanceRequest.find({ submittedByClerkId: clerkUserId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
  ]);
  return {
    hasProfile: !!hasProfile,
    announcements: JSON.parse(JSON.stringify(announcements)),
    myRequests: JSON.parse(JSON.stringify(myRequests)),
  };
}

export default async function PortalDashboard() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "neighbor";

  let announcements: Array<{ _id: string; title: string; body: string; category: string }> = [];
  let myRequests: Array<{ _id: string; description: string; status: string }> = [];
  let dbError = false;
  let hasProfile = true;

  try {
    const data = await getDashboardData(user?.id ?? "");
    hasProfile = data.hasProfile;
    announcements = data.announcements;
    myRequests = data.myRequests;
  } catch {
    dbError = true;
  }

  // New residents complete their directory profile before seeing the dashboard.
  if (!dbError && !hasProfile) redirect("/portal/profile");

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-dune">
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink">Welcome back, {firstName}.</h1>

      {dbError && (
        <p className="mt-6 rounded-lg border border-dune/30 bg-sand/40 p-4 text-sm text-ink/60">
          Connect MongoDB (see .env.example) to see live announcements and requests here.
        </p>
      )}

      <div className="mt-10 grid gap-8 md:grid-cols-2">
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
              <div key={a._id} className="rounded-lg border border-ink/10 p-4">
                <p className="font-medium text-ink">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink/60">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-marina">Your maintenance requests</h2>
            <Link href="/portal/maintenance" className="text-sm text-marina underline underline-offset-4">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {myRequests.length === 0 && !dbError && (
              <p className="text-sm text-ink/60">You haven&apos;t submitted any requests.</p>
            )}
            {myRequests.map((r) => (
              <div key={r._id} className="flex items-center justify-between rounded-lg border border-ink/10 p-4">
                <p className="text-sm text-ink/80">{r.description}</p>
                <span className="rounded-full bg-sand px-2 py-1 text-xs font-medium capitalize text-ink/70">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
