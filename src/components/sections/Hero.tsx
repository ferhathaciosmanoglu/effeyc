/**
 * Hero — dev arka plan yazısı (imleç ışığıyla aydınlanır), başlıklar, iki buton,
 * soyut grafik ve "gezegen ufku" üzerinde güven bandı.
 */
import { ArrowRight } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { site } from "@/config/site";
import { HeroGraphic } from "./HeroGraphic";

export function Hero() {
  return (
    <section
      id="ana-sayfa"
      aria-labelledby="hero-title"
      className="relative isolate -mt-[76px] overflow-hidden pt-[76px] sm:-mt-[80px] sm:pt-[80px]"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-12 pb-10 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:gap-6 lg:pt-20">
        <div className="flex flex-col items-start gap-6">
          <span className="glass-pill !min-h-9 !cursor-default !px-3.5 text-xs text-gray-300">
            <span className="relative flex size-2">
              <span className="anim-pulse absolute inline-flex size-full rounded-full bg-orange-400" />
              <span className="relative inline-flex size-2 rounded-full bg-orange-500" />
            </span>
            Günlük hayat için uygulamalar
          </span>
          <h1 id="hero-title" className="text-display font-semibold text-fg">
            Günlük Hayatınızı Kolaylaştıran{" "}
            <span className="text-gradient-orange">Akıllı</span> Çözümler
          </h1>
          <h2 className="max-w-xl font-sans text-base leading-relaxed font-normal tracking-normal text-muted sm:text-lg">
            Zaman, kaybedilen bir hazinedir
          </h2>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <LiquidMetalButton label="Uygulamaları Keşfet" href="#uygulamalarim" size="lg" />
            <GlassButton href="#nasil-calisir" className="!min-h-[52px] !px-6">
              Nasıl Çalışır?
              <ArrowRight className="size-4" aria-hidden="true" />
            </GlassButton>
          </div>
        </div>

        <HeroGraphic />
      </div>

      {/* Gezegen ufku + güven bandı */}
      <div
        className="relative mt-4 h-[230px] sm:h-[260px]"
        // alt kenarda sert kesim olmasın: gezegen zemine doğru erisin
        style={{ maskImage: "linear-gradient(180deg, #000 55%, transparent 100%)", WebkitMaskImage: "linear-gradient(180deg, #000 55%, transparent 100%)" }}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 h-[1200px] w-[240vw] -translate-x-1/2 rounded-[50%] sm:w-[180vw] lg:w-[140vw]"
          style={{
            background: "var(--hero-planet)",
            boxShadow: "0 -1px 0 var(--line)",
          }}
        />

        <ul className="relative mx-auto grid max-w-4xl grid-cols-3 gap-2 px-4 pt-14 text-center sm:gap-6 sm:pt-16">
          {site.stats.map((s) => (
            <li key={s.label} className="flex flex-col items-center gap-1">
              <span className="font-display text-3xl font-semibold tracking-tight text-fg sm:text-5xl">{s.value}</span>
              <span className="text-xs text-muted sm:text-sm">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
