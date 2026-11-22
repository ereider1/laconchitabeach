import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/lib/models/ContactMessage";
import OutboundEmail from "@/lib/models/OutboundEmail";
import { isAdmin } from "@/lib/isAdmin";
import AdminEmailMessages from "@/components/AdminEmailMessages";
import AdminEmailComposer from "@/components/AdminEmailComposer";

export default async function AdminEmailsPage() {
  const { userId } = await auth();
  if (!(await isAdmin(userId))) redirect("/portal");

  await connectToDatabase();
  const [messages, outboundMessages] = await Promise.all([
    ContactMessage.find().sort({ createdAt: -1 }).lean(),
    OutboundEmail.find().sort({ createdAt: -1 }).lean(),
  ]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
        <h2 className="font-display text-2xl text-ink">Emails</h2>
        <p className="mt-1 text-sm text-ink/60">
          Website contact messages and your sent replies.
        </p>
        </div>
        <AdminEmailComposer />
      </div>

      <AdminEmailMessages
        initialMessages={[
          ...messages.map((message) => ({
          id: message._id.toString(),
          name: message.name,
          email: message.email,
          subject: message.subject,
          message: message.message,
          createdAt: message.createdAt.toLocaleString(),
          dateTime: message.createdAt.toISOString(),
          replies: (message.replies ?? []).map((reply) => ({
            body: reply.body,
            sentAt: reply.sentAt.toLocaleString(),
            dateTime: reply.sentAt.toISOString(),
          })),
          })),
          ...outboundMessages.map((message) => ({
            id: `outbound-${message._id.toString()}`,
            name: message.name,
            email: message.email,
            subject: message.subject,
            message: message.message,
            createdAt: message.createdAt.toLocaleString(),
            dateTime: message.createdAt.toISOString(),
            replies: [],
            isOutbound: true,
            recipients: message.recipients ?? [],
          })),
        ].sort((a, b) => b.dateTime.localeCompare(a.dateTime))}
      />
    </section>
  );
}
