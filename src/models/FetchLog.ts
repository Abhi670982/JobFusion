import mongoose, { Schema, model, models } from "mongoose";

const FetchLogSchema = new Schema(
  {
    source: {
      type: String,
      required: true,
      enum: ["linkedin", "indeed", "wellfound", "internshala"],
    },
    status: {
      type: String,
      required: true,
      enum: ["success", "failed", "captcha"],
    },
    jobsFetched: {
      type: Number,
      default: 0,
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

const FetchLog = models.FetchLog || model("FetchLog", FetchLogSchema);

export default FetchLog;
