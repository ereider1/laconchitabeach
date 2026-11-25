import mongoose, { Schema, model, models } from "mongoose";

export interface IResidentPhoto {
  ownerClerkId: string;
  uploaderName?: string;
  originalUrl: string;
  thumbnailUrl: string;
  caption?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  reports: Array<{ reporterClerkId: string; reason?: string; createdAt: Date; resolvedAt?: Date; resolvedBy?: string }>;
}

const ResidentPhotoSchema = new Schema<IResidentPhoto>({
  ownerClerkId: { type: String, required: true, index: true },
  uploaderName: String,
  originalUrl: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  caption: { type: String, maxlength: 240 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  reports: [{ reporterClerkId: String, reason: String, createdAt: Date, resolvedAt: Date, resolvedBy: String }],
}, { timestamps: true });

ResidentPhotoSchema.index({ createdAt: -1 });
export default (models.ResidentPhoto as mongoose.Model<IResidentPhoto>) || model<IResidentPhoto>("ResidentPhoto", ResidentPhotoSchema);
