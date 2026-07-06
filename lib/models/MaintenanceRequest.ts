import mongoose, { Schema, models, model } from "mongoose";

export interface IMaintenanceRequest {
  submittedByName: string;
  submittedByClerkId: string;
  address: string;
  category:
    | "common-area"
    | "beach-access"
    | "landscaping"
    | "lighting"
    | "Lost & Found"
    | "for sale"
    | "looking for"
    | "free"
    | "other";
  description: string;
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
      enum: [
        "common-area",
        "beach-access",
        "landscaping",
        "lighting",
        "Lost & Found",
        "for sale",
        "looking for",
        "free",
        "other",
      ],
      default: "other",
    },
    description: { type: String, required: true },
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
