import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  CalendarClock,
  BookOpenCheck,
  MessagesSquare,
  ArrowRight,
  History,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { readActivity, timeAgo, type ActivityItem } from "@/lib/activity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "One workspace for drafting emails, planning tasks, summarising research and chatting with a workplace AI assistant — all in your browser.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Draft emails, plan your day, summarise research and chat with a workplace assistant. Runs entirely in the browser.",
      },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  {
    to: "/email" as const,
    title: "Email Generator",
    description: "Professional emails with tone and length control.",
    icon: Mail,
  },
  {
    to: "/planner" as const,
    title: "Task Planner",
    description: "Prioritised schedules with recommended time blocks.",
    icon: CalendarClock,
  },
  {
    to: "/research" as const,
    title: "Research Assistant",
    description: "Summaries, findings, insights and follow-up questions.",
    icon: BookOpenCheck,
  },
  {
    to: "/chat" as const,
    title: "Workplace Chat",
    description: "Ask for drafts, priorities or a second opinion.",
    icon: MessagesSquare,
  },
];

function Dashboard() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const sync = () => setActivity(readActivity());
    sync();
    window.addEventListener("awpa:activity", sync);
    return () => window.removeEventListener("awpa:activity", sync);
  }, []);

  return (
    <AppShell title="Dashboard" description="Your workplace AI toolkit, all in one place">
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">Welcome back</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
          What should we get off your plate today?
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Write a sharper email, turn a messy task list into a real schedule, make sense of an
          article, or think out loud with the assistant.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/email">
              Draft an email <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/planner">Plan my day</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/research">Summarise an article</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/chat">Open chat</Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {TOOLS.map(({ to, title, description, icon: Icon }) => (
          <Link key={to} to={to} className="group focus-visible:outline-none">
            <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <CardHeader>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <CardTitle className="mt-3 text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" aria-hidden /> Recent activity
            </CardTitle>
            <CardDescription>Saved in this browser only.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing yet — generate an email, plan or summary and it will show up here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.tool}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(item.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="mt-6">
        <AiDisclaimer />
      </div>
    </AppShell>
  );
}
