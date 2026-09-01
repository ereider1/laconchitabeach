import mongoose, { Schema, models, model } from "mongoose";

export interface IResident {
  clerkUserId?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  address: string;
  email: string;
  phone?: string;
  householdMembers?: string[];
  listedInDirectory: boolean;
  moveInYear?: number;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentSchema = new Schema<IResident>(
  {
    // Admins can add a resident's directory info before that resident has
    // signed up (or ever will) — clerkUserId is filled in once/if they do.
    clerkUserId: { type: String, unique: true, sparse: true },
    firstName: { type: String },
    lastName: { type: String },
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    householdMembers: [{ type: String }],
    listedInDirectory: { type: Boolean, default: true },
    moveInYear: { type: Number },
    // Grants admin access once this record's clerkUserId matches a signed-in
    // user. Managed from Admin → Profiles. See lib/isAdmin.ts.
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default (models.Resident as mongoose.Model<IResident>) ||
  model<IResident>("Resident", ResidentSchema);
