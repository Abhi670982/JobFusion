import mongoose, { Schema, model, models } from "mongoose";

const FailedJobSchema = new Schema(
  {
    source: {
      type: String,
      required: true,
    },
    rawPayload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    errorMsg: {
      type: String,
      required: true,
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

FailedJobSchema.index({ source: 1, timestamp: -1 });

if (models.FailedJob) {
  delete (models as any).FailedJob;
}
const FailedJob = model("FailedJob", FailedJobSchema);

export default FailedJob;
