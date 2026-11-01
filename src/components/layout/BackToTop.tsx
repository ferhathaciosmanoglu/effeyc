/** BackToTop — kaydırınca beliren küçük yuvarlak cam "yukarı çık" butonu. */
import { ArrowUp } from "lucide-react";
import { UI } from "@/config/site";
import { useScrolledPast } from "@/hooks/useScrollY";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const visible = useScrolledPast(UI.backToTopThreshold);
  return (
    <a
      href="#ana-sayfa"
      aria-label="Sayfanın başına dön"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "glass-pill fixed right-4 bottom-4 z-30 size-12 !px-0 transition-all duration-500 ease-liquid sm:right-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </a>
  );
}
