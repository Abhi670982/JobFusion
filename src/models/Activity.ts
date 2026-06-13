import mongoose, { Schema, model, models } from "mongoose";

const ActivitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      enum: ["applied", "saved", "viewed", "updated_profile", "updated_resume", "interview", "offer", "rejected"],
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
    jobTitle: {
      type: String,
    },
    company: {
      type: String,
    },
    details: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Activity = models.Activity || model("Activity", ActivitySchema);

export default Activity;
