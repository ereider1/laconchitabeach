import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/lib/models/ContactMessage";
import { isAdmin } from "@/lib/isAdmin";

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

      {messages.length === 0 ? (
        <p className="rounded-2xl bg-sand/55 px-5 py-8 text-sm text-ink/60">
          No contact form messages yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {messages.map((message) => (
            <li
              key={message._id.toString()}
              className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h3 className="font-display text-lg text-ink">{message.subject}</h3>
                  <p className="mt-1 text-sm text-ink/70">
                    {message.name} ·{" "}
                    <a
                      href={`mailto:${message.email}`}
                      className="text-marina underline underline-offset-2"
                    >
                      {message.email}
                    </a>
                  </p>
                </div>
                <time
                  dateTime={message.createdAt.toISOString()}
                  className="shrink-0 text-xs text-ink/50"
                >
                  {message.createdAt.toLocaleString()}
                </time>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink/80">
                {message.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
