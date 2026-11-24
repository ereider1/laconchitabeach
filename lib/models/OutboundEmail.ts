import mongoose, { Schema, models, model } from "mongoose";

export interface IOutboundEmail {
  name: string;
  email: string;
  subject: string;
  message: string;
  recipientCount: number;
  recipients: string[];
  attachments: { filename: string; contentType: string; size: number }[];
  createdAt: Date;
  updatedAt: Date;
  trashedAt?: Date;
}

const OutboundEmailSchema = new Schema<IOutboundEmail>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    recipientCount: { type: Number, required: true },
    recipients: { type: [String], required: true, default: [] },
    attachments: {
      type: [{ filename: String, contentType: String, size: Number }],
      required: true,
      default: [],
    },
    trashedAt: { type: Date },
  },
  { timestamps: true }
);

export default (models.OutboundEmail as mongoose.Model<IOutboundEmail>) ||
  model<IOutboundEmail>("OutboundEmail", OutboundEmailSchema);
