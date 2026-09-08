import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

// A public proxy endpoint to serve private homepage-builder images on the public site.
// This allows rendering private images to anonymous landing page visitors.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
  }

  try {
    const result = await get(url, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable", // Heavily cache on CDN and browser for performance
      },
    });
  } catch (error) {
    console.error("Error streaming homepage-builder media:", error);
    return NextResponse.json({ error: "Failed to stream media" }, { status: 500 });
  }
}
