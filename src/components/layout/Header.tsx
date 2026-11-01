/**
 * Header — sticky üst bar. Ortada "Liquid Navbar" (sıvı damla aktif bölümü takip eder),
 * solda logo, sağda Liquid Metal "Bana Ulaş" butonu. Mobilde navbar yalnızca ikon gösterir.
 */
import { House, LayoutGrid, Mail, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { LiquidNavbar, type LiquidNavItem, type NimbusFx } from "@/components/ui/liquid-glass-navbar";
import { sections, UI } from "@/config/site";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTheme } from "@/hooks/useTheme";
import { useScrolledPast } from "@/hooks/useScrollY";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";

/** Menü öğesine göre ikon ve ikonun oynadığı küçük animasyon (sections ile aynı sırada) */
const NAV_META: { icon: React.ReactNode; fx: NimbusFx }[] = [
  { icon: <House size={18} strokeWidth={1.8} aria-hidden="true" />, fx: "glow" },
  { icon: <LayoutGrid size={18} strokeWidth={1.8} aria-hidden="true" />, fx: "spin" },
  { icon: <User size={18} strokeWidth={1.8} aria-hidden="true" />, fx: "wave" },
  { icon: <Mail size={18} strokeWidth={1.8} aria-hidden="true" />, fx: "pop" },
];
const SCROLL_LOCK_MS = 1100; // tıklanan bölüme kayarken damla ara bölümlerde zıplamasın

export function Header({ active }: { active: string }) {
  const scrolled = useScrolledPast(UI.headerScrollThreshold);
  const iconsOnly = useMediaQuery("(max-width: 639px)");
  const [theme] = useTheme();

  const items = useMemo<LiquidNavItem[]>(
    () => sections.map((s, i) => ({ label: s.label, href: `#${s.id}`, ...NAV_META[i] })),
    [],
  );

  // Scroll'a göre aktif bölüm; tıklama sırasında geçici olarak tıklanan öğe kilitlenir
  const [locked, setLocked] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const activeIndex = Math.max(0, sections.findIndex((s) => s.id === active));
  const onChange = (i: number) => {
    setLocked(i);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLocked(null), SCROLL_LOCK_MS);
  };

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      {/* kaydırınca içeriğin barın arkasında karışmaması için yumuşak solma */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-bg via-bg/75 to-transparent transition-opacity duration-500",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Brand iconOnlyBelowLg className="justify-self-start" />
        <LiquidNavbar
          className="header-nav"
          tone={theme === "light" ? "light" : "dark"}
          compact={iconsOnly}
          items={items}
          active={locked ?? activeIndex}
          onChange={onChange}
        />
        <div className="hidden justify-self-end md:block">
          <LiquidMetalButton label="Bana Ulaş" href="#iletisim" />
        </div>
      </div>
    </header>
  );
}
