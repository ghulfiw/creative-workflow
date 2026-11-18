const { checkPasscode, generate, candidates, listModels, send } = require("../../lib/gemini");

// GET /api/ai/health                         -> settings present (no secrets) + models this key can use
// GET /api/ai/health?test=1&passcode=...     -> also runs a tiny text call
module.exports = async (req, res) => {
  const info = { hasKey: !!process.env.GEMINI_API_KEY, hasPasscode: !!process.env.DEMO_PASSCODE };
  if (info.hasKey) {
    try {
      const all = await listModels(true);
      info.modelCount = all.length;
      info.textModels = (await candidates("text")).slice(0, 4);
      info.imageModels = (await candidates("image")).slice(0, 4);
    } catch (e) { info.modelListError = e.message; }
  }
  if (req.query && req.query.test && info.hasKey) {
    if (!checkPasscode(req)) return send(res, 401, { ...info, error: "Wrong passcode" });
    try {
      const { j, model } = await generate("text", { contents: [{ role: "user", parts: [{ text: "Reply with the single word OK." }] }] });
      const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
      info.test = { model, reply: parts.filter((p) => !p.thought).map((p) => p.text || "").join("").trim() };
    } catch (e) { info.test = "error: " + e.message; }
  }
  send(res, 200, info);
};
