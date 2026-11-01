import { type RefObject, useEffect, useState } from "react";

type Options = {
  rootMargin?: string;
  threshold?: number;
  /** true ise bir kez görünür olduktan sonra gözlemi bırakır (scroll reveal için) */
  once?: boolean;
};

/**
 * Bir elemanın görünür alanda olup olmadığını izler.
 * Scroll reveal ve "yalnızca görünürken shader çalıştır" için kullanılır.
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { rootMargin = "0px", threshold = 0, once = false }: Options = {},
): boolean {
  // IntersectionObserver yoksa (çok eski tarayıcı) her şeyi görünür kabul et
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold, once]);

  return inView;
}
