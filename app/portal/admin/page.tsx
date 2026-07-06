import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/isAdmin";
import AdminResidents from "@/components/AdminResidents";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!isAdmin(userId)) redirect("/portal");

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Admin</h1>
      <p className="mt-2 text-ink/60">
        Manage resident records and who appears in the directory.
      </p>

      <div className="mt-8">
        <AdminResidents />
      </div>
    </div>
  );
}
