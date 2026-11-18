const { checkPasscode, readJson, gemini, send } = require("../../lib/gemini");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  if (!checkPasscode(req)) return send(res, 401, { error: "Wrong passcode" });
  if (!process.env.GEMINI_API_KEY) return send(res, 200, { fallback: true, error: "GEMINI_API_KEY is not set" });
  const { prompt, images, aspectRatio } = await readJson(req);
  if (!prompt) return send(res, 400, { error: "prompt is required" });
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const parts = [];
  for (const im of (images || []).slice(0, 3)) {
    if (im && im.data && im.mimeType) parts.push({ inlineData: { mimeType: im.mimeType, data: im.data } });
  }
  parts.push({ text: String(prompt).slice(0, 8000) });
  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
  };
  if (aspectRatio) body.generationConfig.imageConfig = { aspectRatio };
  try {
    const t0 = Date.now();
    let j;
    try { j = await gemini(model, body); }
    catch (e) {
      // Some image models reject imageConfig; retry once without it.
      if (aspectRatio && e.status === 400) { delete body.generationConfig.imageConfig; j = await gemini(model, body); }
      else throw e;
    }
    const out = ((((j.candidates || [])[0] || {}).content || {}).parts || []).find((p) => p.inlineData || p.inline_data);
    if (!out) return send(res, 502, { error: "The model returned no image (it may have refused the prompt)", fallback: true });
    const d = out.inlineData || out.inline_data;
    send(res, 200, { mimeType: d.mimeType || d.mime_type || "image/png", data: d.data, model, ms: Date.now() - t0 });
  } catch (e) {
    send(res, 502, { error: e.message, fallback: true });
  }
};
