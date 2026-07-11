import mongoose, { Schema, model, models } from "mongoose";

const ResumeParsingLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    step: {
      type: String,
      required: true,
    },
    errorMsg: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: "unknown",
    },
    parsingTimeMs: {
      type: Number,
      default: 0,
    },
    skillsExtractedCount: {
      type: Number,
      default: 0,
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

ResumeParsingLogSchema.index({ status: 1, timestamp: -1 });

const ResumeParsingLog = models.ResumeParsingLog || model("ResumeParsingLog", ResumeParsingLogSchema);

export default ResumeParsingLog;
