import { currentUser } from "@clerk/nextjs/server";
import { Mail } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";

export default async function PortalContactPage() {
  const user = await currentUser();
  let residentEmail = "";

  if (user) {
    try {
      await connectToDatabase();
      const resident = await Resident.findOne({ clerkUserId: user.id })
        .select("email")
        .lean();
      residentEmail = resident?.email ?? "";
    } catch (error) {
      console.error("Unable to load resident email for the contact form.", error);
    }
  }

  const email = residentEmail || user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Contact an administrator</h1>
      <p className="mt-2 text-ink/60">
        Send a message to the community administrator using the form below, or email us directly.
      </p>

      <div className="mt-6 max-w-2xl rounded-xl border border-ink/10 bg-white p-5 sm:p-7">
        <ContactForm initialEmail={email} redirectTo="/portal" />
        <p className="mt-5 flex items-center gap-2 text-sm text-ink/65">
          <Mail className="h-4 w-4 text-marina" aria-hidden="true" />
          Prefer email?{" "}
          <a
            href="mailto:admin@laconchitabeach.com"
            className="font-semibold text-marina underline underline-offset-4"
          >
            admin@laconchitabeach.com
          </a>
        </p>
      </div>
    </div>
  );
}
