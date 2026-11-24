import mongoose, { Schema, models, model } from "mongoose";

export interface IContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  replies: {
    body: string;
    sentAt: Date;
    attachments: { filename: string; contentType: string; size: number }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
  trashedAt?: Date;
}

const ContactMessageReplySchema = new Schema(
  {
    body: { type: String, required: true },
    sentAt: { type: Date, required: true },
    attachments: {
      type: [{ filename: String, contentType: String, size: Number }],
      default: [],
    },
  },
  { _id: false }
);

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    replies: { type: [ContactMessageReplySchema], default: [] },
    trashedAt: { type: Date },
  },
  { timestamps: true }
);

export default (models.ContactMessage as mongoose.Model<IContactMessage>) ||
  model<IContactMessage>("ContactMessage", ContactMessageSchema);
