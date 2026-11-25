import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import { connectToDatabase } from "@/lib/mongodb";
import ResidentPhoto from "@/lib/models/ResidentPhoto";
import { hasApprovedResidentAccess } from "@/lib/registration";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId || !(await hasApprovedResidentAccess(userId))) return NextResponse.json({ error: "Resident access required" }, { status: userId ? 403 : 401 });
  await connectToDatabase();
  const photo = await ResidentPhoto.findById((await params).id).lean();
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  const result = await get(request.nextUrl.searchParams.get("size") === "thumb" ? photo.thumbnailUrl : photo.originalUrl, { access: "private" });
  if (!result || result.statusCode !== 200) return NextResponse.json({ error: "File not found" }, { status: 404 });
  return new NextResponse(result.stream, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=60, no-store" } });
}
