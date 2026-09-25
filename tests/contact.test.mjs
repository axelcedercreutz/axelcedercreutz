// The contact function, exercised directly with Web Requests and a fake mail sender. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createContactHandler, issueToken, MIN_FILL_MS, MAX_TOKEN_AGE_MS } from "../api/_contact-core.js";

const SECRET = "test-secret";
const T0 = 1_790_000_000_000;

function setup({ configured = true, fail = false, now = T0 + 60_000 } = {}) {
  const sent = [];
  const logs = [];
  const h = createContactHandler({
    secret: SECRET,
    configured,
    now: () => now,
    log: (m) => logs.push(m),
    send: async (mail) => { if (fail) throw new Error("boom"); sent.push(mail); },
  });
  return { h, sent, logs };
}

const good = (over = {}) => ({
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hi Axel, we are hiring a product engineer. Fancy a chat next week?",
  website: "",
  token: issueToken(SECRET, T0),
  ...over,
});

const post = (body, headers = {}) =>
  new Request("https://axelcedercreutz.fi/api/contact", {
    method: "POST",
    headers: { host: "axelcedercreutz.fi", origin: "https://axelcedercreutz.fi", "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("GET issues a signed token that is not cached", async () => {
  const { h } = setup();
  const res = await h.GET();
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.match((await res.json()).token, /^\d{13}\.[\w-]+$/);
});

test("a real message is sent, with the sender as reply-to material", async () => {
  const { h, sent } = setup();
  const res = await h.POST(post(good()));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].email, "ada@example.com");
  assert.match(sent[0].meta, /60 s/);
});

for (const [label, body] of [
  ["no token", good({ token: undefined })],
  ["forged token", good({ token: `${T0}.not-the-signature` })],
  ["token signed with another secret", good({ token: issueToken("other", T0) })],
]) {
  test(`sinkhole: ${label} (a script, not a person on the page) looks sent but is dropped`, async () => {
    const { h, sent, logs } = setup();
    const res = await h.POST(post(body));
    assert.equal(res.status, 200, "same status as a real send");
    assert.deepEqual(await res.json(), { ok: true }, "same body as a real send");
    assert.equal(sent.length, 0, "nothing is emailed");
    assert.ok(logs.some((l) => l.includes("no-or-forged-token")), `logged: ${logs}`);
  });
}

for (const [label, body, flag] of [
  ["honeypot filled (bots, or a stray autofill)", good({ website: "https://cheap-seo.example" }), "honeypot"],
  ["sent within seconds (paste + autofill)", good({ token: issueToken(SECRET, T0 + 60_000 - (MIN_FILL_MS - 500)) }), "too-fast"],
  ["a brief with many links", good({ message: "Our brief: https://a.example https://b.example https://c.example www.d.example" }), "many-links"],
  ["HTML anchor", good({ message: 'Great site! <a href="https://x.example">click</a>' }), "markup"],
  ["BBCode", good({ message: "Great site! [url=https://x.example]click[/url]" }), "markup"],
  ["link as the name", good({ name: "https://spam.example" }), "link-in-name"],
]) {
  test(`never dropped, only flagged: ${label}`, async () => {
    const { h, sent, logs } = setup();
    const res = await h.POST(post(body));
    assert.equal(res.status, 200);
    assert.equal(sent.length, 1, "delivered");
    assert.ok(sent[0].flags.includes(flag), `flagged ${flag}: ${sent[0].flags}`);
    assert.ok(logs.some((l) => l.includes("flagged") && l.includes(flag)), `logged: ${logs}`);
  });
}

test("personal email addresses are delivered unflagged, like any other", async () => {
  for (const email of ["someone@gmail.com", "someone@outlook.com", "someone@hotmail.com", "someone@icloud.com", "someone@yahoo.com", "someone@proton.me", "firstname.lastname@kolumbus.fi", "ceo@startup.io"]) {
    const { h, sent } = setup();
    const res = await h.POST(post(good({ email })));
    assert.equal(res.status, 200, email);
    assert.equal(sent.length, 1, `${email} delivered`);
    assert.deepEqual(sent[0].flags, [], `${email} not flagged`);
  }
});

