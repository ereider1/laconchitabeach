import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";

// Admin access is granted per-resident via the `isAdmin` flag on the
// Resident record (managed from Admin → Profiles), so board members can
// grant/revoke access themselves without touching env vars or redeploying.
//
// ADMIN_USER_IDS is kept as a permanent bootstrap/break-glass list — a
// comma-separated list of Clerk user IDs in your env — so there's always a
// way to grant the very first admin (or recover access if every Resident
// record's isAdmin flag is ever accidentally unset).
export async function isAdmin(clerkUserId: string | null | undefined): Promise<boolean> {
  if (!clerkUserId) return false;

  const envAdmins = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (envAdmins.includes(clerkUserId)) return true;

  await connectToDatabase();
  const resident = await Resident.findOne({ clerkUserId }).select("isAdmin").lean();
  return !!resident?.isAdmin;
}
