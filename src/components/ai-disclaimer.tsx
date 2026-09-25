import { Info, Sparkle } from "lucide-react";
import { AI_DISCLAIMER } from "@/lib/ai-engine";
import { cn } from "@/lib/utils";

export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      <p>{AI_DISCLAIMER}</p>
    </div>
  );
}

export function AiBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary",
        className,
      )}
    >
      <Sparkle className="h-3 w-3" aria-hidden />
      AI-generated
    </span>
  );
}
