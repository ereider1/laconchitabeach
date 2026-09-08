import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import PageSection from "@/lib/models/PageSection";
import GlobalSettings from "@/lib/models/GlobalSettings";
import { isAdmin } from "@/lib/isAdmin";

// 1. GET: Fetch all sections and the global setting
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  await connectToDatabase();

  // Get all custom sections sorted by slot, then order
  const sections = await PageSection.find().sort({ slot: 1, order: 1 }).lean();

  // Get the global toggle status
  const globalSetting = await GlobalSettings.findOne({ key: "page-builder-active" }).lean();
  const pageBuilderActive = globalSetting ? globalSetting.value : true;

  return NextResponse.json({ sections, pageBuilderActive });
}

// 2. POST: Create a new homepage section
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();
  if (!body.name || !body.slot || !body.layout || !body.content) {
    return NextResponse.json({ error: "Missing required fields (name, slot, layout, content)" }, { status: 400 });
  }

  await connectToDatabase();

  // Determine order (last in slot)
  const lastSection = await PageSection.findOne({ slot: body.slot }).sort({ order: -1 }).lean();
  const nextOrder = lastSection ? lastSection.order + 1 : 0;

  const section = await PageSection.create({
    name: body.name,
    slot: body.slot,
    layout: body.layout,
    eyebrow: body.eyebrow,
    title: body.title,
    content: body.content,
    imageUrl: body.imageUrl,
    buttonText: body.buttonText,
    buttonLink: body.buttonLink,
    isActive: body.isActive !== false,
    order: body.order ?? nextOrder,
  });

  return NextResponse.json({ section }, { status: 201 });
}

// 3. PATCH: Update a section OR update the global toggle
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();
  await connectToDatabase();

  // Scenario A: Global Toggle Update
  if (body.toggleKey === "page-builder-active") {
    const updatedSetting = await GlobalSettings.findOneAndUpdate(
      { key: "page-builder-active" },
      { value: !!body.value },
      { upsert: true, new: true }
    );
    return NextResponse.json({ ok: true, active: updatedSetting.value });
  }

  // Scenario B: Reorder Sections
  if (body.reorder && Array.isArray(body.reorder)) {
    const promises = body.reorder.map(async (item: { id: string; order: number }) => {
      return PageSection.findByIdAndUpdate(item.id, { order: item.order });
    });
    await Promise.all(promises);
    return NextResponse.json({ ok: true });
  }

  // Scenario C: Section Edit Update
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const allowed = ["name", "slot", "layout", "eyebrow", "title", "content", "imageUrl", "buttonText", "buttonLink", "isActive", "order"];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) fields[key] = updates[key];
  }

  const section = await PageSection.findByIdAndUpdate(id, fields, { new: true });
  if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

  return NextResponse.json({ section });
}

// 4. DELETE: Delete a custom section
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectToDatabase();
  await PageSection.findByIdAndDelete(id);

  return NextResponse.json({ ok: true });
}
