import mongoose, { Schema, models, model } from "mongoose";
import {
  COMMUNITY_POST_CATEGORIES,
  LEGACY_COMMUNITY_POST_CATEGORIES,
} from "@/lib/communityCategories";

const categoryValues = [
  ...COMMUNITY_POST_CATEGORIES.map((category) => category.value),
  ...Object.keys(LEGACY_COMMUNITY_POST_CATEGORIES),
];

export interface IMaintenanceRequest {
  submittedByName: string;
  submittedByClerkId: string;
  address: string;
  category:
    | (typeof COMMUNITY_POST_CATEGORIES)[number]["value"]
    | keyof typeof LEGACY_COMMUNITY_POST_CATEGORIES;
  description: string;
  photoUrl?: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceRequestSchema = new Schema<IMaintenanceRequest>(
  {
    submittedByName: { type: String, required: true },
    submittedByClerkId: { type: String, required: true },
    address: { type: String, required: true },
    category: {
      type: String,
      enum: categoryValues,
      default: "other",
    },
    description: { type: String, required: true },
    photoUrl: { type: String },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

export default (models.MaintenanceRequest as mongoose.Model<IMaintenanceRequest>) ||
  model<IMaintenanceRequest>("MaintenanceRequest", MaintenanceRequestSchema);
