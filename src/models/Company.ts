import mongoose, { Schema, model, models } from "mongoose";

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    careerUrl: {
      type: String,
      required: true,
      trim: true,
    },
    crawlStatus: {
      type: String,
      enum: ["idle", "crawling", "failed", "success"],
      default: "idle",
    },
    lastSync: {
      type: Date,
      default: null,
    },
    jobsFound: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
      default: null,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CompanySchema.index({ name: 1 });
CompanySchema.index({ isEnabled: 1 });

const Company = models.Company || model("Company", CompanySchema);

export default Company;
