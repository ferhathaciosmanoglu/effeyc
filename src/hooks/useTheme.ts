import { useCallback, useSyncExternalStore } from "react";
import type { Theme } from "@/components/ui/apple-liquid-glass-switcher";

const STORAGE_KEY = "effeyc-theme";
const EVENT = "effeyc-theme-change";
const THEMES: readonly Theme[] = ["light", "dark", "dim"];

const isTheme = (v: unknown): v is Theme => typeof v === "string" && (THEMES as readonly string[]).includes(v);

/** index.html'deki küçük betik temayı sayfa çizilmeden önce <html data-theme> olarak yazar. */
function read(): Theme {
  const v = document.documentElement.dataset.theme;
  return isTheme(v) ? v : "dark";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** Site teması (light | dark | dim): <html data-theme> ve localStorage ile senkron. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, read, () => "dark" as Theme);
  const setTheme = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* gizli modda depolama kapalı olabilir */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", t === "light" ? "#f6f6f4" : t === "dim" ? "#1b1d23" : "#0b0b0d");
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [theme, setTheme];
}
