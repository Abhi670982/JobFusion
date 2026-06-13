import mongoose, { Schema, model, models } from "mongoose";

const ApplicationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job ID is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["Applied", "Under Review", "Interview", "Rejected", "Offer"],
        message: "Status must be: Applied, Under Review, Interview, Rejected, or Offer",
      },
      default: "Applied",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// A user should only be able to apply to a specific job once
ApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const Application = models.Application || model("Application", ApplicationSchema);

export default Application;