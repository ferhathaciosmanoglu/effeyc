/**
 * LiquidMetalButton — Ek-A referans bileşeninin iyileştirilmiş hali.
 *
 * Korunanlar: 3 katmanlı yapı (shader kabuğu → siyah çekirdek → etiket), liquid metal shader,
 * gölgeler, hover/click hızlanması ve ripple efekti.
 *
 * Eklenenler (Bölüm 4.4):
 *  1. Etikete göre otomatik genişlik (min 142px) + `width` / `size` prop'ları
 *  2. AA kontrastlı açık gri etiket (`labelColor` ile değiştirilebilir)
 *  3. Klavye odağında (:focus-visible) turuncu odak halkası
 *  4. `type`, `disabled`, `href`, `className`, `ariaLabel` prop'ları
 *  5. Pointer olayları (dokunmatikte basılı efekt)
 *  6. prefers-reduced-motion → shader hızı 0, ripple kapalı
 *  7. Shader yalnızca görünür alandayken çalışır (WebGL context sınırı)
 *  8. WebGL yoksa CSS gümüş gradient kenarlık yedeği
 *  9. Zamanlayıcı temizliği, anlamlı log etiketi
 */
import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { UI } from "@/config/site";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { prefersLightEffects } from "@/lib/device";
import { cn } from "@/lib/utils";

/* ---- Sabitler ---- */
const MIN_WIDTH = 142;
const SHELL_INSET = 2; // kabuk ile siyah çekirdek arasındaki metal kenar kalınlığı
const HEIGHTS = { md: 46, lg: 52 } as const;
const LABEL_PADDING_X = { md: 28, lg: 34 } as const;
const FONT_SIZE = { md: 14, lg: 15 } as const;
const SPEED = { idle: 0.6, hover: 1, click: 2.4 } as const;
const CLICK_BOOST_MS = 300;
const RIPPLE_MS = 600;
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const DEFAULT_LABEL_COLOR = "#d4d4d8"; // siyah çekirdek üzerinde WCAG AA

/** Shader için kullanılan dar arayüz (paketin yalnızca ihtiyaç duyduğumuz kısmı) */
type ShaderHandle = Pick<ShaderMount, "setSpeed" | "dispose" | "setUniforms">;

type RGBA = [number, number, number, number];
const TINT: Record<"chrome" | "accent", RGBA> = {
  chrome: [1, 1, 1, 1],
  accent: [1, 0.62, 0.32, 1], // turuncu tonlu metal (paket u_colorTint destekliyor)
};

function buildUniforms(tint: RGBA) {
  return {
    u_colorBack: [0, 0, 0, 0] as RGBA,
    u_colorTint: tint,
    u_isImage: false,
    u_repetition: 4,
    u_softness: 0.5,
    u_shiftRed: 0.3,
    u_shiftBlue: 0.3,
    u_distortion: 0,
    u_contour: 0,
    u_angle: 45,
    u_shape: 0,
    // sizing (paketin güncel sürümü bunları zorunlu tutuyor)
    u_fit: 0,
    u_scale: 1,
    u_rotation: 0,
    u_originX: 0.5,
    u_originY: 0.5,
    u_offsetX: 0.1,
    u_offsetY: -0.1,
    u_worldWidth: 0,
    u_worldHeight: 0,
  };
}

/** Tarayıcı WebGL destekliyor mu? (bir kez hesaplanır) */
let webglSupport: boolean | null = null;
function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement("canvas");
    webglSupport = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/**
 * Shader başlatma kuyruğu: her shader derlemesi ana iş parçacığını kısa süre bloklar.
 * İlk yüklemeyi (LCP/TBT) etkilememek için sayfa yüklendikten sonra, tarayıcı boştayken
 * ve her seferinde yalnızca bir shader başlatılır.
 */
const shaderQueue: Array<() => void> = [];
let queueRunning = false;
const IDLE_TIMEOUT_MS = 1200;
const idle = (cb: () => void) => {
  // Safari'de requestIdleCallback yok → setTimeout yedeği
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(cb, { timeout: IDLE_TIMEOUT_MS });
  } else {
    setTimeout(cb, 1);
  }
};

function pumpShaderQueue() {
  const next = shaderQueue.shift();
  if (!next) {
    queueRunning = false;
    return;
  }
  next();
  idle(pumpShaderQueue);
}

