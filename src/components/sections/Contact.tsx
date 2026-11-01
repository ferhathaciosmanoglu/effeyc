/**
 * Contact — iletişim formu ve iletişim kanalları.
 * Form, Cloudflare Pages çalışanına (public/_worker.js → POST /api/contact) gönderilir; çalışan mesajı
 * e-posta ile iletir. Servis kapalıysa/ulaşılamıyorsa kullanıcı bilgilendirilir ve (tanımlıysa) e-posta bağlantısı sunulur.
 *
 * VITE_CONTACT_API boş verilirse (GitHub Pages gibi sunucu kodu çalıştıramayan barındırmalar) form hiç
 * gösterilmez; yerine doğrudan iletişim kanalları sunulur. Böylece hiçbir zaman çalışmayan bir form kalmaz.
 */
import { CheckCircle2, Mail, MessageCircle, TriangleAlert } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { Reveal } from "@/components/ui/reveal";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

type FormData = { name: string; email: string; message: string };
type Errors = Partial<Record<keyof FormData, string>>;
type SubmitResult = { ok: true } | { ok: false; message: string; fields?: Errors };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_MESSAGE = 10;
// Yapılandırılabilir uç nokta: tanımsızsa Cloudflare çalışanı, boş string ise form devre dışı.
const API_URL = (import.meta.env.VITE_CONTACT_API ?? "/api/contact").trim();
const FORM_ENABLED = API_URL !== "";

function validate(d: FormData): Errors {
  const e: Errors = {};
  if (d.name.trim().length < 2) e.name = "Lütfen adınızı girin (en az 2 karakter).";
  if (!EMAIL_RE.test(d.email.trim())) e.email = "Geçerli bir e-posta adresi girin (ör. ad@ornek.com).";
  if (d.message.trim().length < MIN_MESSAGE) e.message = `Mesajınız en az ${MIN_MESSAGE} karakter olmalı.`;
  return e;
}

/** Formu sunucuya gönderir. `website` bal küpü alanıdır (insanlar boş bırakır), `elapsed` formun açık kaldığı süredir. */
async function submitForm(data: FormData, extra: { website: string; elapsed: number }): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, ...extra }),
    });
  } catch {
    return { ok: false, message: "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin." };
  }
  if (res.ok) return { ok: true };

  const body = (await res.json().catch(() => null)) as { message?: string; fields?: Errors } | null;
  if (res.status === 400 && body?.fields) return { ok: false, message: body.message ?? "Lütfen alanları kontrol edin.", fields: body.fields };
  if (res.status === 404 || res.status === 503 || !body) return { ok: false, message: "Mesaj servisi şu anda kullanılamıyor." };
  return { ok: false, message: body.message ?? "Mesajınız gönderilemedi. Lütfen daha sonra tekrar deneyin." };
}

const fieldClass =
  "w-full rounded-2xl border bg-[var(--field-bg)] px-4 py-3 text-base text-fg placeholder:text-gray-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] transition-colors focus:outline-none focus-visible:!shadow-[var(--focus-ring)]";

