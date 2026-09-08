import mongoose, { Schema, models, model } from "mongoose";

export interface IGlobalSettings {
  key: string;
  value: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GlobalSettingsSchema = new Schema<IGlobalSettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export default (models.GlobalSettings as mongoose.Model<IGlobalSettings>) ||
  model<IGlobalSettings>("GlobalSettings", GlobalSettingsSchema);
