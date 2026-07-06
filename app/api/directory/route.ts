import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  await connectToDatabase();

  const filter: Record<string, unknown> = { listedInDirectory: true };
  if (q) {
    filter.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { address: { $regex: q, $options: "i" } },
    ];
  }

  const residents = await Resident.find(filter)
    .select("fullName address email phone moveInYear")
    .sort({ fullName: 1 })
    .lean();

  return NextResponse.json({ residents });
}
