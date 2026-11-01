/** AppModal — bir uygulamanın ekran görüntüleri, özellikleri ve teknolojileri; erişilebilir liquid glass pencere. */
import { Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import type { AppItem } from "@/data/apps";
import { cn } from "@/lib/utils";
import { AppIcon } from "./AppIcon";

type Props = { app: AppItem | null; onClose: () => void };

export function AppModal({ app, onClose }: Props) {
  const hasLiveUrl = !!app && app.url !== "#";
  const isExternal = !!app && /^https?:\/\//.test(app.url);

  return (
    <Dialog open={app !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        {app && (
          <div className="flex flex-col gap-6">
            <DialogHeader>
              <span className="mb-2 inline-grid size-14 place-items-center rounded-2xl bg-fg text-[var(--bg)] shadow-[0_10px_30px_var(--drop-strong)]">
                <AppIcon name={app.icon} className="size-7" />
              </span>
              <span className="text-xs font-medium tracking-widest text-[color:var(--eyebrow)] uppercase">{app.category}</span>
              <DialogTitle>{app.name}</DialogTitle>
              <DialogDescription>{app.description}</DialogDescription>
            </DialogHeader>

            <Gallery key={app.id} app={app} />

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 font-sans text-sm font-semibold tracking-wide text-fg">Amaç</h3>
                <p className="text-sm leading-relaxed text-gray-300">{app.purpose}</p>
              </div>
              <div>
                <h3 className="mb-2 font-sans text-sm font-semibold tracking-wide text-fg">Yaklaşım</h3>
                <p className="text-sm leading-relaxed text-gray-300">{app.approach}</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 font-sans text-sm font-semibold tracking-wide text-fg">Özellikler</h3>
                <ul className="flex flex-col gap-2">
                  {app.details.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--tint-2)] text-fg">
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-3 font-sans text-sm font-semibold tracking-wide text-fg">Teknolojiler</h3>
                <ul className="flex flex-wrap gap-1.5">
                  {app.tech.map((t) => (
                    <li key={t}>
                      <Badge>{t}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-5">
              <LiquidMetalButton
                label={hasLiveUrl ? "Uygulamayı Dene" : "Canlı link yakında"}
                href={hasLiveUrl ? app.url : undefined}
                disabled={!hasLiveUrl}
                icon={hasLiveUrl && isExternal ? <ExternalLink className="size-4" aria-hidden="true" /> : undefined}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Ekran görüntüsü galerisi (uygulama değişince `key` ile sıfırlanır) */
function Gallery({ app }: { app: AppItem }) {
  const [shot, setShot] = useState(0);
  const current = app.images[shot];
  if (!current) return null;
  return (
    <div>
      <figure className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--tint)]">
        <img src={current.src} alt={`${app.name} — ${current.alt}`} className="mx-auto block max-h-[52svh] w-auto max-w-full object-contain" />
        <figcaption className="border-t border-[var(--line)] px-4 py-2 text-xs text-muted">{current.alt}</figcaption>
      </figure>
      {app.images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Ekran görüntüleri">
          {app.images.map((im, i) => (
            <li key={im.src}>
              <button
                type="button"
                onClick={() => setShot(i)}
                aria-label={`Görsel ${i + 1}: ${im.alt}`}
                aria-current={i === shot ? "true" : undefined}
                className={cn(
                  "block h-16 w-24 overflow-hidden rounded-xl border transition-all",
                  i === shot ? "border-orange-500 opacity-100" : "border-[var(--line)] opacity-60 hover:opacity-100",
                )}
              >
                <img src={im.src} alt="" loading="lazy" className="size-full object-cover object-top" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
