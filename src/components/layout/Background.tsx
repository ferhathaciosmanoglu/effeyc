/**
 * Background — sabit arka plan: animasyonlu silk (ipek) dokusu, çok hafif turuncu ışıma ve grain.
 * Silk renkleri seçili temaya göre değişir. Cam paneller bu katmanı bulanıklaştırarak "cam" görünür.
 */
import { SilkBackground } from "@/components/ui/silk-background-animation";
import { useTheme } from "@/hooks/useTheme";

type RGB = [number, number, number];
// Sabit referanslar: silk efekti bu dizilere bağlı olduğundan her render'da yeniden oluşturulmamalı
const SILK: Record<"light" | "dark" | "dim", { base: RGB; shade: RGB }> = {
  light: { base: [246, 246, 244], shade: [24, 23, 22] },
  dark: { base: [30, 30, 36], shade: [24, 24, 29] },
  dim: { base: [52, 56, 68], shade: [30, 33, 42] },
};

export function Background() {
  const [theme] = useTheme();
  const silk = SILK[theme];
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg transition-colors duration-500">
      <SilkBackground base={silk.base} shade={silk.shade} />
      {/* turuncu yalnızca çok hafif bir ışıma olarak */}
      <div
        className="absolute -top-[14vh] -left-[10vw] size-[55vw] max-h-[720px] max-w-[720px] rounded-full opacity-25 blur-[90px]"
        style={{ background: "radial-gradient(circle, #ffb26b 0%, #ffd9b8 45%, transparent 70%)" }}
      />
      <div className="grain" />
    </div>
  );
}
