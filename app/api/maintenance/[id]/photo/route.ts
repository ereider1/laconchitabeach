import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import { connectToDatabase } from "@/lib/mongodb";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
import mongoose from "mongoose";
import { hasApprovedResidentAccess } from "@/lib/registration";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await hasApprovedResidentAccess(userId))) {
    return NextResponse.json({ error: "Resident registration is not approved" }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await connectToDatabase();
  const post = await MaintenanceRequest.findById(id).select("photoUrl").lean();
  if (!post?.photoUrl) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  try {
    const result = await get(post.photoUrl, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Community Corner photo retrieval failed:", error);
    return NextResponse.json({ error: "Failed to retrieve photo" }, { status: 502 });
  }
}
