// public/_worker.js (/api/contact) için birim testleri — Node'un yerleşik test koşucusu ile: npm test
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import worker from "../public/_worker.js";

const ORIGIN = "https://effeyc.example";
const ENV = { RESEND_API_KEY: "re_test_key", CONTACT_TO: "sahip@example.com", CONTACT_FROM: "effeyc <iletisim@effeyc.example>" };
const VALID = { name: "Ada Lovelace", email: "ada@example.com", message: "Merhaba, bir proje hakkında konuşmak istiyorum.", elapsed: 5000 };

let calls;
const realFetch = globalThis.fetch;
beforeEach(() => {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: "abc" }), { status: 200 });
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const post = (body, { origin = ORIGIN, type = "application/json", raw, method = "POST" } = {}) =>
  worker.fetch(
    new Request(`${ORIGIN}/api/contact`, {
      method,
      headers: { ...(origin ? { origin } : {}), "content-type": type },
      body: method === "GET" ? undefined : raw ?? JSON.stringify(body),
    }),
    ENV,
  );

describe("/api/contact", () => {
  it("geçerli mesajı Resend'e iletir ve 200 döner", async () => {
    const res = await post(VALID);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    assert.equal(calls[0].init.headers.authorization, "Bearer re_test_key");
    const sent = JSON.parse(calls[0].init.body);
    assert.deepEqual(sent.to, ["sahip@example.com"]);
    assert.equal(sent.reply_to, "ada@example.com");
    assert.equal(sent.from, ENV.CONTACT_FROM);
    assert.match(sent.subject, /Ada Lovelace/);
    assert.match(sent.text, /proje hakkında/);
  });

  it("virgülle ayrılmış alıcıları böler", async () => {
    await worker.fetch(
      new Request(`${ORIGIN}/api/contact`, { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify(VALID) }),
      { ...ENV, CONTACT_TO: "a@example.com, b@example.com" },
    );
    assert.deepEqual(JSON.parse(calls[0].init.body).to, ["a@example.com", "b@example.com"]);
  });

  it("konu satırında başlık enjeksiyonunu engeller", async () => {
    await post({ ...VALID, name: "Mallory\r\nBcc: kurban@example.com" });
    const sent = JSON.parse(calls[0].init.body);
    assert.ok(!/[\r\n]/.test(sent.subject));
    assert.ok(!sent.subject.includes("\n"));
  });

  it("alanları doğrular ve hataları alan alan döner", async () => {
    const res = await post({ name: "A", email: "gecersiz", message: "kısa", elapsed: 5000 });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, "validation");
    assert.ok(body.fields.name && body.fields.email && body.fields.message);
    assert.equal(calls.length, 0);
  });

  it("başka bir origin'den gelen isteği reddeder", async () => {
    const res = await post(VALID, { origin: "https://kotu-site.example" });
    assert.equal(res.status, 403);
    assert.equal(calls.length, 0);
  });

  it("Origin başlığı olmayan isteği reddeder", async () => {
    const res = await post(VALID, { origin: null });
    assert.equal(res.status, 403);
  });

  it("ALLOWED_ORIGINS içindeki ek origin'e izin verir", async () => {
    const res = await worker.fetch(
      new Request(`${ORIGIN}/api/contact`, { method: "POST", headers: { origin: "https://www.alan.example", "content-type": "application/json" }, body: JSON.stringify(VALID) }),
      { ...ENV, ALLOWED_ORIGINS: "https://www.alan.example/" },
    );
    assert.equal(res.status, 200);
  });

  it("JSON olmayan içerik türünü reddeder", async () => {
    const res = await post(null, { type: "text/plain", raw: "merhaba" });
    assert.equal(res.status, 415);
  });

  it("bozuk JSON'u reddeder", async () => {
    const res = await post(null, { raw: "{bozuk" });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "bad_json");
  });

  it("çok büyük gövdeyi reddeder", async () => {
    const res = await post({ ...VALID, message: "x".repeat(20000) });
    assert.equal(res.status, 413);
    assert.equal(calls.length, 0);
  });

  it("bal küpü dolu ise sessizce başarılı döner ama e-posta göndermez", async () => {
    const res = await post({ ...VALID, website: "http://spam.example" });
    assert.equal(res.status, 200);
    assert.equal(calls.length, 0);
  });

  it("çok hızlı gönderimi reddeder", async () => {
    const res = await post({ ...VALID, elapsed: 200 });
    assert.equal(res.status, 429);
    assert.equal(calls.length, 0);
  });

  it("servis yapılandırılmamışsa 503 döner", async () => {
    const res = await worker.fetch(
      new Request(`${ORIGIN}/api/contact`, { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify(VALID) }),
      {},
    );
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error, "not_configured");
  });

  it("e-posta sağlayıcısı hata verirse 502 döner", async () => {
    globalThis.fetch = async () => new Response("domain doğrulanmamış", { status: 403 });
    const res = await post(VALID);
    assert.equal(res.status, 502);
    assert.equal((await res.json()).error, "delivery_failed");
  });

  it("ağ hatasında 502 döner", async () => {
    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    const res = await post(VALID);
    assert.equal(res.status, 502);
  });

  it("POST dışındaki yöntemleri reddeder", async () => {
    const res = await post(null, { method: "GET" });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get("allow"), "POST");
  });

  it("yanıtlar önbelleğe alınmaz", async () => {
    const res = await post(VALID);
    assert.equal(res.headers.get("cache-control"), "no-store");
  });

  it("bilinmeyen /api yolu 404 döner", async () => {
    const res = await worker.fetch(new Request(`${ORIGIN}/api/yok`), ENV);
    assert.equal(res.status, 404);
  });
});
