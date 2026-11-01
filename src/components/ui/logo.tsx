/** Logo — kullanıcının "FH" monogramının vektör (SVG) hali. */
import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = { className?: string; /** "dark": mevcut metin rengi (sade), "gradient": turuncu geçiş */ tone?: "dark" | "gradient" };

export function LogoMark({ className, tone = "dark" }: Props) {
  const id = useId();
  return (
    <svg viewBox="250 225 530 590" className={cn("shrink-0", className)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5a00" />
          <stop offset="0.6" stopColor="#ff9a3c" />
          <stop offset="1" stopColor="#ffc58a" />
        </linearGradient>
      </defs>
      <g fill={tone === "gradient" ? `url(#${id})` : "currentColor"}>
        <path d="M272 248 L580 242 L580 350 L403 350 L403 398 L519 398 L519 420 L270 465 Z" />
        <path d="M633 241 L766 238 L766 462 Q766 492 736 498 L400 560 L400 800 L262 800 L266 545 Q268 507 306 499 L628 443 Z" />
        <path d="M455 592 L758 552 L755 795 L622 797 L622 685 L453 685 Z" />
      </g>
    </svg>
  );
}
