import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { Resend } from "resend";
import Announcement from "@/lib/models/Announcement";
import Resident from "@/lib/models/Resident";
import { connectToDatabase } from "@/lib/mongodb";
import { isAdmin } from "@/lib/isAdmin";
import { normalizeEmail } from "@/lib/residentCsv";

const EMAIL_BATCH_SIZE = 100;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("id" in payload) ||
    typeof payload.id !== "string" ||
    !mongoose.isObjectIdOrHexString(payload.id)
  ) {
    return NextResponse.json({ error: "A valid announcement id is required" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("Announcement email blasts are not configured; set RESEND_API_KEY and RESEND_FROM_EMAIL.");
    return NextResponse.json({ error: "Email blasts are not configured. Contact your administrator." }, { status: 503 });
  }

  let sentCount = 0;
  try {
    await connectToDatabase();
    const announcement = await Announcement.findById(payload.id).lean();
    if (!announcement) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });

    const residents = await Resident.find().select("email").lean();
    const recipientMap = new Map<string, string>();
    for (const resident of residents) {
      const email = resident.email.trim();
      const normalizedEmail = normalizeEmail(email);
      if (normalizedEmail && !recipientMap.has(normalizedEmail)) {
        recipientMap.set(normalizedEmail, email);
      }
    }
    const recipients = Array.from(recipientMap.values());
    if (recipients.length === 0) {
      return NextResponse.json({ error: "No resident email addresses were found." }, { status: 409 });
    }

    const announcementUrl = new URL(
      `/portal/announcements#announcement-${announcement._id.toString()}`,
      process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin
    ).toString();
    const text = [
      announcement.title,
      "",
      announcement.body,
      "",
      `View the announcement: ${announcementUrl}`,
    ].join("\n");
    const resend = new Resend(apiKey);

    for (let index = 0; index < recipients.length; index += EMAIL_BATCH_SIZE) {
      const batch = recipients.slice(index, index + EMAIL_BATCH_SIZE).map((email) => ({
        from,
        to: [email],
        subject: announcement.title,
        text,
      }));
      const result = await resend.batch.send(batch);
      if (result.error) {
        console.error("Resend rejected an announcement email batch.", result.error);
        return NextResponse.json(
          { error: "Unable to send the email blast. Please check the email logs before retrying.", sentCount },
          { status: 502 }
        );
      }
      sentCount += batch.length;
    }

    return NextResponse.json({ ok: true, sentCount });
  } catch (error) {
    console.error("Unable to send an announcement email blast.", error);
    return NextResponse.json(
      { error: "Unable to send the email blast. Please check the email logs before retrying.", sentCount },
      { status: 502 }
    );
  }
}
