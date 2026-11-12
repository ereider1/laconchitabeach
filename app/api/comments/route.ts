import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hasApprovedResidentAccess } from "@/lib/registration";
import Comment, { type CommentTargetType } from "@/lib/models/Comment";
import Announcement from "@/lib/models/Announcement";
import Event from "@/lib/models/Event";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";

const targetTypes = ["announcement", "event", "community-post"] as const;

async function requireResident() {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!(await hasApprovedResidentAccess(userId))) {
    return { error: NextResponse.json({ error: "Resident registration is not approved" }, { status: 403 }) };
  }
  return { userId };
}

async function targetExists(targetType: CommentTargetType, targetId: string) {
  if (targetType === "announcement") return Boolean(await Announcement.findById(targetId).select("_id").lean());
  if (targetType === "event") return Boolean(await Event.findById(targetId).select("_id").lean());
  return Boolean(await MaintenanceRequest.findById(targetId).select("_id").lean());
}

export async function GET(req: NextRequest) {
  const access = await requireResident();
  if (access.error) return access.error;
  const targetType = req.nextUrl.searchParams.get("targetType");
  const targetId = req.nextUrl.searchParams.get("targetId");
  if (!targetType || !targetId || !targetTypes.includes(targetType as CommentTargetType)) {
    return NextResponse.json({ error: "targetType and targetId are required" }, { status: 400 });
  }
  await connectToDatabase();
  const comments = await Comment.find({ targetType: targetType as CommentTargetType, targetId }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const access = await requireResident();
  if (access.error) return access.error;
  const { targetType, targetId, body } = await req.json();
  if (!targetTypes.includes(targetType) || typeof targetId !== "string" || typeof body !== "string") {
    return NextResponse.json({ error: "A valid target and comment are required" }, { status: 400 });
  }
  const trimmedBody = body.trim();
  if (!trimmedBody || trimmedBody.length > 2000) {
    return NextResponse.json({ error: "Comments must be between 1 and 2,000 characters" }, { status: 400 });
  }
  await connectToDatabase();
  if (!(await targetExists(targetType, targetId))) return NextResponse.json({ error: "Content not found" }, { status: 404 });
  const user = await currentUser();
  const comment = await Comment.create({
    targetType,
    targetId,
    authorClerkId: access.userId,
    authorName: user?.fullName ?? user?.username ?? "Resident",
    body: trimmedBody,
  });
  return NextResponse.json({ comment }, { status: 201 });
}
