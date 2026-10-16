import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";
import { isAdmin } from "@/lib/isAdmin";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const directoryAdmin = await isAdmin(userId);

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
    .select(directoryAdmin ? "fullName address email phone moveInYear" : "fullName address moveInYear")
    .sort({ fullName: 1 })
    .lean();

  return NextResponse.json({ residents, isAdmin: directoryAdmin });
}
