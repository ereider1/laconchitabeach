import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
import { isAdmin } from "@/lib/isAdmin";

// Residents see only their own requests; admins see everything.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const filter = isAdmin(userId) ? {} : { submittedByClerkId: userId };
  const requests = await MaintenanceRequest.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.address || !body.description) {
    return NextResponse.json({ error: "Address and description are required" }, { status: 400 });
  }

  const user = await currentUser();
  await connectToDatabase();
  try {
    const request = await MaintenanceRequest.create({
      address: body.address,
      description: body.description,
      category: body.category ?? "other",
      submittedByName: user?.fullName ?? user?.username ?? "Resident",
      submittedByClerkId: userId,
    });
    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Admin-only status update. Body: { id, status }
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(userId)) {
    return NextResponse.json({ error: "Only board members can update status" }, { status: 403 });
  }

  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id and status are required" }, { status: 400 });

  await connectToDatabase();
  const updated = await MaintenanceRequest.findByIdAndUpdate(id, { status }, { new: true });
  return NextResponse.json({ request: updated });
}
