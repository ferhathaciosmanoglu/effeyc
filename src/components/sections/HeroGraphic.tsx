/**
 * HeroGraphic — sade, animasyonlu logo.
 * Açılışta üç parça yerine süzülerek oturur, sonra yavaşça süzülür ve zaman zaman üzerinden hafif
 * bir ışık geçer. İmleç logonun üstüne gelince "liquid sculpture" motoru devreye girer: logo
 * binlerce parçacığa dönüşüp imlecin etrafında sıvı gibi akar, imleç gidince yeniden toplanır.
 * Saf SVG + CSS (+ hover'da WebGL2); WebGL2 yoksa yalnızca SVG logo kalır.
 */
import { useEffect, useId, useRef } from "react";
// Motor yalnızca tür olarak içe aktarılır; kodu ilk hover'da ayrı bir parça (chunk) olarak yüklenir.
import type { EngineOptions, LiquidEngine } from "@/components/ui/liquid-sculpture-hero";
import { useTheme } from "@/hooks/useTheme";

// [parça yolu, başlangıç kayması (px), gecikme (sn)]
const PIECES = [
  { d: "M272 248 L580 242 L580 350 L403 350 L403 398 L519 398 L519 420 L270 465 Z", from: ["-70px", "-50px"], delay: 0 },
  { d: "M633 241 L766 238 L766 462 Q766 492 736 498 L400 560 L400 800 L262 800 L266 545 Q268 507 306 499 L628 443 Z", from: ["0px", "70px"], delay: 0.15 },
  { d: "M455 592 L758 552 L755 795 L622 797 L622 685 L453 685 Z", from: ["70px", "50px"], delay: 0.3 },
] as const;

/** Canvas, logonun her kenarından bu oranda taşar (parçacıklar logonun dışına da dağılabilsin) */
const BLEED = 0.25;
/** İmleç ayrıldıktan sonra parçacıkların toplanmasını beklemek için süre (ms) */
const SETTLE_MS = 2600;

/** Logo animasyonunun motor ayarları (renk logonun kendi pikselinden gelir) */
const ENGINE_OPTIONS = (reducedMotion: boolean): EngineOptions => ({
  interactive: true,
  strength: 1,
  radius: 190,
  density: 0.2, // ~450 px ızgara → yaklaşık 150–170 bin parçacık
  dotSize: 1.25,
  spread: 1,
  turbulence: 1,
  liquid: 1,
  streaks: true,
  restStyle: "image",
  returnSpeed: 1,
  ambient: false,
  ambientIntensity: 1,
  speed: 1,
  intro: false,
  reducedMotion,
  bg: [1, 1, 1],
  imgBg: null,
});

/**
 * Hover'da sıvı parçacık animasyonunu yönetir. Kök elemanda data-live="1" iken canvas görünür.
 * Performans: WebGL motoru (shader derleme + parçacık üretimi) sayfa açılışında değil,
 * ilk hover / dokunuşta başlatılır; böylece ilk yükleme etkilenmez.
 */
