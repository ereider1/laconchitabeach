import mongoose, { Schema, models, model } from "mongoose";

export interface IGlobalSettings {
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const GlobalSettingsSchema = new Schema<IGlobalSettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

// In development Next.js can hot-reload this module while Mongoose keeps the
// previous model cached. Rebuild it if the old schema still only accepts booleans.
const existingGlobalSettings = models.GlobalSettings as mongoose.Model<IGlobalSettings> | undefined;
const existingValueType = existingGlobalSettings?.schema.path("value")?.instance;
if (existingGlobalSettings && existingValueType !== "Mixed") {
  mongoose.deleteModel("GlobalSettings");
}

export default (models.GlobalSettings as mongoose.Model<IGlobalSettings>) ||
  model<IGlobalSettings>("GlobalSettings", GlobalSettingsSchema);
