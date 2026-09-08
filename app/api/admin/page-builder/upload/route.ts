import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { isAdmin } from "@/lib/isAdmin";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Vercel Blob directly from server with public access
    const blob = await put(file.name, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
