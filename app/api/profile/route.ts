import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";

// The signed-in resident's own directory profile (if any).
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const resident = await Resident.findOne({ clerkUserId: userId }).lean();
  return NextResponse.json({ resident: resident ?? null });
}

// Self-service create/update of the signed-in resident's own profile.
// Body: { fullName, address, email, phone?, moveInYear?, listedInDirectory }
export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.fullName || !body.address || !body.email) {
    return NextResponse.json(
      { error: "Name, address, and email are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const fields = {
    fullName: body.fullName,
    address: body.address,
    email: body.email,
    phone: body.phone || undefined,
    moveInYear: body.moveInYear || undefined,
    listedInDirectory: !!body.listedInDirectory,
    clerkUserId: userId,
  };

  let resident = await Resident.findOne({ clerkUserId: userId });

  if (!resident) {
    // An admin may have already added this person to the roster by email
    // before they ever signed up — link that record instead of duplicating it.
    const unclaimed = await Resident.find({ clerkUserId: { $exists: false } });
    resident = unclaimed.find((r) => r.email.toLowerCase() === body.email.toLowerCase()) ?? null;
  }

  if (resident) {
    Object.assign(resident, fields);
    await resident.save();
  } else {
    resident = await Resident.create(fields);
  }

  return NextResponse.json({ resident });
}
