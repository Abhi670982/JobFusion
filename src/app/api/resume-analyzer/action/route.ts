import { NextRequest, NextResponse } from "next/server";
import { getAIConfig } from "@/lib/ai-provider";
import { generateAISimpleText } from "@/lib/ai-client";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const { actionType, originalText, context = "" } = body;

    if (!actionType || !originalText) {
      return NextResponse.json({ success: false, error: "Missing required parameters." }, { status: 400 });
    }

    const rawConfig = await getAIConfig(
      mongoUser.id,
      "resume-analyzer",
      mongoUser.clerkId || undefined,
      "gemini"
    );

    if (!rawConfig.allowed) {
      return NextResponse.json(
        { success: false, code: "AI_LIMIT_REACHED", error: rawConfig.error },
        { status: 403 }
      );
    }

    let prompt = "";
    if (actionType === "rewrite-bullet") {
      prompt = `You are a world-class resume writer. Rewrite the following resume work experience bullet point to use the STAR method (Situation, Task, Action, Result).
Make sure to:
1. Start with a strong action verb.
2. Incorporate specific metrics, numbers, percentages, or scope increases.
3. Keep it to a single concise sentence.

Original bullet point:
"${originalText}"
${context ? `Context/Role information: ${context}` : ""}

Return ONLY three high-impact bullet point suggestions, each separated by a newline. Do not include introductory text, numbers, or bullet points (e.g. do not start with a hyphen or asterisk).`;
    } else if (actionType === "rewrite-summary") {
      prompt = `You are a professional executive resume writer. Optimize and rewrite this resume summary statement to be highly engaging to recruiters.
1. Highlight years of experience, primary tech stack/domain, and core values.
2. Eliminate vague adjectives ("hardworking", "passionate") and replace them with strong professional descriptions.
3. Keep it under 3-4 sentences.

Original summary:
"${originalText}"
${context ? `Target role or keywords context: ${context}` : ""}

Return ONLY two polished summary options, separated by the text "---SEPARATOR---". Do not include numbers, labels, or intro text.`;
    } else if (actionType === "add-metrics") {
      prompt = `You are a resume auditor. The user wants to add quantified achievements to this resume statement:
"${originalText}"

Provide 3 mock variations of this bullet point where you inject common quantified achievements (e.g., "improving API performance by 35%", "reducing server latency by 200ms", "saving 15 hours of manual work weekly"). Let the user customize the exact numbers.
Return ONLY the three variations, each on a new line. Do not include numbers or bullet markers.`;
    } else if (actionType === "suggest-verbs") {
      prompt = `Provide 8 strong, high-impact action verbs that are highly relevant to replace the verbs in this statement:
"${originalText}"

Return ONLY a comma-separated list of the 8 action verbs (e.g., "Spearheaded, Architected, Engineered..."). No intro or explanation text.`;
    } else {
      return NextResponse.json({ success: false, error: "Invalid actionType." }, { status: 400 });
    }

    const aiResponse = await generateAISimpleText(prompt, rawConfig);
    const result = aiResponse.trim();

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    return safeErrorResponse(err, "Failed to process analyzer action");
  }
}
