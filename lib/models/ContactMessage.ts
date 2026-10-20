import mongoose, { Schema, models, model } from "mongoose";

export interface IContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default (models.ContactMessage as mongoose.Model<IContactMessage>) ||
  model<IContactMessage>("ContactMessage", ContactMessageSchema);
