import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import PortalSidebar from "@/components/PortalSidebar";
import PortalQuickLinks from "@/components/PortalQuickLinks";
import { isAdmin } from "@/lib/isAdmin";
import ProfileForm from "@/components/ProfileForm";
import { getResidentRegistrationStatus } from "@/lib/registration";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";

// Access to everything under /portal is already enforced in proxy.ts
// via clerkMiddleware + auth.protect(), so by the time this layout renders
// we know there's a signed-in user. Admin status is computed here (server
// side, from ADMIN_USER_IDS) and passed down so the sidebar only shows the
// admin link to actual admins.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const admin = await isAdmin(userId);
  const registrationStatus = admin || !userId
    ? "approved"
    : await getResidentRegistrationStatus(userId);
  let pendingRegistrationCount = 0;

  if (admin) {
    await connectToDatabase();
    pendingRegistrationCount = await Resident.countDocuments({ registrationStatus: "pending" });
  }

  if (!admin && registrationStatus !== "approved") {
    if (registrationStatus === "pending" || registrationStatus === "denied") {
      return (
        <main className="grid min-h-screen place-items-center bg-sand px-5 py-12">
          <section className="w-full max-w-lg rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-dune">
                  La Conchita Beach
                </p>
                <h1 className="mt-3 font-display text-2xl text-ink">
                  {registrationStatus === "pending"
                    ? "Registration under review"
                    : "Registration not approved"}
                </h1>
              </div>
              <UserButton />
            </div>
            <p className="mt-4 text-sm leading-6 text-ink/65">
              {registrationStatus === "pending"
                ? "Your registration is waiting for administrator review. You’ll be able to access the resident portal once it is approved."
                : "An administrator was unable to approve your resident portal registration. Please contact the community if you believe this is an error."}
            </p>
          </section>
        </main>
      );
    }

    const user = await currentUser();
    return (
      <main className="grid min-h-screen place-items-center bg-sand px-5 py-12">
        <section className="w-full max-w-lg">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-dune">
                La Conchita Beach
              </p>
              <h1 className="mt-3 font-display text-2xl text-ink">
                Request resident access
              </h1>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Complete your registration details. An administrator will review your request
                before you can access the portal.
              </p>
            </div>
            <UserButton />
          </div>
          <ProfileForm
            defaults={{
              firstName: user?.firstName ?? "",
              lastName: user?.lastName ?? "",
              address: "",
              alternateAddress: "",
              email: user?.primaryEmailAddress?.emailAddress ?? "",
              phone: "",
              moveInYear: "",
              listedInDirectory: false,
            }}
            isNewProfile
          />
        </section>
      </main>
    );
  }

  return (
    <div className="portal-shell flex flex-col md:flex-row">
      <PortalSidebar
        isAdmin={admin}
        pendingRegistrationCount={pendingRegistrationCount}
      />
      <main className="portal-main flex-1 overflow-y-auto px-5 py-8 sm:px-8 md:ml-64 md:px-12 md:py-12">
        <div className="mx-auto max-w-4xl">
          <PortalQuickLinks />
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
