import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Announcement from "@/lib/models/Announcement";
import { isAdmin } from "@/lib/isAdmin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const announcements = await Announcement.find().sort({ pinned: -1, createdAt: -1 }).lean();
  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Only board members can post announcements" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.title || !body.body) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
  }

  const user = await currentUser();
  await connectToDatabase();
  const announcement = await Announcement.create({
    title: body.title,
    body: body.body,
    category: body.category ?? "general",
    pinned: !!body.pinned,
    authorName: user?.fullName ?? user?.username ?? "Board member",
    authorClerkId: userId,
  });

  return NextResponse.json({ announcement }, { status: 201 });
}

// Body: { id, title?, body?, category?, pinned? }
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Only board members can edit announcements" }, { status: 403 });
  }

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const allowed = ["title", "body", "category", "pinned"];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) fields[key] = updates[key];
  }

  await connectToDatabase();
  const announcement = await Announcement.findByIdAndUpdate(id, fields, { new: true });
  if (!announcement) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  return NextResponse.json({ announcement });
}

// Query: ?id=<announcementId>
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Only board members can delete announcements" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectToDatabase();
  await Announcement.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
