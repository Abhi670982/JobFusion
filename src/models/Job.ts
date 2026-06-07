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
      enum: ["full-time", "part-time", "contract", "internship"],
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
  },
  {
    timestamps: true,
  }
);

const Job = models.Job || model("Job", JobSchema);

export default Job;