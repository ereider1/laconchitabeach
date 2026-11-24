import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { Resend } from "resend";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/lib/models/ContactMessage";
import { isAdmin } from "@/lib/isAdmin";
import OutboundEmail from "@/lib/models/OutboundEmail";
import type { IOutboundEmail } from "@/lib/models/OutboundEmail";

const MAX_REPLY_LENGTH = 10_000;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  let payload: unknown;
  let uploadedFiles: File[] = [];
  try {
    const formData = await request.formData();
    payload = Object.fromEntries(formData.entries());
    uploadedFiles = formData.getAll("attachments").filter((file): file is File => file instanceof File && file.size > 0);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("id" in payload) ||
    !("reply" in payload) ||
    typeof payload.id !== "string" ||
    (!mongoose.isObjectIdOrHexString(payload.id) && !payload.id.startsWith("outbound-")) ||
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

  if (uploadedFiles.length > MAX_ATTACHMENTS || uploadedFiles.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
    return NextResponse.json({ error: `Attach up to ${MAX_ATTACHMENTS} files, each no larger than 10 MB.` }, { status: 413 });
  }
  if (uploadedFiles.reduce((total, file) => total + file.size, 0) > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json({ error: "Attachments must total 10 MB or less." }, { status: 413 });
  }
  const attachments = await Promise.all(uploadedFiles.map(async (file) => ({
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    content: Buffer.from(await file.arrayBuffer()),
  })));

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("Admin email replies are not configured; set RESEND_API_KEY and RESEND_FROM_EMAIL.");
    return NextResponse.json({ error: "Email responses are not configured. Contact your administrator." }, { status: 503 });
  }

  try {
    await connectToDatabase();
    const isOutbound = payload.id.startsWith("outbound-");
    const message = isOutbound
      ? await OutboundEmail.findById(payload.id.slice("outbound-".length)).lean()
      : await ContactMessage.findById(payload.id).lean();
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const recipients = isOutbound ? (message as unknown as IOutboundEmail).recipients : [message.email];
    if (!recipients?.length) return NextResponse.json({ error: "No recipients found for this email." }, { status: 409 });

    const subject = /^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject}`;
    const result = await new Resend(apiKey).emails.send({
      from,
      to: recipients,
      subject,
      text: reply,
      attachments,
    });

    if (result.error) {
      console.error("Resend rejected an admin email response.", result.error);
      return NextResponse.json({ error: "Unable to send your response right now. Please try again." }, { status: 502 });
    }

    const sentAt = new Date();
    try {
      const replyRecord = { body: reply, sentAt, attachments: attachments.map(({ filename, contentType, content }) => ({ filename, contentType, size: content.length })) };
      const updatedMessage = isOutbound
        ? await OutboundEmail.findByIdAndUpdate(
          payload.id.slice("outbound-".length),
          { $push: { replies: replyRecord } },
          { new: true, runValidators: true }
        ).lean()
        : await ContactMessage.findByIdAndUpdate(
          payload.id,
          { $push: { replies: replyRecord } },
          { new: true, runValidators: true }
        ).lean();

      if (!updatedMessage) {
        return NextResponse.json(
          { error: "Your response was sent, but its conversation was removed before it could be saved. Do not resend it." },
          { status: 409 }
        );
      }

      return NextResponse.json({
        ok: true,
        reply: {
          body: reply,
          sentAt: sentAt.toLocaleString(),
          dateTime: sentAt.toISOString(),
          attachments: attachments.map(({ filename, contentType, content }) => ({ filename, contentType, size: content.length })),
        },
      });
    } catch (error) {
      console.error("Email was sent, but its conversation history could not be saved.", error);
      return NextResponse.json(
        { error: "Your response was sent, but its conversation history could not be saved. Do not resend it." },
        { status: 500 }
      );
    }
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
  if (!id || (!id.startsWith("outbound-") && !mongoose.isObjectIdOrHexString(id))) {
    return NextResponse.json({ error: "A valid message id is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    if (id.startsWith("outbound-")) {
      const outbound = await OutboundEmail.findByIdAndUpdate(id.slice("outbound-".length), { trashedAt: new Date() });
      if (!outbound) return NextResponse.json({ error: "Message not found" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    const message = await ContactMessage.findByIdAndUpdate(id, { trashedAt: new Date() });
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete a contact message.", error);
    return NextResponse.json({ error: "Unable to delete this message right now." }, { status: 500 });
  }
}
