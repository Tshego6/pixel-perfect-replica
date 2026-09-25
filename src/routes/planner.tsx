import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Loader2, Plus, Trash2, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AiBadge, AiDisclaimer } from "@/components/ai-disclaimer";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePlan, type PlannedTask, type Priority, type Task } from "@/lib/ai-engine";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace AI" },
      {
        name: "description",
        content:
          "Turn tasks, deadlines and available hours into a prioritised daily or weekly schedule with recommended time blocks.",
      },
      { property: "og:title", content: "AI Task Planner" },
      {
        property: "og:description",
        content: "Prioritised schedules with High, Medium and Low priorities and editable time blocks.",
      },
    ],
  }),
  component: PlannerPage,
});

const PRIORITY_STYLES: Record<Priority, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-primary/15 text-primary",
  Low: "bg-muted text-muted-foreground",
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [importance, setImportance] = useState<"1" | "2" | "3">("2");
  const [estimate, setEstimate] = useState("1");
  const [hours, setHours] = useState("6");
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [plan, setPlan] = useState<PlannedTask[] | null>(null);
  const [loading, setLoading] = useState(false);

  function addTask() {
    if (!title.trim()) {
      toast.error("Give the task a name");
      return;
    }
    setTasks((prev) => [
      ...prev,
      {
        id: newId(),
        title: title.trim(),
        deadline,
        importance: Number(importance) as 1 | 2 | 3,
        estimateHours: Math.max(0.5, Number(estimate) || 1),
      },
    ]);
    setTitle("");
    setDeadline("");
    setEstimate("1");
    setImportance("2");
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function build() {
    if (tasks.length === 0) {
      toast.error("Add at least one task");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      setPlan(generatePlan(tasks, Number(hours) || 6, mode));
      setLoading(false);
      logActivity("Task Planner", `${mode} plan · ${tasks.length} tasks`);
      toast.success("Schedule generated");
    }, 600);
  }

  function updatePlanned(id: string, patch: Partial<PlannedTask>) {
    setPlan((prev) => prev?.map((p) => (p.id === id ? { ...p, ...patch } : p)) ?? prev);
  }

  const planText =
    plan
      ?.map((p) => `[${p.priority}] ${p.title} — ${p.block}${p.deadline ? ` (due ${p.deadline})` : ""}\n  ${p.note}`)
      .join("\n\n") ?? "";

  return (
    <AppShell title="AI Task Planner" description="From a task list to a realistic schedule">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a task</CardTitle>
              <CardDescription>Deadline and importance drive the priority.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task">Task</Label>
                <Input
                  id="task"
                  placeholder="Finish the client proposal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimate">Estimated hours</Label>
                  <Input
                    id="estimate"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={estimate}
                    onChange={(e) => setEstimate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="importance">Importance</Label>
                <Select value={importance} onValueChange={(v) => setImportance(v as "1" | "2" | "3")}>
                  <SelectTrigger id="importance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Critical</SelectItem>
                    <SelectItem value="2">Important</SelectItem>
                    <SelectItem value="1">Nice to have</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addTask} variant="secondary" className="w-full">
                <Plus className="h-4 w-4" aria-hidden /> Add task
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your capacity</CardTitle>
              <CardDescription>{tasks.length} task(s) queued.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hours">Working hours per day</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="1"
                    max="14"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode">Plan type</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as "daily" | "weekly")}>
                    <SelectTrigger id="mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {tasks.length > 0 && (
                <ul className="space-y-2">
                  {tasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{t.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {t.deadline ? `due ${t.deadline}` : "no deadline"} · {t.estimateHours}h
                        </span>
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${t.title}`}
                        onClick={() => removeTask(t.id)}
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={build} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Wand2 className="h-4 w-4" aria-hidden />
                  )}
                  {loading ? "Planning…" : "Generate schedule"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setTasks([]);
                    setPlan(null);
                    toast.success("Cleared");
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Clear all
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                {mode === "weekly" ? "Weekly schedule" : "Today's schedule"}
                {plan && <AiBadge />}
              </CardTitle>
              <CardDescription>Edit any title, block or note.</CardDescription>
            </div>
            {plan && <CopyButton value={planText} />}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-72 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
                Balancing priorities against your hours…
              </div>
            ) : plan ? (
              <div className="space-y-3">
                {plan.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border p-3 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[p.priority]}`}
                      >
                        {p.priority} priority
                      </span>
                      {p.deadline && (
                        <span className="text-xs text-muted-foreground">due {p.deadline}</span>
                      )}
                    </div>
                    <Input
                      className="mt-2 border-transparent bg-transparent px-0 text-base font-medium shadow-none focus-visible:border-input focus-visible:px-3"
                      value={p.title}
                      aria-label="Task title"
                      onChange={(e) => updatePlanned(p.id, { title: e.target.value })}
                    />
                    <div className="mt-1 flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <Input
                        className="border-transparent bg-transparent px-0 text-sm shadow-none focus-visible:border-input focus-visible:px-3"
                        value={p.block}
                        aria-label="Time block"
                        onChange={(e) => updatePlanned(p.id, { block: e.target.value })}
                      />
                    </div>
                    <Input
                      className="mt-1 border-transparent bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:border-input focus-visible:px-3"
                      value={p.note}
                      aria-label="Note"
                      onChange={(e) => updatePlanned(p.id, { note: e.target.value })}
                    />
                  </div>
                ))}
                <AiDisclaimer />
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                <CalendarClock className="h-6 w-6 text-primary" aria-hidden />
                <p className="mt-3 text-sm font-medium text-foreground">No schedule yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your tasks and available hours, then generate a schedule.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
