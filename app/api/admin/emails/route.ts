import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { Resend } from "resend";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/lib/models/ContactMessage";
import { isAdmin } from "@/lib/isAdmin";

const MAX_REPLY_LENGTH = 10_000;

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
    !("reply" in payload) ||
    typeof payload.id !== "string" ||
    !mongoose.isObjectIdOrHexString(payload.id) ||
    typeof payload.reply !== "string"
  ) {
    return NextResponse.json({ error: "A valid message and response are required" }, { status: 400 });
  }

  const reply = payload.reply.trim();
  if (!reply || reply.length > MAX_REPLY_LENGTH) {
    return NextResponse.json(
      { error: `Your response must be between 1 and ${MAX_REPLY_LENGTH} characters` },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("Admin email replies are not configured; set RESEND_API_KEY and RESEND_FROM_EMAIL.");
    return NextResponse.json({ error: "Email responses are not configured. Contact your administrator." }, { status: 503 });
  }

  try {
    await connectToDatabase();
    const message = await ContactMessage.findById(payload.id).lean();
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const subject = /^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject}`;
    const result = await new Resend(apiKey).emails.send({
      from,
      to: [message.email],
      subject,
      text: reply,
    });

    if (result.error) {
      console.error("Resend rejected an admin email response.", result.error);
      return NextResponse.json({ error: "Unable to send your response right now. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to send an admin email response.", error);
    return NextResponse.json({ error: "Unable to send your response right now. Please try again." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id || !mongoose.isObjectIdOrHexString(id)) {
    return NextResponse.json({ error: "A valid message id is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const message = await ContactMessage.findByIdAndDelete(id);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete a contact message.", error);
    return NextResponse.json({ error: "Unable to delete this message right now." }, { status: 500 });
  }
}
