// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

/**
 * Extracts raw text from a PDF Buffer
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);

    return data.text || "";
  } catch (error) {
    console.error("Error parsing PDF file:", error);
    throw new Error("Failed to parse PDF resume");
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