/** Shader kurulumunu kuyruğa ekler; iptal fonksiyonu döner. */
function scheduleShader(task: () => void): () => void {
  shaderQueue.push(task);
  if (!queueRunning) {
    queueRunning = true;
    const start = () => idle(pumpShaderQueue);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
  }
  return () => {
    const i = shaderQueue.indexOf(task);
    if (i >= 0) shaderQueue.splice(i, 1);
  };
}

const SHARED_STYLE_ID = "liquid-metal-button-style";
function ensureSharedStyles() {
  if (document.getElementById(SHARED_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = SHARED_STYLE_ID;
  style.textContent = `
    .shader-container-exploded canvas {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      border-radius: 100px !important;
    }
    @keyframes ripple-animation {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
      100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: "text" | "icon";
  /** Sabit genişlik (px). Verilmezse etikete göre otomatik (min 142). */
  width?: number;
  size?: "md" | "lg";
  /** chrome: gümüş (varsayılan) · accent: turuncu tonlu metal */
  variant?: "chrome" | "accent";
  type?: "button" | "submit";
  disabled?: boolean;
  /** Verilirse tıklanabilir alan <a> olur. http ile başlıyorsa yeni sekmede açılır. */
  href?: string;
  className?: string;
  ariaLabel?: string;
  labelColor?: string;
  /** Etiketin yanında gösterilecek küçük ikon */
  icon?: React.ReactNode;
}

export function LiquidMetalButton({
  label = "Get Started",
  onClick,
  viewMode = "text",
  width,
  size = "md",
  variant = "chrome",
  type = "button",
  disabled = false,
  href,
  className,
  ariaLabel,
  labelColor = DEFAULT_LABEL_COLOR,
  icon,
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [shaderFailed, setShaderFailed] = useState(false);
  const [labelWidth, setLabelWidth] = useState<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const shaderRef = useRef<HTMLDivElement>(null);
  const shaderMount = useRef<ShaderHandle | null>(null);
  const interactiveRef = useRef<HTMLElement | null>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const rippleId = useRef(0);
  const timers = useRef(new Set<number>());
  const hoveredRef = useRef(false);

  const reducedMotion = usePrefersReducedMotion();
  const inView = useInView(rootRef, { rootMargin: UI.shaderRootMargin });

  const height = HEIGHTS[size];
  const idleSpeed = reducedMotion ? 0 : SPEED.idle;
  const hoverSpeed = reducedMotion ? 0 : SPEED.hover;
  const clickSpeed = reducedMotion ? 0 : SPEED.click;
  // shader kurulumu sırasında güncel hızları okumak için (effect'i yeniden tetiklemeden)
  const speedRef = useRef({ idle: idleSpeed, hover: hoverSpeed });
  useEffect(() => {
    speedRef.current = { idle: idleSpeed, hover: hoverSpeed };
  }, [idleSpeed, hoverSpeed]);

  /* 1) Dinamik genişlik: etiketin gerçek genişliğini ölç (font yüklenince de güncellenir) */
  useLayoutEffect(() => {
    const el = labelRef.current;
    if (!el || viewMode === "icon") return;
    const measure = () => setLabelWidth(Math.ceil(el.scrollWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [label, viewMode, size, icon]);

  const dimensions = useMemo(() => {
    if (viewMode === "icon") {
      return { width: height, height };
    }
    // ilk render'da ölçüm yoksa kaba tahmin (layout kaymasını azaltır)
    const estimate = label.length * FONT_SIZE[size] * 0.56;
    const auto = Math.max(MIN_WIDTH, Math.ceil((labelWidth ?? estimate) + LABEL_PADDING_X[size] * 2));
    return { width: width ?? auto, height };
  }, [viewMode, height, label, labelWidth, size, width]);

  const inner = {
    width: dimensions.width - SHELL_INSET * 2,
    height: dimensions.height - SHELL_INSET * 2,
  };

  /* 7) Shader'ı yalnızca görünür alandayken başlat, çıkınca yok et */
  useEffect(() => {
    ensureSharedStyles();
    // WebGL yoksa shader hiç başlatılmaz; CSS gümüş gradient yedeği görünür kalır
    // Zayıf cihazlarda/veri tasarrufunda WebGL açılmaz; CSS gümüş kenarlık (yedek görünüm) kalır
    if (!inView || shaderFailed || !hasWebGL() || prefersLightEffects()) return;
    const host = shaderRef.current;
    if (!host) return;
    const cancel = scheduleShader(() => {
      if (!host.isConnected) return;
      try {
        shaderMount.current = new ShaderMount(
          host,
          liquidMetalFragmentShader,
          buildUniforms(TINT[variant]),
          undefined,
          hoveredRef.current ? speedRef.current.hover : speedRef.current.idle,
        );
      } catch (error) {
        console.error("[LiquidMetalButton] Shader yüklenemedi:", error);
        setShaderFailed(true);
      }
    });
    return () => {
      cancel();
      shaderMount.current?.dispose();
      shaderMount.current = null;
    };
    // Not: hız değişimi ayrı effect'te yönetilir; hız değişince shader yeniden kurulmaz.
  }, [inView, shaderFailed, variant]);

  // reduced-motion tercihi değişirse hızı güncelle
  useEffect(() => {
    shaderMount.current?.setSpeed(hoveredRef.current ? hoverSpeed : idleSpeed);
  }, [idleSpeed, hoverSpeed]);

  /* 9) Unmount'ta tüm zamanlayıcıları temizle */
  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach((t) => window.clearTimeout(t));
      set.clear();
    };
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  /* 5) Pointer olayları */
  const handlePointerEnter = () => {
    if (disabled) return;
    hoveredRef.current = true;
    setIsHovered(true);
    shaderMount.current?.setSpeed(hoverSpeed);
  };

  const handlePointerLeave = () => {
    hoveredRef.current = false;
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed(idleSpeed);
  };

  const handlePointerDown = () => {
    if (!disabled) setIsPressed(true);
  };
  const handlePointerUp = () => setIsPressed(false);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (shaderMount.current) {
      shaderMount.current.setSpeed(clickSpeed);
      later(() => {
        shaderMount.current?.setSpeed(hoveredRef.current ? hoverSpeed : idleSpeed);
      }, CLICK_BOOST_MS);
    }

    // 6) Hareket azaltma açıksa ripple yok
    if (!reducedMotion && interactiveRef.current) {
      const rect = interactiveRef.current.getBoundingClientRect();
      // klavyeyle tetiklenince (clientX=0) ripple ortadan başlasın
      const fromKeyboard = e.clientX === 0 && e.clientY === 0;
      const x = fromKeyboard ? rect.width / 2 : e.clientX - rect.left;
      const y = fromKeyboard ? rect.height / 2 : e.clientY - rect.top;
      const ripple = { x, y, id: rippleId.current++ };
      setRipples((prev) => [...prev, ripple]);
      later(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), RIPPLE_MS);
    }

    onClick?.();
  };

  /* 3) Yalnızca klavye odağında halka göster */
  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    setIsFocusVisible(e.currentTarget.matches(":focus-visible"));
  };
  const handleBlur = () => setIsFocusVisible(false);

  const isExternal = !!href && /^https?:\/\//.test(href);

  const layerTransition = `all 0.8s ${SPRING}, width 0.4s ease, height 0.4s ease`;
  const pressTransform = isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)";

  const interactiveStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: disabled ? "not-allowed" : "pointer",
    outline: "none",
    zIndex: 40,
    transformStyle: "preserve-3d",
    transform: "translateZ(25px)",
    transition: layerTransition,
    overflow: "hidden",
    borderRadius: "100px",
    display: "block",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  };

  const interactiveProps = {
    onClick: handleClick,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
    onFocus: handleFocus,
    onBlur: handleBlur,
    style: interactiveStyle,
    "aria-label": ariaLabel ?? label,
  };

  const rippleNodes = ripples.map((ripple) => (
    <span
      key={ripple.id}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${ripple.x}px`,
        top: `${ripple.y}px`,
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%)",
        pointerEvents: "none",
        animation: `ripple-animation ${RIPPLE_MS}ms ease-out`,
      }}
    />
  ));

  // Metal yüzeyi bozmadan, hover'da dışarıdan hafif turuncu ışıma
  const glow = isHovered && !disabled ? "drop-shadow(0 0 14px rgba(255, 106, 26, 0.35))" : "none";

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-block shrink-0 align-middle", disabled && "opacity-50", className)}
      style={{ filter: glow, transition: "filter 0.35s ease", width: dimensions.width, height: dimensions.height }}
    >
      <div style={{ perspective: "1000px", perspectiveOrigin: "50% 50%" }}>
        <div
          style={{
            position: "relative",
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            transformStyle: "preserve-3d",
            transition: layerTransition,
            transform: "none",
          }}
        >
          {/* Katman 3: etiket */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transformStyle: "preserve-3d",
              transition: `${layerTransition}, gap 0.4s ease`,
              transform: "translateZ(20px)",
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            {viewMode === "icon" && (
              <Sparkles
                size={16}
                aria-hidden="true"
                style={{
                  color: labelColor,
                  filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.5))",
                  transition: `all 0.8s ${SPRING}`,
                }}
              />
            )}
            {viewMode === "text" && (
              <span
                ref={labelRef}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: `${FONT_SIZE[size]}px`,
                  color: labelColor,
                  fontWeight: 500,
                  textShadow: "0px 1px 2px rgba(0, 0, 0, 0.5)",
                  transition: `all 0.8s ${SPRING}`,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
                {icon}
              </span>
            )}
          </div>

          {/* Katman 2: siyah çekirdek */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: "preserve-3d",
              transition: layerTransition,
              transform: `translateZ(10px) ${pressTransform}`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: `${inner.width}px`,
                height: `${inner.height}px`,
                margin: `${SHELL_INSET}px`,
                borderRadius: "100px",
                background: "linear-gradient(180deg, #202020 0%, #000000 100%)",
                boxShadow: isPressed
                  ? "inset 0px 2px 4px rgba(0, 0, 0, 0.4), inset 0px 1px 2px rgba(0, 0, 0, 0.3)"
                  : "none",
                transition: `${layerTransition}, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            />
          </div>

          {/* Katman 1: metal kabuk (shader) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: "preserve-3d",
              transition: layerTransition,
              transform: `translateZ(0px) ${pressTransform}`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: `${dimensions.height}px`,
                width: `${dimensions.width}px`,
                borderRadius: "100px",
                boxShadow: isFocusVisible
                  ? "0 0 0 2px var(--bg), 0 0 0 4px #ff6a1a"
                  : isPressed
                    ? "0px 0px 0px 1px rgba(0, 0, 0, 0.5), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)"
                    : isHovered
                      ? "0px 0px 0px 1px rgba(0, 0, 0, 0.4), 0px 12px 6px 0px rgba(0, 0, 0, 0.05), 0px 8px 5px 0px rgba(0, 0, 0, 0.1), 0px 4px 4px 0px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.2)"
                      : "0px 0px 0px 1px rgba(0, 0, 0, 0.3), 0px 36px 14px 0px rgba(0, 0, 0, 0.02), 0px 20px 12px 0px rgba(0, 0, 0, 0.08), 0px 9px 9px 0px rgba(0, 0, 0, 0.12), 0px 2px 5px 0px rgba(0, 0, 0, 0.15)",
                transition: `${layerTransition}, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)`,
                // 8) Yedek: shader yokken / yüklenirken gümüş gradient kenarlık
                background:
                  variant === "accent"
                    ? "linear-gradient(135deg, #fff3e6 0%, #c9824f 30%, #fde0c4 52%, #8a5a3a 74%, #f6d2b0 100%)"
                    : "linear-gradient(135deg, #f4f4f5 0%, #8e8e96 30%, #e4e4e7 52%, #6b6b72 74%, #d4d4d8 100%)",
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-exploded"
                aria-hidden="true"
                style={{
                  borderRadius: "100px",
                  overflow: "hidden",
                  position: "relative",
                  width: `${dimensions.width}px`,
                  maxWidth: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                  transition: "width 0.4s ease, height 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Etkileşim katmanı: <a> veya <button> */}
          {href && !disabled ? (
            <a
              ref={(el) => {
                interactiveRef.current = el;
              }}
              href={href}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              {...interactiveProps}
            >
              {rippleNodes}
            </a>
          ) : (
            <button
              ref={(el) => {
                interactiveRef.current = el;
              }}
              type={type}
              disabled={disabled}
              {...interactiveProps}
            >
              {rippleNodes}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
