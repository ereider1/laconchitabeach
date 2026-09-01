import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";
import { isAdmin } from "@/lib/isAdmin";
import { normalizeEmail, parseResidentCsv } from "@/lib/residentCsv";

async function ensureSparseClerkUserIndex() {
  const indexes = await Resident.collection.indexes();
  const clerkIndex = indexes.find((index) => index.name === "clerkUserId_1");
  const isCorrect = clerkIndex?.unique === true && clerkIndex?.sparse === true;

  if (!isCorrect && clerkIndex) await Resident.collection.dropIndex("clerkUserId_1");
  if (!isCorrect) {
    await Resident.collection.createIndex(
      { clerkUserId: 1 },
      { name: "clerkUserId_1", unique: true, sparse: true }
    );
  }
}

// Full resident roster, including residents who've opted out of the public
// directory. Admin-only — this is the underlying data for /portal/admin.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  await connectToDatabase();
  const residents = await Resident.find().sort({ fullName: 1 }).lean();
  return NextResponse.json({ residents });
}

// Body: { firstName, lastName, address, email, phone?, moveInYear?, listedInDirectory? }
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();

  if (body.action === "preview" || body.action === "import") {
    if (typeof body.csv !== "string" || !body.csv.trim()) {
      return NextResponse.json({ error: "A CSV file is required" }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await Resident.find().select("email").lean();
    const existingEmails = new Set(existing.map((resident) => normalizeEmail(resident.email)));
    let rows;
    try {
      rows = parseResidentCsv(body.csv, existingEmails);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to parse CSV" },
        { status: 400 }
      );
    }

    const summary = {
      found: rows.length,
      added: rows.filter((row) => row.status === "valid").length,
      skippedExisting: rows.filter((row) => row.status === "existing").length,
      invalid: rows.filter((row) => row.status === "invalid").length,
    };

    if (body.action === "preview") return NextResponse.json({ rows, summary });

    const toInsert = rows
      .filter((row) => row.status === "valid")
      .map(({ firstName, lastName, fullName, address, email, phone }) => ({
        firstName,
        lastName,
        fullName,
        address,
        email,
        phone,
      }));
    if (toInsert.length > 0) await ensureSparseClerkUserIndex();
    const inserted = toInsert.length > 0 ? await Resident.insertMany(toInsert) : [];
    return NextResponse.json({
      summary: { ...summary, added: inserted.length },
      rows,
    });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  if (!firstName || !lastName || !body.address || !body.email) {
    return NextResponse.json(
      { error: "First name, last name, address, and email are required" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const resident = await Resident.create({
    firstName,
    lastName,
    fullName,
    address: body.address,
    email: body.email,
    phone: body.phone || undefined,
    moveInYear: body.moveInYear || undefined,
    listedInDirectory: body.listedInDirectory ?? true,
  });

    return NextResponse.json({ resident }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/residents] POST failed", error);
    return NextResponse.json({ error: "Unable to process resident request" }, { status: 500 });
  }
}

// Body: { id, fullName?, address?, email?, phone?, moveInYear?, listedInDirectory? }
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const allowed = ["fullName", "address", "email", "phone", "moveInYear", "listedInDirectory", "isAdmin"];
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
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectToDatabase();
  await Resident.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
