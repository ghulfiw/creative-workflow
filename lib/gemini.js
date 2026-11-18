// Shared helpers for the demo's AI endpoints. Keys live only in Vercel env vars.
// Models are discovered from the account's model list, so a retired model never breaks the demo.
const BASE = "https://generativelanguage.googleapis.com/v1beta/";

const PREFER = {
  text: ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-3-flash", "gemini-2.5-flash"],
  image: ["gemini-nano-banana-2.1", "gemini-3.1-flash-image", "gemini-3.1-flash-image-preview", "gemini-3.1-flash-lite-image", "gemini-3-pro-image-preview", "gemini-2.5-flash-image"],
};

function checkPasscode(req) {
  const want = process.env.DEMO_PASSCODE;
  if (!want) return true;
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

let cache = { at: 0, models: null };
async function listModels(force) {
  if (!force && cache.models && Date.now() - cache.at < 10 * 60 * 1000) return cache.models;
  const r = await fetch(BASE + "models?pageSize=1000", { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY } });
  const j = await r.json().catch(() => ({}));
  const models = (j.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => String(m.name || "").replace(/^models\//, ""));
  cache = { at: Date.now(), models };
  return models;
}

function isImage(n) { return /image|banana/i.test(n); }
function isTextCandidate(n) { return /^gemini/.test(n) && /flash/.test(n) && !/image|banana|tts|live|audio|robotics|transcribe|translate|omni|embedding|lite/.test(n); }

async function candidates(kind) {
  const env = kind === "text" ? process.env.GEMINI_TEXT_MODEL : process.env.GEMINI_IMAGE_MODEL;
  let avail = [];
  try { avail = await listModels(); } catch {}
  const out = [];
  if (env) out.push(env);
  for (const p of PREFER[kind]) if (!avail.length || avail.includes(p)) out.push(p);
  const extra = avail.filter((n) => (kind === "image" ? isImage(n) : isTextCandidate(n))).sort().reverse();
  for (const n of extra) out.push(n);
  return [...new Set(out)];
}

async function call(model, body) {
  const r = await fetch(BASE + "models/" + encodeURIComponent(model) + ":generateContent", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (j.error && j.error.message) || ("HTTP " + r.status);
    const e = new Error(msg); e.status = r.status; throw e;
  }
  return j;
}

// Try the preferred models in order; skip any that are retired, unknown or not allowed for this key.
async function generate(kind, body, maxTries = 4) {
  const list = await candidates(kind);
  let last;
  for (const model of list.slice(0, maxTries)) {
    try { const j = await call(model, body); return { j, model }; }
    catch (e) {
      last = e;
      const skip = e.status === 404 || e.status === 403 || /no longer available|not found|not supported|deprecated|unsupported|permission/i.test(e.message);
      if (!skip) throw e;
      cache.at = 0; // refresh the model list next time
    }
  }
  throw last || new Error("No usable " + kind + " model for this API key");
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(obj));
}

module.exports = { checkPasscode, readJson, generate, candidates, listModels, send };
