import mongoose, { Schema, model, models } from "mongoose";

const PageViewSchema = new Schema(
  {
    path: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }
);

PageViewSchema.index({ timestamp: -1 });
PageViewSchema.index({ path: 1, timestamp: -1 });

const PageView = models.PageView || model("PageView", PageViewSchema);

export default PageView;
