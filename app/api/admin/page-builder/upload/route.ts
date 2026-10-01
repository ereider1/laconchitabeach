import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/isAdmin";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Please upload an image file" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "Image must be 4 MB or smaller" },
      { status: 413 }
    );
  }

  try {
    const blob = await put(file.name, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Page-builder image upload failed:", error);
    return NextResponse.json({ error: "Image upload failed" }, { status: 502 });
  }
}