test("a normal message carries no flags", async () => {
  const { h, sent } = setup();
  await h.POST(post(good()));
  assert.deepEqual(sent[0].flags, []);
});

test("flagged mail is labelled in the subject so a filter can sort it", async () => {
  const calls = [];
  const { resendSender } = await import("../api/_contact-core.js");
  const send = resendSender({ apiKey: "k", to: "a@b.fi", from: "x <y@z.dev>", fetchImpl: async (url, init) => { calls.push(JSON.parse(init.body)); return new Response("{}", { status: 200 }); } });
  await send({ name: "Ada", email: "ada@gmail.com", message: "Hello there, a project for you.", meta: "", flags: ["honeypot"] });
  await send({ name: "Ada", email: "ada@gmail.com", message: "Hello there, a project for you.", meta: "", flags: [] });
  assert.equal(calls[0].subject, "[Flagged: honeypot] Site contact: Ada");
  assert.match(calls[0].text, /Delivered anyway/);
  assert.equal(calls[1].subject, "Site contact: Ada");
  assert.equal(calls[1].reply_to, "Ada <ada@gmail.com>");
});

test("two links are fine; people share links", async () => {
  const { h, sent } = setup();
  await h.POST(post(good({ message: "See https://a.example and https://b.example for context on the role." })));
  assert.equal(sent.length, 1);
});

test("cross-origin and missing-origin posts are refused", async () => {
  const { h, sent } = setup();
  assert.equal((await h.POST(post(good(), { origin: "https://evil.example" }))).status, 403);
  const noOrigin = post(good());
  noOrigin.headers.delete("origin");
  assert.equal((await h.POST(noOrigin)).status, 403);
  assert.equal(sent.length, 0);
});

test("the same-origin check follows the host, so previews work too", async () => {
  const { h, sent } = setup();
  const host = "axelcedercreutz-git-branch.vercel.app";
  const res = await h.POST(post(good(), { host, origin: `https://${host}` }));
  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
});

test("non-JSON, oversized and malformed bodies are refused", async () => {
  const { h } = setup();
  assert.equal((await h.POST(post("name=x", { "content-type": "application/x-www-form-urlencoded" }))).status, 415);
  assert.equal((await h.POST(post(good({ message: "x".repeat(25_000) })))).status, 413);
  assert.equal((await h.POST(post("{not json"))).status, 400);
});

test("a person with a typo is told what to fix, per field", async () => {
  const { h, sent } = setup();
  const res = await h.POST(post(good({ name: "", email: "ada@", message: "hi" })));
  assert.equal(res.status, 400);
  const out = await res.json();
  assert.equal(out.code, "invalid");
  assert.deepEqual(Object.keys(out.errors).sort(), ["email", "message", "name"]);
  assert.equal(sent.length, 0);
});

test("a form left open for hours asks to resend instead of vanishing", async () => {
  const { h, sent } = setup({ now: T0 + MAX_TOKEN_AGE_MS + 1 });
  const res = await h.POST(post(good()));
  assert.equal(res.status, 400);
  assert.equal((await res.json()).code, "expired");
  assert.equal(sent.length, 0);
});

test("unconfigured or failing mail says so, so the page can offer plain email", async () => {
  const off = setup({ configured: false });
  const r1 = await off.h.POST(post(good()));
  assert.equal(r1.status, 503);
  assert.equal((await r1.json()).code, "unavailable");
  const broken = setup({ fail: true });
  const r2 = await broken.h.POST(post(good()));
  assert.equal(r2.status, 502);
  assert.equal((await r2.json()).code, "unavailable");
});

test("line breaks cannot sneak into the one-line fields", async () => {
  const { h, sent } = setup();
  await h.POST(post(good({ name: "Ada\r\nBcc: victim@example.com" })));
  assert.equal(sent[0].name.includes("\n"), false);
});
