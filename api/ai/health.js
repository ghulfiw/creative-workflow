const { checkPasscode, gemini, send } = require("../../lib/gemini");

// GET /api/ai/health            -> which settings are present (no secrets)
// GET /api/ai/health?test=1&passcode=...  -> also runs a tiny text call
module.exports = async (req, res) => {
  const info = {
    hasKey: !!process.env.GEMINI_API_KEY,
    hasPasscode: !!process.env.DEMO_PASSCODE,
    textModel: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
    imageModel: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image",
  };
  if (req.query && req.query.test && info.hasKey) {
    if (!checkPasscode(req)) return send(res, 401, { ...info, error: "Wrong passcode" });
    try {
      const j = await gemini(info.textModel, { contents: [{ role: "user", parts: [{ text: "Reply with the single word OK." }] }] });
      const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
      info.test = parts.map((p) => p.text || "").join("").trim();
    } catch (e) { info.test = "error: " + e.message; }
  }
  send(res, 200, info);
};
