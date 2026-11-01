/**
 * apps.ts içindeki `icon` alanını (string) lucide-react bileşenine eşler.
 * Tüm ikon kütüphanesini paketlememek için yalnızca kullanılanlar burada listelenir.
 */
import {
  Bot, BookOpen, CalendarCheck, ClipboardList, FileText, HeartPulse, type LucideIcon, Utensils, Wallet,
} from "lucide-react";

export const appIcons: Record<string, LucideIcon> = {
  Bot, BookOpen, CalendarCheck, ClipboardList, FileText, HeartPulse, Utensils, Wallet,
};

/** Bilinmeyen ikon adında varsayılan olarak Bot ikonu kullanılır */
export const FALLBACK_ICON = Bot;
