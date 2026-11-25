import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import ResidentPhoto from "@/lib/models/ResidentPhoto";
import { isAdmin } from "@/lib/isAdmin";
export async function GET() { const { userId } = await auth(); if (!userId || !(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: userId ? 403 : 401 }); await connectToDatabase(); const photos = await ResidentPhoto.find().sort({ createdAt: -1 }).lean(); return NextResponse.json({ photos }); }
export async function PATCH(request: NextRequest) { const { userId } = await auth(); if (!userId || !(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: userId ? 403 : 401 }); const { id, reportIndex } = await request.json(); await connectToDatabase(); const photo = await ResidentPhoto.findById(id); if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 }); if (typeof reportIndex === "number" && photo.reports[reportIndex]) { photo.reports[reportIndex].resolvedAt = new Date(); photo.reports[reportIndex].resolvedBy = userId; await photo.save(); } return NextResponse.json({ ok: true }); }
