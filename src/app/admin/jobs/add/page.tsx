"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  Globe,
  DollarSign,
  Calendar,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function AddJobPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [description, setDescription] = useState("");
  const [responsibilitiesInput, setResponsibilitiesInput] = useState("");
  const [requirementsInput, setRequirementsInput] = useState("");
  
  // Tag input states
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [prefSkillInput, setPrefSkillInput] = useState("");

  const [experience, setExperience] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [type, setType] = useState("full-time");
  const [locationType, setLocationType] = useState("remote");
  const [salary, setSalary] = useState("");
  const [salaryMin, setSalaryMin] = useState(0);
  const [salaryMax, setSalaryMax] = useState(0);
  const [location, setLocation] = useState("Remote");
  const [openings, setOpenings] = useState(1);

  // Application info
  const [applyUrl, setApplyUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [source, setSource] = useState("Manual");

  // Company info
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");

  // Additional Toggles
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Skill tag add handlers
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (idx: number) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  const handleAddPrefSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = prefSkillInput.trim();
      if (val && !preferredSkills.includes(val)) {
        setPreferredSkills([...preferredSkills, val]);
      }
      setPrefSkillInput("");
    }
  };

  const handleRemovePrefSkill = (idx: number) => {
    setPreferredSkills(preferredSkills.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Merge skills and preferred skills to requirements bullet list
    const requirementsList = requirementsInput
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
    
    if (preferredSkills.length > 0) {
      requirementsList.push(`Preferred skills: ${preferredSkills.join(", ")}`);
    }

    const payload = {
      title,
      company,
      companyLogo,
      description,
      responsibilities: responsibilitiesInput,
      requirements: requirementsList,
      skills,
      experience,
      experienceLevel,
      type,
      locationType,
      salary,
      salaryMin: Number(salaryMin) || 0,
      salaryMax: Number(salaryMax) || 0,
      location,
      applicants: 0,
      applyUrl,
      sourceUrl,
      expiresAt: expiresAt || undefined,
      source,
      featured,
      isActive,
      companyWebsite,
      industry,
      companySize,
    };

    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        // Reset form
        setTitle("");
        setCompany("");
        setCompanyLogo("");
        setDescription("");
        setResponsibilitiesInput("");
        setRequirementsInput("");
        setSkills([]);
        setPreferredSkills([]);
        setExperience("");
        setSalary("");
        setSalaryMin(0);
        setSalaryMax(0);
        setLocation("Remote");
        setApplyUrl("");
        setSourceUrl("");
        setExpiresAt("");
        setCompanyWebsite("");
        setIndustry("");
        setCompanySize("");
        setFeatured(false);
        setIsActive(true);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(data.error || "Failed to create job posting.");
      }
    } catch (err: any) {
      setError(err.message || "Request timeout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16 animate-fade-in">
      {/* Back link */}
      <button
        onClick={() => window.location.href = "/admin/jobs"}
        className="flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors group touch-auto"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Jobs Management
      </button>

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
          Create New Job Posting
        </h2>
        <p className="text-xs text-[#a1a1aa] mt-1">Manually publish a vacancy details. Newly created listings sync instantly across all user job feeds.</p>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] text-xs font-semibold text-emerald-400 leading-normal"
          >
            <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#e4e4e7]">Job Created Successfully!</p>
              <p className="text-[#a1a1aa] font-normal mt-0.5">The job vacancy is now live and can be recommended, searched, and saved by candidates.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 p-4 rounded-xl border border-red-500/10 bg-red-500/[0.02] text-xs font-semibold text-red-400 leading-normal"
          >
            <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#e4e4e7]">Job Validation Errors</p>
              <p className="text-[#a1a1aa] font-normal mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="rounded-2xl border border-[#27272a]/80 bg-[#18181b]/10 p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" /> Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Job Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Company Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
            </div>

            {/* Company Logo Url */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Company Logo URL (optional)</label>
              <input
                type="url"
                value={companyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
                placeholder="e.g. https://logo.clearbit.com/acme.com"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
            </div>

            {/* Experience level & Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#e4e4e7] block">Exp Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3 py-2.5 rounded-xl outline-none transition-all touch-auto"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#e4e4e7] block">Exp Required</label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 3-5 years"
                  className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
                />
              </div>
            </div>

            {/* Employment Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Employment Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3 py-2.5 rounded-xl outline-none transition-all touch-auto"
              >
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>

            {/* Work Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Work Mode</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3 py-2.5 rounded-xl outline-none transition-all touch-auto"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Job Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangalore, India"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
            </div>

            {/* Openings */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Number of Openings</label>
              <input
                type="number"
                min="1"
                value={openings}
                onChange={(e) => setOpenings(Number(e.target.value))}
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all"
              />
            </div>
          </div>

          {/* Salary inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#27272a]/30">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Salary Text (optional)
              </label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. ₹15L - ₹22L / yr"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Min Salary (value)</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Max Salary (value)</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(Number(e.target.value))}
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-[#e4e4e7] block">Job Description (Rich Text/Detailed) <span className="text-red-400">*</span></label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a thorough job description..."
              className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] p-3.5 rounded-xl outline-none transition-all placeholder-[#71717a] font-sans leading-normal"
            />
          </div>

          {/* Responsibilities */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#e4e4e7] block">Responsibilities (One bullet per line)</label>
            <textarea
              rows={4}
              value={responsibilitiesInput}
              onChange={(e) => setResponsibilitiesInput(e.target.value)}
              placeholder="e.g. Design responsive UI layouts&#10;Implement REST API endpoints&#10;Optimize database queries"
              className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] p-3.5 rounded-xl outline-none transition-all placeholder-[#71717a] font-sans leading-normal"
            />
          </div>

          {/* Requirements / Preferred experience */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#e4e4e7] block">Key Requirements / Preferred Experience (One bullet per line)</label>
            <textarea
              rows={4}
              value={requirementsInput}
              onChange={(e) => setRequirementsInput(e.target.value)}
              placeholder="e.g. Bachelor's in Computer Science&#10;Solid understanding of React and Next.js&#10;Familiarity with Tailwind CSS"
              className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] p-3.5 rounded-xl outline-none transition-all placeholder-[#71717a] font-sans leading-normal"
            />
          </div>

          {/* Tag Inputs: Required Skills */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-[#e4e4e7] block">Required Skills (Type and press Enter or Comma)</label>
            <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-[#27272a] bg-[#09090b]/40 min-h-[46px] items-center">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-400"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-[#71717a] hover:text-[#f4f4f5] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder={skills.length === 0 ? "e.g. React, Next.js, Node.js" : ""}
                className="bg-transparent border-none outline-none text-xs text-[#f4f4f5] flex-1 min-w-[120px] placeholder-[#71717a]"
              />
            </div>
          </div>

          {/* Tag Inputs: Preferred Skills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#e4e4e7] block">Preferred Skills (optional)</label>
            <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-[#27272a] bg-[#09090b]/40 min-h-[46px] items-center">
              {preferredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#27272a] border border-[#27272a]/60 text-[10px] font-semibold text-[#a1a1aa]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemovePrefSkill(idx)}
                    className="text-[#71717a] hover:text-[#f4f4f5] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={prefSkillInput}
                onChange={(e) => setPrefSkillInput(e.target.value)}
                onKeyDown={handleAddPrefSkill}
                placeholder={preferredSkills.length === 0 ? "e.g. Docker, GraphQL" : ""}
                className="bg-transparent border-none outline-none text-xs text-[#f4f4f5] flex-1 min-w-[120px] placeholder-[#71717a]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Application Information */}
        <div className="rounded-2xl border border-[#27272a]/80 bg-[#18181b]/10 p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" /> Application Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Apply URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Application Link (Apply URL) <span className="text-red-400">*</span></label>
              <input
                type="url"
                required
                value={applyUrl}
                onChange={(e) => setApplyUrl(e.target.value)}
                placeholder="e.g. https://careers.acme.com/apply/102"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
            </div>

            {/* Official Careers URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Official Career Page URL</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="e.g. https://acme.com/careers"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Application Deadline
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all touch-auto"
              />
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Platform Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3 py-2.5 rounded-xl outline-none transition-all touch-auto"
              >
                <option value="Manual">Manual Entry</option>
                <option value="careers">Company Careers</option>
                <option value="wellfound">Wellfound</option>
                <option value="foundit">Foundit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Company Profile */}
        <div className="rounded-2xl border border-[#27272a]/80 bg-[#18181b]/10 p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" /> Company Profile information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Website */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Company Website</label>
              <input
                type="url"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="e.g. https://acme.com"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. FinTech, SaaS"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
            </div>

            {/* Company Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#e4e4e7] block">Company Size</label>
              <input
                type="text"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                placeholder="e.g. 50-100 employees"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Configuration Toggles */}
        <div className="rounded-2xl border border-[#27272a]/80 bg-[#18181b]/10 p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Featured Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured-toggle"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-[#27272a] bg-[#09090b] text-indigo-500 focus:ring-indigo-500 focus:ring-offset-[#09090b] outline-none"
              />
              <label htmlFor="featured-toggle" className="text-xs font-bold text-[#e4e4e7] cursor-pointer">
                Featured Vacancy
              </label>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active-toggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-[#27272a] bg-[#09090b] text-indigo-500 focus:ring-indigo-500 focus:ring-offset-[#09090b] outline-none"
              />
              <label htmlFor="active-toggle" className="text-xs font-bold text-[#e4e4e7] cursor-pointer">
                Publish Immediately (Active)
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.href = "/admin/jobs"}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a]/50 transition-all touch-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 transition-all flex items-center gap-1.5 disabled:opacity-50 touch-auto"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Job Listing
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
