/**
 * GlassCard — liquid glass panel. `interactive` verilirse hover'da kalkar,
 * turuncu kenar parlar ve ışık yansıması imleci takip eder (--mx / --my).
 */
import type React from "react";
import { cn } from "@/lib/utils";

type GlassCardProps<T extends React.ElementType> = {
  as?: T;
  interactive?: boolean;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/** İmleç konumunu CSS değişkenlerine yazar; yansıma bu noktaya kayar. */
function trackPointer(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
  el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
}

export function GlassCard<T extends React.ElementType = "div">({
  as,
  interactive = false,
  className,
  children,
  ...rest
}: GlassCardProps<T>) {
  const Comp = (as ?? "div") as React.ElementType;
  return (
    <Comp
      className={cn("glass", interactive && "glass-interactive", className)}
      onPointerMove={interactive ? trackPointer : undefined}
      {...rest}
    >
      {children}
    </Comp>
  );
}
