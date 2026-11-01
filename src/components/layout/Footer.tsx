/** Footer — sosyal bağlantılar, hızlı menü ve dinamik yıllı telif metni. */
import { sections, site } from "@/config/site";
import { Brand } from "./Brand";
import { SocialLinks } from "./SocialLinks";

// Telif yılı dinamik (sabit "2024" yazılmaz)
const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-[var(--line)] px-5 pt-14 pb-10">
      {/* üst kenarda ince turuncu ışık çizgisi */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-px mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_auto] md:items-start">
        <div className="flex flex-col gap-4">
          <Brand />
          <p className="max-w-sm text-sm text-muted">
            Günlük hayatı kolaylaştıran küçük ama etkili araçlar.
          </p>
        </div>
        <nav aria-label="Hızlı menü">
          <h2 className="mb-3 font-sans text-xs font-semibold tracking-widest text-muted uppercase">Hızlı Menü</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-flex min-h-10 items-center text-sm text-gray-300 transition-colors hover:text-fg">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 font-sans text-xs font-semibold tracking-widest text-muted uppercase">Takip Et</h2>
          <SocialLinks />
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-[var(--line)] pt-6 text-center text-sm text-muted">
        © {YEAR} {site.brand}. Tüm hakları saklıdır.
      </p>
    </footer>
  );
}
