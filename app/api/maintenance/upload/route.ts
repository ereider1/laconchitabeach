import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

const MAX_PHOTO_SIZE = 4 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const photo = formData.get("photo");
  if (!(photo instanceof File)) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }

  try {
    if (photo.size === 0 || photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json(
        { error: "Photos must be smaller than 4 MB." },
        { status: 400 }
      );
    }

    const extension = PHOTO_TYPES[photo.type];
    if (!extension) {
      return NextResponse.json(
        { error: "Choose a JPG, PNG, GIF, WebP, or AVIF image." },
        { status: 400 }
      );
    }

    const blob = await put(
      `community-corner/${crypto.randomUUID()}.${extension}`,
      photo,
      {
        access: "public",
        addRandomSuffix: true,
        contentType: photo.type,
      }
    );
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Photo upload failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
