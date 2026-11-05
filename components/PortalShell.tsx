"use client";

import { usePathname } from "next/navigation";
import PortalQuickLinks from "@/components/PortalQuickLinks";
import PortalSidebar from "@/components/PortalSidebar";

export default function PortalShell({
  children,
  isAdmin,
  pendingRegistrationCount,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
  pendingRegistrationCount: number;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/portal/admin");

  return (
    <div className="portal-shell flex flex-col md:flex-row">
      {!isAdminRoute && (
        <PortalSidebar
          isAdmin={isAdmin}
          pendingRegistrationCount={pendingRegistrationCount}
        />
      )}
      <main
        className={`portal-main flex-1 overflow-y-auto px-5 py-8 sm:px-8 md:px-12 md:py-12 ${
          isAdminRoute ? "" : "md:ml-64"
        }`}
      >
        <div className="mx-auto max-w-6xl">
          <PortalQuickLinks />
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
