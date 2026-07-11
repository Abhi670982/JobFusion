import mongoose, { Schema, model, models } from "mongoose";

const SettingsSchema = new Schema(
  {
    settingsId: {
      type: String,
      required: true,
      unique: true,
      default: "global",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    homepageAnnouncement: {
      type: String,
      default: "",
    },
    geminiKeyPlaceholder: {
      type: String,
      default: "",
    },
    featureFlags: {
      type: Schema.Types.Mixed,
      default: {
        aiRecommendations: true,
        scraperEnabled: true,
        resumeParsing: true,
      },
    },
    futureIntegrations: {
      type: Schema.Types.Mixed,
      default: {},
    },
    allowedAdminEmails: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Settings = models.Settings || model("Settings", SettingsSchema);

export default Settings;
