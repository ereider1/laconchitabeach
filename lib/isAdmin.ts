// Simple allow-list based admin check. Set ADMIN_USER_IDS in your env to a
// comma-separated list of Clerk user IDs (find these in the Clerk
// dashboard, under Users) who should be able to post announcements, upload
// documents, and manage maintenance requests.
//
// For a bigger community, replace this with Clerk's `publicMetadata.role`
// (set via the Clerk dashboard or a webhook) instead of an env var.
export function isAdmin(clerkUserId: string | null | undefined): boolean {
  if (!clerkUserId) return false;
  const admins = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return admins.includes(clerkUserId);
}
