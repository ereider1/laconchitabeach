import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
import { isAdmin } from "@/lib/isAdmin";
import mongoose from "mongoose";
import { hasApprovedResidentAccess } from "@/lib/registration";
import {
  isCommunityPostCategory,
  isLegacyCommunityPostCategory,
} from "@/lib/communityCategories";

// Community Corner is a shared bulletin board for all signed-in residents.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasApprovedResidentAccess(userId))) {
    return NextResponse.json({ error: "Resident registration is not approved" }, { status: 403 });
  }

  await connectToDatabase();
  const requests = await MaintenanceRequest.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasApprovedResidentAccess(userId))) {
    return NextResponse.json({ error: "Resident registration is not approved" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.address || !body.description) {
    return NextResponse.json({ error: "Address and description are required" }, { status: 400 });
  }
  const category = body.category ?? "other";
  if (!isCommunityPostCategory(category)) {
    return NextResponse.json({ error: "Invalid post category" }, { status: 400 });
  }

  const user = await currentUser();
  await connectToDatabase();
  try {
    const request = await MaintenanceRequest.create({
      address: body.address,
      description: body.description,
      category,
      photoUrl: body.photoUrl,
      submittedByName: user?.fullName ?? user?.username ?? "Resident",
      submittedByClerkId: userId,
    });
    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Admin-only update. Body: { id, address?, category?, description?, status? }
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasApprovedResidentAccess(userId))) {
    return NextResponse.json({ error: "Resident registration is not approved" }, { status: 403 });
  }
  const admin = await isAdmin(userId);

  const { id, ...updates } = await req.json();
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "A valid post id is required" }, { status: 400 });
  }

  const allowed = admin
    ? ["address", "category", "description", "status"]
    : ["address", "category", "description"];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) fields[key] = updates[key];
  }

  await connectToDatabase();
  const filter = admin ? { _id: id } : { _id: id, submittedByClerkId: userId };
  if ("category" in fields && !isCommunityPostCategory(fields.category)) {
    if (!isLegacyCommunityPostCategory(fields.category)) {
      return NextResponse.json({ error: "Invalid post category" }, { status: 400 });
    }

    const existing = await MaintenanceRequest.findOne(filter).select("category").lean();
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (existing.category !== fields.category) {
      return NextResponse.json({ error: "Invalid post category" }, { status: 400 });
    }
  }

  const updated = await MaintenanceRequest.findOneAndUpdate(filter, fields, {
    new: true,
    runValidators: true,
  });
  if (!updated) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ request: updated });
}

// Owners and admins can delete posts. Query: ?id=<requestId>
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasApprovedResidentAccess(userId))) {
    return NextResponse.json({ error: "Resident registration is not approved" }, { status: 403 });
  }
  const admin = await isAdmin(userId);

  const id = req.nextUrl.searchParams.get("id");
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "A valid post id is required" }, { status: 400 });
  }

  await connectToDatabase();
  const filter = admin ? { _id: id } : { _id: id, submittedByClerkId: userId };
  const deleted = await MaintenanceRequest.findOneAndDelete(filter);
  if (!deleted) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
