import mongoose, { Schema, model, models } from "mongoose";

const ActivitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["applied", "saved", "viewed", "updated_profile", "updated_resume", "interview", "offer", "rejected", "admin_action", "failed_login", "system_event", "registered"],
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
    adminName: {
      type: String,
    },
    adminEmail: {
      type: String,
    },
    action: {
      type: String,
    },
    resource: {
      type: String,
    },
    resourceId: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Activity = models.Activity || model("Activity", ActivitySchema);

export default Activity;
