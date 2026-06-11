import mongoose, { Schema, model, models } from "mongoose";
import { calculateAtsScore } from "@/lib/ats-scorer";

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
    notifications: {
      jobMatches: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
      recruiterMessages: { type: Boolean, default: true },
      aiRecommendations: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      marketingEmails: { type: Boolean, default: false },
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    atsDetails: {
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      missingSections: { type: [String], default: [] },
      suggestions: { type: [String], default: [] },
    },
    lastAnalyzedAt: {
      type: Date,
    },
    atsHistory: [
      {
        score: { type: Number, required: true },
        date: { type: Date, default: Date.now },
      }
    ],
    resumeSkillMode: {
      type: String,
      enum: ["merge", "replace"],
      default: "merge",
    },
  },
  {
    timestamps: true,
  }
);

ProfileSchema.pre("save", async function(this: any) {
  try {
    let userEmail = "";
    try {
      const User = mongoose.models.User || mongoose.model("User");
      const userDoc = await User.findById(this.userId);
      if (userDoc) {
        userEmail = userDoc.email || "";
      }
    } catch (err) {
      console.error("[Profile pre-save] Could not fetch user details for ATS:", err);
    }

    const profileData = {
      headline: this.headline || "",
      bio: this.bio || "",
      skills: (this.skills || []).map((s: any) => ({
        name: s.name || "",
        level: s.level || 0
      })),
      location: this.location || "",
      experience: this.experience || "",
      resumeUrl: this.resumeUrl || "",
      resumeName: this.resumeName || "",
      resumeText: this.resumeText || "",
      experiences: (this.experiences || []).map((e: any) => ({
        company: e.company || "",
        role: e.role || "",
        period: e.period || "",
        duration: e.duration || "",
        description: e.description || "",
        skills: e.skills || []
      })),
      education: (this.education || []).map((edu: any) => ({
        school: edu.school || "",
        degree: edu.degree || "",
        period: edu.period || ""
      })),
      certifications: (this.certifications || []).map((c: any) => ({
        name: c.name || "",
        issuer: c.issuer || "",
        year: c.year || ""
      })),
      projects: (this.projects || []).map((p: any) => ({
        name: p.name || "",
        description: p.description || "",
        tech: p.tech || []
      })),
      phone: this.phone || "",
      portfolioUrl: this.portfolioUrl || "",
      githubUrl: this.githubUrl || "",
      linkedinUrl: this.linkedinUrl || "",
      userEmail,
    };

    const analysis = calculateAtsScore(profileData);
    
    this.atsScore = analysis.score;
    this.atsDetails = {
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      missingSections: analysis.missingSections,
      suggestions: analysis.suggestions,
    };
    this.lastAnalyzedAt = new Date();

    const isNew = this.isNew;
    const isScoreModified = this.isModified("atsScore");
    
    if (isNew || isScoreModified || !this.atsHistory || this.atsHistory.length === 0) {
      const history = this.atsHistory || [];
      const lastEntry = history[history.length - 1];
      if (!lastEntry || lastEntry.score !== analysis.score) {
        history.push({ score: analysis.score, date: new Date() });
        if (history.length > 10) {
          history.shift();
        }
        this.atsHistory = history;
      }
    }
  } catch (error) {
    console.error("[Profile pre-save] Error in ATS calculation hook:", error);
  }
});

const Profile = models.Profile || model("Profile", ProfileSchema);

export default Profile;
