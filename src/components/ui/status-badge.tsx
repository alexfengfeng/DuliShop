import { cn } from "@/lib/format";

const tones: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Installed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Unfulfilled: "bg-amber-50 text-amber-800 ring-amber-200",
  Available: "bg-slate-50 text-slate-700 ring-slate-200",
  Archived: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  VIP: "bg-purple-50 text-purple-800 ring-purple-200",
  "At risk": "bg-rose-50 text-rose-800 ring-rose-200",
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ring-1",
        tones[value] ?? "bg-slate-50 text-slate-700 ring-slate-200",
      )}
    >
      {label ?? value}
    </span>
  );
}
