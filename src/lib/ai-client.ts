import { AIProviderConfig } from "./ai-provider";

export async function generateAIJson<T>(prompt: string, config: AIProviderConfig): Promise<T> {
  const { provider, key } = config;

  if (!key) {
    throw new Error(`[AI Client] No API key provided for ${provider}`);
  }

  try {
    let rawJsonText = "";

    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
      const data = await response.json();
      rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    } 
    
    else if (provider === "openai") {
      const url = "https://api.openai.com/v1/chat/completions";
      // Explicitly tell OpenAI to return JSON
      const systemPrompt = "You are a helpful AI assistant. You must output ONLY valid JSON. No markdown fences, no explanations.";
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
      const data = await response.json();
      rawJsonText = data.choices?.[0]?.message?.content ?? "";
    } 
    
    else if (provider === "claude") {
      const url = "https://api.anthropic.com/v1/messages";
      const systemPrompt = "You must output ONLY valid JSON. No markdown fences, no explanations. Start directly with {";
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: "{" }
          ]
        })
      });

      if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
      const data = await response.json();
      // Because we prefilled '{', Claude's response starts immediately after '{'.
      // So we must prepend '{' back to the raw text to make it valid JSON.
      const text = data.content?.[0]?.text ?? "";
      rawJsonText = "{" + text;
    } 
    
    else {
      throw new Error(`[AI Client] Unsupported provider: ${provider}`);
    }

    if (!rawJsonText) {
      throw new Error(`[AI Client] Empty response from ${provider}`);
    }

    // Clean up potential markdown formatting if the model ignored instructions
    rawJsonText = rawJsonText.trim();
    if (rawJsonText.startsWith("```json")) {
      rawJsonText = rawJsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (rawJsonText.startsWith("```")) {
      rawJsonText = rawJsonText.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    return JSON.parse(rawJsonText) as T;
  } catch (error: any) {
    console.error(`[AI Client] Error generating JSON with ${provider}:`, error);
    throw error;
  }
}
