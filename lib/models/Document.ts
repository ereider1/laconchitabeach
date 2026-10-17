import mongoose, { Schema, models, model } from "mongoose";
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/lib/documentCategories";

export interface IDocument {
  title: string;
  description?: string;
  category: DocumentCategory;
  fileUrl: string;
  uploadedByName: string;
  uploadedByClerkId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: DOCUMENT_CATEGORIES,
      default: "other",
    },
    fileUrl: { type: String, required: true },
    uploadedByName: { type: String, required: true },
    uploadedByClerkId: { type: String, required: true },
  },
  { timestamps: true }
);

export default (models.Document as mongoose.Model<IDocument>) ||
  model<IDocument>("Document", DocumentSchema);
