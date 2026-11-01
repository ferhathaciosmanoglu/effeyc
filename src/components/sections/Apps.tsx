/**
 * Apps — "Uygulamalarım": her kategori bir cam klasör; klasörü açınca uygulamaların
 * ekran görüntüleri dosya gibi yelpaze olur, birine tıklayınca detay penceresi açılır.
 * Veri src/data/apps.ts dosyasından gelir (boş kategoriler gösterilmez).
 */
import { lazy, Suspense, useMemo, useState } from "react";
import GlassFolder, { type ArtPreset } from "@/components/ui/glass-folder-cards";
import { Reveal } from "@/components/ui/reveal";
import { type AppItem, apps, categories, type Category } from "@/data/apps";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTheme } from "@/hooks/useTheme";

// Detay penceresi (Radix Dialog dahil) ilk ihtiyaçta ayrı parça olarak yüklenir; klasör açılınca önceden ısıtılır.
const loadModal = () => import("./AppModal");
const AppModal = lazy(() => loadModal().then((m) => ({ default: m.AppModal })));

// Her klasörün arka panelindeki üretken sanat (renk paleti)
const FOLDER_ART: Record<Category, { art: ArtPreset; seed: number }> = {
  "İş": { art: "aurora", seed: 3 },
  "Finans": { art: "ember", seed: 11 },
  "Üretkenlik": { art: "glacier", seed: 5 },
  "Sağlık": { art: "verdant", seed: 7 },
  "Eğitim": { art: "dusk", seed: 2 },
  "Günlük Yaşam": { art: "dusk", seed: 9 },
};
const STAGGER_MS = 120;

export function Apps() {
  const [selected, setSelected] = useState<AppItem | null>(null);
  const [modalMounted, setModalMounted] = useState(false);
  const [theme] = useTheme();
  const narrow = useMediaQuery("(max-width: 400px)");
  const width = narrow ? 296 : 340;

  const groups = useMemo(
    () => categories.map((c) => ({ category: c, items: apps.filter((a) => a.category === c) })).filter((g) => g.items.length > 0),
    [],
  );

  return (
    <section id="uygulamalarim" aria-labelledby="apps-title" className="relative px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="flex flex-col gap-4">
          <span className="eyebrow">
            <span className="h-px w-8 bg-[image:var(--gradient-orange)]" aria-hidden="true" /> Uygulamalarım
          </span>
          <h2 id="apps-title" className="text-section max-w-2xl font-semibold text-fg">
            Her gün işinize yarayacak akıllı araçlar.
          </h2>
          <p className="max-w-2xl text-muted">
            Kategoriye göre klasörlere ayrıldı. Bir klasöre tıklayın, uygulamaların ekran görüntüleri dosyalar gibi açılsın.
          </p>
        </Reveal>

        <ul className="mt-14 grid list-none justify-items-center gap-x-10 gap-y-24 p-0 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => {
            const { art, seed } = FOLDER_ART[g.category];
            return (
              <li key={g.category}>
                <GlassFolder
                  label={g.category}
                  meta={`${g.items.length} uygulama`}
                  tone={theme === "light" ? "light" : "dark"}
                  art={art}
                  seed={seed}
                  action="none"
                  width={width}
                  appearDelay={(i % 3) * STAGGER_MS}
                  files={g.items.map((a) => ({ name: a.name, meta: a.tech[0], image: a.cover }))}
                  onOpenChange={(open) => {
                    if (open) void loadModal();
                  }}
                  onFileSelect={(_, index) => {
                    setModalMounted(true);
                    setSelected(g.items[index] ?? null);
                  }}
                />
              </li>
            );
          })}
        </ul>

        <p className="mt-16 text-center font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          Üzerine gelin · Tıklayıp açın · Dosyaya dokunun
        </p>
      </div>

      {modalMounted ? (
        <Suspense fallback={null}>
          <AppModal app={selected} onClose={() => setSelected(null)} />
        </Suspense>
      ) : null}
    </section>
  );
}
