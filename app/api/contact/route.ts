import { NextResponse } from "next/server";
import { Resend } from "resend";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/lib/models/ContactMessage";

const MAX_REQUEST_BYTES = 12_000;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

type ContactSubmission = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isContactSubmission(value: unknown): value is ContactSubmission {
  if (!isRecord(value)) return false;

  return (
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.subject === "string" &&
    typeof value.message === "string"
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Your message is too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Your message is too large." }, { status: 413 });
    }
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isContactSubmission(payload)) {
    return NextResponse.json({ error: "Please complete all fields." }, { status: 400 });
  }

  const submission = {
    name: payload.name.trim(),
    email: payload.email.trim(),
    subject: payload.subject.trim(),
    message: payload.message.trim(),
  };

  if (
    !submission.name ||
    submission.name.length > 100 ||
    CONTROL_CHARACTERS.test(submission.name) ||
    submission.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email) ||
    !submission.subject ||
    submission.subject.length > 150 ||
    CONTROL_CHARACTERS.test(submission.subject) ||
    !submission.message ||
    submission.message.length > 5000
  ) {
    return NextResponse.json({ error: "Please check your contact details and message." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    await ContactMessage.create(submission);
  } catch (error) {
    console.error("Unable to save a contact inquiry.", error);
    return NextResponse.json(
      { error: "Unable to receive your message right now. Please try again later." },
      { status: 503 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to) {
    console.error("Contact email is not configured; set RESEND_API_KEY, RESEND_FROM_EMAIL, and CONTACT_TO_EMAIL.");
    return NextResponse.json({
      message: "Thank you for reaching out. Your message has been sent. We will respond shortly.",
    });
  }

  const resend = new Resend(apiKey);
  let result;
  try {
    result = await resend.emails.send({
      from,
      to: [to],
      replyTo: submission.email,
      subject: `Message from La Conchita Beach Website: ${submission.subject}`,
      text: `Name: ${submission.name}\nEmail: ${submission.email}\n\n${submission.message}`,
    });
  } catch (error) {
    console.error("Unable to reach Resend while sending a contact inquiry.", error);
    return NextResponse.json({
      message: "Thank you for reaching out. Your message has been sent. We will respond shortly.",
    });
  }

  if (result.error) {
    console.error("Resend rejected a contact inquiry.", result.error);
    return NextResponse.json({
      message: "Thank you for reaching out. Your message has been sent. We will respond shortly.",
    });
  }

  return NextResponse.json({
    message: "Thank you for reaching out. Your message has been sent. We will respond shortly.",
  });
}
