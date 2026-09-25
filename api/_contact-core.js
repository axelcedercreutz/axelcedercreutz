// Contact form backend. Framework-free so it runs as a Vercel Function (api/contact.js), in the local
// preview server (scripts/serve.mjs) and under node:test with a fake mail sender.
//
// Rule one: a real enquiry is never lost. This is a freelancer's inbox, so a false positive is a lost
// client and a false negative is one extra email. Only what a person using the page cannot produce is
// dropped; everything merely suspicious is delivered with a flag. The sender's email address, personal
// or not, never counts against them.
//
// Sinkhole (dropped, answered with the same "sent" response a person gets, so bots learn nothing):
//   - No token, or a forged one. The page fetches a signed token before it will submit and the form is
//     hidden without JavaScript, so only a script posting straight to the endpoint lacks one.
//
// Flagged (delivered, subject prefixed with [Flagged: ...] so a mail filter can sort them):
//   - Honeypot: the hidden "website" field has a value (bots fill it; so, rarely, does autofill).
//   - Too fast: sent less than MIN_FILL_MS after the person started on the form (paste + autofill can).
//   - Link-stuffed: more than MAX_LINKS links (a brief can have many).
//   - Markup: HTML anchors or BBCode.
//   - A link as the name.
//
// Refused with an error (the page tells the person what to do): cross-origin requests, non-JSON bodies,
// oversized bodies, an expired token, invalid fields.
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

/** True only when no person using the page could have produced this request. */
export function isCertainlyAutomated(age) {
  return age === null;
}

/** Reasons a delivered message looks suspicious. Empty for a normal message. */
export function flags(fields, age) {
  const out = [];
  if (fields.website) out.push("honeypot");
  if (age < MIN_FILL_MS) out.push("too-fast");
  const links = (fields.message.match(/https?:\/\/|www\./gi) || []).length;
  if (links > MAX_LINKS) out.push("many-links");
  if (/<a\s+href|\[url[=\]]|\[link[=\]]/i.test(fields.message)) out.push("markup");
  if (/https?:\/\/|www\./i.test(fields.name)) out.push("link-in-name");
  return out;
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

    if (isCertainlyAutomated(age)) {
      log("contact: sinkholed (no-or-forged-token)");
      return json(200, { ok: true });
    }
    if (age > MAX_TOKEN_AGE_MS) return json(400, { ok: false, code: "expired", error: "The form sat open for a while. Send it again." });

    const errors = validate(fields);
    if (Object.keys(errors).length) return json(400, { ok: false, code: "invalid", errors });

    if (!configured) {
      log("contact: not configured (RESEND_API_KEY missing)");
      return json(503, { ok: false, code: "unavailable", error: "The form is not switched on yet." });
    }
    const flagged = flags(fields, age);
    try {
      await send({
        name: fields.name,
        email: fields.email,
        message: fields.message,
        flags: flagged,
        meta: `Filled in ${Math.round(age / 1000)} s after starting.`,
      });
    } catch (err) {
      log(`contact: send failed (${err?.message ?? err})`);
      return json(502, { ok: false, code: "unavailable", error: "Sending failed on my side." });
    }
    log(flagged.length ? `contact: sent, flagged (${flagged.join(", ")})` : "contact: sent");
    return json(200, { ok: true });
  }

  return { GET, POST };
}

/** Mail sender backed by Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email). */
export function resendSender({ apiKey, to, from, fetchImpl = fetch }) {
  return async ({ name, email, message, meta, flags = [] }) => {
    const flagNote = flags.length
      ? `\nFlagged as possible spam (${flags.join(", ")}). Delivered anyway: real enquiries are never dropped.`
      : "";
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: `${name.replace(/[<>"]/g, "")} <${email}>`,
        subject: `${flags.length ? `[Flagged: ${flags.join(", ")}] ` : ""}Site contact: ${name}`,
        text: `${message}\n\n— ${name} <${email}>\nSent from the contact form on axelcedercreutz.fi. ${meta}${flagNote}\nReply to this email to answer them directly.`,
      }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}`);
  };
}

// aced.fi is verified in the Resend account (axel.cedercreutz@gmail.com), so any address on it can send.
// The address needs no mailbox: replies go to the person who wrote, via reply_to.
export const DEFAULT_FROM = "axelcedercreutz.fi contact form <contact@aced.fi>";

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
      from: env.CONTACT_FROM || DEFAULT_FROM,
    }),
  });
}
