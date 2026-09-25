import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck, Link2, Loader2, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AiBadge, AiDisclaimer } from "@/components/ai-disclaimer";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateResearch, type ResearchOutput } from "@/lib/ai-engine";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Workplace AI" },
      {
        name: "description",
        content:
          "Paste an article and get an executive summary, key findings, insights, recommendations and follow-up questions you can edit and copy.",
      },
      { property: "og:title", content: "AI Research Assistant" },
      {
        property: "og:description",
        content: "Executive summaries, key findings and follow-up questions from text you paste.",
      },
    ],
  }),
  component: ResearchPage,
});

const SECTIONS: { key: keyof ResearchOutput; label: string; rows: number }[] = [
  { key: "summary", label: "Executive summary", rows: 5 },
  { key: "findings", label: "Key findings", rows: 6 },
  { key: "insights", label: "Insights", rows: 6 },
  { key: "recommendations", label: "Recommendations", rows: 6 },
  { key: "questions", label: "Follow-up questions", rows: 6 },
];

function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [output, setOutput] = useState<ResearchOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  async function tryFetchUrl() {
    if (!url.trim()) {
      toast.error("Paste a link first");
      return;
    }
    setFetching(true);
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(String(res.status));
      const html = await res.text();
      const stripped = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z#0-9]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (stripped.length < 400) throw new Error("too-short");
      setText(stripped.slice(0, 20000));
      toast.success("Page text loaded — check it looks right before analysing");
    } catch {
      toast.error(
        "This browser could not read that link (CORS restrictions). Please open the page and paste the article text below instead.",
      );
    } finally {
      setFetching(false);
    }
  }

  function analyse() {
    if (text.trim().length < 80) {
      toast.error("Paste at least a paragraph of article text");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      setOutput(generateResearch(topic, text));
      setLoading(false);
      logActivity("Research Assistant", topic || text.slice(0, 60));
      toast.success("Analysis ready");
    }, 700);
  }

  const allText = output
    ? SECTIONS.map(({ key, label }) => `${label.toUpperCase()}\n${output[key]}`).join("\n\n")
    : "";

  return (
    <AppShell title="AI Research Assistant" description="Make sense of an article in seconds">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Research workspace</CardTitle>
            <CardDescription>
              Analysis is based only on the text you paste here — nothing is fetched on your behalf
              unless the link below loads successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Research topic or question</Label>
              <Input
                id="topic"
                placeholder="How is hybrid work affecting team productivity?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL / link (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button variant="outline" onClick={tryFetchUrl} disabled={fetching}>
                  {fetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Link2 className="h-4 w-4" aria-hidden />
                  )}
                  Try
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Most sites block direct browser access. If the attempt fails, paste the article text
                instead.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="article">Article text</Label>
              <Textarea
                id="article"
                rows={12}
                placeholder="Paste the article or report text here…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={analyse} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Wand2 className="h-4 w-4" aria-hidden />
                )}
                {loading ? "Analysing…" : "Analyse"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setTopic("");
                  setText("");
                  setUrl("");
                  setOutput(null);
                  toast.success("Cleared");
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                Analysis {output && <AiBadge />}
              </CardTitle>
              <CardDescription>Every section is editable and copyable.</CardDescription>
            </div>
            {output && <CopyButton value={allText} label="Copy all" />}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-80 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
                Reading the text you pasted…
              </div>
            ) : output ? (
              <div className="space-y-5">
                {SECTIONS.map(({ key, label, rows }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`sec-${key}`}>{label}</Label>
                      <CopyButton value={output[key]} size="icon" variant="ghost" label={`Copy ${label}`} />
                    </div>
                    <Textarea
                      id={`sec-${key}`}
                      rows={rows}
                      value={output[key]}
                      onChange={(e) => setOutput({ ...output, [key]: e.target.value })}
                      className="leading-relaxed"
                    />
                  </div>
                ))}
                <AiDisclaimer />
              </div>
            ) : (
              <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                <BookOpenCheck className="h-6 w-6 text-primary" aria-hidden />
                <p className="mt-3 text-sm font-medium text-foreground">No analysis yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your question and paste the article text, then press Analyse.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
