/* Creative Hub · live demo. One brief through the BAU workflow (BPMN v3), with live AI. */
(function () {
"use strict";

// ---------- constants ----------
const ROLES = {
  AM: "Account Manager", SP: "Strategic Planner", CW: "Copywriter", AD: "Art Director",
  CL: "Creative Lead (ECD)", VE: "Video Editor", SS: "Samsung reviewer",
};
const STAGES = [
  { id: "brief", label: "Brief", owner: "AM", hours: 1 },
  { id: "planner", label: "Complete brief", owner: "SP", hours: 2 },
  { id: "script", label: "AI script", owner: "CW", hours: 1 },
  { id: "images", label: "AI still images", owner: "AD", hours: 1 },
  { id: "internal_board", label: "Internal board review", owner: "CL", hours: 1.5 },
  { id: "client_board", label: "Samsung board review", owner: "SS", hours: 2 },
  { id: "board_revision", label: "Board revision", owner: "AD", hours: 1.5, optional: true },
  { id: "joint_rereview", label: "Joint re-review", owner: "SS", hours: 2, optional: true },
  { id: "production", label: "Video production", owner: "VE", hours: 4 },
  { id: "internal_content", label: "Internal content review", owner: "CL", hours: 2 },
  { id: "client_content", label: "Samsung content review", owner: "SS", hours: 2 },
  { id: "content_revision", label: "Content revision", owner: "VE", hours: 3, optional: true },
  { id: "internal_rereview", label: "Internal re-review", owner: "CL", hours: 7 / 6, optional: true },
  { id: "closed", label: "Closed", owner: "AM", hours: 0 },
];
const SLA_H = 45, DAY_H = 9;
const stageOf = (id) => STAGES.find((s) => s.id === id);

const TRENDS = [
  { id: "t1", name: "#Harbolnas 12.12 countdown", growth: "▲ 240%", src: "TikTok, Instagram, X", window: "Peaks in 3 days",
    note: "Shopping-day countdown posts peak 19:00–22:00; phones and earbuds are the most wished-for gifts." },
  { id: "t2", name: "#LiburanAkhirTahun", growth: "▲ 85%", src: "Instagram, TikTok", window: "Rising for 2 weeks",
    note: "Year-end travel prep and family trips; packing-list content is trending." },
  { id: "t3", name: "\"Unboxing ASMR\" sound", growth: "▲ 60%", src: "TikTok sound", window: "Peaks in 4 days",
    note: "A trending sound used for calm, close-up unboxing videos." },
  { id: "t4", name: "ASEAN Cup final watch parties", growth: "Known occasion", src: "Calendar, social listening", window: "Final in 5 days",
    note: "Watch-party posts and big-screen searches rise in the week before the final." },
];

const fresh = () => ({
  v: 3, role: "AM", follow: true, stage: "brief", elapsed: 0, started: false,
  brief: {
    workflow: "BAU", campaign: "Year-end campaign · Brief 3", product: "Galaxy Z Flip7",
    objective: "Drive pre-orders for the 12.12 shopping day among young urban buyers.",
    message: "Pre-order before 12.12 and get the bundle gift. Only 3 days left.",
    audience: "18–30, Jakarta and Surabaya, shopping-app users", channels: "Instagram Reels, TikTok",
    ready: "10 Dec 2026", mandatories: "Price and bundle terms on screen for at least 3 seconds. Samsung logo end card.",
    videos: 5,
  },
  trend: null, direction: null,
  form: { hook: "Countdown reveal", focus: "Galaxy Z Flip7 cover screen", must: "Pre-order before 12.12 · bundle gift", lang: "Bahasa Indonesia, casual", n: 3, notes: "" },
  options: [], pick: null, script: null, scriptVersions: 0,
  look: "", productRef: null, frames: [], selFrame: 0,
  aiCheck: null, decision: {}, comments: [], videos: [], log: [], alerts: [],
  rounds: { board: 1, content: 1 }, path: [],
});

// ---------- storage (IndexedDB; images are too big for localStorage) ----------
const DB = {
  open() { return new Promise((ok, no) => { const r = indexedDB.open("creative-hub-demo", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }); },
  async get(k) { const db = await this.open(); return new Promise((ok) => { const t = db.transaction("kv").objectStore("kv").get(k); t.onsuccess = () => ok(t.result); t.onerror = () => ok(undefined); }); },
  async set(k, v) { const db = await this.open(); return new Promise((ok) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = () => ok(); t.onerror = () => ok(); }); },
};
let S = fresh();
let busy = {};            // ui-only: which AI calls are running
let aiStatus = { ok: null, msg: "AI: checking…" };
const save = () => DB.set("state", S);

// ---------- helpers ----------
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtH = (h) => { const m = Math.round(h * 60); const hh = Math.floor(m / 60), mm = m % 60; return (hh ? hh + " h" : "") + (mm ? (hh ? " " : "") + mm + " min" : (hh ? "" : "0 min")); };
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
function toast(html) { const t = document.createElement("div"); t.className = "toast"; t.innerHTML = html; document.getElementById("toasts").appendChild(t); setTimeout(() => t.remove(), 5000); }

function log(actor, text) { S.log.unshift({ at: S.elapsed, clock: now(), actor, text }); }
function alertTo(role, text) {
  const ch = role === "SS" ? "Email + Telegram" : "Telegram";
  S.alerts.unshift({ to: role, ch, text, clock: now() });
  toast(`<b>${ch} → ${esc(ROLES[role])}</b><br>${esc(text)}`);
}
function advance(next, actor, text) {
  const cur = stageOf(S.stage);
  if (S.started) S.elapsed += cur.hours;
  S.path.push(S.stage);
  log(actor, text);
  S.stage = next;
  const ns = stageOf(next);
  if (next !== "closed") alertTo(ns.owner, `${ns.label}: “${S.brief.campaign}” is waiting for you.`);
  if (S.follow) S.role = ns.owner;
  save(); render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- AI calls ----------
function passcode() { return localStorage.getItem("ch_pass") || ""; }
async function api(path, body) {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json", "x-demo-passcode": passcode() }, body: JSON.stringify(body) });
  if (r.status === 401) { askPass(); throw new Error("Wrong passcode"); }
  const j = await r.json().catch(() => ({ error: "Bad response" }));
  if (j.fallback || j.error) throw new Error(j.error || "AI unavailable");
  return j;
}
function parseJSON(t) { try { return JSON.parse(t); } catch { const m = String(t).match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch {} } return null; } }
async function aiJSON(prompt, system) {
  try { const j = await api("/api/ai/text", { prompt, system, json: true }); setAI(true); return parseJSON(j.text); }
  catch (e) { setAI(false, e.message); return null; }
}
async function aiImage(prompt, refs) {
  try {
    const images = (refs || []).filter(Boolean).map((d) => ({ mimeType: d.slice(5, d.indexOf(";")), data: d.slice(d.indexOf(",") + 1) }));
    const j = await api("/api/ai/image", { prompt, images, aspectRatio: "9:16" });
    setAI(true);
    return await shrink("data:" + j.mimeType + ";base64," + j.data);
  } catch (e) { setAI(false, e.message); return null; }
}
function setAI(ok, msg) { aiStatus = ok ? { ok: true, msg: "AI: live" } : { ok: false, msg: "AI: offline, using samples" + (msg ? " (" + msg.slice(0, 60) + ")" : "") }; const el = document.getElementById("aistat"); if (el) { el.className = "pill " + (ok ? "ok" : "warn"); el.textContent = aiStatus.msg; } }
function shrink(dataUrl, max = 720) {
  return new Promise((ok) => { const im = new Image(); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", 0.86)); }; im.onerror = () => ok(dataUrl); im.src = dataUrl; });
}
function placeholder(label, i, note) {
  const cols = ["#2B2D6B", "#2F6B5C", "#8A5A1F", "#6B3A5A", "#2F5C8A", "#4A4F63"];
  const c = document.createElement("canvas"); c.width = 360; c.height = 640; const g = c.getContext("2d");
  g.fillStyle = cols[i % cols.length]; g.fillRect(0, 0, 360, 640);
  g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(30, 180, 300, 280);
  g.fillStyle = "#fff"; g.font = "600 22px Poppins, Arial"; g.fillText(label, 30, 120);
  g.font = "400 15px Poppins, Arial"; wrap(g, note || "Sample frame (AI offline)", 30, 520, 300, 20);
  return c.toDataURL("image/jpeg", 0.85);
}
function wrap(g, t, x, y, w, lh) { const words = String(t).split(" "); let line = ""; for (const wd of words) { const tt = line + wd + " "; if (g.measureText(tt).width > w && line) { g.fillText(line, x, y); line = wd + " "; y += lh; } else line = tt; } g.fillText(line, x, y); }

// ---------- canned fallbacks (only when the AI is unreachable) ----------
const SAMPLE_DIRECTION = { insight: "People count down to 12.12 together; phones are the most wished-for gift and posts peak in the evening.", angle: "The Flip opens to reveal the countdown. Each variant counts a different moment before 12.12.", tone: "Playful, fast, local slang, warm evening light", post_time: "19:00–22:00", dos: "Show the cover screen and the bundle gift clearly.", donts: "No competitor shopping apps or logos." };
const SAMPLE_OPTIONS = [
  { title: "Countdown flip", hook: "The phone opens on the countdown", beats: [
    { time: "0–3s", visual: "Close-up: a closed Galaxy Z Flip7 on a desk lights up; cover screen shows a countdown", voiceover: "Tiga hari lagi…", onscreen: "3 hari lagi ke 12.12" },
    { time: "3–7s", visual: "Hand flips the phone open in a busy Jakarta café at golden hour", voiceover: "Waktunya upgrade!", onscreen: "" },
    { time: "7–11s", visual: "Quick cuts: selfie with the cover screen, friends laughing, the gift bundle box", voiceover: "Pre-order sekarang, dapat bundle gift.", onscreen: "Bonus bundle gift" },
    { time: "11–15s", visual: "Offer card with the phone and the countdown, then the end card", voiceover: "Jangan sampai kelewatan.", onscreen: "Pre-order sebelum 12.12" } ] },
  { title: "Wish list", hook: "Top of everyone's wish list", beats: [
    { time: "0–3s", visual: "A shopping-app wish list on a phone screen, the Flip at the top", voiceover: "Wishlist kamu udah siap?", onscreen: "Wishlist 12.12" },
    { time: "3–8s", visual: "Friends gather around as the Flip opens hands-free on a café table", voiceover: "Yang ini paling dicari.", onscreen: "" },
    { time: "8–12s", visual: "Close-up of the bundle gift being unboxed", voiceover: "Pre-order dapat bundle gift.", onscreen: "Bonus bundle gift" },
    { time: "12–15s", visual: "End card with the deadline", voiceover: "Cuma sampai 12.12.", onscreen: "Pre-order sebelum 12.12" } ] },
  { title: "Night before", hook: "Midnight checkout", beats: [
    { time: "0–3s", visual: "Night, a bedroom lit by the Flip's cover screen showing 23:59", voiceover: "Jam 23.59…", onscreen: "" },
    { time: "3–8s", visual: "She flips it open and taps pre-order, smiling", voiceover: "Pre-order duluan.", onscreen: "Pre-order dibuka" },
    { time: "8–12s", visual: "Morning: the gift bundle arrives at the door", voiceover: "Plus bundle gift.", onscreen: "Bonus bundle gift" },
    { time: "12–15s", visual: "End card", voiceover: "Sebelum 12.12.", onscreen: "Pre-order sebelum 12.12" } ] },
];

// ---------- actions ----------
const A = {};
A.role = (v) => { S.role = v; save(); render(); };
A.follow = (v, el) => { S.follow = el.checked; save(); };
A.reset = async () => { if (!confirm("Start the demo again from a new brief?")) return; const keepRef = S.productRef; S = fresh(); S.productRef = keepRef; await save(); render(); };
A.switchTo = (r) => { S.role = r; save(); render(); };

A.markFinal = () => {
  readForm("brief", S.brief);
  S.started = true; S.elapsed = 0;
  advance("planner", "AM", "Marked the brief final. SLA clock started (5 business days, 45 working hours).");
};
A.pickTrend = (id) => { S.trend = TRENDS.find((t) => t.id === id); save(); render(); };
A.draftDirection = async () => {
  if (!S.trend) { toast("Pick a trend first."); return; }
  busy.dir = true; render();
  const out = await aiJSON(
    `Brief:\n${briefText()}\n\nTrend from the Trend Library (social listening): ${S.trend.name} (${S.trend.growth}, ${S.trend.src}). ${S.trend.note}\n\nWrite the trend direction that completes this brief. Return JSON with keys: insight, angle, tone, post_time, dos, donts. Each value one or two short sentences, in English.`,
    "You are a Strategic Planner at Cheil Indonesia, a creative agency working for Samsung Indonesia. You turn social-listening trends into a sharp creative direction for 15-second short-form videos. Be specific to Indonesia.");
  S.direction = out && out.insight ? out : { ...SAMPLE_DIRECTION, _fb: true };
  busy.dir = false; save(); render();
};
A.handToCW = () => {
  if (!S.direction) { toast("Draft or write the trend direction first."); return; }
  readForm("dir", S.direction);
  if (!S.look) S.look = S.direction.tone || "";
  advance("script", "SP", `Completed the brief with the trend direction (${S.trend ? S.trend.name : "no trend"}) and handed it to the Copywriter.`);
};
A.genScripts = async () => {
  readForm("form", S.form);
  busy.scripts = true; render();
  const n = Math.max(1, Math.min(4, parseInt(S.form.n, 10) || 3));
  const out = await aiJSON(
    `Brief:\n${briefText()}\n\nTrend direction:\n${dirText()}\n\nCopywriter's form:\n- Hook style: ${S.form.hook}\n- Product focus: ${S.form.focus}\n- Must say: ${S.form.must}\n- Language: ${S.form.lang}\n- Notes: ${S.form.notes || "none"}\n\nWrite ${n} different script options for one 15-second vertical video. Return JSON: {"options":[{"title":"2-4 words","hook":"one line","beats":[{"time":"0–3s","visual":"what we see, one sentence","voiceover":"spoken line in the requested language","onscreen":"short on-screen text or empty"}]}]}. Each option has 4 beats that add up to 15 seconds. Use the product name exactly as given and include the mandatories.`,
    "You are a senior copywriter at Cheil Indonesia writing short-form video scripts for Samsung Indonesia. Scripts are fast, local and on-brand. Never invent prices or claims not in the brief.");
  S.options = out && Array.isArray(out.options) && out.options.length ? out.options.slice(0, n) : SAMPLE_OPTIONS.slice(0, n).map((o) => ({ ...o, _fb: true }));
  S.pick = null; S.script = null;
  busy.scripts = false; log("CW", `Generated ${S.options.length} AI script options.`); save(); render();
};
A.usePick = (i) => { S.pick = +i; S.script = JSON.parse(JSON.stringify(S.options[+i])); S.scriptVersions = 1; save(); render(); };
A.reviseScript = async () => {
  readBeats();
  const ins = val("revise"); if (!ins) { toast("Type how the script should change."); return; }
  busy.revise = true; render();
  const out = await aiJSON(
    `Current script (JSON):\n${JSON.stringify({ title: S.script.title, hook: S.script.hook, beats: S.script.beats })}\n\nBrief mandatories: ${S.brief.mandatories}\nInstruction from the copywriter: ${ins}\n\nRewrite the script following the instruction. Keep the same JSON shape and 4 beats adding up to 15 seconds. Return only the JSON object.`,
    "You are a senior copywriter at Cheil Indonesia editing a 15-second script for Samsung Indonesia.");
  if (out && Array.isArray(out.beats)) { S.script = { ...S.script, ...out }; S.scriptVersions++; log("CW", `Revised the script by prompt: “${ins}”.`); }
  else toast("The AI could not revise the script right now. Edit it by hand instead.");
  busy.revise = false; save(); render();
};
A.scriptFinal = () => {
  readBeats();
  S.frames = S.script.beats.map((b, i) => ({ beat: i, prompt: "", versions: [], cur: -1 }));
  advance("images", "CW", `Marked script “${S.script.title}” final (version ${S.scriptVersions}).`);
};
A.uploadRef = (v, el) => {
  const f = el.files && el.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = async () => { S.productRef = await shrink(r.result, 768); save(); render(); toast("Product reference added. New frames will follow it."); }; r.readAsDataURL(f);
};
A.clearRef = () => { S.productRef = null; save(); render(); };
function framePrompt(b) {
  const ref = S.productRef ? "Use the attached product photo as the exact reference for the phone's design and colour; show it naturally in the scene." : "If a smartphone appears, keep it generic and partly out of focus; do not show any brand.";
  return `Vertical 9:16 photorealistic advertising still for a 15-second short-form video by Samsung Indonesia.\nScene: ${b.visual}\nSetting: contemporary urban Indonesia, Indonesian people.\nLook and mood: ${S.look || "warm, cinematic, natural light"}.\n${ref}\nDo not render any text, captions, logos, watermarks or brand names.`;
}
A.genFrames = async () => {
  S.look = val("look") || S.look;
  busy.frames = true; render();
  S.frames.forEach((f) => { f.busy = true; }); render();
  await Promise.all(S.frames.map(async (f, i) => {
    const b = S.script.beats[i];
    let img = await aiImage(framePrompt(b), [S.productRef]);
    const fb = !img; if (!img) img = placeholder(`Frame ${i + 1} · ${b.time}`, i, b.visual);
    f.versions.push({ img, prompt: "Generated from beat " + b.time, fb });
    f.cur = f.versions.length - 1; f.busy = false;
    render();
  }));
  save();
  busy.frames = false; log("AD", `AI generated ${S.frames.length} still images for the script.`); save(); render();
};
A.selFrame = (i) => { S.selFrame = +i; save(); render(); };
A.selVer = (v) => { const [i, k] = v.split(":").map(Number); S.frames[i].cur = k; save(); render(); };
A.refine = async () => {
  const ins = val("refine"); if (!ins) { toast("Type how the frame should change."); return; }
  const fr = S.frames[S.selFrame]; if (!fr || fr.cur < 0) return;
  busy.refine = true; fr.busy = true; render();
  const base = fr.versions[fr.cur].img;
  const p = `Edit this image: ${ins}.\nKeep the same scene, framing, people and product unless the instruction says otherwise. Vertical 9:16. No text, captions, logos or watermarks.`;
  let img = await aiImage(p, [base, S.productRef]);
  const fb = !img; if (!img) img = placeholder(`Frame ${S.selFrame + 1} · edited`, S.selFrame + 2, ins);
  fr.versions.push({ img, prompt: ins, fb }); fr.cur = fr.versions.length - 1; fr.busy = false; busy.refine = false;
  log("AD", `Refined frame ${S.selFrame + 1} by prompt: “${ins}”.`); save(); render();
};
A.regenFrame = async () => {
  const fr = S.frames[S.selFrame]; if (!fr) return;
  busy.refine = true; fr.busy = true; render();
  let img = await aiImage(framePrompt(S.script.beats[S.selFrame]) + "\nTry a different composition.", [S.productRef]);
  const fb = !img; if (!img) img = placeholder(`Frame ${S.selFrame + 1} · new`, S.selFrame + 3, S.script.beats[S.selFrame].visual);
  fr.versions.push({ img, prompt: "Regenerated", fb }); fr.cur = fr.versions.length - 1; fr.busy = false; busy.refine = false; save(); render();
};
A.submitBoard = () => {
  if (S.frames.some((f) => f.cur < 0)) { toast("Generate all frames first."); return; }
  const from = S.stage;
  if (from === "board_revision") advance("joint_rereview", "AD", "Revised the board by prompt after Samsung's feedback; booked the joint re-review.");
  else advance("internal_board", "AD", "Submitted the board (script + still images) for internal review.");
};
A.aiCheck = async () => {
  busy.check = true; render();
  const out = await aiJSON(
    `Brief:\n${briefText()}\n\nScript (JSON):\n${JSON.stringify(S.script.beats)}\n\nCheck the script against the brief. Return JSON {"checks":[{"item":"short name","status":"pass" or "warn","note":"one sentence"}]} with 5 checks: on brief, key message, mandatories, product naming, tone for the audience.`,
    "You are a meticulous Executive Creative Director at Cheil Indonesia reviewing work for Samsung Indonesia before it goes to the client.");
  S.aiCheck = out && Array.isArray(out.checks) ? out.checks : [
    { item: "On brief", status: "pass", note: "The countdown idea drives pre-orders before 12.12.", _fb: true },
    { item: "Key message", status: "pass", note: "Pre-order and bundle gift both appear." },
    { item: "Mandatories", status: "warn", note: "Price and bundle terms must stay on screen for at least 3 seconds; check the last beat." },
    { item: "Product naming", status: "pass", note: "Galaxy Z Flip7 is named correctly." },
    { item: "Tone", status: "pass", note: "Casual Bahasa Indonesia fits 18–30 shopping-app users." } ];
  busy.check = false; save(); render();
};
A.pickDecision = (v) => { S.decision[S.stage] = v; save(); render(); };
A.decide = () => {
  const d = S.decision[S.stage]; const c = val("comment");
  if (!d) { toast("Choose a decision first."); return; }
  const who = stageOf(S.stage).owner;
  if (c) S.comments.unshift({ stage: S.stage, by: who, text: c, clock: now() });
  const st = S.stage;
  if (st === "internal_board") {
    if (d === "approve") advance("client_board", "CL", "Approved the board internally. Account sent it to Samsung.");
    else { S.rounds.board++; advance("images", "CL", "Sent the board back for revision by prompt." + (c ? ` “${c}”` : "")); }
  } else if (st === "client_board") {
    if (d === "approve") advance("production", "SS", "Samsung approved the board. Production starts.");
    else advance("board_revision", "SS", "Samsung requested changes to the board (one round)." + (c ? ` “${c}”` : ""));
  } else if (st === "joint_rereview") {
    advance("production", "SS", "Cheil and Samsung re-reviewed the board together and approved it.");
  } else if (st === "internal_content") {
    if (d === "approve") advance("client_content", "CL", "Approved the videos internally. Account sent them to Samsung.");
    else advance("production", "CL", "Sent the videos back to production." + (c ? ` “${c}”` : ""));
  } else if (st === "client_content") {
    if (d === "approve") advance("closed", "SS", "Samsung approved the content. Account closed the task and delivered the final files.");
    else advance("content_revision", "SS", "Samsung requested one round of content changes." + (c ? ` “${c}”` : ""));
  } else if (st === "internal_rereview") {
    advance("closed", "CL", "Internal re-review passed. Account closed the task; further changes need a new brief.");
  }
};
A.render = async () => {
  busy.render = true; render();
  await new Promise((r) => setTimeout(r, 1800));
  const hooks = ["3 hari lagi", "2 hari lagi", "Besok 12.12", "Malam ini", "Last call"];
  S.videos = Array.from({ length: S.brief.videos || 5 }, (_, v) => ({
    name: `V${v + 1} · ${hooks[v] || "Variant " + (v + 1)}`,
    caps: S.script.beats.map((b, i) => (i === 0 ? hooks[v] || b.onscreen : b.onscreen) || ""),
  }));
  busy.render = false;
  if (S.stage === "content_revision") { readCaps(); advance("internal_rereview", "VE", "Applied Samsung's changes and re-rendered the videos."); }
  else { log("VE", `Rendered ${S.videos.length} variants (Flow, After Effects, Suno) and uploaded them.`); save(); render(); }
};
A.sendContent = () => { if (!S.videos.length) { toast("Render and upload the variants first."); return; } advance("internal_content", "VE", `Uploaded ${S.videos.length} videos for internal content review.`); };
A.applyRevision = () => { readCaps(); advance("internal_rereview", "VE", "Applied Samsung's changes to the on-screen text and re-rendered the videos."); };
A.play = (i) => playVideo(+i);

// ---------- form readers ----------
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; }
function readForm(prefix, obj) { document.querySelectorAll(`[data-f^="${prefix}."]`).forEach((el) => { obj[el.dataset.f.split(".")[1]] = el.value; }); }
function readBeats() { document.querySelectorAll("[data-beat]").forEach((el) => { const [i, k] = el.dataset.beat.split(":"); S.script.beats[+i][k] = el.value; }); }
function readCaps() { document.querySelectorAll("[data-cap]").forEach((el) => { const [v, i] = el.dataset.cap.split(":"); S.videos[+v].caps[+i] = el.value; }); }
const briefText = () => `Campaign: ${S.brief.campaign}\nProduct: ${S.brief.product}\nObjective: ${S.brief.objective}\nKey message: ${S.brief.message}\nAudience: ${S.brief.audience}\nChannels: ${S.brief.channels}\nReady to post: ${S.brief.ready}\nMandatories: ${S.brief.mandatories}\nOutput: ${S.brief.videos} short-form videos, 15 seconds each`;
const dirText = () => S.direction ? `Trend: ${S.trend ? S.trend.name : "-"}\nInsight: ${S.direction.insight}\nAngle: ${S.direction.angle}\nTone: ${S.direction.tone}\nPost time: ${S.direction.post_time}\nDo: ${S.direction.dos}\nDon't: ${S.direction.donts}` : "none";

// ---------- video player ----------
let timers = {};
function playVideo(v) {
  const el = document.querySelector(`[data-player="${v}"]`); if (!el) return;
  clearInterval(timers[v]); el.classList.remove("ended");
  const imgs = el.querySelectorAll("img"); const cap = el.querySelector(".cap"); const bar = el.querySelector(".prog i");
  const caps = S.videos[v].caps; const n = imgs.length; let t = 0; const per = 15000 / n;
  const show = (k) => { imgs.forEach((im, j) => im.classList.toggle("on", j === k)); cap.textContent = caps[k] || ""; };
  show(0); bar.style.width = "0%";
  timers[v] = setInterval(() => { t += 100; bar.style.width = Math.min(100, t / 150) + "%"; const k = Math.min(n - 1, Math.floor(t / per)); show(k); if (t >= 15000) { clearInterval(timers[v]); el.classList.add("ended"); } }, 100);
}

// ---------- views ----------
function render() {
  const app = document.getElementById("app");
  const st = stageOf(S.stage);
  app.innerHTML = topbar() + `<div class="wrap">${head()}${stepper()}${slaBar()}<div class="grid"><div class="main">${stageView(st)}</div><div class="side">${sideView()}</div></div></div>`;
}
function topbar() {
  const opts = Object.entries(ROLES).map(([k, v]) => `<option value="${k}"${S.role === k ? " selected" : ""}>${esc(v)}</option>`).join("");
  return `<header class="top"><div class="brand">Creative Hub<small>Live demo · Cheil Indonesia × Samsung</small></div>
  <span id="aistat" class="pill ${aiStatus.ok === true ? "ok" : aiStatus.ok === false ? "warn" : "ghost"}">${esc(aiStatus.msg)}</span>
  <div class="spacer"></div>
  <div class="rolebox"><label for="role">Viewing as</label><select id="role" data-change="role">${opts}</select></div>
  <label class="chk"><input type="checkbox" data-change="follow"${S.follow ? " checked" : ""}> Follow the hand-off</label>
  <button class="btn sec small" data-act="reset">Reset demo</button></header>`;
}
function head() {
  return `<div class="head"><div><h1>${esc(S.brief.campaign)}</h1><p>${esc(S.brief.product)} · ${S.brief.videos} short-form videos, 15 s each · BAU workflow</p></div>
  <div class="actions"><span class="pill bau">BAU</span><span class="pill navy">Now: ${esc(stageOf(S.stage).label)}</span></div></div>`;
}
function stepper() {
  const done = new Set(S.path);
  return `<nav class="stepper" aria-label="Workflow steps">${STAGES.map((s) => {
    const cls = s.id === S.stage ? "cur" : done.has(s.id) ? "done" : s.optional ? "skip" : "";
    return `<div class="step ${cls}"><b>${esc(s.label)}</b><span>${esc(ROLES[s.owner].split(" (")[0])}${s.hours ? " · " + fmtH(s.hours) : ""}</span></div>`;
  }).join("")}</nav>`;
}
function slaBar() {
  const pct = Math.min(100, (S.elapsed / SLA_H) * 100);
  const days = [1, 2, 3, 4].map((d) => `<i class="day" style="left:${(d * DAY_H / SLA_H) * 100}%"></i>`).join("");
  const left = SLA_H - S.elapsed;
  const status = !S.started ? `<span class="pill ghost" style="background:#ECECF1;color:#55577A">Clock starts when the brief is marked final</span>`
    : S.stage === "closed" ? `<span class="pill ok">Closed in ${fmtH(S.elapsed)} · SLA met</span>`
    : `<span class="pill ${left > 9 ? "ok" : "warn"}">${fmtH(left)} left of 45 h</span>`;
  return `<section class="sla" aria-label="SLA clock"><div class="row"><b style="color:#1C1D4F">SLA clock · working hours (1 business day = 9 h)</b>${status}</div>
  <div class="bar"><div class="fill" style="width:${pct}%"></div>${days}</div>
  <div class="row muted"><span>Elapsed ${fmtH(S.elapsed)} · Day ${Math.min(5, Math.floor(S.elapsed / DAY_H) + 1)} of 5</span><span>Simulated: each hand-off adds the step's planned turnaround</span></div></section>`;
}
function waitingFor(st) {
  return `<div class="waiting"><span>This step is with the <b>${esc(ROLES[st.owner])}</b>. You're viewing as ${esc(ROLES[S.role])}.</span><button class="btn small" data-act="switchTo" data-v="${st.owner}">Switch to ${esc(ROLES[st.owner].split(" (")[0])}</button></div>`;
}
function stageView(st) {
  const mine = S.role === st.owner || (st.id === "joint_rereview" && S.role === "CL") || (st.id === "board_revision" && S.role === "CW");
  const bp = (t) => `<p class="bpmn">BPMN step: ${esc(t)}</p>`;
  const wait = mine ? "" : waitingFor(st);
  const ro = !mine;
  switch (st.id) {
    case "brief": return `<section class="card"><h2>New brief <span class="pill" style="background:#ECECF1">Draft</span></h2>${bp("Account · Prepare & finalize brief, create task")}${wait}
      <div class="g2">${fld("brief.campaign", "Campaign", S.brief.campaign, ro)}${fld("brief.product", "Product", S.brief.product, ro)}</div>
      ${fld("brief.objective", "Objective", S.brief.objective, ro)}${area("brief.message", "Key message", S.brief.message, ro, 2)}
      <div class="g2">${fld("brief.audience", "Target audience", S.brief.audience, ro)}${fld("brief.channels", "Channels", S.brief.channels, ro)}</div>
      <div class="g2">${fld("brief.ready", "Ready to post", S.brief.ready, ro)}${fld("brief.videos", "Videos", S.brief.videos, true)}</div>
      ${area("brief.mandatories", "Mandatories", S.brief.mandatories, ro, 2)}
      ${mine ? `<div class="actions"><button class="btn" data-act="markFinal">Mark brief final · start SLA clock</button><span class="note">Clarify open questions with Samsung before this: clarification is outside the SLA.</span></div>` : ""}</section>`;
    case "planner": return `<section class="card"><h2>Complete the brief <span class="pill ok">Step: 2 h</span></h2>${bp("Strategic Planner · Complete brief with trend direction (reads the Trend Library)")}${wait}
      <div class="ro">${roBrief()}</div></section>
      <section class="card"><h2>Trend Library <span class="note">Social listening · sample data until the SONAR API is connected</span></h2>
      <div class="g2">${TRENDS.map((t) => `<div class="trend${S.trend && S.trend.id === t.id ? " sel" : ""}"><div class="t"><span>${esc(t.name)}</span><span class="pill ok">${esc(t.growth)}</span></div><p class="muted">${esc(t.src)} · ${esc(t.window)}</p><p style="margin:0;font-size:13px">${esc(t.note)}</p>${mine ? `<button class="btn sec small" data-act="pickTrend" data-v="${t.id}">${S.trend && S.trend.id === t.id ? "Selected" : "Use this trend"}</button>` : ""}</div>`).join("")}</div></section>
      <section class="card"><h2>Trend direction ${S.direction && S.direction._fb ? '<span class="tag-fb">sample</span>' : S.direction ? '<span class="pill ok">AI draft · edit freely</span>' : ""}</h2>
      ${mine ? `<div class="actions"><button class="btn ai" data-act="draftDirection"${busy.dir ? " disabled" : ""}>${busy.dir ? '<span class="spinner"></span> Drafting…' : "Draft direction with AI"}</button><span class="note">Uses the brief + the selected trend</span></div>` : ""}
      ${S.direction ? `<div class="g2">${area("dir.insight", "Insight", S.direction.insight, ro, 3)}${area("dir.angle", "Creative angle", S.direction.angle, ro, 3)}</div><div class="g2">${fld("dir.tone", "Tone and look", S.direction.tone, ro)}${fld("dir.post_time", "Post time", S.direction.post_time, ro)}</div><div class="g2">${area("dir.dos", "Do", S.direction.dos, ro, 2)}${area("dir.donts", "Don't", S.direction.donts, ro, 2)}</div>` : '<p class="muted">Pick a trend, then let the AI draft the direction.</p>'}
      ${mine && S.direction ? `<div class="actions"><button class="btn" data-act="handToCW">Hand off to Copywriter</button></div>` : ""}</section>`;
    case "script": return scriptView(mine, wait, bp);
    case "images": case "board_revision": return imagesView(st, mine, wait, bp);
    case "internal_board": case "client_board": case "joint_rereview": return boardReview(st, mine, wait, bp);
    case "production": case "content_revision": return productionView(st, mine, wait, bp);
    case "internal_content": case "client_content": case "internal_rereview": return contentReview(st, mine, wait, bp);
    case "closed": return closedView();
  }
  return "";
}
function fld(key, label, v, ro) { const id = key.replace(".", "_"); return `<div class="f"><label for="${id}">${esc(label)}</label><input id="${id}" data-f="${key}" value="${esc(v)}"${ro ? " readonly" : ""}></div>`; }
function area(key, label, v, ro, rows) { const id = key.replace(".", "_"); return `<div class="f"><label for="${id}">${esc(label)}</label><textarea id="${id}" data-f="${key}" rows="${rows || 3}"${ro ? " readonly" : ""}>${esc(v)}</textarea></div>`; }
function roBrief() { const b = S.brief; return [["Campaign", b.campaign], ["Product", b.product], ["Objective", b.objective], ["Key message", b.message], ["Audience", b.audience], ["Mandatories", b.mandatories]].map(([k, v]) => `<div><b>${k}</b>${esc(v)}</div>`).join(""); }
function sel(id, label, v, options) { return `<div class="f"><label for="${id}">${label}</label><select id="${id}" data-f="form.${id.split("_")[1]}">${options.map((o) => `<option${o == v ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></div>`; }

function scriptView(mine, wait, bp) {
  const f = S.form;
  return `<section class="card"><h2>Brief form for the AI <span class="pill ok">Step: 1 h</span></h2>${bp("Copywriter · Prompt AI for script options → pick, edit by hand or by prompt → Script final?")}${wait}
    <p class="muted"><b>Trend direction:</b> ${esc(S.direction ? S.direction.angle : "-")}</p>
    <div class="g2">${sel("form_hook", "Hook style", f.hook, ["Countdown reveal", "Question", "Problem → solution", "Trend sound", "POV"])}${fld("form.focus", "Product focus", f.focus, !mine)}</div>
    <div class="g2">${fld("form.must", "Must say", f.must, !mine)}${sel("form_lang", "Language", f.lang, ["Bahasa Indonesia, casual", "English", "Bahasa Indonesia + English mix"])}</div>
    <div class="g2">${sel("form_n", "Options", f.n, [2, 3, 4])}${fld("form.notes", "Anything else (optional)", f.notes, !mine)}</div>
    ${mine ? `<div class="actions"><button class="btn ai" data-act="genScripts"${busy.scripts ? " disabled" : ""}>${busy.scripts ? '<span class="spinner"></span> Writing options…' : "Generate script options"}</button></div>` : ""}</section>
    ${S.options.length ? `<section class="card"><h2>Script options ${S.options[0]._fb ? '<span class="tag-fb">sample</span>' : '<span class="pill ok">AI drafts</span>'}</h2><div class="g3">${S.options.map((o, i) => `<div class="opt${S.pick === i ? " sel" : ""}"><b style="color:#1C1D4F">${i + 1}. ${esc(o.title)}</b><p class="muted">${esc(o.hook || "")}</p><table class="beats"><tbody>${(o.beats || []).map((b) => `<tr><td style="white-space:nowrap;color:#55577A">${esc(b.time)}</td><td>${esc(b.visual)}<br><i style="color:#55577A">“${esc(b.voiceover)}”</i></td></tr>`).join("")}</tbody></table>${mine ? `<button class="btn ${S.pick === i ? "" : "sec"} small" data-act="usePick" data-v="${i}">${S.pick === i ? "Selected" : "Use this option"}</button>` : ""}</div>`).join("")}</div></section>` : ""}
    ${S.script ? `<section class="card"><h2>Selected script · version ${S.scriptVersions} <span class="note">Edit by hand, or tell the AI what to change</span></h2>
      <table class="beats"><thead><tr><th>Time</th><th>Visual</th><th>Voice-over</th><th>On screen</th></tr></thead><tbody>${S.script.beats.map((b, i) => `<tr><td style="white-space:nowrap">${esc(b.time)}</td>${["visual", "voiceover", "onscreen"].map((k) => `<td><textarea rows="3" data-beat="${i}:${k}" aria-label="${k} ${i + 1}"${mine ? "" : " readonly"}>${esc(b[k])}</textarea></td>`).join("")}</tr>`).join("")}</tbody></table>
      ${mine ? `<div class="inline"><div class="f"><label for="revise">Revise by prompt</label><input id="revise" placeholder="e.g. make the hook faster and mention the bundle gift in the first 3 seconds"></div><button class="btn ai" data-act="reviseScript"${busy.revise ? " disabled" : ""}>${busy.revise ? '<span class="spinner"></span> Revising…' : "Revise with AI"}</button></div>
      <div class="actions"><button class="btn" data-act="scriptFinal">Mark script final · generate still images</button></div>` : ""}</section>` : ""}`;
}
function imagesView(st, mine, wait, bp) {
  const fb = S.comments.find((c) => c.stage === "client_board");
  const fr = S.frames[S.selFrame];
  const anyImg = S.frames.some((f) => f.cur >= 0);
  return `<section class="card"><h2>${st.id === "board_revision" ? "Revise the board" : "AI still images"} <span class="pill ok">Step: ${fmtH(st.hours)}</span></h2>${bp(st.id === "board_revision" ? "Copywriter + Art Director · Revise board by prompt → joint re-review (BAU)" : "Creative AI · Generate still images → Art Director · Review, refine by prompt → Satisfied?")}${wait}
    ${st.id === "board_revision" && fb ? `<div class="alert"><b>Samsung's feedback:</b> ${esc(fb.text)}</div>` : ""}
    ${S.rounds.board > 1 && st.id === "images" ? `<div class="alert"><b>Creative Lead's feedback:</b> ${esc((S.comments.find((c) => c.stage === "internal_board") || {}).text || "Revise and resubmit.")}</div>` : ""}
    <div class="g2"><div class="f"><label for="look">Look and mood</label><input id="look" value="${esc(S.look)}"${mine ? "" : " readonly"} placeholder="e.g. warm evening light, playful, Jakarta café"></div>
    <div class="f"><label>Product reference (optional)</label>${S.productRef ? `<div class="actions"><img src="${S.productRef}" alt="Product reference" style="height:64px;border-radius:8px">${mine ? '<button class="btn sec small" data-act="clearRef">Remove</button>' : ""}</div>` : mine ? `<input type="file" accept="image/*" data-change="uploadRef" aria-label="Upload a product reference photo">` : '<p class="muted">None</p>'}<span class="note">An official product shot keeps the phone accurate.</span></div></div>
    ${mine ? `<div class="actions"><button class="btn ai" data-act="genFrames"${busy.frames ? " disabled" : ""}>${busy.frames ? '<span class="spinner"></span> Generating…' : anyImg ? "Generate all frames again" : "Generate still images"}</button><span class="note">One image per script beat · ${S.frames.length} frames</span></div>` : ""}
    <div class="frames">${S.frames.map((f, i) => { const v = f.versions[f.cur]; return `<div class="frame"><button class="img${S.selFrame === i ? " sel" : ""}" data-act="selFrame" data-v="${i}" aria-label="Frame ${i + 1}">${v ? `<img src="${v.img}" alt="Frame ${i + 1}">` : ""}<span class="lab">${i + 1} · ${esc(S.script.beats[i].time)}</span>${f.busy ? '<span class="spin"><span class="spinner"></span>&nbsp;AI…</span>' : ""}</button>${v && v.fb ? '<span class="tag-fb">sample</span>' : v ? `<span class="note">v${f.cur + 1}${f.versions.length > 1 ? " of " + f.versions.length : ""}</span>` : ""}</div>`; }).join("")}</div>
    </section>
    ${fr && fr.cur >= 0 ? `<section class="card"><h2>Frame ${S.selFrame + 1} · ${esc(S.script.beats[S.selFrame].time)}</h2><p class="muted">${esc(S.script.beats[S.selFrame].visual)}</p>
      <div class="vers" aria-label="Versions">${fr.versions.map((v, k) => `<button class="${fr.cur === k ? "sel" : ""}" data-act="selVer" data-v="${S.selFrame}:${k}" title="${esc(v.prompt)}"><img src="${v.img}" alt="Version ${k + 1}"></button>`).join("")}</div>
      <div class="log" style="max-height:120px">${fr.versions.map((v, k) => `<div class="e"><b>v${k + 1}</b> ${esc(v.prompt)}</div>`).reverse().join("")}</div>
      ${mine ? `<div class="inline"><div class="f"><label for="refine">Refine this frame by prompt</label><input id="refine" placeholder="e.g. warmer evening light, add the Jakarta skyline behind her"></div><button class="btn ai" data-act="refine"${busy.refine ? " disabled" : ""}>${busy.refine ? '<span class="spinner"></span> Editing…' : "Refine with AI"}</button><button class="btn sec" data-act="regenFrame"${busy.refine ? " disabled" : ""}>New take</button></div>` : ""}</section>` : ""}
    ${mine && anyImg ? `<section class="card"><h2>Satisfied with the board?</h2><div class="actions"><button class="btn" data-act="submitBoard">${st.id === "board_revision" ? "Send to joint re-review" : "Submit board for internal review"}</button></div></section>` : ""}`;
}
function boardHTML() {
  return `<table class="beats"><tbody>${S.script.beats.map((b) => `<tr><td style="white-space:nowrap;color:#55577A">${esc(b.time)}</td><td>${esc(b.visual)}<br><i style="color:#55577A">“${esc(b.voiceover)}”</i>${b.onscreen ? `<br><b>On screen:</b> ${esc(b.onscreen)}` : ""}</td></tr>`).join("")}</tbody></table>
  <div class="frames">${S.frames.map((f, i) => { const v = f.versions[f.cur]; return `<div class="frame"><div class="img" style="cursor:default">${v ? `<img src="${v.img}" alt="Frame ${i + 1}">` : ""}<span class="lab">${i + 1} · ${esc(S.script.beats[i].time)}</span></div></div>`; }).join("")}</div>`;
}
function decisionHTML(opts, mine) {
  const d = S.decision[S.stage];
  return `<div class="decision">${opts.map(([v, t, sub]) => `<label class="radio${d === v ? " sel" : ""}"><input type="radio" name="dec" data-change="pickDecision" value="${v}"${d === v ? " checked" : ""}${mine ? "" : " disabled"}><span><b style="font-size:14px">${t}</b><br><span class="note">${sub}</span></span></label>`).join("")}
  ${mine ? `<div class="f"><label for="comment">Comment ${S.stage.startsWith("client") ? "(one combined set of feedback)" : "(optional)"}</label><textarea id="comment" rows="2" placeholder="${S.stage === "client_board" ? "e.g. Use the red Flip colour in frames 2 and 4" : "Feedback for the team"}"></textarea></div><div class="actions"><button class="btn" data-act="decide">Send decision</button></div>` : ""}</div>`;
}
function boardReview(st, mine, wait, bp) {
  const client = st.id !== "internal_board";
  const title = st.id === "internal_board" ? "Internal board review" : st.id === "client_board" ? "Board review" : "Joint re-review (Cheil + Samsung)";
  const opts = st.id === "internal_board" ? [["approve", "Approve and send to Samsung", "Account sends the board to Samsung."], ["revise", "Request revision", "Copywriter and Art Director revise by prompt."]]
    : st.id === "client_board" ? [["approve", "Approve the board", "Cheil starts video production."], ["revise", "Request changes", "One round: Cheil revises, then we re-review together."]]
    : [["approve", "Approved together", "Video production starts."]];
  return `<section class="card${client ? " portal" : ""}">${client ? '<span class="portal-tag">Samsung review portal</span>' : ""}<h2>${title} <span class="pill ok">Step: ${fmtH(st.hours)}</span></h2>${bp(st.id === "internal_board" ? "Creative Leads · Internal review → Approved?" : st.id === "client_board" ? "Samsung · Review board → Approved? (BAU: one revision, then joint re-review)" : "Cheil + Samsung · Re-review board together")}${wait}
    ${boardHTML()}</section>
    ${st.id === "internal_board" ? `<section class="card"><h2>AI pre-check</h2>${mine ? `<div class="actions"><button class="btn ai" data-act="aiCheck"${busy.check ? " disabled" : ""}>${busy.check ? '<span class="spinner"></span> Checking…' : "Check the board against the brief"}</button></div>` : ""}
      ${S.aiCheck ? `<div class="checks">${S.aiCheck.map((c) => `<div class="check"><span class="pill ${c.status === "pass" ? "ok" : "warn"}">${c.status === "pass" ? "Pass" : "Check"}</span><span><b>${esc(c.item)}</b> · ${esc(c.note)}</span></div>`).join("")}</div>${S.aiCheck[0]._fb ? '<span class="tag-fb">sample</span>' : ""}` : '<p class="muted">The AI reads the brief and the script and flags anything off-brief before the client sees it.</p>'}</section>` : ""}
    <section class="card"><h2>Your decision</h2>${decisionHTML(opts, mine)}</section>`;
}
function playerHTML(v, i) {
  return `<div class="vid"><div class="player" data-player="${i}"><div class="prog"><i></i></div>${S.frames.map((f, k) => `<img src="${(f.versions[f.cur] || {}).img || ""}" alt="" class="${k === 0 ? "on" : ""}">`).join("")}<div class="cap">${esc(v.caps[0] || "")}</div><div class="end"><span style="font-size:18px">SAMSUNG</span><span style="font-size:13px;font-weight:500">${esc(S.brief.product)}</span><span style="font-size:12px;font-weight:500">${esc(S.brief.mandatories.split(".")[0])}</span></div><div class="ctrl"><button data-act="play" data-v="${i}">▶ Play 0:15</button></div></div><b style="font-size:13px">${esc(v.name)}</b></div>`;
}
function productionView(st, mine, wait, bp) {
  const fb = S.comments.find((c) => c.stage === "client_content");
  return `<section class="card"><h2>${st.id === "content_revision" ? "Content revision" : "Video production"} <span class="pill ok">Step: ${fmtH(st.hours)}</span></h2>${bp(st.id === "content_revision" ? "Creative · Revise content (Samsung feedback) → internal re-review" : "Creative · Produce videos in Flow, After Effects and Suno → upload")}${wait}
    ${st.id === "content_revision" && fb ? `<div class="alert"><b>Samsung's feedback:</b> ${esc(fb.text)}</div>` : ""}
    <p class="muted">Production happens in Flow, After Effects and Suno; finished files are uploaded here. In this demo the approved frames become animated previews.</p>
    ${mine && st.id === "production" ? `<div class="actions"><button class="btn ai" data-act="render"${busy.render ? " disabled" : ""}>${busy.render ? '<span class="spinner"></span> Rendering…' : S.videos.length ? "Render again" : "Render and upload " + (S.brief.videos || 5) + " variants"}</button></div>` : ""}
    ${S.videos.length ? `<div class="vids">${S.videos.map(playerHTML).join("")}</div>` : ""}
    ${st.id === "content_revision" && S.videos.length ? `<h3>Edit on-screen text</h3>${S.videos.map((v, i) => `<div class="f"><label>${esc(v.name)}</label><div class="g3">${v.caps.map((c, k) => `<input data-cap="${i}:${k}" value="${esc(c)}" aria-label="${esc(v.name)} beat ${k + 1}"${mine ? "" : " readonly"}>`).join("")}</div></div>`).join("")}${mine ? '<div class="actions"><button class="btn" data-act="applyRevision">Re-render and send to internal re-review</button></div>' : ""}` : ""}
    ${mine && st.id === "production" && S.videos.length ? `<div class="actions"><button class="btn" data-act="sendContent">Send to internal content review</button></div>` : ""}</section>`;
}
function contentReview(st, mine, wait, bp) {
  const client = st.id === "client_content";
  const opts = st.id === "internal_content" ? [["approve", "Approve and send to Samsung", "Account sends the videos to Samsung."], ["revise", "Send back to production", "The video editor revises."]]
    : st.id === "client_content" ? [["approve", "Approve all", "Cheil closes the task and delivers the final files."], ["revise", "Request changes", "One round. Later changes need a new brief."]]
    : [["approve", "Re-review passed", "Account closes the task."]];
  const title = st.id === "internal_content" ? "Internal content review" : st.id === "client_content" ? "Content review" : "Internal re-review";
  return `<section class="card${client ? " portal" : ""}">${client ? '<span class="portal-tag">Samsung review portal</span>' : ""}<h2>${title} <span class="pill ok">Step: ${fmtH(st.hours)}</span></h2>${bp(st.id === "client_content" ? "Samsung · Review content → Approved? (No: Cheil revises once, internal re-review)" : st.id === "internal_content" ? "Creative Leads · Internal content review" : "Creative Leads · Internal re-review → process complete")}${wait}
    <div class="vids">${S.videos.map(playerHTML).join("")}</div></section>
    <section class="card"><h2>Your decision</h2>${decisionHTML(opts, mine)}</section>`;
}
function closedView() {
  const met = S.elapsed <= SLA_H;
  return `<section class="card"><h2>Task closed <span class="pill ${met ? "ok" : "bad"}">${met ? "SLA met" : "SLA missed"} · ${fmtH(S.elapsed)} of 45 h</span></h2>
    <p class="muted">Final files delivered to Samsung. Any further change starts a new brief linked to this one.</p>
    <div class="vids">${S.videos.map(playerHTML).join("")}</div></section>
    <section class="card"><h2>Hand-off log</h2><table class="beats"><thead><tr><th>Clock</th><th>Who</th><th>What</th></tr></thead><tbody>${S.log.slice().reverse().map((e) => `<tr><td style="white-space:nowrap">${fmtH(e.at)}</td><td style="white-space:nowrap">${esc(ROLES[e.actor])}</td><td>${esc(e.text)}</td></tr>`).join("")}</tbody></table>
    <div class="actions"><button class="btn sec" data-act="reset">Run the demo again</button></div></section>`;
}
function sideView() {
  return `<section class="card"><h2>Hand-off log</h2><div class="log">${S.log.length ? S.log.map((e) => `<div class="e"><b>${esc(ROLES[e.actor])}</b> · ${esc(e.text)}<span>SLA clock ${fmtH(e.at)} · ${esc(e.clock)}</span></div>`).join("") : '<p class="muted">Every hand-off is timestamped here.</p>'}</div></section>
  <section class="card"><h2>Alerts</h2><div class="log" style="max-height:260px">${S.alerts.length ? S.alerts.slice(0, 12).map((a) => `<div class="alert"><b>${esc(a.ch)} → ${esc(ROLES[a.to])}</b><br>${esc(a.text)}</div>`).join("") : '<p class="muted">Email and Telegram alerts appear here.</p>'}</div></section>
  ${S.comments.length ? `<section class="card"><h2>Comments</h2><div class="log">${S.comments.map((c) => `<div class="e"><b>${esc(ROLES[c.by])}</b> · ${esc(c.text)}<span>${esc(stageOf(c.stage).label)}</span></div>`).join("")}</div></section>` : ""}`;
}

// ---------- events ----------
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const f = A[b.dataset.act]; if (f) { e.preventDefault(); f(b.dataset.v, b); }
});
document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-change]"); if (el) { const f = A[el.dataset.change]; if (f) f(el.value, el); return; }
  const fk = e.target.dataset && e.target.dataset.f;
  if (fk && fk.startsWith("form.")) { S.form[fk.split(".")[1]] = e.target.value; save(); }
});

// ---------- passcode ----------
function askPass() {
  if (document.querySelector(".modal")) return;
  const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = `<form class="card"><h2>Demo passcode</h2><p class="muted">The AI features need the demo passcode.</p><div class="f"><label for="pc">Passcode</label><input id="pc" type="password" autocomplete="off"></div><div class="actions"><button class="btn" type="submit">Save</button><button class="btn sec" type="button" id="pcx">Use samples only</button></div></form>`;
  document.body.appendChild(m);
  m.querySelector("form").onsubmit = (ev) => { ev.preventDefault(); localStorage.setItem("ch_pass", m.querySelector("#pc").value); m.remove(); checkAI(); };
  m.querySelector("#pcx").onclick = () => m.remove();
  m.querySelector("#pc").focus();
}
async function checkAI() {
  try {
    const r = await fetch("/api/ai/health", { cache: "no-store" }); const j = await r.json();
    if (!j.hasKey) setAI(false, "no API key yet");
    else { aiStatus = { ok: true, msg: "AI: ready (" + j.imageModel + ")" }; const el = document.getElementById("aistat"); if (el) { el.className = "pill ok"; el.textContent = aiStatus.msg; } if (j.hasPasscode && !passcode()) askPass(); }
  } catch { setAI(false, "API not reachable"); }
}

// ---------- boot ----------
(async () => {
  const saved = await DB.get("state");
  if (saved && saved.v === fresh().v) S = saved;
  render(); checkAI();
})();
})();
