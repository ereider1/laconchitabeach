import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";

const MAX_PHOTO_SIZE = 8 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("community-corner/")) {
          throw new Error("Invalid photo upload path");
        }

        return {
          allowedContentTypes: ["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: MAX_PHOTO_SIZE,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Photo upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
