const { checkPasscode, readJson, gemini, send } = require("../../lib/gemini");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  if (!checkPasscode(req)) return send(res, 401, { error: "Wrong passcode" });
  if (!process.env.GEMINI_API_KEY) return send(res, 200, { fallback: true, error: "GEMINI_API_KEY is not set" });
  const { prompt, system, json, temperature } = await readJson(req);
  if (!prompt) return send(res, 400, { error: "prompt is required" });
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const body = {
    contents: [{ role: "user", parts: [{ text: String(prompt).slice(0, 30000) }] }],
    generationConfig: { temperature: typeof temperature === "number" ? temperature : 0.8 },
  };
  if (system) body.systemInstruction = { parts: [{ text: String(system).slice(0, 10000) }] };
  if (json) body.generationConfig.responseMimeType = "application/json";
  try {
    const t0 = Date.now();
    const j = await gemini(model, body);
    const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
    const text = parts.map((p) => p.text || "").join("");
    if (!text) return send(res, 502, { error: "The model returned no text", fallback: true });
    send(res, 200, { text, model, ms: Date.now() - t0 });
  } catch (e) {
    send(res, 502, { error: e.message, fallback: true });
  }
};
