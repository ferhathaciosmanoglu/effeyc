/**
 * Site genel ayarları — marka, iletişim ve sosyal bağlantılar.
 * Boş ("") bırakılan bağlantılar/e-posta sitede hiç gösterilmez.
 */
export const site = {
  /** Marka / site adı */
  brand: "effeyc",
  /** Markanın altındaki kısa slogan (boşsa gösterilmez) */
  tagline: "",
  /**
   * Sitede görünen iletişim e-postası. Boşsa gösterilmez (iletişim formu yeterlidir).
   * Mesajların GİDECEĞİ adres burada değil, Cloudflare'de gizli CONTACT_TO değişkenindedir (README'ye bak).
   */
  email: "",
  /** Sosyal medya bağlantıları (boşsa gösterilmez) */
  socials: {
    github: "https://github.com/ferhathaciosmanoglu",
    linkedin: "https://www.linkedin.com/in/ferhat-haciosmano%C4%9Flu-7a889a1bb/",
    x: "",
  },
  /** Hero altındaki güven bandı */
  stats: [
    { value: "10", label: "uygulama" },
    { value: "5", label: "kategori" },
    { value: "PWA", label: "mobilde uygulama gibi" },
  ],
} as const;

/** Menüde ve sayfada kullanılan bölümler (id = anchor) */
export const sections = [
  { id: "ana-sayfa", label: "Ana Sayfa" },
  { id: "uygulamalarim", label: "Uygulamalarım" },
  { id: "hakkimda", label: "Hakkımda" },
  { id: "iletisim", label: "İletişim" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

/** Ortak sabitler (magic number yerine) */
export const UI = {
  /** Header'ın "kaydırıldı" durumuna geçtiği eşik (px) */
  headerScrollThreshold: 24,
  /** "Yukarı çık" butonunun belirdiği eşik (px) */
  backToTopThreshold: 600,
  /** Metal butonların shader'ını önceden başlatma payı */
  shaderRootMargin: "120px",
} as const;
