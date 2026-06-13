import mongoose, { Schema, model, models } from "mongoose";

const ProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    skills: [
      {
        name: { type: String, required: true },
        level: { type: Number, required: true },
      }
    ],
    location: {
      type: String,
      trim: true,
    },
    experience: {
      type: String,
      trim: true,
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    resumeName: {
      type: String,
      trim: true,
    },
    resumeUpdatedAt: {
      type: Date,
    },
    resumeText: {
      type: String,
      default: "",
    },
    extractedSkillsText: {
      type: String,
      default: "",
    },
    experiences: [
      {
        company: String,
        role: String,
        period: String,
        duration: String,
        description: String,
        skills: [String],
        companyColor: String,
        logo: String,
      }
    ],
    education: [
      {
        school: String,
        degree: String,
        period: String,
        logo: String,
        color: String,
      }
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        year: String,
        iconName: String,
      }
    ],
    projects: [
      {
        name: String,
        description: String,
        tech: [String],
        link: String,
        stars: String,
      }
    ],
    noticePeriod: {
      type: String,
      default: "30 days",
    },
    expectedSalary: {
      type: String,
      default: "₹28L – ₹45L",
    },
    phone: {
      type: String,
      default: "+91 98765 43210",
    },
    portfolioUrl: {
      type: String,
      default: "",
    },
    githubUrl: {
      type: String,
      default: "",
    },
    linkedinUrl: {
      type: String,
      default: "",
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    resumeSkillMode: {
      type: String,
      enum: ["merge", "replace"],
      default: "merge",
    },
    resumeCategory: {
      type: String,
      default: "",
    },
    resumeSummary: {
      type: String,
      default: "",
    },
    suggestedRoles: [
      {
        type: String,
      }
    ],
    resumeInsights: {
      found: [{ type: String }],
      missing: [{ type: String }],
      tips: [{ type: String }],
    },
    notifications: {
      jobMatches: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
      recruiterMessages: { type: Boolean, default: true },
      aiRecommendations: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      marketingEmails: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

const Profile = models.Profile || model("Profile", ProfileSchema);

export default Profile;
