import { describe, it, expect } from "vitest";
import { parseTailorResult } from "./tailor-result";

describe("parseTailorResult", () => {
  it("parses a valid result", () => {
    const result = parseTailorResult(
      JSON.stringify({
        coverLetter: "Dear Hiring Manager, ...",
        matchScore: 87,
        matchedKeywords: ["React"],
        missingKeywords: ["GraphQL"],
        tips: ["Add metrics"],
      }),
    );
    expect(result.coverLetter).toContain("Dear Hiring Manager");
    expect(result.matchScore).toBe(87);
    expect(result.matchedKeywords).toEqual(["React"]);
  });

  it("returns safe defaults on malformed JSON", () => {
    const result = parseTailorResult("not json {");
    expect(result).toEqual({
      coverLetter: "",
      matchScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      tips: [],
    });
  });

  it("clamps matchScore to the 0-100 range", () => {
    expect(parseTailorResult('{"matchScore": 150}').matchScore).toBe(100);
    expect(parseTailorResult('{"matchScore": -5}').matchScore).toBe(0);
    expect(parseTailorResult('{"matchScore": 87.4}').matchScore).toBe(87);
  });

  it("filters non-string values out of arrays", () => {
    const result = parseTailorResult('{"tips": ["a", 42, null]}');
    expect(result.tips).toEqual(["a"]);
  });
});
