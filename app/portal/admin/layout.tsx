import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/isAdmin";
import AdminNavGrid from "@/components/AdminNavGrid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!(await isAdmin(userId))) redirect("/portal");

  await connectToDatabase();
  const pendingRegistrationCount = await Resident.countDocuments({ registrationStatus: "pending" });

  return (
    <div>
      <Link
        href="/portal"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-marina transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to resident portal
      </Link>
      <h1 className="font-display text-3xl text-ink">Admin</h1>
      <p className="mt-2 text-ink/60">
        Manage everything residents see across the intranet.
      </p>

      <AdminNavGrid pendingRegistrationCount={pendingRegistrationCount} />

      <div className="mt-10">{children}</div>
    </div>
  );
}
