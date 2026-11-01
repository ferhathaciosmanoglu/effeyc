import fs from "node:fs/promises";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";

const SITE_NAME = "effeyc";
const SITE_DESCRIPTION = "Zaman, kaybedilen bir hazinedir. Günlük hayatı kolaylaştıran akıllı uygulamalar.";

/**
 * Yayın hedefi. "github" → GitHub Pages (statik): sunucu kodu ve başlık dosyaları çıktıdan atılır,
 * CSP <meta> ile uygulanır, Jekyll devre dışı bırakılır. Boş/diğer → Cloudflare Pages.
 */
const TARGET = (process.env.DEPLOY_TARGET ?? "").trim().toLowerCase();
const IS_GITHUB = TARGET === "github";

/** Cloudflare'e özgü dosyalar: GitHub Pages'te işe yaramaz, çıktıdan silinir. */
const CLOUDFLARE_ONLY = ["_worker.js", "_headers", "_routes.json"];

/** Katı içerik güvenliği politikası. frame-ancestors yalnızca HTTP başlığında geçerli olduğu için <meta>'ya konmaz. */
function cspMeta(): string {
  const cfScript = IS_GITHUB ? "" : " https://static.cloudflareinsights.com";
  const cfConnect = IS_GITHUB ? "" : " https://cloudflareinsights.com";
  return [
    "default-src 'self'",
    `script-src 'self'${cfScript}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self'",
    `connect-src 'self'${cfConnect}`,
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Yayın adresi (SITE_URL ortam değişkeni, ör. https://effeyc.com) verilirse:
 *  - canonical, og:url ve MUTLAK og:image / twitter:image adreslerini (sosyal medya önizlemeleri bunu ister),
 *  - JSON-LD (schema.org WebSite) verisini,
 *  - sitemap.xml dosyasını
 * üretir. robots.txt her zaman üretilir. SITE_URL yoksa build uyarı verir ve bu öğeler atlanır.
 * Cloudflare Pages'te: Settings → Variables and Secrets → SITE_URL.
 * GitHub Pages'te: .github/workflows/pages.yml içindeki SITE_URL.
 */
function siteMeta(): Plugin {
  const raw = (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");
  const site = /^https?:\/\/[^\s]+$/.test(raw) ? raw : "";
  let isBuild = false;
  let base = "/";
  let outDir = "dist";

  return {
    name: "site-meta",
    configResolved(config) {
      isBuild = config.command === "build";
      base = config.base;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    buildStart() {
      if (isBuild && !site) {
        this.warn(
          "SITE_URL tanımlı değil: canonical, mutlak og:image ve sitemap.xml üretilmeyecek. Örnek: SITE_URL=https://effeyc.com npm run build",
        );
      }
    },
    transformIndexHtml(_html, ctx) {
      const image = site ? `${site}/og-image.png` : `${base}og-image.png`;
      const tags: HtmlTagDescriptor[] = [
        // Sunucu başlığı ayarlayamayan barındırmalarda (GitHub Pages) CSP'yi sayfa taşır.
        { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: cspMeta() }, injectTo: "head-prepend" },
        { tag: "meta", attrs: { property: "og:image", content: image }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:image:width", content: "1200" }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:image:height", content: "630" }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:image:alt", content: "effeyc — Zaman, kaybedilen bir hazinedir." }, injectTo: "head" },
        { tag: "meta", attrs: { name: "twitter:image", content: image }, injectTo: "head" },
      ];
      // Başlıkta kullanılan Poppins 600 yazı tipini (Türkçe karakterler için latin + latin-ext) önceden yükle
      for (const file of Object.keys(ctx.bundle ?? {})) {
        if (/poppins-latin(-ext)?-600-normal-.+\.woff2$/.test(file)) {
          tags.push({ tag: "link", attrs: { rel: "preload", as: "font", type: "font/woff2", href: `${base}${file}`, crossorigin: true }, injectTo: "head" });
        }
      }
      if (site) {
        tags.push(
          { tag: "link", attrs: { rel: "canonical", href: `${site}/` }, injectTo: "head" },
          { tag: "meta", attrs: { property: "og:url", content: `${site}/` }, injectTo: "head" },
          {
            tag: "script",
            attrs: { type: "application/ld+json" },
            injectTo: "head",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: `${site}/`,
              description: SITE_DESCRIPTION,
              inLanguage: "tr-TR",
            }),
          },
        );
      }
      return tags;
    },
    generateBundle() {
      const lines = ["User-agent: *", "Allow: /"];
      if (!IS_GITHUB) lines.push("Disallow: /api/");
      if (site) lines.push("", `Sitemap: ${site}/sitemap.xml`);
      this.emitFile({ type: "asset", fileName: "robots.txt", source: lines.join("\n") + "\n" });
      if (site) {
        const today = new Date().toISOString().slice(0, 10);
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
        });
      }
      // GitHub Pages, alt çizgiyle başlayan yolları Jekyll sanıp atlamasın
      if (IS_GITHUB) this.emitFile({ type: "asset", fileName: ".nojekyll", source: "" });
    },
    // public/ içindeki dosyalar bundle'a girmez, doğrudan kopyalanır:
    // Cloudflare'e özgü olanları siliyor, alt dizine yayında kalan kök yolları düzeltiyoruz.
    async closeBundle() {
      if (!isBuild) return;

      if (IS_GITHUB) {
        for (const name of CLOUDFLARE_ONLY) {
          await fs.rm(path.join(outDir, name), { force: true });
        }
        this.info(`GitHub Pages çıktısı: ${CLOUDFLARE_ONLY.join(", ")} kaldırıldı, .nojekyll eklendi.`);
      }

      // Alt dizine yayında (base "/" değilse) public/ dosyalarındaki "/..." yolları base ile yeniden yazılır.
      // index.html'i Vite zaten yeniden yazar; bu dosyalar ona dahil değildir.
      if (base === "/") return;

      // href="/x" ve src="/x" → href="<base>x" (protokole bağlı "//" hariç)
      for (const rel of ["404.html", "demos/kartvizit/index.html"]) {
        const file = path.join(outDir, rel);
        const html = await fs.readFile(file, "utf8").catch(() => null);
        if (html === null) continue;
        await fs.writeFile(file, html.replace(/\b(href|src)="\/(?!\/)/g, `$1="${base}`));
      }

      // manifest: start_url, scope ve ikon yolları
      const manifestPath = path.join(outDir, "manifest.webmanifest");
      const rawManifest = await fs.readFile(manifestPath, "utf8").catch(() => null);
      if (rawManifest !== null) {
        const m = JSON.parse(rawManifest) as {
          start_url?: string;
          scope?: string;
          icons?: { src?: string }[];
        };
        const rebase = (value: string | undefined) => (value?.startsWith("/") ? base + value.slice(1) : value);
        m.start_url = rebase(m.start_url);
        m.scope = rebase(m.scope);
        for (const icon of m.icons ?? []) icon.src = rebase(icon.src);
        await fs.writeFile(manifestPath, `${JSON.stringify(m, null, 2)}\n`);
      }

      this.info(`Alt dizin yayını: public/ dosyalarındaki kök yollar "${base}" ile yeniden yazıldı.`);
    },
  };
}

// base: kök alan adı için "/" (Cloudflare Pages, GitHub kullanıcı sitesi kullaniciadi.github.io).
// Alt dizine yayında (GitHub proje sitesi, ör. .../effeyc/) BASE_PATH=/effeyc/ verilir.
const BASE = (process.env.BASE_PATH ?? "/").trim() || "/";

// İletişim formunun uç noktası derleme sırasında sabitlenir (ortam değişkeni aktarımına bağlı kalmasın diye).
// GitHub Pages'te sunucu kodu çalışmadığı için boş: form yerine iletişim kanalları gösterilir.
const CONTACT_API = IS_GITHUB ? "" : (process.env.VITE_CONTACT_API ?? "/api/contact");

export default defineConfig({
  base: BASE.endsWith("/") ? BASE : `${BASE}/`,
  define: { "import.meta.env.VITE_CONTACT_API": JSON.stringify(CONTACT_API) },
  plugins: [react(), tailwindcss(), siteMeta()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
