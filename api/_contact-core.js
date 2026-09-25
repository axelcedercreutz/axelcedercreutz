// Contact form backend. Framework-free so it runs as a Vercel Function (api/contact.js), in the local
// preview server (scripts/serve.mjs) and under node:test with a fake mail sender.
//
// Spam handling is a sinkhole: anything that looks automated gets the exact same "sent" response a
// person gets, and is quietly dropped. Bots learn nothing to adapt to. The traps:
//   1. Honeypot: a "website" field hidden from people. Anything typed there is a bot.
//   2. Signed timer: the page fetches a token (GET) when someone starts on the form; the POST must carry
//      it, unforged, and arrive no sooner than MIN_FILL_MS after it was issued. Scripts that post
//      straight to the endpoint, or fill the form in a blink, fail this.
//   3. Content: link-stuffed messages and markup (HTML anchors, BBCode) are dropped.
// Plus hard checks that do answer with an error: same-origin requests only, JSON only, size caps,
// and field validation, so a real person with a typo is told what to fix.
import { createHmac, timingSafeEqual } from "node:crypto";

export const MIN_FILL_MS = 3_000;
export const MAX_TOKEN_AGE_MS = 2 * 60 * 60 * 1000;
export const LIMITS = { name: 120, email: 200, message: 5_000, body: 20_000 };
const MAX_LINKS = 3;

const json = (status, data) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

const sign = (secret, ts) => createHmac("sha256", secret).update(`contact:${ts}`).digest("base64url");

export function issueToken(secret, now = Date.now()) {
  return `${now}.${sign(secret, now)}`;
}

/** Age of a valid token in ms, or null when the token is missing, malformed or forged. */
export function tokenAge(secret, token, now = Date.now()) {
  if (typeof token !== "string") return null;
  const [ts, sig] = token.split(".");
  if (!/^\d{12,14}$/.test(ts ?? "") || !sig) return null;
  const expected = Buffer.from(sign(secret, Number(ts)));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return now - Number(ts);
}

/** Same-origin check: the browser's Origin header must name the host that received the request. */
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
  try { return new URL(origin).host === host; } catch { return false; }
}

const clean = (v, max) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max + 1) : "");
const oneLine = (s) => s.replace(/[\r\n\t]+/g, " ").trim();
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/** Returns a reason string when the submission should be sinkholed, else null. */
export function spamReason(fields, age) {
  if (fields.website) return "honeypot";
  if (age === null) return "no-or-forged-token";
  if (age < MIN_FILL_MS) return "too-fast";
  const links = (fields.message.match(/https?:\/\/|www\./gi) || []).length;
  if (links > MAX_LINKS) return "link-stuffed";
  if (/<a\s+href|\[url[=\]]|\[link[=\]]/i.test(fields.message)) return "markup";
  if (/https?:\/\/|www\./i.test(fields.name)) return "link-in-name";
  return null;
}

export function validate(fields) {
  const errors = {};
  if (!fields.name) errors.name = "Tell me who you are.";
  else if (fields.name.length > LIMITS.name) errors.name = `Keep the name under ${LIMITS.name} characters.`;
  if (!EMAIL.test(fields.email) || fields.email.length > LIMITS.email) errors.email = "That email address does not look right.";
  if (fields.message.length < 10) errors.message = "Say a little more, at least a sentence.";
  else if (fields.message.length > LIMITS.message) errors.message = `Keep it under ${LIMITS.message.toLocaleString("en-US")} characters, or email me directly.`;
  return errors;
}

/**
 * @param {{ secret: string, configured: boolean, send: (mail: {name:string,email:string,message:string,meta:string}) => Promise<void>, log?: (msg: string) => void, now?: () => number }} deps
 */
export function createContactHandler({ secret, configured, send, log = console.log, now = Date.now }) {
  async function GET() {
    return json(200, { token: issueToken(secret, now()) });
  }

  async function POST(request) {
    if (!sameOrigin(request)) return json(403, { ok: false, error: "Send the form from the site itself." });
    if (!(request.headers.get("content-type") || "").includes("application/json")) return json(415, { ok: false, error: "Unsupported format." });
    const raw = await request.text();
    if (raw.length > LIMITS.body) return json(413, { ok: false, error: "That message is too long for the form; email me directly." });
    let body;
    try { body = JSON.parse(raw); } catch { return json(400, { ok: false, error: "Could not read the form." }); }
    if (!body || typeof body !== "object") return json(400, { ok: false, error: "Could not read the form." });

    const fields = {
      name: oneLine(clean(body.name, LIMITS.name)),
      email: oneLine(clean(body.email, LIMITS.email)),
      message: clean(body.message, LIMITS.message),
      website: clean(body.website, 200),
    };
    const age = tokenAge(secret, body.token, now());

    const reason = spamReason(fields, age);
    if (reason) {
      log(`contact: sinkholed (${reason})`);
      return json(200, { ok: true });
    }
    if (age > MAX_TOKEN_AGE_MS) return json(400, { ok: false, code: "expired", error: "The form sat open for a while. Send it again." });

    const errors = validate(fields);
    if (Object.keys(errors).length) return json(400, { ok: false, code: "invalid", errors });

    if (!configured) {
      log("contact: not configured (RESEND_API_KEY missing)");
      return json(503, { ok: false, code: "unavailable", error: "The form is not switched on yet." });
    }
    try {
      await send({ name: fields.name, email: fields.email, message: fields.message, meta: `Filled in ${Math.round(age / 1000)} s after starting.` });
    } catch (err) {
      log(`contact: send failed (${err?.message ?? err})`);
      return json(502, { ok: false, code: "unavailable", error: "Sending failed on my side." });
    }
    log("contact: sent");
    return json(200, { ok: true });
  }

  return { GET, POST };
}

/** Mail sender backed by Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email). */
export function resendSender({ apiKey, to, from, fetchImpl = fetch }) {
  return async ({ name, email, message, meta }) => {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: `${name.replace(/[<>"]/g, "")} <${email}>`,
        subject: `Site contact: ${name}`,
        text: `${message}\n\n— ${name} <${email}>\nSent from the contact form on axelcedercreutz.fi. ${meta}\nReply to this email to answer them directly.`,
      }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}`);
  };
}

/** Wires the handler to environment variables. See docs/SITE.md, "Contact form". */
export function handlerFromEnv(env = process.env) {
  const apiKey = env.RESEND_API_KEY || "";
  const secret = env.CONTACT_SECRET || apiKey || "local-development-only";
  return createContactHandler({
    secret,
    configured: Boolean(apiKey),
    send: resendSender({
      apiKey,
      to: env.CONTACT_TO || "axel.cedercreutz@gmail.com",
      from: env.CONTACT_FROM || "axelcedercreutz.fi <onboarding@resend.dev>",
    }),
  });
}
