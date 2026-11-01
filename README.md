# effeyc — Uygulamalar Portfolyosu

> Zaman, kaybedilen bir hazinedir.

Günlük hayatı kolaylaştıran uygulamaların vitrin sitesi. Koyu ana tema (açık ve loş tema seçilebilir), Liquid Glass tasarım dili,
kategori klasörleri, Liquid Navbar ve Liquid Metal butonlar. **Cloudflare Pages** üzerinde yayınlanmak üzere hazırlanmıştır.

**Teknolojiler:** Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui yapısı · `@paper-design/shaders` ·
Radix Dialog · Cloudflare Pages (+ `_worker.js` ile iletişim servisi)

---

## 1. Yerel geliştirme

```bash
npm install
npm run dev          # geliştirme sunucusu → http://localhost:5173
npm run lint         # oxlint
npm test             # iletişim servisi birim testleri (Node yerleşik test koşucusu)
npm run build        # üretim derlemesi → dist/
```

Node 22 gerekir (`.node-version`).

İletişim servisini yerelde **gerçek Cloudflare çalışma zamanıyla** denemek için:

```bash
cp .dev.vars.example .dev.vars     # içini doldur (git'e eklenmez)
npm run build
npm run pages:dev                  # http://localhost:8788  (wrangler ilk çalıştırmada otomatik indirilir)
```

---

## 2. Cloudflare Pages'e yayın

