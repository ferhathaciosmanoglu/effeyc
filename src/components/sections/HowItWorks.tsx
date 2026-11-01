/**
 * HowItWorks — "Nasıl Yapıyorum?" / Hakkımda bölümü.
 * Samimi tanıtım metni, Fikir → Tasarım → Kod → Canlı Ürün iş akışı ve küçük istatistikler.
 * [YER TUTUCU] köşeli parantezli metinleri kendi cümlelerinle değiştir.
 */
import { Code2, Lightbulb, MessageSquareText, Rocket } from "lucide-react";
import { Fragment, useRef } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal } from "@/components/ui/reveal";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const STEPS = [
  { icon: Lightbulb, title: "Fikir", text: "Sahada karşılaşılan gerçek bir problemi ve kullanıcının ihtiyacını net biçimde tanımlıyorum." },
  { icon: MessageSquareText, title: "Tasarım", text: "Süreci analiz edip sade, kullanımı kolay ve sahada rahat okunan bir arayüz kurguluyorum." },
  { icon: Code2, title: "Kod", text: "Güvenilir ve bakımı kolay kodu yazıyor, her adımı test ederek ilerliyorum." },
  { icon: Rocket, title: "Canlı Ürün", text: "Hızlı, mobil uyumlu ve çevrimdışı çalışabilen bir uygulama olarak yayına alıp geri bildirimle geliştiriyorum." },
] as const;

const STATS = [
  { value: "10", label: "geliştirilmiş uygulama" },
  { value: "5", label: "farklı kategori" },
  { value: "TR", label: "Türkçe arayüzler" },
] as const;

const STEP_DELAY_MS = 140;

/** Logo videosu yalnızca görünürken oynar; hareket azaltmada sadece poster görünür. */
function LogoVideo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { rootMargin: "200px" });
  const reduced = usePrefersReducedMotion();
  const base = import.meta.env.BASE_URL;

  return (
    <div ref={ref} className="glass relative aspect-video overflow-hidden !rounded-[28px] p-1.5">
      <div className="relative size-full overflow-hidden rounded-[22px] bg-gray-900">
        {inView && !reduced ? (
          <video
            className="size-full object-cover"
            src={`${base}media/logo-liquid.mp4`}
            poster={`${base}media/logo-liquid-poster.jpg`}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-label="Turuncu sıvı camdan logo animasyonu"
          />
        ) : (
          <img
            className="size-full object-cover"
            src={`${base}media/logo-liquid-poster.jpg`}
            alt="Turuncu sıvı camdan logo"
            loading="lazy"
            width={960}
            height={540}
          />
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]" />
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="hakkimda" aria-labelledby="about-title" className="relative px-5 py-20 sm:py-28">
      {/* bölüm arkası turuncu ışıma */}
      <div aria-hidden="true" className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-[420px] w-[80vw] max-w-4xl -translate-x-1/2 rounded-full bg-orange-500/[0.06] blur-[120px]" />

      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal className="flex flex-col gap-5">
          <span className="eyebrow">
            <span className="h-px w-8 bg-[image:var(--gradient-orange)]" aria-hidden="true" /> Hakkımda
          </span>
          <h2 id="about-title" className="text-section font-semibold text-fg">
            İhtiyaçtan <span className="text-gradient-orange">ürüne.</span>
          </h2>
          <p className="text-base leading-relaxed text-gray-300">
            Mekatronik mühendisiyim. Endüstriyel otomasyon ve enerji sistemleri alanında çalışırken sahada tekrar eden iş yükünü, kâğıt formları ve
            dağınık takip süreçlerini yakından gördüm. effeyc, bu deneyimden doğan; sade, hızlı ve gerçekten kullanılan dijital araçları bir
            araya getiren çalışma alanımdır.
          </p>
          <p className="text-base leading-relaxed text-muted">
            Her proje net bir ihtiyaçla başlar. Süreci analiz eder, arayüzü kullanıcının sahadaki gerçek koşullarına göre tasarlar, kodu yazıp
            test eder ve mobil uyumlu, çevrimdışı da çalışabilen bir ürün olarak yayına alırım. Amacım teknolojiyi karmaşık değil, faydalı kılmaktır.
          </p>
          <ul className="mt-2 grid grid-cols-3 gap-3">
            {STATS.map((s) => (
              <li key={s.label}>
                <GlassCard className="flex flex-col gap-1 !rounded-2xl p-4">
                  <span className="font-display text-2xl font-semibold text-fg sm:text-3xl">{s.value}</span>
                  <span className="text-xs text-muted">{s.label}</span>
                </GlassCard>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <LogoVideo />
        </Reveal>
      </div>

      {/* İş akışı şeması: masaüstünde yatay, mobilde dikey */}
      <div id="nasil-calisir" className="mx-auto mt-20 max-w-6xl scroll-mt-28">
        <Reveal>
          <h3 className="mb-8 text-center font-sans text-sm font-semibold tracking-[0.2em] text-muted uppercase">
            Fikirden canlı ürüne
          </h3>
        </Reveal>
        <ol className="flex flex-col items-stretch lg:flex-row lg:items-stretch">
          {STEPS.map((step, i) => (
            <Fragment key={step.title}>
              <li className="flex-1">
                <Reveal delay={i * STEP_DELAY_MS} className="h-full">
                  <GlassCard interactive className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-center justify-between">
                      <span className="grid size-11 place-items-center rounded-xl border border-[var(--line)] bg-[var(--tint)] text-fg">
                        <step.icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="font-display text-sm font-semibold text-gray-500" aria-hidden="true">
                        0{i + 1}
                      </span>
                    </div>
                    <h4 className="font-display text-lg font-semibold text-fg">
                      <span className="sr-only">Adım {i + 1}: </span>
                      {step.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-muted">{step.text}</p>
                  </GlassCard>
                </Reveal>
              </li>
              {i < STEPS.length - 1 && (
                <li aria-hidden="true" className="flex items-center justify-center">
                  <span className="flow-line-y block h-8 w-0.5 rounded-full lg:hidden" />
                  <span className="flow-line-x hidden h-0.5 w-10 rounded-full lg:block" />
                </li>
              )}
            </Fragment>
          ))}
        </ol>
      </div>
    </section>
  );
}