function useLiquidLogo(
  rootRef: React.RefObject<HTMLDivElement | null>,
  wrapRef: React.RefObject<HTMLDivElement | null>,
  logoSrc: string,
) {
  useEffect(() => {
    const root = rootRef.current;
    const wrap = wrapRef.current;
    if (!root || !wrap) return;

    let started = false;
    let ready = false;
    let cancelled = false;
    let leaveTimer = 0;
    let engine: LiquidEngine | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let teardown: (() => void) | null = null;

    // İmleç konumu canvas'a göre hesaplanır
    const pos = (e: PointerEvent) => {
      const b = canvas!.getBoundingClientRect();
      return [e.clientX - b.left, e.clientY - b.top] as const;
    };
    const live = (on: boolean) => {
      window.clearTimeout(leaveTimer);
      if (on) root.dataset.live = "1";
      else leaveTimer = window.setTimeout(() => (root.dataset.live = "0"), SETTLE_MS);
    };

    /** Motoru kurar (yalnızca bir kez). WebGL2 yoksa sessizce vazgeçer, SVG logo kalır. */
    const start = async () => {
      if (started) return;
      started = true;
      let mod: typeof import("@/components/ui/liquid-sculpture-hero");
      try {
        mod = await import("@/components/ui/liquid-sculpture-hero");
      } catch {
        return; // parça yüklenemedi (çevrimdışı vb.): SVG logo kalır
      }
      if (cancelled) return;
      canvas = document.createElement("canvas");
      canvas.className = "liquid-logo-canvas";
      wrap.appendChild(canvas);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      try {
        engine = new mod.LiquidEngine(canvas, ENGINE_OPTIONS(reduced.matches), () => {
          ready = false;
          root.dataset.live = "0";
        });
      } catch {
        canvas.remove();
        canvas = null;
        return;
      }
      const eng = engine;
      const cv = canvas;

      const layout = () => {
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        if (!w || !h) return;
        eng.resize(w * (1 + 2 * BLEED), h * (1 + 2 * BLEED), { x: w * BLEED, y: h * BLEED, w, h });
      };
      const ro = new ResizeObserver(layout);
      ro.observe(wrap);
      const io = new IntersectionObserver(([entry]) => eng.setVisible(entry.isIntersecting && !document.hidden));
      io.observe(root);
      const onVisibility = () => eng.setVisible(!document.hidden);
      document.addEventListener("visibilitychange", onVisibility);
      const onReduced = () => eng.setOptions({ reducedMotion: reduced.matches });
      reduced.addEventListener("change", onReduced);

      const image = new Image();
      image.onload = () => {
        if (cancelled) return;
        try {
          eng.onFirstFrame = () => {
            ready = true;
          };
          layout();
          eng.setImage(image);
          layout();
        } catch (error) {
          console.error("[HeroGraphic] Sıvı logo animasyonu başlatılamadı:", error);
        }
      };
      image.src = `${import.meta.env.BASE_URL}${logoSrc}`;

      teardown = () => {
        ro.disconnect();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        reduced.removeEventListener("change", onReduced);
        eng.destroy();
        cv.remove();
      };
    };

    const onEnter = () => {
      void start();
      if (ready) live(true);
    };
    const onMove = (e: PointerEvent) => {
      if (!ready || !engine) return;
      const touch = e.pointerType === "touch";
      if (touch && e.buttons === 0 && e.pressure === 0) return;
      live(true);
      engine.pointer("move", ...pos(e), touch);
    };
    const onDown = (e: PointerEvent) => {
      void start();
      if (!ready || !engine) return;
      live(true);
      engine.pointer("down", ...pos(e), e.pointerType === "touch");
    };
    const onUp = (e: PointerEvent) => {
      if (!ready || !engine) return;
      engine.pointer("up", ...pos(e), e.pointerType === "touch");
      live(false);
    };
    const onLeave = (e: PointerEvent) => {
      if (!ready || !engine) return;
      engine.pointer("leave", ...pos(e), e.pointerType === "touch");
      live(false);
    };
    root.addEventListener("pointerenter", onEnter, { passive: true });
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerdown", onDown, { passive: true });
    root.addEventListener("pointerup", onUp, { passive: true });
    root.addEventListener("pointercancel", onUp, { passive: true });
    root.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      cancelled = true;
      window.clearTimeout(leaveTimer);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("pointerleave", onLeave);
      teardown?.();
      delete root.dataset.live;
    };
  }, [rootRef, wrapRef, logoSrc]);
}

export function HeroGraphic() {
  const uid = useId();
  const bodyId = `${uid}-body`;
  const shineId = `${uid}-shine`;
  const clipId = `${uid}-clip`;
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [theme] = useTheme();
  // Parçacıkların örneklediği logo: açık temada koyu logo, koyu/loş temada açık logo
  useLiquidLogo(rootRef, wrapRef, theme === "light" ? "logo-hero.png" : "logo-hero-light.png");

  return (
    <div
      ref={rootRef}
      className="liquid-logo relative mx-auto grid aspect-square w-full max-w-[280px] place-items-center sm:max-w-[380px] lg:max-w-[440px]"
      aria-hidden="true"
    >
      {/* yumuşak zemin gölgesi */}
      <div className="anim-pulse pointer-events-none absolute bottom-[8%] left-1/2 h-[7%] w-[46%] -translate-x-1/2 rounded-[50%] bg-[var(--logo-shadow)] blur-xl" />

      <div ref={wrapRef} className="anim-float relative w-[68%]">
        <svg viewBox="250 225 530 590" className="liquid-logo-svg block w-full overflow-visible drop-shadow-[0_24px_34px_var(--logo-shadow)]">
          <defs>
            <linearGradient id={bodyId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: "var(--logo-a)" }} />
              <stop offset="1" style={{ stopColor: "var(--logo-b)" }} />
            </linearGradient>
            <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.32" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id={clipId}>
              {PIECES.map((p) => (
                <path key={p.d} d={p.d} />
              ))}
            </clipPath>
          </defs>

          {PIECES.map((p) => (
            <path
              key={p.d}
              d={p.d}
              fill={`url(#${bodyId})`}
              className="logo-piece"
              style={{ "--px": p.from[0], "--py": p.from[1], "--d": `${p.delay}s` } as React.CSSProperties}
            />
          ))}

          {/* logonun içinde gezinen ışık */}
          <g clipPath={`url(#${clipId})`}>
            <rect className="logo-shine" x="60" y="200" width="160" height="640" fill={`url(#${shineId})`} transform="skewX(-18)" />
          </g>
        </svg>
      </div>
    </div>
  );
}