Proje; `public/_headers` (güvenlik + önbellek), `public/_routes.json`, `public/404.html`, `public/_worker.js` (iletişim API'si)
ve `wrangler.toml` ile **hazır**. İki yoldan biriyle yayınlayabilirsin.

### Yol A — GitHub'a bağla (önerilen: her `git push` otomatik yayınlanır)

1. Projeyi bir GitHub deposuna gönder:
   ```bash
   git init && git add . && git commit -m "effeyc: ilk sürüm"
   git branch -M main
   git remote add origin https://github.com/KULLANICI/effeyc.git
   git push -u origin main
   ```
2. Cloudflare panosu → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → depoyu seç.
3. Derleme ayarları:

   | Alan | Değer |
   |---|---|
   | Framework preset | Vite (ya da None) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | *(boş)* |

4. **Settings → Variables and Secrets** bölümüne ekle:

   | Ad | Tür | Açıklama |
   |---|---|---|
   | `SITE_URL` | Variable (build) | Yayın adresin, ör. `https://effeyc.com` (canonical, paylaşım görseli, sitemap için) |
   | `RESEND_API_KEY` | **Secret** | İletişim formu için e-posta servisi anahtarı (aşağıya bak) |
   | `CONTACT_TO` | **Secret** | Mesajların gideceği e-posta adresin |
   | `CONTACT_FROM` | **Secret** | Gönderen, ör. `effeyc <iletisim@alanadin.com>` |

   Değişkenleri ekledikten sonra **Deployments → Retry deployment** ile yeniden yayınla.
5. **Custom domains** bölümünden alan adını bağla (SSL otomatik).

### Yol B — Doğrudan yükleme (GitHub gerekmez)

```bash
npm run deploy      # build alır ve `wrangler pages deploy dist` çalıştırır (wrangler otomatik indirilir; ilk seferde tarayıcıda Cloudflare girişi ve proje oluşturma onayı ister)
```

`SITE_URL` derleme sırasında okunur; yayın adresini vererek derle (verilmezse canonical/sitemap/paylaşım görseli üretilmez ve derleme uyarı yazar):

```bash
SITE_URL=https://effeyc.pages.dev npm run deploy                 # macOS / Linux / Git Bash
```
```powershell
$env:SITE_URL="https://effeyc.pages.dev"; npm run deploy         # Windows PowerShell
```

Ya da panodan: **Workers & Pages → Create → Pages → Upload assets** ile `dist` klasörünü (ya da hazır zip'i) sürükleyip bırak.
Bu yöntem siteyi hızlıca görmek için uygundur. İletişim servisi (`_worker.js`) yüklenmediyse `/api/contact` adresi 404 verir;
bu durumda `npm run deploy` (Wrangler) yöntemini ya da Yol A'yı kullan — ikisinde de `_worker.js` her zaman dahil edilir.
(Secret'ları yine panodan ekle.)

### Yayından sonra kontrol listesi
- [ ] Ana sayfa açılıyor, tema seçici çalışıyor, klasörler açılıyor
- [ ] İletişim formundan kendine bir test mesajı gönder (e-postana düşmeli)
- [ ] `https://alanadin.com/robots.txt` ve `/sitemap.xml` açılıyor
- [ ] Paylaşım önizlemesi: bağlantıyı WhatsApp/LinkedIn'e yapıştırıp görsele bak
- [ ] **Web Analytics** (ücretsiz, çerezsiz): Pages projesi → **Metrics → Web Analytics → Enable**. CSP buna zaten izin verir.

---

## 2b. GitHub Pages'e yayın (ücretsiz alternatif)

Bazı internet sağlayıcıları `pages.dev` adreslerini engelliyor. `github.io` adresleri genelde erişilebilir olduğu için
proje GitHub Pages'e de yayınlanabilir. **Sunucu kodu çalışmadığından iletişim formu bu sürümde gösterilmez**;
yerine doğrudan iletişim kanalları (GitHub, LinkedIn) sunulur. Geri kalan her şey aynı çalışır.

1. GitHub'da yeni bir **public** depo aç:
   - `KULLANICI.github.io` → site `https://KULLANICI.github.io/` adresinde (önerilen)
   - başka bir ad, ör. `effeyc` → site `https://KULLANICI.github.io/effeyc/` adresinde
2. Projeyi gönder:
   ```bash
   git init && git add . && git commit -m "effeyc: ilk sürüm"
   git branch -M main
   git remote add origin https://github.com/KULLANICI/DEPO.git
   git push -u origin main
   ```
3. Depo → **Settings → Pages → Source**: **GitHub Actions** seç.
4. `.github/workflows/pages.yml` çalışır; adresi ve `base` yolunu depo adından kendisi belirler. Birkaç dakika içinde site yayında.

Sonraki her `git push` siteyi günceller. Yerelde aynı çıktıyı almak için: `npm run build:github`.

Cloudflare ve GitHub Pages iş akışları birbirinden bağımsızdır; ikisi aynı anda açık kalabilir.

---

## 3. İletişim formu (gerçek e-posta)

Form, `POST /api/contact` adresine gider; `public/_worker.js` mesajı [Resend](https://resend.com) ile e-postana iletir.

**Kurulum (≈5 dakika):**
1. resend.com'da ücretsiz hesap aç → **Domains** bölümünde alan adını ekle ve DNS kayıtlarını doğrula
   (Cloudflare'de alan adın varsa kayıtlar tek tıkla eklenir).
2. **API Keys** → yeni anahtar oluştur → `RESEND_API_KEY` secret'ı olarak Cloudflare'e ekle.
3. `CONTACT_FROM` = doğruladığın alan adından bir adres (`effeyc <iletisim@alanadin.com>`), `CONTACT_TO` = mesajları okuyacağın adres.

Servis yapılandırılmamışsa form kullanıcıya nazik bir hata gösterir (ve `src/config/site.ts` içinde `email` tanımlıysa e-posta bağlantısı sunar).

**Korumalar:** yalnızca aynı origin · JSON ve boyut sınırı (8 KB) · alan doğrulama · gizli bal küpü (honeypot) alanı ·
çok hızlı gönderim kontrolü · başlık enjeksiyonu temizliği. Spam artarsa: Cloudflare panosunda **Security → WAF → Rate limiting**
ile `/api/contact` için bir kural ekle (ücretsiz planda 1 kural) ve/veya Turnstile ekle.

---

## 4. İçeriği düzenleme

| Ne | Nerede |
|---|---|
| Marka adı, sosyal bağlantılar, sitede görünen e-posta, hero istatistikleri | `src/config/site.ts` (boş bırakılan bağlantı/e-posta gösterilmez) |
| Uygulamalar (ad, açıklama, amaç, yaklaşım, teknolojiler, canlı link, görseller) | `src/data/apps.ts` |
| Uygulama görselleri | `public/apps/<id>/` → `cover.webp` (klasör kapağı, 816×552) ve `1.webp`, `2.webp`… (galeri) |
| Hero sözü | `src/components/sections/Hero.tsx` |
| Hakkımda metni ve iş akışı adımları | `src/components/sections/HowItWorks.tsx` |
| Renkler / temalar | `src/index.css` → `:root`, `[data-theme="dark"]`, `[data-theme="dim"]` |

**Yeni uygulama eklemek:** `apps.ts`'e bir obje ekle (mevcut olanlara bak), görsellerini `public/apps/<id>/` altına koy.
Boş kategoriler klasör olarak gösterilmez. Canlı adres yoksa `url: "#"` bırak ("Canlı link yakında" görünür).

**Dijital Kartvizit demosu:** `public/demos/kartvizit/` (bağımsız sayfa, `/demos/kartvizit/`). Kişisel iletişim bilgisi içermez; arama motorlarına kapalıdır.

---

## 5. Güvenlik ve performans notları

- Katı bir **Content-Security-Policy** uygulanır (`default-src 'self'`): Cloudflare'de `public/_headers` ile, her derlemede ayrıca
  `<meta http-equiv>` etiketiyle (başlık gönderemeyen GitHub Pages için). Siteye **yeni bir üçüncü taraf kaynak**
  (harici betik, font, görsel, iframe) eklersen önce oradaki CSP'ye izin ekle; yoksa tarayıcı engeller.
- Yazı tipleri (Inter, Poppins — SIL OFL) `src/assets/fonts` içinde, kendi sunucundan sunulur: Google'a istek yok, gizlilik dostu.
- Vite çıktısı hash'li dosya adları kullanır; `/assets/*` bir yıl önbellekte kalır. `/apps/*` görselleri 1 gün önbelleğe alınır.
- Zayıf cihazlarda / "Veri tasarrufu" açıkken WebGL metal butonlar ve silk animasyonu devre dışı kalır (`src/lib/device.ts`).
- Sıvı logo animasyonunun kodu ilk hover'a kadar yüklenmez; detay penceresi ilk ihtiyaçta yüklenir.
- Tema seçimi `localStorage`'da (`effeyc-theme`) saklanır ve sayfa çizilmeden önce uygulanır (`public/theme-init.js`).

---

## 6. Bileşenler

Üçüncü taraf bileşenler (kaynak dosyaları olduğu gibi korunur; yapılan küçük değişiklikler dosya başında yazılıdır):
`liquid-glass-navbar`, `liquid-metal-button` (Ek-A'dan uyarlandı), `glass-folder-cards`, `apple-liquid-glass-switcher`
(yer değiştirme haritası `public/switcher-map.png`), `silk-background-animation`, `liquid-sculpture-hero` (motor).

**Liquid Metal Button** (`src/components/ui/liquid-metal-button.tsx`):

| Prop | Açıklama |
|---|---|
| `label`, `viewMode` (`text` \| `icon`) | etiket / yalnızca ikon |
| `width`, `size` (`md` \| `lg`) | genişlik verilmezse etikete göre otomatik (min 142px) |
| `href` | verilirse `<a>` olur; `http…` linkler yeni sekmede açılır |
| `type`, `disabled`, `onClick`, `ariaLabel`, `className`, `labelColor`, `icon` | |
| `variant` (`chrome` \| `accent`) | gümüş krom veya turuncu tonlu metal |

---

## 7. Klasör yapısı

```
public/
  _headers  _routes.json  _worker.js  404.html     # Cloudflare Pages dosyaları
  manifest.webmanifest  icons/  favicon.*          # PWA ve ikonlar
  apps/<id>/                                       # uygulama görselleri (WebP)
  demos/kartvizit/                                 # kartvizit demosu
src/
  config/site.ts   data/apps.ts   index.css
  components/{ui,layout,sections}/
  hooks/   lib/
tests/worker.test.mjs                              # iletişim servisi testleri
wrangler.toml  .dev.vars.example  .node-version
.github/workflows/{ci,deploy}.yml
```
