import mongoose, { Schema, model, models } from "mongoose";

const ReportSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["bug", "feature_request", "incorrect_job", "resume_parsing"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ status: 1, createdAt: -1 });

const Report = models.Report || model("Report", ReportSchema);

export default Report;
