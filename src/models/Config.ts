import mongoose, { Schema, model, models } from "mongoose";

/**
 * Generic key/value config store for server-side state
 * that needs to persist across serverless function invocations.
 * Used for: crawl cooldown timestamps, feature flags, etc.
 */
const ConfigSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Config = models.Config || model("Config", ConfigSchema);

export default Config;
