import pdf from "pdf-parse";
import mammoth from "mammoth";

/**
 * Extracts raw text from a PDF Buffer
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    if (!data || !data.text) {
      console.warn("[Parser] pdf-parse returned empty text — the PDF may be image-only (scanned) with no text layer.");
      return "";
    }
    return data.text;
  } catch (error: any) {
    // Log the real error so it's visible in server logs, not just the generic message
    console.error("[Parser] pdf-parse failed with error:", error?.message || error);
    if (error?.message?.toLowerCase().includes("encrypted") || error?.message?.toLowerCase().includes("password")) {
      throw new Error("This PDF is password-protected. Please upload an unencrypted version.");
    }
    throw new Error(`Failed to parse PDF resume: ${error?.message || "Unknown parsing error"}`);
  }
}

/**
 * Extracts raw text from a DOCX Buffer
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("Error parsing DOCX file:", error);
    throw new Error("Failed to parse DOCX resume");
  }
}
