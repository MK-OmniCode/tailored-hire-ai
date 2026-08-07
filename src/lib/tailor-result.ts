export type TailorResult = {
  coverLetter: string;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  tips: string[];
};

function clampScore(value: unknown): number {
  const number = typeof value === "number" ? Math.round(value) : 0;
  return Math.max(0, Math.min(100, number));
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function parseTailorResult(raw: string): TailorResult {
  let data: Partial<TailorResult> = {};
  try {
    data = JSON.parse(raw) as Partial<TailorResult>;
  } catch {
    // Malformed model output — fall through to safe defaults.
  }

  return {
    coverLetter: typeof data.coverLetter === "string" ? data.coverLetter : "",
    matchScore: clampScore(data.matchScore),
    matchedKeywords: stringArray(data.matchedKeywords),
    missingKeywords: stringArray(data.missingKeywords),
    tips: stringArray(data.tips),
  };
}
