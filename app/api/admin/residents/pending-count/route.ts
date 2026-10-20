import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";
import { isAdmin } from "@/lib/isAdmin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  try {
    await connectToDatabase();
    const count = await Resident.countDocuments({ registrationStatus: "pending" });
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Unable to get pending registration count.", error);
    return NextResponse.json(
      { error: "Unable to load pending registration requests." },
      { status: 500 },
    );
  }
}
