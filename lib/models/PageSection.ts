import mongoose, { Schema, models, model } from "mongoose";
import { PAGE_SECTION_VISIBILITIES, type PageSectionVisibility } from "@/lib/pageSectionVisibility";
import { PAGE_SECTION_SLOTS, type PageSectionSlot } from "@/lib/pageSectionSlots";
import { PAGE_SECTION_LAYOUTS, type PageSectionLayout } from "@/lib/pageSectionLayouts";

export interface IPageSection {
  name: string;
  slot: PageSectionSlot;
  layout: PageSectionLayout;
  eyebrow?: string;
  title?: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  buttonText?: string;
  buttonLink?: string;
  visibility: PageSectionVisibility;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PageSectionSchema = new Schema<IPageSection>(
  {
    name: { type: String, required: true },
    slot: {
      type: String,
      enum: PAGE_SECTION_SLOTS.map((slot) => slot.value),
      required: true,
    },
    layout: {
      type: String,
      enum: PAGE_SECTION_LAYOUTS,
      required: true,
    },
    eyebrow: { type: String },
    title: { type: String },
    content: { type: String, default: "" },
    imageUrl: { type: String },
    imageUrls: { type: [String], default: undefined },
    buttonText: { type: String },
    buttonLink: { type: String },
    visibility: { type: String, enum: PAGE_SECTION_VISIBILITIES, default: "everyone" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const existingPageSection = models.PageSection as mongoose.Model<IPageSection> | undefined;
const existingSlotEnum = existingPageSection?.schema.path("slot")?.options.enum;
const existingLayoutEnum = existingPageSection?.schema.path("layout")?.options.enum;
const existingContentRequired = existingPageSection?.schema.path("content")?.options.required;
const existingVisibilityEnum = existingPageSection?.schema.path("visibility")?.options.enum;

if (
  existingPageSection &&
  ((!Array.isArray(existingSlotEnum) || !PAGE_SECTION_SLOTS.every((slot) => existingSlotEnum.includes(slot.value))) ||
    !Array.isArray(existingLayoutEnum) ||
    !PAGE_SECTION_LAYOUTS.every((layout) => existingLayoutEnum.includes(layout)) ||
    existingContentRequired === true ||
    !Array.isArray(existingVisibilityEnum) ||
    !PAGE_SECTION_VISIBILITIES.every((visibility) => existingVisibilityEnum.includes(visibility)))
) {
  mongoose.deleteModel("PageSection");
}

export default
  (models.PageSection as mongoose.Model<IPageSection>) ||
  model<IPageSection>("PageSection", PageSectionSchema);
