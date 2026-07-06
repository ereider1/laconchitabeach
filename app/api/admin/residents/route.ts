import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";
import { isAdmin } from "@/lib/isAdmin";

// Full resident roster, including residents who've opted out of the public
// directory. Admin-only — this is the underlying data for /portal/admin.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  await connectToDatabase();
  const residents = await Resident.find().sort({ fullName: 1 }).lean();
  return NextResponse.json({ residents });
}

// Body: { fullName, address, email, phone?, moveInYear?, listedInDirectory? }
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();
  if (!body.fullName || !body.address || !body.email) {
    return NextResponse.json(
      { error: "Name, address, and email are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const resident = await Resident.create({
    fullName: body.fullName,
    address: body.address,
    email: body.email,
    phone: body.phone || undefined,
    moveInYear: body.moveInYear || undefined,
    listedInDirectory: body.listedInDirectory ?? true,
  });

  return NextResponse.json({ resident }, { status: 201 });
}

// Body: { id, fullName?, address?, email?, phone?, moveInYear?, listedInDirectory? }
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const allowed = ["fullName", "address", "email", "phone", "moveInYear", "listedInDirectory"];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) fields[key] = updates[key];
  }

  await connectToDatabase();
  const resident = await Resident.findByIdAndUpdate(id, fields, { new: true });
  if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });
  return NextResponse.json({ resident });
}

// Query: ?id=<residentId>
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectToDatabase();
  await Resident.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
