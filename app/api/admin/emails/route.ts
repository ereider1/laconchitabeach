import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/lib/models/ContactMessage";
import { isAdmin } from "@/lib/isAdmin";

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id || !mongoose.isObjectIdOrHexString(id)) {
    return NextResponse.json({ error: "A valid message id is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const message = await ContactMessage.findByIdAndDelete(id);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete a contact message.", error);
    return NextResponse.json({ error: "Unable to delete this message right now." }, { status: 500 });
  }
}
