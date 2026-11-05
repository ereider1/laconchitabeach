import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import PageSection from "@/lib/models/PageSection";
import GlobalSettings from "@/lib/models/GlobalSettings";
import { isAdmin } from "@/lib/isAdmin";
import { isPageSectionVisibility } from "@/lib/pageSectionVisibility";
import { isPageSectionSlot } from "@/lib/pageSectionSlots";
import { isImageCollectionLayout, isPageSectionLayout } from "@/lib/pageSectionLayouts";
import { isHomePageContent } from "@/lib/homePageContent";

// 1. GET: Fetch sections and page content
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  await connectToDatabase();

  // Get all custom sections sorted by slot, then order
  const sections = await PageSection.find().sort({ slot: 1, order: 1 }).lean();

  const aboutSetting = await GlobalSettings.findOne({ key: "about-page-content" }).lean();
  const preparednessSetting = await GlobalSettings.findOne({ key: "community-preparedness-content" }).lean();
  const homepageSetting = await GlobalSettings.findOne({ key: "home-page-content" }).lean();

  return NextResponse.json({
    sections,
    aboutContent: aboutSetting?.value ?? null,
    preparednessContent: preparednessSetting?.value ?? null,
    homePageContent: homepageSetting?.value ?? null,
  });
}

// 2. POST: Create a new homepage section
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();
  const isFlyer = body.layout === "single-image-flyer";
  const isImageCollection = isPageSectionLayout(body.layout) && isImageCollectionLayout(body.layout);
  const sectionName = typeof body.name === "string" ? body.name.trim() : "";
  if (!isPageSectionSlot(body.slot)) {
    return NextResponse.json({ error: "Section placement is invalid" }, { status: 400 });
  }
  if (body.visibility !== undefined && !isPageSectionVisibility(body.visibility)) {
    return NextResponse.json({ error: "Section visibility is invalid" }, { status: 400 });
  }
  if (!isPageSectionLayout(body.layout)) {
    return NextResponse.json({ error: "Section layout is invalid" }, { status: 400 });
  }
  if (
    isImageCollection &&
    (!Array.isArray(body.imageUrls) ||
      body.imageUrls.length === 0 ||
      body.imageUrls.some((image: unknown) => typeof image !== "string" || !image.trim()))
  ) {
    return NextResponse.json({ error: "Add at least one valid image to the gallery or carousel" }, { status: 400 });
  }
  if (
    (!isFlyer && !sectionName) ||
    !body.slot ||
    (isFlyer && !body.imageUrl) ||
    (!isFlyer && !isImageCollection && !body.content)
  ) {
    return NextResponse.json(
      { error: "Slot, layout, and the layout's required fields are required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // Determine order (last in slot)
    const lastSection = await PageSection.findOne({ slot: body.slot }).sort({ order: -1 }).lean();
    const nextOrder = lastSection ? lastSection.order + 1 : 0;

    const section = await PageSection.create({
      name: sectionName || "Single Image/Flyer",
      slot: body.slot,
      layout: body.layout,
      eyebrow: body.eyebrow,
      title: body.title,
      content: body.content ?? "",
      imageUrl: body.imageUrl,
      imageUrls: isImageCollection ? body.imageUrls : undefined,
      buttonText: body.buttonText,
      buttonLink: body.buttonLink,
      visibility: body.visibility ?? "everyone",
      isActive: body.isActive !== false,
      order: body.order ?? nextOrder,
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error("Failed to publish page-builder section:", error);
    return NextResponse.json(
      { error: "Failed to publish section. Please try again." },
      { status: 500 }
    );
  }
}

// 3. PATCH: Update a section OR update the global toggle
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();
  await connectToDatabase();

  if (body.settingKey === "about-page-content") {
    const content = body.value;
    if (!content || typeof content !== "object" || typeof content.eyebrow !== "string" || typeof content.paragraphs !== "string" || (content.images !== undefined && (!Array.isArray(content.images) || content.images.some((image: unknown) => typeof image !== "string")))) {
      return NextResponse.json({ error: "About page content is invalid" }, { status: 400 });
    }
    try {
      const updatedSetting = await GlobalSettings.findOneAndUpdate(
        { key: "about-page-content" },
        { value: { eyebrow: content.eyebrow.trim(), paragraphs: content.paragraphs.trim(), images: content.images ?? [] } },
        { upsert: true, new: true, runValidators: true }
      );
      return NextResponse.json({ ok: true, aboutContent: updatedSetting.value });
    } catch (error) {
      console.error("Failed to save About page content:", error);
      return NextResponse.json({ error: "Failed to save About page content" }, { status: 500 });
    }
  }

  if (body.settingKey === "community-preparedness-content") {
    if (!body.value || typeof body.value !== "object") {
      return NextResponse.json({ error: "Community preparedness content is invalid" }, { status: 400 });
    }
    try {
      const updatedSetting = await GlobalSettings.findOneAndUpdate(
        { key: "community-preparedness-content" },
        { value: body.value },
        { upsert: true, new: true }
      );
      return NextResponse.json({ ok: true, preparednessContent: updatedSetting.value });
    } catch (error) {
      console.error("Failed to save Community Preparedness content:", error);
      return NextResponse.json({ error: "Failed to save Community Preparedness content" }, { status: 500 });
    }
  }

  if (body.settingKey === "home-page-content") {
    if (!isHomePageContent(body.value)) {
      return NextResponse.json({ error: "Home page content is invalid" }, { status: 400 });
    }
    try {
      const updatedSetting = await GlobalSettings.findOneAndUpdate(
        { key: "home-page-content" },
        { value: body.value },
        { upsert: true, new: true },
      );
      return NextResponse.json({ ok: true, homePageContent: updatedSetting.value });
    } catch (error) {
      console.error("Failed to save Home page content:", error);
      return NextResponse.json({ error: "Failed to save Home page content" }, { status: 500 });
    }
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

  if (updates.visibility !== undefined && !isPageSectionVisibility(updates.visibility)) {
    return NextResponse.json({ error: "Section visibility is invalid" }, { status: 400 });
  }
  if (updates.slot !== undefined && !isPageSectionSlot(updates.slot)) {
    return NextResponse.json({ error: "Section placement is invalid" }, { status: 400 });
  }
  if (updates.layout !== undefined && !isPageSectionLayout(updates.layout)) {
    return NextResponse.json({ error: "Section layout is invalid" }, { status: 400 });
  }
  if (updates.imageUrls !== undefined &&
    (!Array.isArray(updates.imageUrls) ||
      updates.imageUrls.some((image: unknown) => typeof image !== "string" || !image.trim()))
  ) {
    return NextResponse.json({ error: "Section images are invalid" }, { status: 400 });
  }
  const allowed = ["name", "slot", "layout", "eyebrow", "title", "content", "imageUrl", "imageUrls", "buttonText", "buttonLink", "visibility", "isActive", "order"];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) fields[key] = updates[key];
  }

  const existingSection = await PageSection.findById(id).lean();
  if (!existingSection) return NextResponse.json({ error: "Section not found" }, { status: 404 });
  const effectiveLayout = updates.layout ?? existingSection.layout;
  const effectiveImages = updates.imageUrls ?? existingSection.imageUrls ?? (existingSection.imageUrl ? [existingSection.imageUrl] : []);
  if (isImageCollectionLayout(effectiveLayout) && effectiveImages.length === 0) {
    return NextResponse.json({ error: "Add at least one image to the gallery or carousel" }, { status: 400 });
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
