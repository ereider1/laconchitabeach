import mongoose, { Schema, models, model } from "mongoose";

export interface IPageSection {
  name: string;
  slot: "below-hero" | "below-services" | "above-footer";
  layout: "full-width" | "two-col-img-left" | "two-col-img-right";
  eyebrow?: string;
  title?: string;
  content: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
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
      enum: ["below-hero", "below-services", "above-footer"],
      required: true,
    },
    layout: {
      type: String,
      enum: ["full-width", "two-col-img-left", "two-col-img-right"],
      required: true,
    },
    eyebrow: { type: String },
    title: { type: String },
    content: { type: String, required: true },
    imageUrl: { type: String },
    buttonText: { type: String },
    buttonLink: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default (models.PageSection as mongoose.Model<IPageSection>) ||
  model<IPageSection>("PageSection", PageSectionSchema);
