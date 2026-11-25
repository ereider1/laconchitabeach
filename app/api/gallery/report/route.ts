import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import ResidentPhoto from "@/lib/models/ResidentPhoto";
import { hasApprovedResidentAccess } from "@/lib/registration";
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId || !(await hasApprovedResidentAccess(userId))) return NextResponse.json({ error: "Resident access required" }, { status: userId ? 403 : 401 });
  const { id, reason } = await request.json();
  await connectToDatabase();
  const photo = await ResidentPhoto.findById(id);
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  if (!photo.reports.some((report) => report.reporterClerkId === userId && !report.resolvedAt)) photo.reports.push({ reporterClerkId: userId, reason: String(reason ?? "").slice(0, 240), createdAt: new Date() });
  await photo.save();
  return NextResponse.json({ ok: true });
}
