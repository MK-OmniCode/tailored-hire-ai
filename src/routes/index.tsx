import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Copy, Wand2, Check, Lightbulb, RotateCcw } from "lucide-react";
import { tailorApplication, type TailorResult } from "@/lib/tailor.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Job Application Assistant — Tailored Cover Letters" },
      {
        name: "description",
        content:
          "Enter your name, paste a job posting, and instantly get a tailored cover letter, keyword match score, and resume tips powered by AI.",
      },
      { property: "og:title", content: "AI Job Application Assistant" },
      {
        property: "og:description",
        content:
          "Enter your name and a job posting to instantly get a tailored cover letter and keyword match.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TONES = ["professional", "warm", "confident", "concise"] as const;

const EXAMPLE = {
  name: "Jane Doe",
  resume:
    "Senior frontend engineer, 7 years. React, TypeScript, Node.js, PostgreSQL, AWS. Led a team of 5 and shipped analytics dashboards used by 40,000 people.",
  job: "Frontend Engineer at Acme. 5+ years React and TypeScript, GraphQL, Playwright testing, mentoring juniors, design systems, AWS deployment.",
};

function Index() {
  const [name, setName] = useState("");
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [tone, setTone] = useState<string>("professional");
  const [copied, setCopied] = useState(false);
  const run = useServerFn(tailorApplication);

  const mutation = useMutation<TailorResult>({
    mutationFn: () => run({ data: { name, resume, job, tone } }),
    onError: (e: Error) => toast.error(e.message || "Something went wrong"),
  });

  const ready = resume.trim().length > 0 && job.trim().length > 0;
  const result = mutation.data;

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    toast.success("Cover letter copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const fillExample = () => {
    setName(EXAMPLE.name);
    setResume(EXAMPLE.resume);
    setJob(EXAMPLE.job);
  };

  const startOver = () => {
    mutation.reset();
    setResume("");
    setJob("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-3xl px-6 py-14 text-center text-primary-foreground">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your cover letter, in one click
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
            Tell us your name, paste the job you want — we write the letter and show
            which keywords you match.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Card style={{ boxShadow: "var(--shadow-soft)" }}>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                1. Your name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="resume" className="text-sm font-medium text-foreground">
                2. Your resume / CV
              </label>
              <Textarea
                id="resume"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your resume, CV, or a few lines about your experience and skills…"
                className="min-h-32 resize-y text-sm"
              />
              <button
                type="button"
                onClick={fillExample}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                <Lightbulb className="size-3.5" /> Fill in an example
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="job" className="text-sm font-medium text-foreground">
                3. The job you want
              </label>
              <Textarea
                id="job"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                placeholder="Paste the job posting, or just write the role and company…"
                className="min-h-32 resize-y text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
              <span className="text-sm text-muted-foreground">Tone</span>
              {TONES.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={tone === t ? "default" : "outline"}
                  onClick={() => setTone(t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>

            <Button
              className="h-12 w-full text-base"
              size="lg"
              disabled={!ready || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              <Wand2 className="mr-2 size-4" />
              {mutation.isPending ? "Writing your letter…" : "Write my cover letter"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <section className="mt-10 space-y-6">
            <Card style={{ boxShadow: "var(--shadow-soft)" }}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">
                  Your cover letter
                  <span className="ml-3 align-middle text-sm font-normal text-muted-foreground">
                    {result.matchScore}% match
                  </span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={startOver}>
                    <RotateCcw className="mr-2 size-4" />
                    New
                  </Button>
                  <Button size="sm" variant="outline" onClick={copy}>
                    {copied ? (
                      <Check className="mr-2 size-4" />
                    ) : (
                      <Copy className="mr-2 size-4" />
                    )}
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={result.matchScore} className="mb-6" />
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {result.coverLetter}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2">
              <Card style={{ boxShadow: "var(--shadow-soft)" }}>
                <CardHeader>
                  <CardTitle className="text-base">Keywords you match</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {result.matchedKeywords.length === 0 && (
                    <p className="text-sm text-muted-foreground">None found yet.</p>
                  )}
                  {result.matchedKeywords.map((k) => (
                    <Badge key={k} variant="secondary">
                      {k}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <Card style={{ boxShadow: "var(--shadow-soft)" }}>
                <CardHeader>
                  <CardTitle className="text-base">Worth adding</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {result.missingKeywords.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nothing missing 🎉</p>
                  )}
                  {result.missingKeywords.map((k) => (
                    <Badge key={k} variant="outline">
                      {k}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </div>

            {result.tips.length > 0 && (
              <Card style={{ boxShadow: "var(--shadow-soft)" }}>
                <CardHeader>
                  <CardTitle className="text-base">Quick tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                    {result.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
