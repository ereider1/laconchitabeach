import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/lib/models/ContactMessage";
import { isAdmin } from "@/lib/isAdmin";
import AdminEmailMessages from "@/components/AdminEmailMessages";

export default async function AdminEmailsPage() {
  const { userId } = await auth();
  if (!(await isAdmin(userId))) redirect("/portal");

  await connectToDatabase();
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-display text-2xl text-ink">Emails</h2>
        <p className="mt-1 text-sm text-ink/60">
          Messages sent through the website contact form.
        </p>
      </div>

      <AdminEmailMessages
        initialMessages={messages.map((message) => ({
          id: message._id.toString(),
          name: message.name,
          email: message.email,
          subject: message.subject,
          message: message.message,
          createdAt: message.createdAt.toLocaleString(),
          dateTime: message.createdAt.toISOString(),
        }))}
      />
    </section>
  );
}
