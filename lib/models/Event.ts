import mongoose, { Schema, models, model } from "mongoose";

export interface IEvent {
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  isPublic: boolean;
  rsvps: { clerkUserId: string; name: string; guests: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    startsAt: { type: Date, required: true },
    isPublic: { type: Boolean, default: false },
    rsvps: [
      {
        clerkUserId: { type: String, required: true },
        name: { type: String, required: true },
        guests: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export default (models.Event as mongoose.Model<IEvent>) ||
  model<IEvent>("Event", EventSchema);
