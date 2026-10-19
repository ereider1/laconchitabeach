import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";
import { isAdmin } from "@/lib/isAdmin";

export type ResidentRegistrationStatus = "pending" | "approved" | "denied";

export async function getResidentRegistrationStatus(
  clerkUserId: string
): Promise<ResidentRegistrationStatus | null> {
  await connectToDatabase();
  const resident = await Resident.findOne({ clerkUserId })
    .select("registrationStatus")
    .lean();

  if (!resident) return null;
  return resident.registrationStatus ?? "approved";
}

export async function hasApprovedResidentAccess(clerkUserId: string): Promise<boolean> {
  if (await isAdmin(clerkUserId)) return true;
  return (await getResidentRegistrationStatus(clerkUserId)) === "approved";
}
