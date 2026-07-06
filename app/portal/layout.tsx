import { auth } from "@clerk/nextjs/server";
import PortalSidebar from "@/components/PortalSidebar";
import { isAdmin } from "@/lib/isAdmin";

// Access to everything under /portal is already enforced in proxy.ts
// via clerkMiddleware + auth.protect(), so by the time this layout renders
// we know there's a signed-in user. Admin status is computed here (server
// side, from ADMIN_USER_IDS) and passed down so the sidebar only shows the
// admin link to actual admins.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen bg-white">
      <PortalSidebar isAdmin={isAdmin(userId)} />
      <main className="flex-1 overflow-y-auto px-8 py-10 md:px-12">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
