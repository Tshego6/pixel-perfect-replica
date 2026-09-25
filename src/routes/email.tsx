import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RefreshCw, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AiBadge, AiDisclaimer } from "@/components/ai-disclaimer";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateEmail, type Length, type Tone } from "@/lib/ai-engine";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Workplace AI" },
      {
        name: "description",
        content:
          "Generate professional workplace emails from a recipient, purpose and key points, with formal, friendly or persuasive tone.",
      },
      { property: "og:title", content: "Smart Email Generator" },
      {
        property: "og:description",
        content: "Professional workplace emails with tone and length control, ready to edit and copy.",
      },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState<Tone>("Formal");
  const [length, setLength] = useState<Length>("Medium");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  function generate() {
    if (!purpose.trim()) {
      toast.error("Add the purpose of the email first");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      const result = generateEmail({ recipient, purpose, keyPoints, tone, length });
      setSubject(result.subject);
      setBody(result.body);
      setLoading(false);
      logActivity("Email Generator", `${tone} · ${purpose}`);
      toast.success("Draft ready — edit it as you like");
    }, 550);
  }

  function clearAll() {
    setRecipient("");
    setPurpose("");
    setKeyPoints("");
    setSubject("");
    setBody("");
    toast.success("Cleared");
  }

  const hasOutput = Boolean(subject || body);

  return (
    <AppShell title="Smart Email Generator" description="Turn a few notes into a polished email">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email details</CardTitle>
            <CardDescription>The more context you give, the better the draft.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient / context</Label>
              <Input
                id="recipient"
                placeholder="Thandi Mokoena, Finance lead"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                placeholder="Requesting an extension on the Q3 report"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Key points (one per line)</Label>
              <Textarea
                id="points"
                rows={5}
                placeholder={"Data arrived two days late\nDraft ready by Friday\nNo impact on the board pack"}
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Formal", "Friendly", "Persuasive"] as Tone[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Select value={length} onValueChange={(v) => setLength(v as Length)}>
                  <SelectTrigger id="length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Short", "Medium", "Detailed"] as Length[]).map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={generate} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Wand2 className="h-4 w-4" aria-hidden />
                )}
                {loading ? "Writing…" : "Generate email"}
              </Button>
              <Button variant="ghost" onClick={clearAll}>
                <Trash2 className="h-4 w-4" aria-hidden /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                Draft {hasOutput && <AiBadge />}
              </CardTitle>
              <CardDescription>Fully editable before you send it.</CardDescription>
            </div>
            {hasOutput && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
                  <RefreshCw className="h-4 w-4" aria-hidden /> Regenerate
                </Button>
                <CopyButton value={`Subject: ${subject}\n\n${body}`} />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-72 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
                Drafting your email…
              </div>
            ) : hasOutput ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject-out">Subject</Label>
                  <Input
                    id="subject-out"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body-out">Body</Label>
                  <Textarea
                    id="body-out"
                    rows={18}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="font-normal leading-relaxed"
                  />
                </div>
                <AiDisclaimer />
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                <Wand2 className="h-6 w-6 text-primary" aria-hidden />
                <p className="mt-3 text-sm font-medium text-foreground">No draft yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fill in the purpose on the left and press Generate email.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
