import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/isAdmin";
import AnnouncementsClient from "@/components/AnnouncementsClient";

export default async function AnnouncementsPage() {
  const { userId } = await auth();
  return <AnnouncementsClient isAdmin={await isAdmin(userId)} />;
}
