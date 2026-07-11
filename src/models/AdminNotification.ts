import mongoose, { Schema, model, models } from "mongoose";

const AdminNotificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["new_report", "parsing_failed", "sync_failed", "api_error", "user_spike", "system_warning"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
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

AdminNotificationSchema.index({ isRead: 1, timestamp: -1 });

const AdminNotification = models.AdminNotification || model("AdminNotification", AdminNotificationSchema);

export default AdminNotification;
