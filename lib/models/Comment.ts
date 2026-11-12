import mongoose, { Schema, model, models } from "mongoose";

export type CommentTargetType = "announcement" | "event" | "community-post";

export interface IComment {
  targetType: CommentTargetType;
  targetId: string;
  authorClerkId: string;
  authorName: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    targetType: { type: String, enum: ["announcement", "event", "community-post"], required: true },
    targetId: { type: String, required: true },
    authorClerkId: { type: String, required: true },
    authorName: { type: String, required: true },
    body: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true },
);

CommentSchema.index({ targetType: 1, targetId: 1, createdAt: 1 });

export default (models.Comment as mongoose.Model<IComment>) || model<IComment>("Comment", CommentSchema);
