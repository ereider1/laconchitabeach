import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import { connectToDatabase } from "@/lib/mongodb";
import Announcement from "@/lib/models/Announcement";
import Document from "@/lib/models/Document";
import { hasApprovedResidentAccess } from "@/lib/registration";
import { isAdmin } from "@/lib/isAdmin";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId || (!(await hasApprovedResidentAccess(userId)) && !(await isAdmin(userId)))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await connectToDatabase();
  const announcement = await Announcement.findById(id).select("imageDocumentId").lean();
  if (!announcement?.imageDocumentId) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  const document = await Document.findById(announcement.imageDocumentId).lean();
  if (!document) return NextResponse.json({ error: "Image not found" }, { status: 404 });
  const result = await get(document.fileUrl, { access: "private" });
  if (!result || result.statusCode !== 200) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-cache",
    },
  });
}
