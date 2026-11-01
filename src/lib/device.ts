/**
 * Çok zayıf cihaz (≤2 GB bellek ya da ≤2 çekirdek) veya "Veri tasarrufu" açıksa true döner.
 * Bu durumda ağır görsel efektler (WebGL metal butonlar, silk animasyonu) yerine hafif, durağan görünüm kullanılır.
 * Ölçüm yapılamayan tarayıcılarda (Safari/Firefox bu bilgileri vermez) false döner: efektler açık kalır.
 */
type NavigatorHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

let cached: boolean | undefined;

export function prefersLightEffects(): boolean {
  if (cached !== undefined) return cached;
  if (typeof navigator === "undefined") return false;
  const nav = navigator as NavigatorHints;
  cached = nav.connection?.saveData === true || (nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2;
  return cached;
}
