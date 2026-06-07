import mongoose, { Schema, model, models } from "mongoose";

const SavedJobSchema = new Schema(
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
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// A user should only be able to save a specific job once
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const SavedJob = models.SavedJob || model("SavedJob", SavedJobSchema);

export default SavedJob;