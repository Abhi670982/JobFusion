import mongoose, { Schema, model, models } from "mongoose";

const FetchLogSchema = new Schema(
  {
    source: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["success", "failed", "captcha", "partial"],
    },
    jobsFetched: {
      type: Number,
      default: 0,
    },
    jobsAdded: {
      type: Number,
      default: 0,
    },
    jobsUpdated: {
      type: Number,
      default: 0,
    },
    jobsExpired: {
      type: Number,
      default: 0,
    },
    skillsUsed: {
      type: [String],
      default: [],
    },
    jobsRejected: {
      noDate: { type: Number, default: 0 },
      tooOld: { type: Number, default: 0 },
      noSkillMatch: { type: Number, default: 0 }
    },
    oldestJobStored: {
      type: Date,
      default: null,
    },
    newestJobStored: {
      type: Date,
      default: null,
    },
    crawledAt: {
      type: Date,
      default: Date.now,
    },
    errorMsg: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

FetchLogSchema.index({ source: 1, timestamp: -1 });

if (models.FetchLog) {
  delete (models as any).FetchLog;
}
const FetchLog = model("FetchLog", FetchLogSchema);

export default FetchLog;
