/** AppIcon — veri dosyasındaki ikon adını (string) güvenle render eder. */
import { createElement } from "react";
import { appIcons, FALLBACK_ICON } from "./app-icons";

export function AppIcon({ name, className }: { name: string; className?: string }) {
  return createElement(appIcons[name] ?? FALLBACK_ICON, { className, "aria-hidden": true });
}
