import mongoose, { Schema, model, models } from "mongoose";

const JobSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    companyLogo: {
      type: String,
      default: "",
    },
    companyColor: {
      type: String,
      default: "#6366f1",
    },
    location: {
      type: String,
      trim: true,
    },
    locationType: {
      type: String,
      enum: ["remote", "hybrid", "onsite"],
      default: "remote",
    },
    salary: {
      type: String,
      trim: true,
    },
    salaryMin: {
      type: Number,
      default: 0,
    },
    salaryMax: {
      type: Number,
      default: 0,
    },
    experience: {
      type: String,
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "executive"],
      default: "mid",
    },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "freelance"],
      default: "full-time",
    },
    skills: {
      type: [String],
      default: [],
    },
    matchScore: {
      type: Number,
      default: 80,
    },
    postedAt: {
      type: String,
      default: "Just now",
    },
    postedAtDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    benefits: {
      type: [String],
      default: [],
    },
    applicants: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: "Engineering",
    },
    source: {
      type: String,
      trim: true,
    },
    applyUrl: {
      type: String,
      trim: true,
    },
    // --- Unified Schema Extensions ---
    sourceId: {
      type: String,
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    jobType: {
      type: String,
      trim: true,
    },
    salaryCurrency: {
      type: String,
      trim: true,
    },
    salaryPeriod: {
      type: String,
      trim: true,
    },
    descriptionHtml: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    dedupeHash: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
     isActive: {
      type: Boolean,
      default: true,
    },
    matchedSkill: {
      type: String,
      trim: true,
    }
  },
  {
    timestamps: true,
  }
);

// Create indexes
JobSchema.index({ source: 1 });
JobSchema.index({ title: 1 });
JobSchema.index({ company: 1 });
JobSchema.index({ location: 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ title: 1, company: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ postedAtDate: -1 });
JobSchema.index({ skills: 1 });
JobSchema.index({ city: 1, country: 1 });

// Recency & TTL indexes
JobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
JobSchema.index({ postedAtDate: -1, isActive: 1, source: 1 });
JobSchema.index({ matchedSkill: 1, postedAtDate: -1 });

// Weighted compound text index for fast, safe full-text search.
// Replaces raw $regex queries on q param — prevents ReDoS + enables index use.
JobSchema.index(
  { title: "text", company: "text", skills: "text", description: "text" },
  {
    weights: { title: 10, skills: 8, company: 5, description: 1 },
    name: "jobs_text_search",
  }
);

if (models.Job) {
  delete (models as any).Job;
}
const Job = model("Job", JobSchema);

export default Job;