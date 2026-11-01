/**
 * effeyc — Cloudflare Pages "gelişmiş mod" çalışanı (_worker.js)
 *
 * Yalnızca /api/* istekleri buraya gelir (bkz. _routes.json); statik dosyaları Pages doğrudan sunar.
 * Dağıtımda bu dosya olduğu gibi (derleme gerektirmeden) çalışır; hem Git bağlantısı hem de
 * sürükle-bırak (doğrudan yükleme) yöntemiyle uyumludur.
 *
 * POST /api/contact  →  iletişim formu mesajını e-posta olarak iletir (Resend API).
 *
 * Gerekli ayarlar (Cloudflare Pages → Settings → Variables and Secrets; üçü de "Encrypt/Secret" olsun):
 *   RESEND_API_KEY  Resend API anahtarı (https://resend.com)
 *   CONTACT_TO      Mesajların gideceği adres; birden fazlaysa virgülle ayır
 *   CONTACT_FROM    Gönderen, Resend'de doğrulanmış alan adından. Örn: effeyc <iletisim@alanadiniz.com>
 * İsteğe bağlı:
 *   ALLOWED_ORIGINS Virgülle ayrılmış ek origin'ler (ör. https://www.alanadiniz.com). Kendi origin'i her zaman geçerlidir.
 *   RESEND_API_URL  Yalnızca test için (varsayılan: https://api.resend.com/emails)
 *
 * Savunma katmanları: yalnızca aynı origin, JSON gövde ve boyut sınırı, alan doğrulama, bal küpü (honeypot) alanı,
 * çok hızlı gönderim kontrolü ve başlık enjeksiyonuna karşı temizleme. Ek koruma için Cloudflare'de /api/contact
 * için bir Rate Limiting kuralı ve Turnstile eklenebilir (README'de anlatılır).
 */

const MAX_BODY_BYTES = 8 * 1024;
const MIN_FILL_MS = 1200;
const LIMITS = { name: { min: 2, max: 120 }, email: { max: 254 }, message: { min: 10, max: 4000 } };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DEFAULT_RESEND_URL = "https://api.resend.com/emails";

/** JSON yanıt üretir (önbelleğe alınmaz). */
function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

/** Başlık enjeksiyonunu önlemek için satır sonlarını ve kontrol karakterlerini temizler. */
function cleanLine(value, max = 200) {
  return String(value ?? "")
    // kontrol karakterlerini bilerek eşleştiriyoruz (başlık enjeksiyonu önlemi)
    // oxlint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Form verisini doğrular. { ok: true, value } ya da { ok: false, fields } döner. */
function validate(input) {
  const data = input && typeof input === "object" ? input : {};
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";
  const fields = {};

  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    fields.name = `Lütfen adınızı girin (${LIMITS.name.min}–${LIMITS.name.max} karakter).`;
  }
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email.max) {
    fields.email = "Geçerli bir e-posta adresi girin (ör. ad@ornek.com).";
  }
  if (message.length < LIMITS.message.min || message.length > LIMITS.message.max) {
    fields.message = `Mesajınız ${LIMITS.message.min}–${LIMITS.message.max} karakter arasında olmalı.`;
  }
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, value: { name, email, message } };
}

/** İstek yalnızca izin verilen origin'lerden gelebilir (tarayıcılar POST'ta Origin başlığını gönderir). */
function isAllowedOrigin(request, env) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([new URL(request.url).origin]);
  for (const extra of String(env?.ALLOWED_ORIGINS ?? "").split(",")) {
    const o = extra.trim().replace(/\/+$/, "");
    if (o) allowed.add(o);
  }
  return allowed.has(origin);
}

/** Mesajı Resend üzerinden e-posta olarak gönderir. */
async function deliver({ name, email, message }, env, fetchImpl) {
  const recipients = String(env.CONTACT_TO)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const payload = {
    from: env.CONTACT_FROM,
    to: recipients,
    reply_to: email,
    subject: `[effeyc] ${cleanLine(name, 80)} — yeni mesaj`,
    text: [`Ad: ${cleanLine(name, 120)}`, `E-posta: ${email}`, "", message, "", `— effeyc iletişim formu · ${new Date().toISOString()}`].join("\n"),
  };
  const res = await fetchImpl(env.RESEND_API_URL || DEFAULT_RESEND_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    console.error(`[contact] Resend yanıtı ${res.status}: ${detail}`);
    throw new Error(`resend_${res.status}`);
  }
}

/** POST /api/contact */
async function handleContact(request, env, fetchImpl = fetch) {
  if (request.method !== "POST") return json(405, { error: "method_not_allowed", message: "Yalnızca POST desteklenir." }, { allow: "POST" });
  if (!isAllowedOrigin(request, env)) return json(403, { error: "forbidden_origin", message: "İstek bu adresten kabul edilmiyor." });
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    return json(415, { error: "unsupported_media_type", message: "İçerik türü application/json olmalı." });
  }
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) return json(413, { error: "too_large", message: "Mesaj çok büyük." });

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json(400, { error: "bad_request", message: "İstek okunamadı." });
  }
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: "too_large", message: "Mesaj çok büyük." });

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "bad_json", message: "Geçersiz JSON." });
  }

  // Bal küpü: insanlar görmez, botlar doldurur. Bota başarılı gibi yanıt verip hiçbir şey göndermeyiz.
  if (typeof body?.website === "string" && body.website.trim() !== "") return json(200, { ok: true });
  // Sayfa açıldıktan çok kısa süre sonra gelen gönderimler büyük olasılıkla bottur.
  if (Number.isFinite(body?.elapsed) && body.elapsed < MIN_FILL_MS) {
    return json(429, { error: "too_fast", message: "Lütfen formu doldurup birkaç saniye sonra tekrar gönderin." });
  }

  const checked = validate(body);
  if (!checked.ok) return json(400, { error: "validation", message: "Lütfen alanları kontrol edin.", fields: checked.fields });

  if (!env?.RESEND_API_KEY || !env?.CONTACT_TO || !env?.CONTACT_FROM) {
    return json(503, { error: "not_configured", message: "Mesaj servisi henüz yapılandırılmadı." });
  }

  try {
    await deliver(checked.value, env, fetchImpl);
  } catch (error) {
    console.error("[contact] teslim hatası:", error instanceof Error ? error.message : error);
    return json(502, { error: "delivery_failed", message: "Mesajınız şu anda gönderilemedi. Lütfen daha sonra tekrar deneyin." });
  }
  return json(200, { ok: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/contact") return handleContact(request, env);
    // _routes.json yalnızca /api/* isteklerini buraya yönlendirir; yine de güvenli bir geri dönüş bırakıyoruz.
    if (env?.ASSETS && !pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    return json(404, { error: "not_found", message: "Bulunamadı." });
  },
};
