import PortalSidebar from "@/components/PortalSidebar";

// Access to everything under /portal is already enforced in middleware.ts
// via clerkMiddleware + auth.protect(), so by the time this layout renders
// we know there's a signed-in user.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <PortalSidebar />
      <main className="flex-1 overflow-y-auto px-8 py-10 md:px-12">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
