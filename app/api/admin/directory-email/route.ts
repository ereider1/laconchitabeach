import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";
import { isAdmin } from "@/lib/isAdmin";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import OutboundEmail from "@/lib/models/OutboundEmail";

const MAX_SUBJECT_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50_000;
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
    const residentIds = formData.getAll("residentIds").filter((id): id is string => typeof id === "string");
    if (residentIds.length > 0) (payload as Record<string, unknown>).residentIds = residentIds;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("subject" in payload) ||
    !("content" in payload) ||
    typeof payload.subject !== "string" ||
    typeof payload.content !== "string"
  ) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const subject = payload.subject.trim();
  const content = payload.content.trim();
  if (!subject || subject.length > MAX_SUBJECT_LENGTH || !content || content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: "Enter a subject and a message within the allowed length" }, { status: 400 });
  }

  const files = uploadedFiles;
  if (files.length > MAX_ATTACHMENTS || files.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
    return NextResponse.json({ error: `Attach up to ${MAX_ATTACHMENTS} files, each no larger than 10 MB.` }, { status: 413 });
  }
  const totalAttachmentBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalAttachmentBytes > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json({ error: "Attachments must total 10 MB or less." }, { status: 413 });
  }
  const attachments = await Promise.all(files.map(async (file) => ({
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    content: Buffer.from(await file.arrayBuffer()),
  })));

  const smtpHost = process.env.ZOHO_SMTP_HOST ?? "smtppro.zoho.com";
  const smtpPort = Number(process.env.ZOHO_SMTP_PORT ?? "465");
  const smtpUser = process.env.ZOHO_SMTP_USER;
  const smtpPassword = process.env.ZOHO_SMTP_PASSWORD;
  const fromAddress = process.env.ZOHO_FROM_EMAIL;
  if (!smtpUser || !smtpPassword || !fromAddress || !Number.isInteger(smtpPort)) {
    return NextResponse.json(
      { error: "Zoho Mail is not configured. Set ZOHO_SMTP_USER, ZOHO_SMTP_PASSWORD, and ZOHO_FROM_EMAIL." },
      { status: 503 }
    );
  }

  await connectToDatabase();
  const requestedIds = "residentIds" in payload && Array.isArray(payload.residentIds)
    ? payload.residentIds.filter((id): id is string => typeof id === "string")
    : null;
  if (requestedIds && (requestedIds.length === 0 || requestedIds.some((id) => !mongoose.isObjectIdOrHexString(id)))) {
    return NextResponse.json({ error: "Select at least one valid resident." }, { status: 400 });
  }
  const residents = await Resident.find({
    ...(requestedIds ? {} : { listedInDirectory: true }),
    ...(requestedIds ? { _id: { $in: requestedIds } } : {}),
  }).select("email").lean();
  const recipients = [...new Set(residents.map((resident) => resident.email.trim().toLowerCase()).filter(Boolean))];
  if (recipients.length === 0) return NextResponse.json({ error: "No directory email addresses were found." }, { status: 409 });

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPassword },
    });
    await transporter.sendMail({
      from: fromAddress,
      to: fromAddress,
      bcc: recipients,
      subject,
      text: content,
      attachments,
    });
  } catch (error) {
    console.error("Zoho SMTP rejected a directory email.", error);
    return NextResponse.json({ error: "Zoho could not send the email. Check the SMTP settings and app password." }, { status: 502 });
  }

  await OutboundEmail.create({
    name: "Directory residents",
    email: `Bcc · ${recipients.length} recipients`,
    subject,
    message: content,
    recipientCount: recipients.length,
    recipients,
    attachments: attachments.map(({ filename, contentType, content }) => ({ filename, contentType, size: content.length })),
  });

  return NextResponse.json({ ok: true, recipientCount: recipients.length });
}
