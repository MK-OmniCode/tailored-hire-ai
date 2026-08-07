import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parseTailorResult, type TailorResult } from "./tailor-result";

export type { TailorResult } from "./tailor-result";

const Input = z.object({
  name: z.string().default(""),
  resume: z.string().min(1),
  job: z.string().min(1),
  tone: z.string().default("professional"),
});

const schema = {
  type: "OBJECT",
  properties: {
    coverLetter: { type: "STRING" },
    matchScore: { type: "NUMBER" },
    matchedKeywords: { type: "ARRAY", items: { type: "STRING" } },
    missingKeywords: { type: "ARRAY", items: { type: "STRING" } },
    tips: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["coverLetter", "matchScore", "matchedKeywords", "missingKeywords", "tips"],
};

const SYSTEM_PROMPT =
  "You are an expert career coach and recruiter. Given a resume and a job posting, write a tailored cover letter and analyse keyword overlap. The cover letter must be 250-350 words, specific, free of clichés, and reference real details from the resume. Never invent experience. matchScore is 0-100. matchedKeywords are important terms from the posting present in the resume; missingKeywords are important terms absent. tips are 3-5 short actionable resume improvements. Respond in JSON.";

export const tailorApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<TailorResult> => {
    const key = process.env["GEMINI_API_KEY"];
    if (!key) throw new Error("AI is not configured.");

    const model = process.env["GEMINI_MODEL"] || "gemini-3-flash-preview";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Applicant name: ${data.name || "the applicant"}\nDesired tone: ${data.tone}\n\n=== RESUME / BACKGROUND ===\n${data.resume}\n\n=== JOB POSTING ===\n${data.job}\n\nIf the background is short, still write a complete, confident cover letter using only what is given. Sign off with the applicant's name.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Rate limited — please try again in a moment.");
      if (res.status === 403) throw new Error("AI key is invalid or unauthorized.");
      throw new Error(`AI request failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return parseTailorResult(content);
  });
