const { checkPasscode, readJson, generate, send } = require("../../lib/gemini");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  if (!checkPasscode(req)) return send(res, 401, { error: "Wrong passcode" });
  if (!process.env.GEMINI_API_KEY) return send(res, 200, { fallback: true, error: "GEMINI_API_KEY is not set" });
  const { prompt, images, aspectRatio } = await readJson(req);
  if (!prompt) return send(res, 400, { error: "prompt is required" });
  const parts = [];
  for (const im of (images || []).slice(0, 3)) {
    if (im && im.data && im.mimeType) parts.push({ inlineData: { mimeType: im.mimeType, data: im.data } });
  }
  parts.push({ text: String(prompt).slice(0, 8000) });
  const mk = (withAspect) => {
    const b = { contents: [{ role: "user", parts }], generationConfig: { responseModalities: ["IMAGE", "TEXT"] } };
    if (withAspect && aspectRatio) b.generationConfig.imageConfig = { aspectRatio };
    return b;
  };
  try {
    const t0 = Date.now();
    let r;
    try { r = await generate("image", mk(true)); }
    catch (e) { if (e.status === 400 && aspectRatio) r = await generate("image", mk(false)); else throw e; }
    const out = ((((r.j.candidates || [])[0] || {}).content || {}).parts || []).find((p) => p.inlineData || p.inline_data);
    if (!out) return send(res, 502, { error: "The model returned no image (it may have refused the prompt)", fallback: true });
    const d = out.inlineData || out.inline_data;
    send(res, 200, { mimeType: d.mimeType || d.mime_type || "image/png", data: d.data, model: r.model, ms: Date.now() - t0 });
  } catch (e) {
    send(res, 502, { error: e.message, fallback: true });
  }
};
