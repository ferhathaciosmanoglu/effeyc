/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * İletişim formunun gönderileceği adres. Varsayılan: "/api/contact" (Cloudflare Pages çalışanı).
   * Boş bırakılırsa (GitHub Pages gibi sunucu kodu çalıştıramayan barındırmalarda) form yerine
   * doğrudan iletişim kanalları gösterilir.
   */
  readonly VITE_CONTACT_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
