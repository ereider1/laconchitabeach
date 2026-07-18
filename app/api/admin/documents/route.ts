import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { connectToDatabase } from "@/lib/mongodb";
import Document from "@/lib/models/Document";
import { isAdmin } from "@/lib/isAdmin";

// Full document list, admin-only (the resident-facing /portal/documents page
// queries the model directly instead of this route).
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  await connectToDatabase();
  const documents = await Document.find().sort({ category: 1, title: 1 }).lean();
  return NextResponse.json({ documents });
}

// Creates the metadata row after the file has already been uploaded to Blob
// via /api/documents/upload. Body: { title, description?, category?, fileUrl }
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();
  if (!body.title || !body.fileUrl) {
    return NextResponse.json({ error: "Title and fileUrl are required" }, { status: 400 });
  }

  const user = await currentUser();
  await connectToDatabase();
  const document = await Document.create({
    title: body.title,
    description: body.description || undefined,
    category: body.category ?? "other",
    fileUrl: body.fileUrl,
    uploadedByName: user?.fullName ?? user?.username ?? "Board member",
    uploadedByClerkId: userId,
  });

  return NextResponse.json({ document }, { status: 201 });
}

// Body: { id, title?, description?, category? }
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const allowed = ["title", "description", "category"];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) fields[key] = updates[key];
  }

  await connectToDatabase();
  const document = await Document.findByIdAndUpdate(id, fields, { new: true });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return NextResponse.json({ document });
}

// Query: ?id=<documentId> — also deletes the underlying blob.
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectToDatabase();
  const document = await Document.findByIdAndDelete(id);
  if (document?.fileUrl) {
    try {
      await del(document.fileUrl);
    } catch {
      // Blob may already be gone — the metadata row is still removed.
    }
  }
  return NextResponse.json({ ok: true });
}
