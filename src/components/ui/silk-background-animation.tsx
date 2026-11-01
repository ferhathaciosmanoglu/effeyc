'use client';

/**
 * Silk background — ipek dokulu animasyonlu arka plan.
 *
 * Orijinal bileşenin (silk-background-animation) deseni korunur; site için şu uyarlamalar yapıldı:
 *  - Metin/başlık içermez, yalnızca arka plan katmanıdır (kapsayıcısını doldurur).
 *  - Açık tema: koyu ipek yerine `base` rengi üzerinde `shade` kadar koyulaşan ince doku.
 *  - Performans: düşük çözünürlükte çizilir (CSS ile büyütülür), gürültü bir kez hesaplanır,
 *    kare hızı sınırlıdır; sekme gizliyken durur, "hareketi azalt" / zayıf cihaz / veri tasarrufunda tek kare çizilir.
 */
import { useEffect, useRef } from 'react';
import { prefersLightEffects } from '@/lib/device';

type RGB = [number, number, number];

export type SilkBackgroundProps = {
  /** Zemin rengi (ipeğin en açık tonu) */
  base?: RGB;
  /** En koyu kıvrımda zeminden çıkarılacak miktar (her kanal için) */
  shade?: RGB;
  /** Akış hızı (1 = orijinal hız) */
  speed?: number;
  /** Desen ölçeği */
  scale?: number;
  /** Gren yoğunluğu */
  noiseIntensity?: number;
  /** Canvas'ın piksel bölücüsü: 4 = ekranın 1/4 çözünürlüğü */
  downscale?: number;
  /** Saniyedeki en fazla kare */
  fps?: number;
  className?: string;
};

const TIME_STEP = 2; // çizilen her karede ilerleyen zaman (orijinal: 1 / kare @60fps)
const PATTERN_SPEED = 0.02;

export function SilkBackground({
  base = [246, 246, 244],
  shade = [24, 23, 22],
  speed = 0.5,
  scale = 2,
  noiseIntensity = 0.8,
  downscale = 4,
  fps = 15,
  className,
}: SilkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let image: ImageData;
    let grain: Float32Array;
    let colWave: Float32Array;
    let time = 0;
    let raf = 0;
    let last = 0;
    let resizeTimer = 0;

    // Basit gürültü (orijinaldeki fonksiyon)
    const noise = (x: number, y: number) => {
      const G = 2.71828;
      const rx = G * Math.sin(G * x);
      const ry = G * Math.sin(G * y);
      return (rx * ry * (1 + x)) % 1;
    };

    const setup = () => {
      width = Math.max(8, Math.ceil(window.innerWidth / downscale));
      height = Math.max(8, Math.ceil(window.innerHeight / downscale));
      canvas.width = width;
      canvas.height = height;
      image = ctx.createImageData(width, height);
      // gürültü zamanla değişmez: bir kez hesaplanır
      grain = new Float32Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) grain[y * width + x] = (noise(x, y) / 15) * noiseIntensity;
      }
      colWave = new Float32Array(width);
    };

    const draw = () => {
      const data = image.data;
      const tOffset = PATTERN_SPEED * speed * 2 * time;
      // sütuna bağlı dalga: kare başına bir kez
      for (let x = 0; x < width; x++) colWave[x] = 0.03 * Math.sin(8 * ((x / width) * scale) - tOffset);

      for (let y = 0; y < height; y++) {
        const v = (y / height) * scale;
        for (let x = 0; x < width; x++) {
          const u = (x / width) * scale;
          const ty = v + colWave[x];
          const pattern =
            0.6 +
            0.4 *
              Math.sin(
                5 * (u + ty + Math.cos(3 * u + 5 * ty) + 0.02 * tOffset) +
                  Math.sin(20 * (u + ty - 0.1 * tOffset)),
              );
          const intensity = Math.max(0, pattern - grain[y * width + x]);
          const dark = 1 - Math.min(1, intensity);
          const i = (y * width + x) * 4;
          data[i] = base[0] - dark * shade[0];
          data[i + 1] = base[1] - dark * shade[1];
          data[i + 2] = base[2] - dark * shade[2];
          data[i + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
    };

    const frameGap = 1000 / fps;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < frameGap) return;
      last = now;
      time += TIME_STEP;
      draw();
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reduced.matches || prefersLightEffects() || document.hidden) {
        // hareket azaltma / zayıf cihaz: tek, durağan kare
        if (reduced.matches || prefersLightEffects()) draw();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setup();
        draw();
      }, 150);
    };

    setup();
    draw();
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', start);
    reduced.addEventListener('change', start);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', start);
      reduced.removeEventListener('change', start);
    };
  }, [base, shade, speed, scale, noiseIntensity, downscale, fps]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className ?? 'absolute inset-0 size-full'} />;
}

/** Orijinal dışa aktarım adı (registry uyumluluğu için) */
export const Component = SilkBackground;
export default SilkBackground;
