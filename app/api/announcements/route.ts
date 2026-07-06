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
  if (!isAdmin(userId)) {
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
