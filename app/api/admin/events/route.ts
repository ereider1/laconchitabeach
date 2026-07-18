import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Event from "@/lib/models/Event";
import { isAdmin } from "@/lib/isAdmin";

// Admin-only event creation. Body: { title, description, location, startsAt, isPublic? }
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();
  if (!body.title || !body.description || !body.location || !body.startsAt) {
    return NextResponse.json(
      { error: "Title, description, location, and start time are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const event = await Event.create({
    title: body.title,
    description: body.description,
    location: body.location,
    startsAt: body.startsAt,
    isPublic: !!body.isPublic,
  });

  return NextResponse.json({ event }, { status: 201 });
}

// Body: { id, title?, description?, location?, startsAt?, isPublic? }
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const allowed = ["title", "description", "location", "startsAt", "isPublic"];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) fields[key] = updates[key];
  }

  await connectToDatabase();
  const event = await Event.findByIdAndUpdate(id, fields, { new: true });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ event });
}

// Query: ?id=<eventId>
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectToDatabase();
  await Event.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
