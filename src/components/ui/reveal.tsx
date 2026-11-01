/** Reveal — kaydırınca görünür olduğunda yumuşakça beliren sarmalayıcı. */
import type React from "react";
import { useRef } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

type Props = {
  as?: React.ElementType;
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

export function Reveal({ as: Comp = "div", delay = 0, className, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { once: true, rootMargin: "0px 0px -10% 0px" });
  return (
    <Comp
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Comp>
  );
}
