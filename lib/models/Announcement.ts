import mongoose, { Schema, models, model } from "mongoose";

export interface IAnnouncement {
  title: string;
  body: string;
  category: "general" | "safety" | "maintenance" | "event";
  authorName: string;
  authorClerkId: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ["general", "safety", "maintenance", "event"],
      default: "general",
    },
    authorName: { type: String, required: true },
    authorClerkId: { type: String, required: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default (models.Announcement as mongoose.Model<IAnnouncement>) ||
  model<IAnnouncement>("Announcement", AnnouncementSchema);