export function Contact() {
  const [data, setData] = useState<FormData>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [failure, setFailure] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  // Form ne zamandan beri açık: çok kısa sürede gelen gönderimler sunucuda bot sayılır
  const [openedAt] = useState(() => Date.now());

  const update = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData((d) => ({ ...d, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    setFailure(null);
    const found = validate(data);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as (keyof FormData)[])[0];
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }
    setStatus("sending");
    const result = await submitForm(data, { website: honeypot, elapsed: Date.now() - openedAt });
    if (result.ok) {
      setStatus("sent");
      setData({ name: "", email: "", message: "" });
      return;
    }
    // hata: yazılan metin kaybolmasın
    setStatus("idle");
    if (result.fields) setErrors(result.fields);
    setFailure(result.message);
  };

  const field = (key: keyof FormData, label: string, input: React.ReactNode) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={`contact-${key}`} className="text-sm font-medium text-gray-300">
        {label}
      </label>
      {input}
      <p id={`contact-${key}-error`} className="min-h-5 text-sm text-[color:var(--eyebrow)]" aria-live="polite">
        {errors[key] ?? ""}
      </p>
    </div>
  );

  const aria = (key: keyof FormData) => ({
    id: `contact-${key}`,
    name: key,
    value: data[key],
    onChange: update(key),
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `contact-${key}-error` : undefined,
    className: cn(fieldClass, errors[key] ? "border-orange-400/70" : "border-[var(--line)] focus:border-orange-500/60"),
  });

  return (
    <section id="iletisim" aria-labelledby="contact-title" className="relative px-5 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <Reveal className="flex flex-col gap-5">
          <span className="eyebrow">
            <span className="h-px w-8 bg-[image:var(--gradient-orange)]" aria-hidden="true" /> İletişim
          </span>
          <h2 id="contact-title" className="text-section font-semibold text-fg">
            Bir fikriniz mi var? <span className="text-gradient-orange">Konuşalım.</span>
          </h2>
          <p className="max-w-md text-muted">
            Yeni bir uygulama fikri, iş birliği ya da sadece merhaba demek için yazın. Genellikle 24 saat içinde dönüş yapıyorum.
          </p>
          {site.email ? (
            <a href={`mailto:${site.email}`} className="glass-pill mt-2 w-fit !justify-start">
              <Mail className="size-4 text-fg" aria-hidden="true" />
              {site.email}
            </a>
          ) : null}
          {FORM_ENABLED ? (
            <div className="mt-2">
              <SocialLinks />
            </div>
          ) : null}
        </Reveal>

        <Reveal delay={120}>
          <GlassCard className="p-6 sm:p-8">
            {!FORM_ENABLED ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <MessageCircle className="size-12 text-orange-400" aria-hidden="true" />
                <h3 className="text-2xl font-semibold text-fg">Bağlantı kuralım</h3>
                <p className="max-w-sm text-muted">
                  Aşağıdaki kanallardan bana ulaşabilirsiniz. Mesajınızı genellikle 24 saat içinde yanıtlıyorum.
                </p>
                <div className="mt-2">
                  <SocialLinks />
                </div>
              </div>
            ) : status === "sent" ? (
              <div role="status" className="flex flex-col items-center gap-4 py-10 text-center">
                <CheckCircle2 className="size-12 text-orange-400" aria-hidden="true" />
                <h3 className="text-2xl font-semibold text-fg">Mesajınız alındı!</h3>
                <p className="text-muted">Teşekkürler, en kısa sürede size dönüş yapacağım.</p>
                <button type="button" onClick={() => setStatus("idle")} className="glass-pill mt-2">
                  Yeni mesaj gönder
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} className="flex flex-col gap-2" aria-label="İletişim formu">
                <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                  {field("name", "Adınız", <input type="text" autoComplete="name" placeholder="Adınız Soyadınız" maxLength={120} {...aria("name")} />)}
                  {field("email", "E-posta", <input type="email" autoComplete="email" inputMode="email" placeholder="ad@ornek.com" maxLength={254} {...aria("email")} />)}
                </div>
                {field("message", "Mesajınız", <textarea rows={5} placeholder="Fikrinizden kısaca bahsedin…" maxLength={4000} {...aria("message")} className={cn(aria("message").className, "resize-y")} />)}

                {/* Bal küpü: ekranda yok, klavyeyle de ulaşılmaz. Botlar doldurur, insanlar görmez. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Web siteniz (boş bırakın)
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                  </label>
                </div>

                {failure ? (
                  <p role="alert" className="flex items-start gap-3 rounded-2xl border border-orange-400/40 bg-orange-500/10 px-4 py-3 text-sm text-fg">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-orange-400" aria-hidden="true" />
                    <span>
                      {failure}
                      {site.email ? (
                        <>
                          {" "}
                          İsterseniz doğrudan{" "}
                          <a href={`mailto:${site.email}`} className="font-medium underline underline-offset-4">
                            {site.email}
                          </a>{" "}
                          adresine yazabilirsiniz.
                        </>
                      ) : null}
                    </span>
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-muted">Bilgileriniz yalnızca size dönüş yapmak için kullanılır.</p>
                  <LiquidMetalButton
                    type="submit"
                    label={status === "sending" ? "Gönderiliyor…" : "Gönder"}
                    disabled={status === "sending"}
                    width={160}
                  />
                </div>
              </form>
            )}
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
