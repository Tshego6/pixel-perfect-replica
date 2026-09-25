import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MessagesSquare, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateChatReply } from "@/lib/ai-engine";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Chat — Workplace AI" },
      {
        name: "description",
        content:
          "Chat with a workplace assistant for drafts, priorities, meeting summaries and professional follow-ups.",
      },
      { property: "og:title", content: "AI Workplace Chat" },
      {
        property: "og:description",
        content: "A workplace chat assistant for drafts, priorities and follow-ups.",
      },
    ],
  }),
  component: ChatPage,
});

type Message = { id: string; role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Draft a project update",
  "Help me prioritise my work",
  "Summarise these meeting notes",
  "Write a professional follow-up",
];

function renderRich(text: string): ReactNode {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <span key={i} className="block h-2" />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i} className="block">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          ),
        )}
      </span>
    );
  });
}

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function send(raw?: string) {
    const prompt = (raw ?? input).trim();
    if (!prompt) return;
    if (loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages.map((m) => m.text);
    window.setTimeout(
      () => {
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", text: generateChatReply(prompt, history) },
        ]);
        setLoading(false);
        inputRef.current?.focus();
      },
      600 + Math.random() * 400,
    );
    logActivity("Workplace Chat", prompt);
  }

  return (
    <AppShell title="AI Workplace Chat" description="Think out loud, get a usable draft back">
      <Card className="flex h-[calc(100vh-11rem)] min-h-[520px] flex-col overflow-hidden py-0">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessagesSquare className="h-6 w-6" aria-hidden />
                </span>
                <p className="mt-4 text-base font-semibold text-foreground">
                  How can I help with your work today?
                </p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Ask for a draft, a priority order or a summary. The more context you paste, the
                  more useful the reply.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground shadow-sm">
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="group flex flex-col items-start gap-1">
                      <div className="max-w-[92%] text-sm leading-relaxed text-foreground">
                        {renderRich(m.text)}
                      </div>
                      <CopyButton value={m.text} variant="ghost" size="sm" />
                    </div>
                  ),
                )}
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
                    Thinking…
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="secondary" size="sm" onClick={() => send(s)} disabled={loading}>
                  {s}
                </Button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              rows={2}
              placeholder="Type your message… (Enter to send, Shift+Enter for a new line)"
              value={input}
              aria-label="Message"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="min-h-[52px] resize-none"
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send message">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              <span className="hidden sm:inline">Send</span>
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear conversation"
                onClick={() => {
                  setMessages([]);
                  toast.success("Conversation cleared");
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>

          <AiDisclaimer />
        </CardContent>
      </Card>
    </AppShell>
  );
}
