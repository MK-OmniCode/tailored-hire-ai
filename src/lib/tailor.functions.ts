import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  name: z.string().default(""),
  resume: z.string().min(1),
  job: z.string().min(1),
  tone: z.string().default("professional"),
});


export type TailorResult = {
  coverLetter: string;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  tips: string[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    coverLetter: { type: "string" },
    matchScore: { type: "number" },
    matchedKeywords: { type: "array", items: { type: "string" } },
    missingKeywords: { type: "array", items: { type: "string" } },
    tips: { type: "array", items: { type: "string" } },
  },
  required: ["coverLetter", "matchScore", "matchedKeywords", "missingKeywords", "tips"],
};

export const tailorApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<TailorResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an expert career coach and recruiter. Given a resume and a job posting, write a tailored cover letter and analyse keyword overlap. The cover letter must be 250-350 words, specific, free of clichés, and reference real details from the resume. Never invent experience. matchScore is 0-100. matchedKeywords are important terms from the posting present in the resume; missingKeywords are important terms absent. tips are 3-5 short actionable resume improvements. Respond in JSON.",
          },
          {
            role: "user",
            content: `Desired tone: ${data.tone}\n\n=== RESUME ===\n${data.resume}\n\n=== JOB POSTING ===\n${data.job}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "tailored_application", strict: true, schema },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Rate limited — please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits.");
      throw new Error(`AI request failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as TailorResult;
    return {
      coverLetter: parsed.coverLetter ?? "",
      matchScore: Math.max(0, Math.min(100, Math.round(parsed.matchScore ?? 0))),
      matchedKeywords: parsed.matchedKeywords ?? [],
      missingKeywords: parsed.missingKeywords ?? [],
      tips: parsed.tips ?? [],
    };
  });
