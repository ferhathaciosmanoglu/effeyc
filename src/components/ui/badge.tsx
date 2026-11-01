/** Badge — teknoloji etiketi için küçük cam rozet. */
import type React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--tint)] px-2.5 py-1",
        "text-xs font-medium text-gray-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
