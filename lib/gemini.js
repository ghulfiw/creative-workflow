// Shared helpers for the demo's AI endpoints. Keys live only in Vercel env vars.
const BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

function checkPasscode(req) {
  const want = process.env.DEMO_PASSCODE;
  if (!want) return true; // no passcode set: open (set one before the demo)
  const got = req.headers["x-demo-passcode"] || (req.query && req.query.passcode);
  return got === want;
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return {}; }
}

async function gemini(model, body) {
  const key = process.env.GEMINI_API_KEY;
  const r = await fetch(BASE + encodeURIComponent(model) + ":generateContent", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (j.error && j.error.message) || ("HTTP " + r.status);
    const e = new Error(msg); e.status = r.status; throw e;
  }
  return j;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(obj));
}

module.exports = { checkPasscode, readJson, gemini, send };
