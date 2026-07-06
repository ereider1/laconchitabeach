import mongoose, { Schema, models, model } from "mongoose";

export interface IResident {
  clerkUserId: string;
  fullName: string;
  address: string;
  email: string;
  phone?: string;
  householdMembers?: string[];
  listedInDirectory: boolean;
  moveInYear?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentSchema = new Schema<IResident>(
  {
    clerkUserId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    householdMembers: [{ type: String }],
    listedInDirectory: { type: Boolean, default: true },
    moveInYear: { type: Number },
  },
  { timestamps: true }
);

export default (models.Resident as mongoose.Model<IResident>) ||
  model<IResident>("Resident", ResidentSchema);
