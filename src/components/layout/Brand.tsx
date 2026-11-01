/** Brand — logo + marka adı (header ve footer'da). */
import { LogoMark } from "@/components/ui/logo";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

export function Brand({ className, iconOnlyBelowLg = false }: { className?: string; iconOnlyBelowLg?: boolean }) {
  return (
    <a href="#ana-sayfa" className={cn("group inline-flex items-center gap-3 rounded-lg", className)}>
      <span className="grid size-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[inset_0_1px_0_var(--hi),0_4px_12px_var(--drop)] transition-colors group-hover:border-orange-400/50">
        <LogoMark className="size-6 text-fg" />
      </span>
      <span className={cn("flex flex-col leading-none whitespace-nowrap", iconOnlyBelowLg && "max-lg:sr-only")}>
        <span className="font-display text-xl font-semibold tracking-[0.02em] text-fg">{site.brand}</span>
        {site.tagline ? <span className="mt-1 text-[11px] tracking-wide text-muted">{site.tagline}</span> : null}
        <span className="sr-only"> — Ana sayfa</span>
      </span>
    </a>
  );
}
