import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const user = await currentUser();

  let initialResident = null;
  try {
    await connectToDatabase();
    initialResident = await Resident.findOne({ clerkUserId: user?.id }).lean();
  } catch {
    // DB unreachable — form still renders with Clerk defaults below.
  }

  const defaults = {
    fullName: initialResident?.fullName ?? user?.fullName ?? "",
    address: initialResident?.address ?? "",
    email: initialResident?.email ?? user?.primaryEmailAddress?.emailAddress ?? "",
    phone: initialResident?.phone ?? "",
    moveInYear: initialResident?.moveInYear ? String(initialResident.moveInYear) : "",
    listedInDirectory: initialResident?.listedInDirectory ?? false,
  };

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Your profile</h1>
      <p className="mt-2 text-ink/60">
        Keep your contact info current, and choose whether neighbors can find you in the
        directory.
      </p>

      <div className="mt-8 max-w-lg">
        <ProfileForm defaults={defaults} isNewProfile={!initialResident} />
      </div>
    </div>
  );
}
