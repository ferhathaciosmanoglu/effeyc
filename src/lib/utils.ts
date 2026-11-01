import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind sınıflarını çakışmasız birleştirir (shadcn standardı). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
