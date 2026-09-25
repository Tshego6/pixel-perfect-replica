/**
 * Lightweight, fully local "AI" engine.
 * Builds text from structured templates + the user's own inputs.
 * No network calls, no external services.
 */

export const AI_DISCLAIMER =
  "AI-generated content may contain errors or omissions. Review and verify important information before using it professionally.";

function pick<T>(arr: T[], seed?: number): T {
  const i =
    seed === undefined
      ? Math.floor(Math.random() * arr.length)
      : Math.abs(Math.floor(seed)) % arr.length;
  return arr[i]!;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function bulletsFrom(text: string): string[] {
  return text
    .split(/\n|;|•|- /)
    .map((s) => s.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);
}

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------- Email ---------------------------------- */

export type Tone = "Formal" | "Friendly" | "Persuasive";
export type Length = "Short" | "Medium" | "Detailed";

export type EmailInput = {
  recipient: string;
  purpose: string;
  keyPoints: string;
  tone: Tone;
  length: Length;
};

export function generateEmail(input: EmailInput): { subject: string; body: string } {
  const { recipient, purpose, keyPoints, tone, length } = input;
  const points = bulletsFrom(keyPoints);
  const name = recipient.split(/[,(\n]/)[0]?.trim() || "there";
  const firstName = name.split(/\s+/)[0] || "there";

  const subjectStarters: Record<Tone, string[]> = {
    Formal: ["Regarding", "Update on", "Follow-up:", "Request:"],
    Friendly: ["Quick note on", "Checking in on", "About", "Heads-up on"],
    Persuasive: ["An opportunity:", "Why now:", "Let's move on", "Proposal:"],
  };
  const greetings: Record<Tone, string[]> = {
    Formal: [`Dear ${name},`, `Hello ${name},`],
    Friendly: [`Hi ${firstName},`, `Hey ${firstName},`, `Hello ${firstName},`],
    Persuasive: [`Hi ${firstName},`, `Hello ${name},`],
  };
  const openers: Record<Tone, string[]> = {
    Formal: [
      `I am writing to you regarding ${purpose.toLowerCase()}.`,
      `I wanted to reach out concerning ${purpose.toLowerCase()}.`,
      `Please allow me to share an update on ${purpose.toLowerCase()}.`,
    ],
    Friendly: [
      `Hope your week is going well. I wanted to touch base about ${purpose.toLowerCase()}.`,
      `Just a quick note about ${purpose.toLowerCase()}.`,
      `Wanted to share where things stand on ${purpose.toLowerCase()}.`,
    ],
    Persuasive: [
      `I'd like to make the case for ${purpose.toLowerCase()} — and why it's worth acting on now.`,
      `There's a clear opportunity around ${purpose.toLowerCase()}, and I think we should take it.`,
      `I believe ${purpose.toLowerCase()} deserves a decision this week. Here's why.`,
    ],
  };
  const closers: Record<Tone, string[]> = {
    Formal: [
      "Please let me know if you require any further detail.",
      "I would welcome your thoughts at your earliest convenience.",
      "Thank you for your time and consideration.",
    ],
    Friendly: [
      "Let me know what you think whenever you get a chance.",
      "Happy to jump on a quick call if that's easier.",
      "Shout if anything here needs unpacking.",
    ],
    Persuasive: [
      "Can we agree on the next step by the end of the week?",
      "If you're aligned, I'll start immediately — just say the word.",
      "I'd love your go-ahead so we don't lose the window.",
    ],
  };
  const signoffs: Record<Tone, string> = {
    Formal: "Kind regards,",
    Friendly: "Thanks,",
    Persuasive: "Best,",
  };

  const subject = `${pick(subjectStarters[tone])} ${titleCase(purpose.replace(/\.$/, ""))}`;

  const lines: string[] = [pick(greetings[tone]), "", pick(openers[tone])];

  if (points.length) {
    lines.push("");
    if (length === "Short") {
      lines.push(points.slice(0, 3).join(" ").trim());
    } else {
      lines.push(tone === "Persuasive" ? "The essentials:" : "Key points:");
      points.slice(0, length === "Detailed" ? 8 : 5).forEach((p) => {
        const detail =
          length === "Detailed"
            ? ` ${pick([
                "This is already in motion.",
                "I'll own this end to end.",
                "Worth a quick look before we commit.",
                "No blockers expected here.",
              ])}`
            : "";
        lines.push(`• ${titleCase(p.replace(/\.$/, ""))}.${detail}`);
      });
    }
  }

  if (length === "Detailed") {
    lines.push("");
    lines.push(
      pick([
        `Context: ${recipient.trim()}. I've framed the above so it's easy to action without extra back-and-forth.`,
        `For context, this connects directly to ${purpose.toLowerCase()} and the priorities we discussed.`,
        `I've kept the scope tight deliberately so we can move quickly and adjust as we learn.`,
      ]),
    );
  }

  lines.push("", pick(closers[tone]), "", signoffs[tone], "[Your name]");

  return { subject, body: lines.join("\n") };
}

/* ------------------------------- Planner -------------------------------- */

export type Priority = "High" | "Medium" | "Low";

export type Task = {
  id: string;
  title: string;
  deadline: string; // yyyy-mm-dd
  importance: 1 | 2 | 3; // 3 = critical
  estimateHours: number;
};

export type PlannedTask = {
  id: string;
  title: string;
  priority: Priority;
  deadline: string;
  block: string;
  note: string;
};

function daysUntil(deadline: string): number {
  if (!deadline) return 14;
  const d = new Date(deadline + "T23:59:59");
  const diff = (d.getTime() - Date.now()) / 86_400_000;
  return Number.isNaN(diff) ? 14 : diff;
}

export function scoreTask(task: Task): number {
  const urgency = Math.max(0, 10 - daysUntil(task.deadline) * 1.4);
  return urgency + task.importance * 3;
}

export function priorityOf(score: number): Priority {
  if (score >= 11) return "High";
  if (score >= 6) return "Medium";
  return "Low";
}

function fmtTime(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export function generatePlan(
  tasks: Task[],
  hoursPerDay: number,
  mode: "daily" | "weekly",
): PlannedTask[] {
  const sorted = [...tasks].sort((a, b) => scoreTask(b) - scoreTask(a));
  const dayNames = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];
  let cursor = 9;
  let dayIndex = 0;
  let usedToday = 0;
  const capacity = Math.max(1, hoursPerDay);

  return sorted.map((task, i) => {
    const est = Math.min(Math.max(0.5, task.estimateHours || 1), capacity);
    if (usedToday + est > capacity) {
      dayIndex = Math.min(dayIndex + 1, dayNames.length - 1);
      usedToday = 0;
      cursor = 9;
    }
    const start = cursor;
    const end = cursor + est;
    cursor = end + (est >= 2 ? 0.5 : 0.25);
    usedToday += est;

    const score = scoreTask(task);
    const priority = priorityOf(score);
    const label = `${fmtTime(start)} – ${fmtTime(end)}`;
    const block = mode === "weekly" ? `${dayNames[dayIndex]}, ${label}` : label;

    const notes: Record<Priority, string[]> = {
      High: [
        "Deadline pressure — protect this slot and silence notifications.",
        "Tackle this while your focus is freshest.",
        "Highest impact item today; start here.",
      ],
      Medium: [
        "Good candidate for a focused mid-day block.",
        "Batch this with similar work to save context switching.",
        "Keep moving, but it can shift by a slot if needed.",
      ],
      Low: [
        "Fill-in work — do it if the day allows.",
        "Safe to defer or delegate.",
        "Low cost to postpone; revisit tomorrow.",
      ],
    };

    return {
      id: task.id,
      title: task.title,
      priority,
      deadline: task.deadline,
      block,
      note: pick(notes[priority], i + Math.round(score)),
    };
  });
}

/* ------------------------------ Research -------------------------------- */

export type ResearchOutput = {
  summary: string;
  findings: string;
  insights: string;
  recommendations: string;
  questions: string;
};

export function generateResearch(topic: string, text: string): ResearchOutput {
  const sents = sentences(text);
  const words = text.toLowerCase().match(/[a-z][a-z'-]{4,}/g) ?? [];
  const stop = new Set([
    "about","above","after","again","their","there","these","those","which","while","would","could","should","because","between","other","through","where","being","first","every","under","using","into","than","them","this","that","with","from","have","also","more","most","some","such","when","what","will","been","were","over","only","said",
  ]);
  const freq = new Map<string, number>();
  words.forEach((w) => {
    if (!stop.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  });
  const themes = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  const subject = topic.trim() || "the source material";
  const longest = [...sents].sort((a, b) => b.length - a.length);
  const key = longest.slice(0, 5);

  const summary = [
    `${pick([
      "In short,",
      "At a glance,",
      "The material, read against your question,",
    ])} this source addresses ${subject}${themes.length ? `, centring on ${themes.slice(0, 3).join(", ")}` : ""}.`,
    key[0] ? key[0].replace(/\s+/g, " ") : "",
    sents.length > 4
      ? `Across roughly ${sents.length} statements, the argument holds a consistent line rather than shifting position.`
      : "The source is brief, so treat the reading below as indicative rather than conclusive.",
  ]
    .filter(Boolean)
    .join(" ");

  const findings = key
    .map((s, i) => `${i + 1}. ${s.replace(/\s+/g, " ").replace(/\.$/, "")}.`)
    .join("\n");

  const insights = [
    themes[0]
      ? `• "${themes[0]}" recurs most often, suggesting it is the load-bearing idea rather than a passing mention.`
      : "• No single term dominates, so the piece is broad rather than focused.",
    themes[1] && themes[2]
      ? `• The pairing of "${themes[1]}" and "${themes[2]}" hints at the trade-off the author is really working through.`
      : "• Consider pasting more of the source to sharpen the thematic read.",
    `• Relative to your question — ${subject} — the source answers part of it and leaves the rest open; note where you are inferring rather than reading.`,
    `• ${pick([
      "Watch for claims stated without evidence; they are the weakest points to build on.",
      "Nothing here is quantified, so treat magnitudes as unverified.",
      "The framing is confident, which can mask the absence of counter-arguments.",
    ])}`,
  ].join("\n");

  const recommendations = [
    `1. Extract the two or three statements above that directly serve ${subject} and cite them verbatim.`,
    "2. Find a second, independent source before relying on any single claim here.",
    `3. Turn the strongest finding into a one-line position you can defend in a meeting.`,
    `4. ${pick([
      "Flag any figure or date for manual verification.",
      "Decide explicitly what this source does not tell you, and note the gap.",
      "Share the summary with a colleague to test whether the reading holds.",
    ])}`,
  ].join("\n");

  const questions = [
    `• What evidence supports the central claim about ${themes[0] ?? subject}?`,
    "• Who benefits from this framing, and who is absent from it?",
    "• What would have to be true for the opposite conclusion to hold?",
    `• How recent is this material, and has anything changed since?`,
    `• What is the smallest next step that would test this against ${subject}?`,
  ].join("\n");

  return { summary, findings, insights, recommendations, questions };
}

/* -------------------------------- Chat ---------------------------------- */

export function generateChatReply(prompt: string, history: string[]): string {
  const p = prompt.trim();
  const lower = p.toLowerCase();
  const points = bulletsFrom(p).filter((s) => s.length > 3);
  const turn = history.length;

  const ack = pick(
    [
      `Here's how I'd approach "${p.slice(0, 90)}${p.length > 90 ? "…" : ""}".`,
      `Taking your request at face value — ${p.slice(0, 80)}${p.length > 80 ? "…" : ""} — here's a working draft.`,
      `Good starting point. Based on what you've written, here's a structure you can edit.`,
    ],
    turn,
  );

  let body: string;

  if (/prioriti|priority|too much|overwhelm|workload/.test(lower)) {
    body = [
      "**Sort it in three passes:**",
      "1. **Deadline-driven** — anything due in 48 hours goes first, regardless of how it feels.",
      "2. **Consequence-driven** — what breaks, or who is blocked, if this slips another day?",
      "3. **Everything else** — park it in a named list so it stops competing for attention.",
      "",
      points.length > 1
        ? `From what you listed, I'd start with: ${points[0]}. Give it one protected block before email.`
        : "Name the three items out loud — the order usually becomes obvious once they're separated.",
      "",
      "Then pick exactly one thing you will not do today, and tell whoever is waiting.",
    ].join("\n");
  } else if (/update|status|progress|report/.test(lower)) {
    body = [
      "**Project update — draft**",
      "",
      "**Where we are:** " + (points[0] ?? "Work is progressing against the agreed scope."),
      "**Completed since last update:** " + (points[1] ?? "The items in flight at the last check-in are now closed."),
      "**In progress:** " + (points[2] ?? "The current workstream, on track for the next milestone."),
      "**Risks / blockers:** call out anything you need a decision on — updates without asks tend to get skimmed.",
      "**Next:** the single most important thing happening before the next update.",
    ].join("\n");
  } else if (/summar|notes|minutes|meeting/.test(lower)) {
    const src = sentences(p).slice(1);
    body = [
      "**Summary**",
      src.length
        ? src.slice(0, 3).map((s) => `• ${s.replace(/\.$/, "")}.`).join("\n")
        : "• Paste the notes in your next message and I'll condense them into decisions, owners and actions.",
      "",
      "**Decisions:** what was actually settled (not just discussed).",
      "**Actions:** owner + date for each one.",
      "**Open questions:** anything left unresolved, so it doesn't quietly disappear.",
    ].join("\n");
  } else if (/follow.?up|chase|reminder|no reply/.test(lower)) {
    body = [
      "**Follow-up draft**",
      "",
      "Hi [name],",
      "",
      `Circling back on ${points[0] ?? "my note below"} — I know inboxes get busy.`,
      "If it helps, the only thing I need is [the one decision or answer]. A one-line reply is plenty.",
      "",
      "Happy to move the deadline if that's easier — just let me know which you'd prefer.",
      "",
      "Thanks,",
      "[Your name]",
    ].join("\n");
  } else if (/email|write|draft|message/.test(lower)) {
    body = [
      "Here's a skeleton you can fill in:",
      "",
      `• **Purpose line:** one sentence stating why you're writing — "${p.slice(0, 60)}".`,
      "• **Context:** two sentences maximum, only what the reader needs.",
      "• **The ask:** a single, specific, dated request.",
      "• **Easy exit:** offer an alternative so a 'no' still moves things forward.",
      "",
      "For a fully formatted version with tone and length control, the Email Generator does this in one click.",
    ].join("\n");
  } else {
    body = [
      points.length > 1
        ? points
            .slice(0, 4)
            .map((s, i) => `${i + 1}. **${titleCase(s.replace(/\.$/, ""))}** — worth handling as its own step rather than folding it into the others.`)
            .join("\n")
        : `The core of this looks like a single question: ${p.replace(/\?$/, "")}?`,
      "",
      pick(
        [
          "Practically: define the outcome first, then the smallest action that moves you toward it today.",
          "Practically: write down who needs to agree, and get that agreement before doing the work.",
          "Practically: put a time box on it. Most workplace tasks expand to fill whatever space you give them.",
        ],
        turn + p.length,
      ),
      "",
      "Tell me more about the constraints — deadline, audience, or what's already been tried — and I'll tighten this up.",
    ].join("\n");
  }

  return `${ack}\n\n${body}`;
}
