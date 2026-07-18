import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/isAdmin";
import AdminNavGrid from "@/components/AdminNavGrid";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!(await isAdmin(userId))) redirect("/portal");

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Admin</h1>
      <p className="mt-2 text-ink/60">
        Manage everything residents see across the intranet.
      </p>

      <AdminNavGrid />

      <div className="mt-10">{children}</div>
    </div>
  );
}
