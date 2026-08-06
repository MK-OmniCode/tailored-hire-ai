import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Copy, Sparkles, FileText, Briefcase, Check } from "lucide-react";
import { tailorApplication, type TailorResult } from "@/lib/tailor.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Job Application Assistant — Tailored Cover Letters" },
      {
        name: "description",
        content:
          "Paste your resume and a job posting to instantly get a tailored cover letter, keyword match score, and resume tips powered by AI.",
      },
      { property: "og:title", content: "AI Job Application Assistant" },
      {
        property: "og:description",
        content:
          "Instantly generate a tailored cover letter and see which job keywords your resume matches.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TONES = ["professional", "warm", "confident", "concise"] as const;

function Index() {
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [tone, setTone] = useState<string>("professional");
  const [copied, setCopied] = useState(false);
  const run = useServerFn(tailorApplication);

  const mutation = useMutation<TailorResult>({
    mutationFn: () => run({ data: { resume, job, tone } }),
    onError: (e: Error) => toast.error(e.message || "Something went wrong"),
  });

  const ready = resume.trim().length > 50 && job.trim().length > 50;
  const result = mutation.data;

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    toast.success("Cover letter copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header
        className="border-b border-border"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-16 text-primary-foreground">
          <Badge className="mb-4 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20">
            <Sparkles className="mr-1 size-3" /> Powered by Gemini
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            AI Job Application Assistant
          </h1>
          <p className="mt-4 max-w-2xl text-lg opacity-90">
            Paste your resume and the job posting. Get a tailored cover letter, a keyword
            match score, and the exact terms you're missing.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <Card style={{ boxShadow: "var(--shadow-soft)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-primary" /> Your resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your full resume text here…"
                className="min-h-64 resize-y font-mono text-xs"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {resume.trim().length} characters
              </p>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: "var(--shadow-soft)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="size-4 text-primary" /> Job posting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={job}
                onChange={(e) => setJob(e.target.value)}
                placeholder="Paste the job description, requirements and responsibilities…"
                className="min-h-64 resize-y font-mono text-xs"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {job.trim().length} characters
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Tone:</span>
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
          <Button
            className="ml-auto"
            size="lg"
            disabled={!ready || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Sparkles className="mr-2 size-4" />
            {mutation.isPending ? "Tailoring…" : "Generate cover letter"}
          </Button>
        </div>
        {!ready && (
          <p className="mt-2 text-right text-xs text-muted-foreground">
            Add at least a few lines to both fields to continue.
          </p>
        )}

        {result && (
          <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card style={{ boxShadow: "var(--shadow-soft)" }}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Tailored cover letter</CardTitle>
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? (
                    <Check className="mr-2 size-4" />
                  ) : (
                    <Copy className="mr-2 size-4" />
                  )}
                  Copy
                </Button>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {result.coverLetter}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card style={{ boxShadow: "var(--shadow-soft)" }}>
                <CardHeader>
                  <CardTitle className="text-base">Match score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">
                    {result.matchScore}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <Progress value={result.matchScore} className="mt-3" />
                </CardContent>
              </Card>

              <Card style={{ boxShadow: "var(--shadow-soft)" }}>
                <CardHeader>
                  <CardTitle className="text-base">Matched keywords</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {result.matchedKeywords.length === 0 && (
                    <p className="text-sm text-muted-foreground">None found.</p>
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
                  <CardTitle className="text-base">Missing keywords</CardTitle>
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

              {result.tips.length > 0 && (
                <Card style={{ boxShadow: "var(--shadow-soft)" }}>
                  <CardHeader>
                    <CardTitle className="text-base">Resume tips</CardTitle>
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
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
