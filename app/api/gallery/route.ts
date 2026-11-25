import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { put, del } from "@vercel/blob";
import { connectToDatabase } from "@/lib/mongodb";
import ResidentPhoto from "@/lib/models/ResidentPhoto";
import Resident from "@/lib/models/Resident";
import { hasApprovedResidentAccess } from "@/lib/registration";
import { isAdmin } from "@/lib/isAdmin";

const MAX = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

async function access(userId: string | null) {
  return !!userId && (await hasApprovedResidentAccess(userId));
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!(await access(userId))) return NextResponse.json({ error: "Resident access required" }, { status: userId ? 403 : 401 });
    await connectToDatabase();
    const photos = await ResidentPhoto.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ photos: photos.map(({ reports, ...photo }) => ({ ...photo, hasReport: (reports ?? []).some((r) => !r.resolvedAt), thumbnailUrl: `/api/gallery/${photo._id}/image?size=thumb` })) });
  } catch (error) {
    console.error("Gallery list failed", error);
    return NextResponse.json({ error: "The photo gallery is temporarily unavailable. Please try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!(await access(userId))) return NextResponse.json({ error: userId ? "Resident registration is not approved" : "Unauthorized" }, { status: userId ? 403 : 401 });
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  if (file.size > MAX || !ALLOWED.has(file.type)) return NextResponse.json({ error: "Choose a JPG, PNG, WebP, or AVIF photo smaller than 8 MB." }, { status: 400 });
  const caption = String(form.get("caption") ?? "").trim().slice(0, 240);
  try {
    const { default: sharp } = await import("sharp");
    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input, { failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || metadata.width > 12000 || metadata.height > 12000) throw new Error("This image has invalid dimensions.");
    // sharp drops EXIF/IPTC/XMP by default, including GPS metadata.
    const full = await sharp(input).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
    const thumb = await sharp(input).rotate().resize(720, 720, { fit: "cover" }).jpeg({ quality: 78 }).toBuffer();
    const key = crypto.randomUUID();
    const [original, thumbnail] = await Promise.all([
      put(`resident-gallery/${key}.jpg`, full, { access: "private", addRandomSuffix: false, contentType: "image/jpeg" }),
      put(`resident-gallery/${key}-thumb.jpg`, thumb, { access: "private", addRandomSuffix: false, contentType: "image/jpeg" }),
    ]);
    const user = await currentUser();
    await connectToDatabase();
    const resident = await Resident.findOne({ clerkUserId: userId }).select("fullName listedInDirectory").lean();
    const photo = await ResidentPhoto.create({ ownerClerkId: userId, uploaderName: resident?.listedInDirectory ? (resident.fullName || user?.fullName || "Resident") : undefined, originalUrl: original.url, thumbnailUrl: thumbnail.url, caption: caption || undefined, reports: [] });
    return NextResponse.json({ photo: { ...photo.toObject(), thumbnailUrl: `/api/gallery/${photo._id}/image?size=thumb` } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Photo upload failed. Please try again." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!(await access(userId))) return NextResponse.json({ error: "Resident access required" }, { status: userId ? 403 : 401 });
  const id = request.nextUrl.searchParams.get("id");
  const admin = await isAdmin(userId);
  await connectToDatabase();
  const photo = await ResidentPhoto.findOneAndDelete(admin ? { _id: id } : { _id: id, ownerClerkId: userId });
  if (!photo) return NextResponse.json({ error: "Photo not found or you do not have permission to delete it." }, { status: 404 });
  await Promise.allSettled([del(photo.originalUrl), del(photo.thumbnailUrl)]);
  return NextResponse.json({ ok: true });
}
