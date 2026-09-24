# AI Workplace Productivity Assistant

A frontend-only SaaS-style app with five screens, turquoise/white theme, and a local "AI" engine built from prompt templates and the user's own inputs. No backend, no database, no login, no API keys.

## Look and feel

- Turquoise and white palette, dark readable text, soft shadows, rounded cards, modern type.
- Sidebar navigation on desktop (Dashboard, Email Generator, Task Planner, Research Assistant, Workplace Chat); slide-in menu on phones.
- Subtle animations, loading states, empty states, toast confirmations, keyboard-accessible controls.

## Screens

**Dashboard** — welcome section, "AI Assistant Ready" status, quick-action buttons, one card per tool, recent activity list (saved in the browser), responsible-AI notice.

**Smart Email Generator** — inputs for recipient/context, purpose, key points; tone (Formal / Friendly / Persuasive) and length (Short / Medium / Detailed); produces an editable subject and body with Copy, Regenerate and Clear.

**AI Task Planner** — add tasks with deadlines plus available working hours; generates a daily or weekly schedule, sorts into High / Medium / Low priority using urgency, importance and deadline, and shows recommended time blocks. The plan stays editable.

**Research Assistant** — enter a topic/question plus pasted article text, or a link. Output sections: Executive Summary, Key Findings, Insights, Recommendations, Follow-up Questions — all editable and copyable. If a link cannot be read in the browser, the app says so plainly and asks the user to paste the text; it never pretends to have read a page.

**Workplace Chat** — message bubbles, session history, input with Send, typing indicator, copy on responses, and four suggested prompts ("Draft a project update", "Help me prioritise my work", "Summarise these meeting notes", "Write a professional follow-up"). Replies are built from the user's actual words and context.

## Responsible AI

Generated content is labelled as AI-generated, and every tool shows: "AI-generated content may contain errors or omissions. Review and verify important information before using it professionally." The app never claims to browse the web, send email, or reach outside systems.

## Technical notes

- React + TypeScript + Tailwind on the existing TanStack Start setup; one route file per screen with a shared sidebar layout, and the Dashboard replacing the current placeholder home page.
- Turquoise theme added as semantic tokens in `src/styles.css`; shadcn cards, buttons, inputs, textareas, tabs, sonner toasts.
- A local generation module (`src/lib/ai-engine.ts`) composes output from templates with randomised phrasing variants seeded by the user's input, so repeated runs differ; priority scoring and time-block allocation are plain functions.
- Recent activity and drafts persist in `localStorage`, read after hydration to avoid render mismatches.
- URL research uses a plain browser fetch in a try/catch; any failure surfaces the paste-the-text message rather than fabricated content.
- Unique page titles and descriptions per route.
