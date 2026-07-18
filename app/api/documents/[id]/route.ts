import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import { connectToDatabase } from "@/lib/mongodb";
import Document from "@/lib/models/Document";

// Streams a private document to any signed-in resident. The blob itself
// isn't publicly fetchable — this route is the only way to read it, and it
// checks auth before ever touching Blob storage.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectToDatabase();
  const document = await Document.findById(id).lean();
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const result = await get(document.fileUrl, { access: "private" });
  if (result?.statusCode !== 200) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const safeName = document.title.replace(/[^\w.\- ]/g, "_");

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
