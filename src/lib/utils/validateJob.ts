import { NormalizedJob } from "../types/normalizedJob";

export interface JobValidationResult {
  isValid: boolean;
  missingFields: string[];
}

export function validateNormalizedJob(job: Partial<NormalizedJob>): JobValidationResult {
  const missingFields: string[] = [];

  if (!job.id || typeof job.id !== "string" || job.id.trim() === "") {
    missingFields.push("id");
  }
  if (!job.title || typeof job.title !== "string" || job.title.trim() === "") {
    missingFields.push("title");
  }
  if (!job.company || typeof job.company !== "string" || job.company.trim() === "") {
    missingFields.push("company");
  }
  if (!job.applyUrl || typeof job.applyUrl !== "string" || job.applyUrl.trim() === "") {
    missingFields.push("applyUrl");
  }
  if (!job.source || typeof job.source !== "string" || job.source.trim() === "") {
    missingFields.push("source");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
