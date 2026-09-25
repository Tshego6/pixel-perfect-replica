import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
  variant = "outline",
}: {
  value: string;
  label?: string;
  size?: "sm" | "default" | "icon";
  variant?: "outline" | "ghost" | "secondary";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value.trim()) {
      toast.error("Nothing to copy yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Your browser blocked clipboard access");
    }
  }

  return (
    <Button type="button" size={size} variant={variant} onClick={copy} aria-label={label}>
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}
      {size !== "icon" && <span>{copied ? "Copied" : label}</span>}
    </Button>
  );
}
