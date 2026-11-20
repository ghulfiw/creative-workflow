/* Creative Hub · live demo. One brief through the BAU workflow (BPMN v3), with live AI. */
(function () {
"use strict";

// ---------- constants ----------
const ROLES = {
  AM: "Account Manager", SP: "Strategic Planner", CR: "Creative",
  CL: "Creative Lead (ECD)", VE: "Video Editor", SS: "Samsung reviewer",
};
const STAGES = [
  { id: "brief", label: "Brief", owner: "AM", hours: 1 },
  { id: "planner", label: "Complete brief", owner: "SP", hours: 2 },
  { id: "script", label: "AI scripts", owner: "CR", hours: 1 },
  { id: "images", label: "AI boards", owner: "CR", hours: 1 },
  { id: "internal_board", label: "Internal board review", owner: "CL", hours: 1.5 },
  { id: "client_board", label: "Samsung board review", owner: "SS", hours: 2 },
  { id: "board_revision", label: "Board revision", owner: "CR", hours: 1.5, optional: true },
  { id: "joint_rereview", label: "Joint re-review", owner: "SS", hours: 2, optional: true },
  { id: "production", label: "Video production", owner: "VE", hours: 4 },
  { id: "internal_content", label: "Internal content review", owner: "CL", hours: 2 },
  { id: "client_content", label: "Samsung content review", owner: "SS", hours: 2 },
  { id: "content_revision", label: "Content revision", owner: "VE", hours: 3, optional: true },
  { id: "internal_rereview", label: "Internal re-review", owner: "CL", hours: 7 / 6, optional: true },
  { id: "closed", label: "Closed", owner: "AM", hours: 0 },
];
const SLA_H = 45, DAY_H = 9, MAX_SCRIPTS = 5;
const stageOf = (id) => STAGES.find((s) => s.id === id);

// Trend Library: sample social-listening output (Snowball · local trend monitoring), until the SONAR API is connected.
// `sample` is the write-up from the reference doc; it is the AI's style example and the offline fallback.
const TRENDS = [
  { id: "crackgate", name: "Crackgate Wallpaper", type: "Meme / Issue-led Trend",
    what: "The iPhone Duo screen-crack conversation has inspired Indonesian creators to turn product concerns into memes, jokes and humorous content.",
    links: [["Threads", "https://www.threads.com/@richard001909/post/DfBrpNVEiUI"], ["Instagram", "https://www.instagram.com/p/De_SbwJBBVS/"], ["Instagram", "https://www.instagram.com/p/DfCTs_DBkHk/"]],
    linkNote: "Indonesian posts reacting to the screen crack through memes, humour and visual jokes.",
    sample: { insight: "The iPhone Duo screen-crack conversation has inspired Indonesian creators to turn product concerns into memes, jokes and humorous content.",
      so_what: "Product issues can quickly become entertainment, attracting attention beyond tech audiences and opening wider conversations about foldable smartphones.",
      now_what: "Samsung can join the conversation through relatable humour while reinforcing confidence in the Galaxy foldable experience, supported by authentic product demonstrations.",
      scd: "Turn foldable concerns into opportunities to showcase real Galaxy experiences.",
      opps: "Crack-proof comebacks: Answer the screen-crack jokes with playful, real Galaxy demos.\nFold test, live: Open and close the Fold8 on camera in everyday moments.\nWallpaper prank: Hook with a cracked-screen wallpaper, then reveal a perfect Galaxy screen." } },
  { id: "stopwedding", name: "Stop The Wedding", type: "Social / Cultural Format Trend",
    what: "Indonesian creators are adapting the “Stop The Wedding” format to humorously interrupt everyday situations and questionable decisions.",
    links: [["TikTok", "https://www.tiktok.com/@adie_space/video/7694144931836841222"]],
    linkNote: "Indonesian creators using the format in relatable everyday situations.",
    sample: { insight: "Indonesian creators are adapting the “Stop The Wedding” format to humorously interrupt everyday situations and questionable decisions.",
      so_what: "The format makes warnings and advice entertaining, allowing creators to challenge decisions without sounding overly serious or promotional.",
      now_what: "Samsung can adapt the format to encourage consumers to reconsider how they choose a foldable smartphone, highlighting the practical advantages of Galaxy.",
      scd: "Use the viral warning format to challenge common foldable purchase decisions.",
      opps: "Stop the checkout: Interrupt a foldable purchase with the viral warning format.\nCheck before you fold: Friends quiz each other on what to test in a foldable.\nHappy ending: Close every interruption with the Fold8 as the better choice." } },
  { id: "padel", name: "Padel Lifestyle", type: "Lifestyle Trend",
    what: "Padel is gaining attention as a social lifestyle activity, with Indonesian consumers sharing first-time experiences, equipment trials and moments with friends.",
    links: [["TikTok", "https://www.tiktok.com/@justpadeluk/video/7659392828841217302"]],
    linkNote: "Creators sharing their experiences of trying padel rackets before buying.",
    sample: { insight: "Padel is gaining attention as a social lifestyle activity, with Indonesian consumers sharing first-time experiences, equipment trials and moments with friends.",
      so_what: "Padel is not just about playing sports. It's also becoming a social experience where consumers connect, capture moments and share their activities.",
      now_what: "Samsung can connect Galaxy devices to consumers' active social lifestyles, demonstrating how Galaxy smartphones and wearables support their everyday experiences.",
      scd: "Position Galaxy as a companion for active, social lifestyles.",
      opps: "Hands-free match cam: Flex Mode films the rally from the bench.\nReplay on the big screen: Friends review the winning shot on the unfolded display.\nCourt to cafe: Follow the social side of padel, from the game to the hangout." } },
  { id: "purplejakarta", name: "Purple Jakarta (BTS Concert)", type: "Event / Fan Culture Trend",
    what: "Jakarta plans to turn parts of the city purple to welcome BTS's December concerts, creating excitement and conversations among Indonesian ARMY.",
    links: [], linkNote: "News coverage of Jakarta's icons turning purple and the Ministry of Tourism's preparations (18 Nov 2026); fan preparation videos.",
    sample: { insight: "Jakarta plans to turn parts of the city purple to welcome BTS's December concerts, creating excitement and conversations among Indonesian ARMY.",
      so_what: "The initiative creates a locally relevant moment for fans to express their excitement and share their experiences.",
      now_what: "Samsung can tap into the Purple Jakarta excitement by creating AI-assisted local content that celebrates fan culture and connects it with Galaxy experiences.",
      scd: "Use familiar Jakarta settings, purple-themed visuals and ARMY excitement to create engaging social content, naturally integrating relevant Galaxy experiences.",
      opps: "Transform Jakarta in Purple: Reimagine iconic Jakarta landmarks with purple-themed AI visuals, featuring Galaxy products.\nCapture the Fan Experience: Highlight how Galaxy's camera, zoom and large screen enhance memorable concert moments.\nTurn Fan Excitement Into Content: Use relatable concert preparations, fan reactions and anticipation to create entertaining Galaxy-focused content." } },
  { id: "gta6", name: "GTA VI", type: "Pop Culture / Gaming Trend",
    what: "GTA VI's release is generating excitement among Indonesian gamers, driving online discussions and reactions.",
    links: [], linkNote: "A viral post jokingly \u201cadjusting office hours\u201d for the GTA VI release; creators explaining why GTA VI is everywhere.",
    sample: { insight: "GTA VI's release is generating excitement among Indonesian gamers, driving online discussions and reactions.",
      so_what: "The hype is influencing everyday plans and priorities, sparking relatable jokes beyond gaming.",
      now_what: "Samsung can tap into the hype with AI-generated content that brings familiar Indonesian situations into a GTA-inspired world.",
      scd: "Reimagine everyday Indonesian life through GTA-inspired visuals, local humour and relatable scenarios, naturally integrating Galaxy products.",
      opps: "GTA-Inspired Humour: Turn GTA VI hype into relatable, humorous everyday scenarios, naturally featuring Galaxy products.\nIndonesian Life in GTA Mode: Turn familiar local situations into humorous GTA-style missions.\nGalaxy in the Game: Integrate Galaxy devices as part of the fictional GTA-inspired experience." } },
];
const DIR_FIELDS = [
  ["insight", "Insight · What's trending?", 3],
  ["so_what", "So What · Why does it matter?", 3],
  ["now_what", "Now What · What's the brand opportunity?", 3],
  ["scd", "Strategic Content Direction", 2],
  ["opps", "Creative Opportunities", 5],
];
const PROMPT_FIELDS = [["object", "OBJECT"], ["background", "BACKGROUND"], ["layout", "LAYOUT"], ["camera", "CAMERA"], ["lighting", "LIGHTING AND TONE"]];
const VIDEO_FIELDS = [["sequence", "SEQUENCE", 7], ["camera", "CAMERA", 3], ["audio", "AUDIO", 3]];

const fresh = () => ({
  v: 5, role: "AM", follow: true, stage: "brief", elapsed: 0, started: false,
  brief: {
    workflow: "BAU", campaign: "Snowball · Foldable confidence · Brief 1", product: "Galaxy Z Fold8",
    objective: "Win over foldable shoppers worried about screen durability after the iPhone Duo screen-crack conversation, and grow consideration for Galaxy Z Fold8.",
    message: "Galaxy Z Fold8: super thin and built for everyday folding. Choose your foldable with confidence.",
    audience: "22–35, Jakarta and Surabaya, smartphone upgraders considering a foldable", channels: "Instagram Reels, TikTok",
    ready: "1 Dec 2026", mandatories: "Show the real Galaxy Z Fold8 shape, no distortion. Competitor phones only as an unbranded dark silhouette, never named or shown with a logo. Samsung logo end card.",
    videos: 5,
  },
  trend: null, direction: null, dirVersions: 0,
  form: { hook: "Trend format", focus: "Galaxy Z Fold8 thin design and everyday folding", must: "Choose your foldable with confidence", lang: "Bahasa Indonesia, casual", n: 5, notes: "" },
  scripts: [],
  productRef: null, boards: [], selBoard: 0,
  decision: {}, comments: [], videos: [], log: [], alerts: [],
  rounds: { board: 1, content: 1 }, path: [], hist: [],
});

// ---------- storage (IndexedDB; images are too big for localStorage) ----------
const DB = {
  open() { return new Promise((ok, no) => { const r = indexedDB.open("creative-hub-demo", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }); },
  async get(k) { const db = await this.open(); return new Promise((ok) => { const t = db.transaction("kv").objectStore("kv").get(k); t.onsuccess = () => ok(t.result); t.onerror = () => ok(undefined); }); },
  async set(k, v) { const db = await this.open(); return new Promise((ok) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = () => ok(); t.onerror = () => ok(); }); },
};
let S = fresh();
let busy = {};            // ui-only: which AI calls are running
const ui = { bpOpen: true }; // ui-only: brief panel open or closed
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
  (S.hist = S.hist || []).push(entrySnap());
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
  try { const j = await api("/api/ai/text", { prompt, system, json: true }); setAI(true, null, j.model); return parseJSON(j.text); }
  catch (e) { setAI(false, e.message); return null; }
}
async function aiImage(prompt, refs) {
  try {
    const images = (refs || []).filter(Boolean).map((d) => ({ mimeType: d.slice(5, d.indexOf(";")), data: d.slice(d.indexOf(",") + 1) }));
    const j = await api("/api/ai/image", { prompt, images, aspectRatio: "9:16" });
    setAI(true, null, j.model);
    return await shrink("data:" + j.mimeType + ";base64," + j.data);
  } catch (e) { setAI(false, e.message); return null; }
}
function setAI(ok, msg, model) { aiStatus = ok ? { ok: true, msg: "AI: live" + (model ? " · " + model : "") } : { ok: false, msg: "AI: offline, using samples" + (msg ? " (" + msg.slice(0, 60) + ")" : "") }; const el = document.getElementById("aistat"); if (el) { el.className = "pill " + (ok ? "ok" : "warn"); el.textContent = aiStatus.msg; } }
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
const SAMPLE_SCRIPTS = [
  { title: "Setipis paspor", follows: "Shows the real thin, foldable Galaxy experience instead of talking about it.", hook: "Is that a passport, or a phone?", beats: [
    { time: "0–3s", visual: "Side view: a passport lies flat on a white table; a hand reaches for it", voiceover: "Cuma paspor?", onscreen: "" },
    { time: "3–7s", visual: "The hand lifts the passport: a closed Galaxy Z Fold8 was hidden underneath, the same size and just as thin", voiceover: "Eh, ada yang ngumpet.", onscreen: "Setipis paspor" },
    { time: "7–11s", visual: "She unfolds the Fold8 in an airport lounge; the big screen opens smoothly", voiceover: "Buka, langsung layar lebar.", onscreen: "" },
    { time: "11–15s", visual: "Phone and passport side by side, then the Samsung end card", voiceover: "Galaxy Z Fold8. Pilih foldable dengan yakin.", onscreen: "Galaxy Z Fold8" } ] },
  { title: "Stop the checkout", follows: "Uses the Stop The Wedding warning format to challenge how people choose a foldable.", hook: "STOP! Don't pick a foldable blindly", beats: [
    { time: "0–3s", visual: "In a phone store, a young man is about to pay for a foldable shown only as a dark silhouette; his friend bursts in", voiceover: "STOP! Jangan asal pilih foldable!", onscreen: "Stop the checkout!" },
    { time: "3–7s", visual: "The friend hands him a Galaxy Z Fold8 and folds it open and shut", voiceover: "Cek dulu engselnya, cek dulu layarnya.", onscreen: "" },
    { time: "7–11s", visual: "Both laugh as he tries it himself, folding it again and again", voiceover: "Yang ini dibuat buat dibuka-tutup tiap hari.", onscreen: "Dibuat buat dipakai tiap hari" },
    { time: "11–15s", visual: "He walks out holding the Fold8; Samsung end card", voiceover: "Pilih foldable dengan yakin.", onscreen: "Galaxy Z Fold8" } ] },
  { title: "Cuma wallpaper", follows: "Turns the screen-crack meme into a real Galaxy Z Fold8 demonstration.", hook: "My screen cracked?! Just kidding", beats: [
    { time: "0–3s", visual: "Close-up: a folded phone screen showing a cracked-glass wallpaper; a friend gasps", voiceover: "Layarnya retak?!", onscreen: "Layar retak?" },
    { time: "3–7s", visual: "A swipe changes the wallpaper: the Galaxy Z Fold8 screen is perfectly fine", voiceover: "Santai, cuma wallpaper.", onscreen: "Cuma wallpaper 😅" },
    { time: "7–11s", visual: "She unfolds the Fold8 to its full screen and scrolls the memes together with her friend", voiceover: "Foldable-ku baik-baik aja.", onscreen: "" },
    { time: "11–15s", visual: "The Fold8 closes with a soft snap; Samsung end card", voiceover: "Galaxy Z Fold8. Yakin dipakai tiap hari.", onscreen: "Galaxy Z Fold8" } ] },
  { title: "Padel replay", follows: "Puts Galaxy at the centre of an active, social padel session.", hook: "The phone that filmed the winning shot", beats: [
    { time: "0–3s", visual: "Evening padel court in Jakarta; a half-folded Galaxy Z Fold8 stands on the bench, filming", voiceover: "Match kedua, siap?", onscreen: "" },
    { time: "3–7s", visual: "Fast rally, a winning smash, friends cheer", voiceover: "Smash!", onscreen: "" },
    { time: "7–11s", visual: "The group crowds around the unfolded Fold8 to watch the replay on the big screen", voiceover: "Replay-nya jelas banget.", onscreen: "Replay di layar lebar" },
    { time: "11–15s", visual: "Selfie with the cover screen as the group poses; Samsung end card", voiceover: "Galaxy Z Fold8, teman main kamu.", onscreen: "Galaxy Z Fold8" } ] },
  { title: "Jakarta jadi ungu", follows: "Capture the Fan Experience: purple-lit Jakarta landmarks and ARMY excitement, captured on the Fold8.", hook: "Jakarta turned purple overnight", beats: [
    { time: "0–3s", visual: "Night at a Jakarta roundabout landmark lit in purple; a fan in a purple outfit unfolds a Galaxy Z Fold8 to frame it", voiceover: "Jakarta lagi ungu banget!", onscreen: "Purple Jakarta 💜" },
    { time: "3–7s", visual: "She zooms in on the purple-lit landmark, then stands the half-folded Fold8 on a ledge in Flex Mode for a hands-free group photo", voiceover: "Taruh, foto bareng, beres.", onscreen: "" },
    { time: "7–11s", visual: "Her friends crowd around the unfolded screen to see the photos, big enough for everyone", voiceover: "Semua kebagian lihat di layar lebar.", onscreen: "Satu layar, semua kebagian" },
    { time: "11–15s", visual: "The Fold8 closes against the purple city lights; Samsung end card", voiceover: "Galaxy Z Fold8. Siap buat momen besar.", onscreen: "Galaxy Z Fold8" } ] },
  { title: "Misi: sampai kantor", follows: "Indonesian Life in GTA Mode: the daily commute becomes a game-style mission, with the Fold8 as the in-game gadget.", hook: "Today's mission: reach the office by 9", beats: [
    { time: "0–3s", visual: "Stylised open-world game look (no real game logos or characters): a young worker in Jakarta traffic as a mission title appears", voiceover: "Misi baru: sampai kantor jam 9.", onscreen: "MISI: SAMPAI KANTOR" },
    { time: "3–7s", visual: "He unfolds a Galaxy Z Fold8: the map on one side, the team chat on the other", voiceover: "Rute dan chat bos, satu layar.", onscreen: "" },
    { time: "7–11s", visual: "He weaves through the crowd at a bus stop and walks into the office lobby as a mission-complete banner appears", voiceover: "Misi selesai!", onscreen: "MISI SELESAI" },
    { time: "11–15s", visual: "At his desk he unfolds the Fold8 to start work; Samsung end card", voiceover: "Galaxy Z Fold8. Hidup sehari-hari, mode main.", onscreen: "Galaxy Z Fold8" } ] },
];
// Prompt style from "[CRE] Prompt Example - Samsung Snowball" (Cheil creative team)
const DECK_EXAMPLES = `Key visual prompt example:
POSE:
Samsung Galaxy Z Fold 8 and a second phone sit on a floating yellow rubber duck on water. White background.
OBJECT:
Samsung Galaxy Fold 8 as the reference, the passport-shaped phone. DON'T CHANGE THE SHAPE OF THE PHONE. The phone shape needs to be exactly as real as the real phone.
BACKGROUND:
White limbo. Some objects for contextual supporting objects.
LAYOUT:
No text. No logo. I just need the image.
CAMERA:
Key visual camera. Samsung style. Editorial fashion. Exaggerated angle. Dynamic pose.
LIGHTING AND TONE:
White-ish, bright, natural light.

Prompt-to-video example (follows the order of the images):
SEQUENCE ACCORDING TO THE IMAGE REFERENCE:
1. Side camera. Passport laid horizontally on white background
2. Hand reaching and taking the passport
3. It turns out behind the passport is hidden the super thin SAMSUNG GALAXY FOLD 8, laid in the exact same position. It's hidden because it's super thin
4. The hand reaches both, and the background turns into an airport
CAMERA: Slow camera movement. Still camera.
AUDIO: No dialogue.`;
const RULES = "Never show a competitor brand, logo or name: any other phone appears only as an unbranded dark silhouette. Never depict real celebrities or musicians, or any real game's characters, logos or artwork: show fans and everyday people, and a generic stylised look. No text, captions, logos or watermarks in the image.";

// ---------- actions ----------
const A = {};
A.role = (v) => { S.role = v; save(); render(); };
A.follow = (v, el) => { S.follow = el.checked; save(); };
A.reset = async () => { if (!confirm("Start the demo again from a new brief?")) return; const keepRef = S.productRef; S = fresh(); S.productRef = keepRef; await save(); render(); };
A.switchTo = (r) => { S.role = r; save(); render(); };
// Back one step: each step saves its workflow state when it is entered (step, SLA clock, board statuses).
// Going back restores the previous step as it was when it began. The work itself (direction, scripts,
// boards, images, videos) is kept.
const START_SNAP = { stage: "brief", elapsed: 0, started: false, path: [], rounds: { board: 1, content: 1 }, statuses: [] };
function entrySnap() { return { stage: S.stage, elapsed: S.elapsed, started: S.started, path: S.path.slice(), rounds: { ...S.rounds }, statuses: S.boards.map((b) => b.status) }; }
const prevSnap = () => { const h = S.hist || []; return h.length > 1 ? h.at(-2) : START_SNAP; };
A.back = () => {
  const h = S.hist || [];
  if (!h.length) { toast("This is the first step."); return; }
  if (Object.values(busy).some(Boolean)) { toast("Wait for the AI to finish first."); return; }
  const snap = JSON.parse(JSON.stringify(prevSnap())), from = stageOf(S.stage).label, to = stageOf(snap.stage);
  delete S.decision[S.stage];
  S.stage = snap.stage; S.elapsed = snap.elapsed; S.started = snap.started; S.path = snap.path; S.rounds = snap.rounds;
  S.boards.forEach((b, i) => { if (snap.statuses[i]) b.status = snap.statuses[i]; });
  h.pop();
  log(to.owner, `Went back from ${from} to ${to.label}. Work done so far is kept.`);
  if (S.follow) S.role = to.owner;
  save(); render(); window.scrollTo({ top: 0, behavior: "smooth" });
};

A.markFinal = () => {
  S.started = true; S.elapsed = 0;
  advance("planner", "AM", "Marked the brief final. SLA clock started (5 business days, 45 working hours).");
};

// --- Strategic Planner ---
const trendText = (t) => `Name: ${t.name}\nType: ${t.type}\nWhat's trending: ${t.what}\nSample content: ${t.linkNote}`;
const styleExamples = () => TRENDS.filter((t) => t.id !== (S.trend && S.trend.id)).map((t) => `Trend: ${t.name} (${t.type})\nInsight: ${t.sample.insight}\nSo What: ${t.sample.so_what}\nNow What: ${t.sample.now_what}\nStrategic Content Direction: ${t.sample.scd}\nCreative Opportunities:\n${t.sample.opps.split("\n").map((o) => "- " + o).join("\n")}`).join("\n\n");
// creative opportunities are kept as text, one "Name: description" per line
const normOpps = (x) => Array.isArray(x) ? x.map((o) => typeof o === "string" ? o : [o.name || o.title, o.desc || o.description].filter(Boolean).join(": ")).filter(Boolean).join("\n") : String(x || "");
const SP_SYSTEM = "You are a Strategic Planner at Cheil Indonesia, a creative agency working for Samsung Indonesia. You turn social-listening trends into a sharp strategic direction for 15-second short-form videos. Be specific to Indonesia and to the brief. Never invent product specs or claims.";
A.pickTrend = (id) => { S.trend = TRENDS.find((t) => t.id === id); save(); render(); };
A.draftDirection = async () => {
  if (!S.trend) { toast("Pick a trend first."); return; }
  busy.dir = true; render();
  const out = await aiJSON(
    `Brief:\n${briefText()}\n\nSelected trend from the Trend Library (social listening):\n${trendText(S.trend)}\n\nWrite the trend direction that completes this brief. Use the same structure, length and voice as these write-ups from Cheil's social-listening reports:\n\n${styleExamples()}\n\nReturn JSON with keys: insight (what's trending and the consumer truth behind it), so_what (why does it matter?), now_what (what's the brand opportunity for Samsung, tied to the product in the brief?), scd (the Strategic Content Direction: one sharp line), opps (the Creative Opportunities: an array of exactly 3 strings, each "Short name: one-sentence description" of a distinct way to execute the direction). One or two sentences each, in English.`,
    SP_SYSTEM);
  const notes = S.direction ? S.direction.notes : "";
  S.direction = out && out.insight && out.scd ? { insight: out.insight, so_what: out.so_what || "", now_what: out.now_what || "", scd: out.scd, opps: normOpps(out.opps) || S.trend.sample.opps, notes } : { ...S.trend.sample, notes, _fb: true };
  S.dirVersions = 1;
  busy.dir = false; save(); render();
};
A.reviseDirection = async () => {
  const ins = val("dirrev"); if (!ins) { toast("Type how the direction should change."); return; }
  busy.dirrev = true; render();
  const cur = { insight: S.direction.insight, so_what: S.direction.so_what, now_what: S.direction.now_what, scd: S.direction.scd, opps: String(S.direction.opps || "").split("\n").filter(Boolean) };
  const out = await aiJSON(
    `Brief:\n${briefText()}\n\nTrend:\n${trendText(S.trend)}\n\nCurrent trend direction (JSON):\n${JSON.stringify(cur)}\n\nInstruction from the Strategic Planner: ${ins}\n\nRewrite the direction following the instruction. Change only what the instruction asks for; keep everything else. Return JSON with the same keys: insight, so_what, now_what, scd, opps (an array of "Short name: description" strings).`,
    SP_SYSTEM);
  if (out && out.insight && out.scd) { Object.assign(S.direction, { insight: out.insight, so_what: out.so_what || cur.so_what, now_what: out.now_what || cur.now_what, scd: out.scd, opps: normOpps(out.opps) || S.direction.opps }); delete S.direction._fb; S.dirVersions++; delete drafts.dirrev; log("SP", `Revised the trend direction by prompt: “${ins}”.`); }
  else toast("The AI could not revise the direction right now. Edit it by hand instead.");
  busy.dirrev = false; save(); render();
};
A.handToCW = () => {
  if (!S.direction) { toast("Draft or write the trend direction first."); return; }
  advance("script", "SP", `Completed the brief with the trend direction (${S.trend ? S.trend.name : "no trend"}) and handed it to Creative.`);
};

// --- Creative (copy): up to 5 scripts, one video each ---
const CW_SYSTEM = "You are a senior copywriter at Cheil Indonesia writing short-form video scripts for Samsung Indonesia. Scripts are fast, local and on-brand. The Strategic Planner's trend direction is binding: every script must execute its Strategic Content Direction and brand opportunity (Now What), use the selected trend's format or behaviour, and follow the planner's notes. Where Creative's brief form conflicts with the direction, the direction wins. Never invent prices, specs or claims not in the brief. Never name a competitor brand.";
const SCRIPT_SHAPE = `{"title":"2-4 words","hook":"one line","follows":"one sentence: which Creative Opportunity this script uses and how it executes the Strategic Content Direction","beats":[{"time":"0–3s","visual":"what we see, one sentence","voiceover":"spoken line in the requested language","onscreen":"short on-screen text or empty"}]}`;
const cwContext = () => `BINDING DIRECTION from the Strategic Planner (every script must follow it):\n${dirText()}\n\nThe selected trend:\n${S.trend ? trendText(S.trend) : "none"}\n\nBrief:\n${briefText()}\n\nCreative's brief form (apply it within the direction):\n- Hook style: ${S.form.hook}\n- Product focus: ${S.form.focus}\n- Must say: ${S.form.must}\n- Language: ${S.form.lang}\n- Notes: ${S.form.notes || "none"}`;
const cleanScript = (o) => o && Array.isArray(o.beats) && o.beats.length ? { title: o.title || "Untitled", hook: o.hook || "", follows: o.follows || "", key: newKey(), beats: o.beats.slice(0, 6).map((b) => ({ time: b.time || "", visual: b.visual || "", voiceover: b.voiceover || "", onscreen: b.onscreen || "" })), ver: 1 } : null;
const SAMPLE_FOR = { crackgate: 2, stopwedding: 1, padel: 3, purplejakarta: 4, gta6: 5 };   // offline samples: the one built on the chosen trend comes first
const newKey = () => Math.random().toString(36).slice(2, 9);
const sampleScript = (i) => {
  const m = S.trend ? SAMPLE_FOR[S.trend.id] : 0, order = [m, ...SAMPLE_SCRIPTS.map((_, k) => k).filter((k) => k !== m)];
  return { ...JSON.parse(JSON.stringify(SAMPLE_SCRIPTS[order[i % order.length]])), ver: 1, key: newKey(), _fb: true };
};
A.genScripts = async () => {
  const n = Math.max(1, Math.min(MAX_SCRIPTS, parseInt(S.form.n, 10) || 5));
  if (S.scripts.length && !confirm(`Replace the ${S.scripts.length} current script(s) with ${n} new ones?`)) return;
  busy.scripts = true; render();
  const out = await aiJSON(
    `${cwContext()}\n\nWrite ${n} different scripts. Each script is one separate 15-second vertical video. Each must be a distinct execution of the SAME Strategic Content Direction, built on the selected trend, and must follow the planner's notes. Spread the scripts across the Creative Opportunities (one opportunity per script where possible) and name the opportunity in "follows". Return JSON: {"scripts":[${SCRIPT_SHAPE}]}. Each script has 4 beats that add up to 15 seconds. Use the product name exactly as given and respect the mandatories.`, CW_SYSTEM);
  const got = out && Array.isArray(out.scripts) ? out.scripts.map(cleanScript).filter(Boolean).slice(0, n) : [];
  S.scripts = got.length ? got : Array.from({ length: n }, (_, i) => sampleScript(i));
  busy.scripts = false; log("CR", `Generated ${S.scripts.length} AI scripts (one video each).`); save(); render();
};
async function oneScript(avoid) {
  const out = await aiJSON(`${cwContext()}\n\nOther scripts already written for this brief (do not repeat their ideas): ${avoid.join("; ") || "none"}.\n\nWrite ONE new script for a separate 15-second vertical video. It must execute the Strategic Content Direction, use the selected trend and follow the planner's notes. Return only the JSON object: ${SCRIPT_SHAPE}. 4 beats adding up to 15 seconds.`, CW_SYSTEM);
  return cleanScript(out && out.script ? out.script : out);
}
A.newScript = async (i) => {
  i = +i; busy["s" + i] = true; render();
  const s = await oneScript(S.scripts.filter((_, k) => k !== i).map((x) => x.title));
  if (s) { S.scripts[i] = s; log("CR", `Wrote a new take for script ${i + 1}.`); } else toast("The AI could not write a new take right now.");
  busy["s" + i] = false; save(); render();
};
A.addScript = async () => {
  if (S.scripts.length >= MAX_SCRIPTS) return;
  busy.add = true; render();
  const s = await oneScript(S.scripts.map((x) => x.title));
  S.scripts.push(s || sampleScript(S.scripts.length));
  busy.add = false; log("CR", `Added script ${S.scripts.length}.`); save(); render();
};
A.delScript = (i) => { i = +i; if (!confirm(`Delete script ${i + 1}?`)) return; S.scripts.splice(i, 1); save(); render(); };
A.reviseScript = async (i) => {
  i = +i; const s = S.scripts[i];
  const ins = val("rv_" + i); if (!ins) { toast("Type how the script should change."); return; }
  busy["s" + i] = true; render();
  const out = await aiJSON(
    `BINDING DIRECTION from the Strategic Planner (the script must keep following it):\n${dirText()}\n\nCurrent script (JSON):\n${JSON.stringify({ title: s.title, hook: s.hook, follows: s.follows, beats: s.beats })}\n\nBrief mandatories: ${S.brief.mandatories}\nInstruction from Creative: ${ins}\n\nRewrite the script following the instruction, without breaking the direction. Keep the same JSON shape (including "follows") and 4 beats adding up to 15 seconds. Return only the JSON object.`,
    CW_SYSTEM);
  const r = cleanScript(out);
  if (r) { S.scripts[i] = { ...r, key: s.key || r.key, ver: (s.ver || 1) + 1 }; delete drafts["rv_" + i]; log("CR", `Revised script ${i + 1} by prompt: “${ins}”.`); }
  else toast("The AI could not revise the script right now. Edit it by hand instead.");
  busy["s" + i] = false; save(); render();
};
const sigOf = (s) => JSON.stringify(s.beats.map((b) => b.visual));
function boardFor(s, i) {
  s.key = s.key || newKey();
  const n = s.beats.length;
  const b = S.boards.find((x) => x.key === s.key) || (S.boards[i] && !S.boards[i].key ? S.boards[i] : null) || newBoard(n);
  b.key = s.key;
  while (b.frames.length < n) b.frames.push(newFrame());
  b.frames.length = n; b.n = n; b.selFrame = Math.min(b.selFrame || 0, n - 1);
  if (b.sig && b.sig !== sigOf(s)) { b.drafted = false; b.stale = true; }
  return b;
}
A.scriptsFinal = () => {
  if (!S.scripts.length) { toast("Write at least one script first."); return; }
  S.boards = S.scripts.map(boardFor); S.selBoard = 0;
  advance("images", "CR", `Marked ${S.scripts.length} script(s) final: ${S.scripts.map((s) => "“" + s.title + "”").join(", ")}. One board per script, one image per scene.`);
};

// --- Creative (art): one board per script ---
function newBoard(n) {
  return { n, p: { object: "", background: "", layout: "", camera: "", lighting: "" }, frames: Array.from({ length: n }, () => newFrame()),
    video: { sequence: "", camera: "", audio: "" }, drafted: false, status: "draft", fb: [], check: null, selFrame: 0 };
}
const newFrame = () => ({ pose: "", versions: [], cur: -1, busy: false });
const editable = (b) => (S.stage === "images" && (b.status === "draft" || b.status === "int_rev")) || (S.stage === "board_revision" && b.status === "client_rev");
A.selBoard = (i) => { S.selBoard = +i; save(); render(); };
function boardFallback(b, s) {
  const poses = s.beats.map((x) => x.visual);
  return { poses, object: `${S.brief.product} as the reference. DON'T CHANGE THE SHAPE OF THE PHONE. The phone shape needs to be exactly as real as the real phone.`,
    background: "White limbo. Some objects for contextual supporting objects.", layout: "No text. No logo. I just need the image.",
    camera: "Key visual camera. Samsung style. Editorial fashion. Exaggerated angle. Dynamic pose.", lighting: "White-ish, bright, natural light.",
    video: { sequence: "SEQUENCE FOLLOW THE ORDER OF THE IMAGES PROVIDED:\n" + poses.map((p, k) => `${k + 1}. ${p}`).join("\n"), camera: "Slow camera movement. Still camera.", audio: "No dialogue. Voice-over and music are added in post." } };
}
async function draftBoard(i) {
  const b = S.boards[i], s = S.scripts[i];
  b.busy = true; render();
  const out = await aiJSON(
    `BINDING DIRECTION from the Strategic Planner:\n${dirText()}\n\nBrief:\n${briefText()}\n\nScript ${i + 1} (one 15-second video, ${b.n} scenes):\n${scriptText(s)}\n\nWrite this script's board: exactly ${b.n} key visual stills, ONE PER SCENE, in scene order. POSE k must show scene k's Visual from the script (same people, action, setting and product moment), staged in the selected trend's format and the Strategic Content Direction. Keep people, styling and setting consistent across scenes. Production will animate the stills into the video in Flow. Follow Cheil's prompt format exactly, like these examples:\n\n${DECK_EXAMPLES}\n\nReturn JSON: {"poses":[exactly ${b.n} strings, the POSE for scene 1 to scene ${b.n}],"object":"...","background":"...","layout":"...","camera":"...","lighting":"...","video":{"sequence":"numbered steps, one per scene, following the order of the images","camera":"...","audio":"..."}}.\nRules: OBJECT names ${S.brief.product} as the reference and says DON'T CHANGE THE SHAPE OF THE PHONE. LAYOUT says No text. No logo. Competitor phones appear only as an unbranded dark silhouette. Keep each field short and concrete. English.`,
    "You are a senior Art Director at Cheil Indonesia writing image-generation prompts for Samsung Indonesia key visuals. You write short, sectioned prompts in the team's house format. The script and the Strategic Planner's direction are binding: you visualise them, you do not reinvent them.");
  const fb = boardFallback(b, s);
  const ok = out && Array.isArray(out.poses) && out.poses.length && out.object;
  const r = ok ? out : fb;
  b.frames.forEach((f, k) => { f.pose = String((r.poses || [])[k] || fb.poses[k]); });
  PROMPT_FIELDS.forEach(([k]) => { b.p[k] = String(r[k] || fb[k]); });
  const v = r.video || {}; VIDEO_FIELDS.forEach(([k]) => { b.video[k] = String(v[k] || fb.video[k]); });
  b.drafted = true; b._fb = !ok; b.busy = false; b.sig = sigOf(s); b.stale = false; render();
}
A.draftBoard = async (i) => { await draftBoard(+i); log("CR", `Drafted the prompts for board ${+i + 1}.`); save(); render(); };
A.draftAll = async () => {
  const idx = S.boards.map((b, i) => i).filter((i) => editable(S.boards[i]));
  busy.all = true; render();
  await Promise.all(idx.map(draftBoard));
  busy.all = false; log("CR", `AI drafted the prompts for ${idx.length} board(s).`); save(); render();
};
function kvPrompt(b, i, k, hasProduct, hasFirst) {
  const sc = (S.scripts[i].beats[k] || {});
  const refs = [];
  if (hasProduct) refs.push(`Attached image ${refs.length + 1} is the actual product photo of the ${S.brief.product}: copy its exact shape, proportions, hinge, cameras and colour.`);
  if (hasFirst) refs.push(`Attached image ${refs.length + 1} is scene 1 of this same board: keep the same setting, people, styling and product so the scenes read as one video.`);
  if (!hasProduct) refs.push("No product photo is attached: show a slim book-style foldable phone with no visible branding.");
  return `POSE:\n${b.frames[k].pose}\n\nOBJECT:\n${b.p.object}\n\nBACKGROUND:\n${b.p.background}\n\nLAYOUT:\n${b.p.layout}\n\nCAMERA:\n${b.p.camera}\n\nLIGHTING AND TONE:\n${b.p.lighting}\n\nThis is scene ${k + 1} of ${b.n}${sc.time ? " (" + sc.time + ")" : ""} of one 15-second video. The scene in the script: ${sc.visual || ""}\n${refs.join("\n")}\n${RULES}\nVertical 9:16.`;
}
async function genFrame(b, i, k, first) {
  const f = b.frames[k]; f.busy = true; render();
  const prompt = kvPrompt(b, i, k, !!S.productRef, !!first);
  let img = await aiImage(prompt, [S.productRef, first]);
  const fb = !img; if (!img) img = placeholder(`Board ${i + 1} · scene ${k + 1}`, i + k, f.pose);
  f.versions.push({ img, prompt, label: f.versions.length ? "New take" : "Generated", fb }); f.cur = f.versions.length - 1; f.busy = false; render();
  return fb ? null : img;
}
async function genBoard(i) {
  const b = S.boards[i];
  if (!b.drafted || b.frames.some((f) => !f.pose.trim())) await draftBoard(i);
  const first = await genFrame(b, i, 0, null);
  await Promise.all(b.frames.slice(1).map((_, j) => genFrame(b, i, j + 1, first)));
}
A.genBoard = async (i) => { i = +i; busy["b" + i] = true; render(); await genBoard(i); busy["b" + i] = false; log("CR", `AI generated ${S.boards[i].n} images for board ${i + 1}, one per scene.`); save(); render(); };
A.genAll = async () => {
  const idx = S.boards.map((b, i) => i).filter((i) => editable(S.boards[i]));
  busy.all = true; render();
  await Promise.all(idx.map(genBoard));
  busy.all = false; log("CR", `AI generated the images for ${idx.length} board(s).`); save(); render();
};
A.selFrame = (v) => { const [i, k] = v.split(":").map(Number); S.boards[i].selFrame = k; save(); render(); };
A.selVer = (v) => { const [i, k, n] = v.split(":").map(Number); S.boards[i].frames[k].cur = n; save(); render(); };
A.refine = async (i) => {
  i = +i; const b = S.boards[i], k = b.selFrame, f = b.frames[k];
  const ins = val("refine_" + i); if (!ins) { toast("Type the revision prompt first."); return; }
  if (!f || f.cur < 0) return;
  f.busy = true; busy["r" + i] = true; render();
  const p = `Revision prompt:\n${ins}\n\nKeep everything else in the image the same (composition, setting, people and product) unless the revision says otherwise. DON'T CHANGE THE SHAPE OF THE PHONE.${S.productRef ? " The second attached image is the actual product photo for reference." : ""}\n${RULES}\nVertical 9:16.`;
  let img = await aiImage(p, [f.versions[f.cur].img, S.productRef]);
  const fb = !img; if (!img) img = placeholder(`Board ${i + 1} · scene ${k + 1} · edited`, i + k + 2, ins);
  f.versions.push({ img, prompt: p, label: ins, fb }); f.cur = f.versions.length - 1; f.busy = false; busy["r" + i] = false; if (!fb) delete drafts["refine_" + i];
  log("CR", `Revised board ${i + 1}, scene ${k + 1} by prompt: “${ins}”.`); save(); render();
};
A.regenFrame = async (i) => {
  i = +i; const b = S.boards[i], k = b.selFrame; busy["r" + i] = true; render();
  const first = k > 0 && b.frames[0].cur >= 0 && !b.frames[0].versions[b.frames[0].cur].fb ? b.frames[0].versions[b.frames[0].cur].img : null;
  await genFrame(b, i, k, first); busy["r" + i] = false; save(); render();
};
A.uploadRef = (v, el) => {
  const f = el.files && el.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = async () => { S.productRef = await shrink(r.result, 768); save(); render(); toast("Product photo added. New images will follow it."); }; r.readAsDataURL(f);
};
A.clearRef = () => { S.productRef = null; save(); render(); };
A.submitBoard = () => {
  const idx = S.boards.map((b, i) => i).filter((i) => editable(S.boards[i]));
  const missing = idx.filter((i) => S.boards[i].frames.some((f) => f.cur < 0));
  if (missing.length) { toast(`Generate the images for board ${missing.map((i) => i + 1).join(", ")} first.`); S.selBoard = missing[0]; render(); return; }
  if (S.stage === "board_revision") {
    idx.forEach((i) => { S.boards[i].status = "joint"; });
    advance("joint_rereview", "CR", `Revised board ${idx.map((i) => i + 1).join(", ")} by prompt after Samsung's feedback; booked the joint re-review.`);
  } else {
    idx.forEach((i) => { S.boards[i].status = "internal"; S.boards[i].check = null; });
    advance("internal_board", "CR", `Submitted ${idx.length} board(s) (script + images + video prompt) for internal review.`);
  }
};

// --- Reviews: one decision per board ---
const PENDING = { internal_board: "internal", client_board: "client", joint_rereview: "joint" };
const pendingBoards = () => S.boards.map((b, i) => i).filter((i) => S.boards[i].status === PENDING[S.stage]);
A.aiCheckAll = async () => {
  busy.check = true; render();
  await Promise.all(pendingBoards().map(async (i) => {
    const out = await aiJSON(
      `Brief:\n${briefText()}\n\nTrend direction:\n${dirText()}\n\nScript (JSON):\n${JSON.stringify(S.scripts[i].beats)}\n\nImage prompt OBJECT/LAYOUT: ${S.boards[i].p.object} / ${S.boards[i].p.layout}\n\nCheck this board against the brief. Return JSON {"checks":[{"item":"short name","status":"pass" or "warn","note":"one sentence"}]} with 5 checks: on brief, trend direction, key message, mandatories (product shape, competitor silhouette, end card), tone for the audience.`,
      "You are a meticulous Executive Creative Director at Cheil Indonesia reviewing work for Samsung Indonesia before it goes to the client.");
    S.boards[i].check = out && Array.isArray(out.checks) ? out.checks.slice(0, 6) : [
      { item: "On brief", status: "pass", note: "The idea answers foldable durability worries.", _fb: true },
      { item: "Trend direction", status: "pass", note: `Built on ${S.trend ? S.trend.name : "the selected trend"}.` },
      { item: "Key message", status: "pass", note: "“Choose your foldable with confidence” lands in the last beat." },
      { item: "Mandatories", status: "warn", note: "Check the competitor phone stays an unbranded silhouette in every image." },
      { item: "Tone", status: "pass", note: "Casual Bahasa Indonesia fits 22–35 upgraders." } ];
  }));
  busy.check = false; save(); render();
};
A.pickDecision = (v) => {
  if (v.includes(":")) { const [i, d] = v.split(":"); S.decision[S.stage] = { ...(typeof S.decision[S.stage] === "object" ? S.decision[S.stage] : {}), [i]: d }; }
  else S.decision[S.stage] = v;
  save(); render();
};
A.decide = () => {
  const st = S.stage, who = stageOf(st).owner;
  if (PENDING[st]) return decideBoards(st, who);
  const d = S.decision[st]; const c = val("comment"); delete drafts.comment;
  if (!d) { toast("Choose a decision first."); return; }
  if (c) S.comments.unshift({ stage: st, by: who, text: c, clock: now() });
  delete S.decision[st];
  if (st === "internal_content") {
    if (d === "approve") advance("client_content", "CL", "Approved the videos internally. Account sent them to Samsung.");
    else advance("production", "CL", "Sent the videos back to production." + (c ? ` “${c}”` : ""));
  } else if (st === "client_content") {
    if (d === "approve") advance("closed", "SS", "Samsung approved the content. Account closed the task and delivered the final files.");
    else advance("content_revision", "SS", "Samsung requested one round of content changes." + (c ? ` “${c}”` : ""));
  } else if (st === "internal_rereview") {
    advance("closed", "CL", "Internal re-review passed. Account closed the task; further changes need a new brief.");
  }
};
function decideBoards(st, who) {
  const idx = pendingBoards();
  if (st === "joint_rereview") {
    idx.forEach((i) => { S.boards[i].status = "done"; }); S.boards.forEach((b) => { if (b.status === "client_ok") b.status = "done"; });
    return advance("production", "SS", `Cheil and Samsung re-reviewed board ${idx.map((i) => i + 1).join(", ")} together and approved. Production starts.`);
  }
  const dec = typeof S.decision[st] === "object" ? S.decision[st] : {};
  const open = idx.filter((i) => !dec[i]);
  if (open.length) { toast(`Choose approve or revise for board ${open.map((i) => i + 1).join(", ")}.`); return; }
  const ok = [], rev = [];
  idx.forEach((i) => {
    const c = val("cm_" + i); delete drafts["cm_" + i]; const b = S.boards[i];
    if (c) { S.comments.unshift({ stage: st, by: who, text: `Board ${i + 1}: ${c}`, clock: now() }); }
    if (dec[i] === "approve") { ok.push(i); b.status = st === "internal_board" ? "int_ok" : "client_ok"; }
    else { rev.push(i); b.status = st === "internal_board" ? "int_rev" : "client_rev"; b.fb.unshift({ stage: st, by: who, text: c || "Please revise." }); }
  });
  delete S.decision[st];
  const list = (a) => a.map((i) => i + 1).join(", ");
  const summary = `${ok.length ? "Approved board " + list(ok) + ". " : ""}${rev.length ? "Sent board " + list(rev) + " back for revision." : ""}`.trim();
  if (st === "internal_board") {
    if (rev.length) { S.rounds.board++; S.selBoard = rev[0]; return advance("images", "CL", summary); }
    S.boards.forEach((b) => { b.status = "client"; });
    return advance("client_board", "CL", summary + " Account sent all boards to Samsung.");
  }
  if (rev.length) { S.selBoard = rev[0]; return advance("board_revision", "SS", summary + " One revision round."); }
  S.boards.forEach((b) => { b.status = "done"; });
  advance("production", "SS", "Samsung approved every board. Production starts.");
}

// --- Production: one video per script ---
A.render = async () => {
  busy.render = true; render();
  await new Promise((r) => setTimeout(r, 1800));
  S.videos = S.scripts.map((s, i) => ({ board: i, name: `V${i + 1} · ${s.title}`, caps: s.beats.map((b) => b.onscreen || "") }));
  busy.render = false;
  log("VE", `Produced ${S.videos.length} video(s), one per script (Flow, After Effects, Suno), and uploaded them.`); save(); render();
};
A.sendContent = () => { if (!S.videos.length) { toast("Produce and upload the videos first."); return; } advance("internal_content", "VE", `Uploaded ${S.videos.length} videos for internal content review.`); };
A.applyRevision = () => { advance("internal_rereview", "VE", "Applied Samsung's changes to the on-screen text and re-rendered the videos."); };
A.play = (i) => playVideo(+i);

// ---------- form sync: every input writes straight into the state ----------
const drafts = {};           // ui-only: text typed in prompt / comment boxes, kept across redraws
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : (drafts[id] || "").trim(); }
const BOUND = "[data-f],[data-beat],[data-bp],[data-pose],[data-vp],[data-cap]";
function syncAll() {
  document.querySelectorAll("[data-f]").forEach((el) => {
    if (el.readOnly || el.disabled) return;
    const [grp, key] = el.dataset.f.split(".");
    const obj = grp === "brief" ? S.brief : grp === "form" ? S.form : grp === "dir" ? S.direction : null;
    if (obj) obj[key] = el.value;
  });
  document.querySelectorAll("[data-beat]").forEach((el) => { if (el.readOnly) return; const [s, i, k] = el.dataset.beat.split(":"); if (S.scripts[+s]) S.scripts[+s].beats[+i][k] = el.value; });
  document.querySelectorAll("[data-bp]").forEach((el) => { if (el.readOnly) return; const [i, k] = el.dataset.bp.split(":"); if (S.boards[+i]) S.boards[+i].p[k] = el.value; });
  document.querySelectorAll("[data-pose]").forEach((el) => { if (el.readOnly) return; const [i, k] = el.dataset.pose.split(":"); if (S.boards[+i] && S.boards[+i].frames[+k]) S.boards[+i].frames[+k].pose = el.value; });
  document.querySelectorAll("[data-vp]").forEach((el) => { if (el.readOnly) return; const [i, k] = el.dataset.vp.split(":"); if (S.boards[+i]) S.boards[+i].video[k] = el.value; });
  document.querySelectorAll("[data-cap]").forEach((el) => { if (el.readOnly) return; const [v, i] = el.dataset.cap.split(":"); if (S.videos[+v]) S.videos[+v].caps[+i] = el.value; });
}
const briefText = () => `Campaign: ${S.brief.campaign}\nProduct: ${S.brief.product}\nObjective: ${S.brief.objective}\nKey message: ${S.brief.message}\nAudience: ${S.brief.audience}\nChannels: ${S.brief.channels}\nReady to post: ${S.brief.ready}\nMandatories: ${S.brief.mandatories}\nOutput: up to ${S.brief.videos} short-form videos, 15 seconds each, one script per video`;
const dirText = () => S.direction ? `Trend: ${S.trend ? S.trend.name + " (" + S.trend.type + ")" : "-"}\n${DIR_FIELDS.map(([k, l]) => `${l}: ${S.direction[k]}`).join("\n")}\nPlanner's notes: ${S.direction.notes || "none"}` : "none";
const scriptText = (s) => `Title: ${s.title}\nHook: ${s.hook}\nHow it follows the direction: ${s.follows || "-"}\n${s.beats.map((b, k) => `Scene ${k + 1} · ${b.time} | Visual: ${b.visual} | VO: ${b.voiceover} | On screen: ${b.onscreen || "-"}`).join("\n")}`;

// ---------- video player ----------
let timers = {};
function playVideo(v) {
  const el = document.querySelector(`[data-player="${v}"]`); if (!el) return;
  clearInterval(timers[v]); el.classList.remove("ended");
  const imgs = el.querySelectorAll("img"); const cap = el.querySelector(".cap"); const bar = el.querySelector(".prog i");
  const caps = S.videos[v].caps; const n = imgs.length || 1, m = caps.length || 1; let t = 0;
  const show = (k, c) => { imgs.forEach((im, j) => im.classList.toggle("on", j === k)); cap.textContent = caps[c] || ""; };
  show(0, 0); bar.style.width = "0%";
  timers[v] = setInterval(() => { t += 100; bar.style.width = Math.min(100, t / 150) + "%"; show(Math.min(n - 1, Math.floor(t / (15000 / n))), Math.min(m - 1, Math.floor(t / (15000 / m)))); if (t >= 15000) { clearInterval(timers[v]); el.classList.add("ended"); } }, 100);
}

// ---------- views ----------
function render() {
  const app = document.getElementById("app");
  const st = stageOf(S.stage);
  const y = window.scrollY, ae = document.activeElement, fid = ae && ae.id;
  let ss = null, se = null; try { ss = ae.selectionStart; se = ae.selectionEnd; } catch (e) { /* not a text field */ }
  app.innerHTML = topbar() + `<div class="wrap">${head()}${stepper()}${slaBar()}<div class="grid"><div class="main">${stageView(st)}</div><div class="side">${sideView()}</div></div></div>`;
  Object.entries(drafts).forEach(([id, v]) => { const el = document.getElementById(id); if (el && !el.value) el.value = v; });
  if (fid && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) { const el = document.getElementById(fid); if (el) { el.focus({ preventScroll: true }); try { if (ss != null) el.setSelectionRange(ss, se); } catch (e) { /* ignore */ } } }
  window.scrollTo(0, y);
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
  const n = S.boards.length || S.brief.videos;
  return `<div class="head"><div><h1>${esc(S.brief.campaign)}</h1><p>${esc(S.brief.product)} · ${S.boards.length ? n : "up to " + n} short-form videos, 15 s each, one script per video · BAU workflow</p></div>
  <div class="actions">${(S.hist || []).length ? `<button class="btn sec small" data-act="back">← Back to ${esc(stageOf(prevSnap().stage).label)}</button>` : ""}<span class="pill bau">BAU</span><span class="pill navy">Now: ${esc(stageOf(S.stage).label)}</span></div></div>`;
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
const spin = (on, busyTxt, txt) => on ? `<span class="spinner"></span> ${busyTxt}` : txt;
function stageView(st) {
  const mine = S.role === st.owner || (st.id === "joint_rereview" && S.role === "CL");
  const bp = (t) => `<p class="bpmn">BPMN step: ${esc(t)}</p>`;
  const wait = mine ? "" : waitingFor(st);
  const ro = !mine;
  switch (st.id) {
    case "brief": return `<section class="card"><h2>New brief <span class="pill" style="background:#ECECF1">Draft</span></h2>${bp("Account · Prepare & finalize brief, create task")}${wait}
      <div class="g2">${fld("brief.campaign", "Campaign", S.brief.campaign, ro)}${fld("brief.product", "Product", S.brief.product, ro)}</div>
      ${area("brief.objective", "Objective", S.brief.objective, ro, 2)}${area("brief.message", "Key message", S.brief.message, ro, 2)}
      <div class="g2">${fld("brief.audience", "Target audience", S.brief.audience, ro)}${fld("brief.channels", "Channels", S.brief.channels, ro)}</div>
      <div class="g2">${fld("brief.ready", "Ready to post", S.brief.ready, ro)}${fld("brief.videos", "Videos (max, one script each)", S.brief.videos, true)}</div>
      ${area("brief.mandatories", "Mandatories", S.brief.mandatories, ro, 2)}
      ${mine ? `<div class="actions"><button class="btn" data-act="markFinal">Mark brief final · start SLA clock</button><span class="note">Clarify open questions with Samsung before this: clarification is outside the SLA.</span></div>` : ""}</section>`;
    case "planner": return plannerView(mine, wait, bp);
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
function area(key, label, v, ro, rows, ph) { const id = key.replace(".", "_"); return `<div class="f"><label for="${id}">${esc(label)}</label><textarea id="${id}" data-f="${key}" rows="${rows || 3}"${ro ? " readonly" : ""}${ph ? ` placeholder="${esc(ph)}"` : ""}>${esc(v)}</textarea></div>`; }
function roBrief() { const b = S.brief; return [["Campaign", b.campaign], ["Product", b.product], ["Objective", b.objective], ["Key message", b.message], ["Audience", b.audience], ["Channels", b.channels], ["Ready to post", b.ready], ["Mandatories", b.mandatories]].map(([k, v]) => `<div><b>${k}</b>${esc(v)}</div>`).join(""); }
function sel(id, label, v, options, ro) { return `<div class="f"><label for="${id}">${label}</label><select id="${id}" data-f="form.${id.split("_")[1]}"${ro ? " disabled" : ""}>${options.map((o) => `<option${o == v ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></div>`; }
function trendCard(t, mine) {
  const on = S.trend && S.trend.id === t.id;
  return `<div class="trend${on ? " sel" : ""}"><div class="t"><span>${esc(t.name)}</span></div><span class="pill bau" style="align-self:flex-start">${esc(t.type)}</span>
    <p style="margin:0;font-size:13px">${esc(t.what)}</p>
    <p class="muted"><b>Sample content:</b> ${esc(t.linkNote)}${t.links.length ? " " + t.links.map(([l, u], k) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}${t.links.length > 1 ? " " + (k + 1) : ""} ↗</a>`).join(" · ") : ""}</p>
    ${mine ? `<button class="btn ${on ? "" : "sec"} small" data-act="pickTrend" data-v="${t.id}">${on ? "Selected" : "Use this trend"}</button>` : ""}</div>`;
}
function plannerView(mine, wait, bp) {
  const d = S.direction, ro = !mine;
  return `<section class="card"><h2>Complete the brief <span class="pill ok">Step: 2 h</span></h2>${bp("Strategic Planner · Complete brief with trend direction (reads the Trend Library)")}${wait}
    <div class="ro">${roBrief()}</div></section>
    <section class="card"><h2>Trend Library <span class="note">Social listening · sample data until the SONAR API is connected</span></h2>
    <div class="g2">${TRENDS.map((t) => trendCard(t, mine)).join("")}</div></section>
    <section class="card"><h2>Trend direction ${d && d._fb ? '<span class="tag-fb">sample</span>' : d ? `<span class="pill ok">AI draft · version ${S.dirVersions} · edit freely</span>` : ""}</h2>
    ${S.trend ? `<p class="muted"><b>Trend:</b> ${esc(S.trend.name)} · ${esc(S.trend.type)}</p>` : ""}
    ${mine ? `<div class="actions"><button class="btn ${d ? "sec" : "ai"}" data-act="draftDirection"${busy.dir ? " disabled" : ""}>${spin(busy.dir, "Drafting…", d ? "Draft again from scratch" : "Draft direction with AI")}</button><span class="note">Uses the brief + the selected trend</span></div>` : ""}
    ${d ? `${DIR_FIELDS.map(([k, l, r]) => area("dir." + k, l, d[k] || "", ro, r, k === "opps" ? "One per line, e.g. Transform Jakarta in Purple: reimagine landmarks with purple AI visuals featuring Galaxy" : "")).join("")}
      ${mine ? `<div class="inline"><div class="f"><label for="dirrev">Revise the direction by prompt</label><input id="dirrev" placeholder="e.g. make the Now What about everyday durability, and the direction more playful"></div><button class="btn ai" data-act="reviseDirection"${busy.dirrev ? " disabled" : ""}>${spin(busy.dirrev, "Revising…", "Revise with AI")}</button></div>` : ""}
      ${area("dir.notes", "Notes (Strategic Planner)", d.notes || "", ro, 5, "Anything Creative should know: references, watch-outs, ideas to explore…")}
      <p class="note">The AI never writes in Notes; revising by prompt changes the five fields above.</p>` : '<p class="muted">Pick a trend, then let the AI draft the direction.</p>'}
    ${mine && d ? `<div class="actions"><button class="btn" data-act="handToCW">Hand off to Creative</button></div>` : ""}</section>`;
}
function oppsHTML(t) {
  const items = String(t || "").split("\n").map((x) => x.trim()).filter(Boolean);
  return items.length ? `<ul>${items.map((x) => { const m = x.match(/^([^:]{2,60}):\s*(.+)$/); return `<li>${m ? `<b style="display:inline">${esc(m[1])}:</b> ${esc(m[2])}` : esc(x)}</li>`; }).join("")}</ul>` : "–";
}
function briefPanel() {
  const d = S.direction, notes = d && d.notes && S.role !== "SS";
  return `<section class="card"><details class="bp"${ui.bpOpen ? " open" : ""}><summary><h2>Complete brief + trend direction <span class="note">From Account and the Strategic Planner</span></h2></summary>
    <div class="ro" style="margin-top:12px">${roBrief()}</div>
    ${d ? `<h3 style="margin-top:16px">Trend: ${esc(S.trend ? S.trend.name : "-")} <span class="pill bau">${esc(S.trend ? S.trend.type : "")}</span></h3>
      <div class="dirgrid">${DIR_FIELDS.map(([k, l]) => k === "opps" ? `<div class="wide opps"><b>${esc(l)}</b>${oppsHTML(d[k])}</div>` : `<div><b>${esc(l)}</b>${esc(d[k])}</div>`).join("")}${notes ? `<div class="wide"><b>Notes from the Strategic Planner</b>${esc(d.notes).replace(/\n/g, "<br>")}</div>` : ""}</div>` : ""}
  </details></section>`;
}
function scriptView(mine, wait, bp) {
  const f = S.form, ro = !mine, n = S.scripts.length;
  return `${briefPanel()}<section class="card"><h2>Brief form for the AI <span class="pill ok">Step: 1 h</span></h2>${bp("Creative · Prompt AI for scripts → edit by hand or by prompt → Scripts final?")}${wait}
    <p class="muted">One script makes one video. Write up to ${MAX_SCRIPTS}.</p>
    <div class="g2">${sel("form_hook", "Hook style", f.hook, ["Trend format", "Meme / reaction", "Problem → solution", "Reveal", "POV", "Question"], ro)}${fld("form.focus", "Product focus", f.focus, ro)}</div>
    <div class="g2">${fld("form.must", "Must say", f.must, ro)}${sel("form_lang", "Language", f.lang, ["Bahasa Indonesia, casual", "English", "Bahasa Indonesia + English mix"], ro)}</div>
    <div class="g2">${sel("form_n", "Number of scripts (videos)", f.n, [1, 2, 3, 4, 5], ro)}${fld("form.notes", "Anything else (optional)", f.notes, ro)}</div>
    ${mine ? `<div class="actions"><button class="btn ai" data-act="genScripts"${busy.scripts ? " disabled" : ""}>${spin(busy.scripts, "Writing scripts…", n ? "Write all scripts again" : "Generate scripts")}</button></div>` : ""}</section>
    ${S.scripts.map((s, i) => `<section class="card"><h2><span>Script ${i + 1} · ${esc(s.title)} <span class="note">→ Video ${i + 1} · version ${s.ver || 1}</span></span>${s._fb ? '<span class="tag-fb">sample</span>' : '<span class="pill ok">AI draft</span>'}</h2>
      <p class="muted"><b>Hook:</b> ${esc(s.hook)}</p>
      ${s.follows ? `<p class="follows"><b>Follows the direction:</b> ${esc(s.follows)}</p>` : ""}
      <table class="beats"><thead><tr><th>Time</th><th>Visual</th><th>Voice-over</th><th>On screen</th></tr></thead><tbody>${s.beats.map((b, k) => `<tr><td style="white-space:nowrap">${esc(b.time)}</td>${["visual", "voiceover", "onscreen"].map((x) => `<td><textarea id="bt_${i}_${k}_${x}" rows="3" data-beat="${i}:${k}:${x}" aria-label="Script ${i + 1} ${x} ${k + 1}"${mine ? "" : " readonly"}>${esc(b[x])}</textarea></td>`).join("")}</tr>`).join("")}</tbody></table>
      ${mine ? `<div class="inline"><div class="f"><label for="rv_${i}">Revise script ${i + 1} by prompt</label><input id="rv_${i}" placeholder="e.g. make the hook faster and land the key message in the last beat"></div><button class="btn ai" data-act="reviseScript" data-v="${i}"${busy["s" + i] ? " disabled" : ""}>${spin(busy["s" + i], "Working…", "Revise with AI")}</button><button class="btn sec" data-act="newScript" data-v="${i}"${busy["s" + i] ? " disabled" : ""}>New take</button><button class="btn danger" data-act="delScript" data-v="${i}">Delete</button></div>` : ""}</section>`).join("")}
    ${mine && n ? `<section class="card"><div class="actions">${n < MAX_SCRIPTS ? `<button class="btn sec" data-act="addScript"${busy.add ? " disabled" : ""}>${spin(busy.add, "Writing…", "+ Add a script")}</button>` : ""}<button class="btn" data-act="scriptsFinal">Mark ${n} script${n > 1 ? "s" : ""} final · one board each</button><span class="note">${n} of ${MAX_SCRIPTS} scripts = ${n} video${n > 1 ? "s" : ""}</span></div></section>` : ""}`;
}
const STATUS = { draft: ["In progress", "bau"], internal: ["With Creative Lead", "bau"], int_ok: ["Approved internally", "ok"], int_rev: ["Revise", "warn"],
  client: ["With Samsung", "bau"], client_ok: ["Approved by Samsung", "ok"], client_rev: ["Samsung: revise", "warn"], joint: ["Joint re-review", "bau"], done: ["Approved", "ok"] };
const statusPill = (b) => { const [t, c] = STATUS[b.status] || ["", "bau"]; return `<span class="pill ${c}">${t}</span>`; };
function imagesView(st, mine, wait, bp) {
  const rev = st.id === "board_revision";
  const i = Math.min(S.selBoard, S.boards.length - 1), b = S.boards[i], s = S.scripts[i];
  const can = mine && editable(b);
  const nEdit = S.boards.filter(editable).length;
  const fr = b.frames[b.selFrame];
  const lastFb = b.fb[0];
  return `${briefPanel()}<section class="card"><h2>${rev ? "Revise the boards" : "AI boards · one per script"} <span class="pill ok">Step: ${fmtH(st.hours)}</span></h2>${bp(rev ? "Creative · Revise board by prompt → joint re-review (BAU)" : "Creative AI · Generate still images → Creative · Review, refine by prompt → Satisfied?")}${wait}
    <div class="g2"><div class="f"><label>Actual product image</label>${S.productRef ? `<div class="actions"><img src="${S.productRef}" alt="Product reference" style="height:64px;border-radius:8px">${mine ? '<button class="btn sec small" data-act="clearRef">Remove</button>' : ""}</div>` : mine ? `<input type="file" accept="image/*" data-change="uploadRef" aria-label="Upload the actual product photo">` : '<p class="muted">None</p>'}<span class="note">${S.productRef ? "Sent with every image prompt so the phone keeps its real shape." : "<b>Add an official Galaxy Z Fold8 photo:</b> every prompt uses it as the reference."}</span></div>
    ${mine ? `<div class="f"><label>All boards</label><div class="actions"><button class="btn sec" data-act="draftAll"${busy.all || !nEdit ? " disabled" : ""}>${spin(busy.all, "Working…", "Draft all prompts with AI")}</button><button class="btn ai" data-act="genAll"${busy.all || !nEdit ? " disabled" : ""}>Generate all boards</button></div><span class="note">${nEdit} board(s) to work on</span></div>` : ""}</div>
    <div class="tabs" role="tablist">${S.boards.map((x, k) => `<button role="tab" class="tab${k === i ? " sel" : ""}" aria-selected="${k === i}" data-act="selBoard" data-v="${k}">Board ${k + 1} · ${esc(S.scripts[k].title)} ${statusPill(x)}</button>`).join("")}</div></section>
    <section class="card"><h2><span>Board ${i + 1} · ${esc(s.title)}</span>${statusPill(b)}</h2>
    ${lastFb && editable(b) ? `<div class="alert"><b>${esc(ROLES[lastFb.by])}'s feedback:</b> ${esc(lastFb.text)}</div>` : ""}
    ${!editable(b) ? `<p class="muted">This board is ${esc((STATUS[b.status] || [""])[0].toLowerCase())} and locked this round.</p>` : ""}
    <details><summary class="note">Script ${i + 1}: ${esc(s.hook)}</summary>${scriptTable(s)}</details>
    <h3>Key visual prompt</h3>
    ${b.stale && editable(b) ? `<div class="alert"><b>Script ${i + 1} changed</b> after these prompts were drafted. Redraft the prompts, then generate the scenes again.</div>` : ""}
    <div class="g2"><div class="f"><label>Images on this board</label><p style="margin:0;font-size:14px"><b>${b.n}</b>: one per scene in script ${i + 1}</p></div>
      ${can ? `<div class="f"><label>&nbsp;</label><div class="actions"><button class="btn sec" data-act="draftBoard" data-v="${i}"${b.busy ? " disabled" : ""}>${spin(b.busy, "Drafting…", b.drafted ? "Redraft prompt with AI" : "Draft prompt with AI")}</button>${b._fb ? '<span class="tag-fb">sample</span>' : ""}</div></div>` : ""}</div>
    <div class="g3">${b.frames.map((f, k) => `<div class="f"><label for="pose_${i}_${k}">POSE · scene ${k + 1}${s.beats[k] ? " · " + esc(s.beats[k].time) : ""}</label><textarea id="pose_${i}_${k}" rows="3" data-pose="${i}:${k}"${can ? "" : " readonly"} placeholder="What is in scene ${k + 1}">${esc(f.pose)}</textarea></div>`).join("")}</div>
    <div class="g2">${PROMPT_FIELDS.map(([k, l]) => `<div class="f"><label for="bp_${i}_${k}">${l}</label><textarea id="bp_${i}_${k}" rows="3" data-bp="${i}:${k}"${can ? "" : " readonly"}>${esc(b.p[k])}</textarea></div>`).join("")}</div>
    ${can ? `<div class="actions"><button class="btn ai" data-act="genBoard" data-v="${i}"${busy["b" + i] || busy.all ? " disabled" : ""}>${spin(busy["b" + i], "Generating…", b.frames.some((f) => f.cur >= 0) ? "Generate this board again" : `Generate ${b.n} scene${b.n > 1 ? "s" : ""}`)}</button><span class="note">Scene 1 first; the others follow it for continuity</span></div>` : ""}
    <div class="frames">${b.frames.map((f, k) => { const v = f.versions[f.cur]; return `<div class="frame"><button class="img${b.selFrame === k ? " sel" : ""}" data-act="selFrame" data-v="${i}:${k}" aria-label="Scene ${k + 1}">${v ? `<img src="${v.img}" alt="Board ${i + 1} scene ${k + 1}">` : ""}<span class="lab">Scene ${k + 1}</span>${f.busy ? '<span class="spin"><span class="spinner"></span>&nbsp;AI…</span>' : ""}</button>${v && v.fb ? '<span class="tag-fb">sample</span>' : v ? `<span class="note">v${f.cur + 1}${f.versions.length > 1 ? " of " + f.versions.length : ""}</span>` : ""}</div>`; }).join("")}</div>
    ${fr && fr.cur >= 0 ? `<div class="sub"><h3>Scene ${b.selFrame + 1} · versions</h3>
      <div class="vers" aria-label="Versions">${fr.versions.map((v, n) => `<button class="${fr.cur === n ? "sel" : ""}" data-act="selVer" data-v="${i}:${b.selFrame}:${n}" title="${esc(v.label)}"><img src="${v.img}" alt="Version ${n + 1}"></button>`).join("")}</div>
      <details><summary class="note">Prompt sent for v${fr.cur + 1}</summary><pre class="prompt">${esc(fr.versions[fr.cur].prompt)}</pre></details>
      ${can ? `<div class="inline"><div class="f"><label for="refine_${i}">Revision prompt for scene ${b.selFrame + 1}</label><textarea id="refine_${i}" rows="3" placeholder="- make the Fold8 in the front more visible&#10;- don't change the orientation of the phones"></textarea></div><button class="btn ai" data-act="refine" data-v="${i}"${busy["r" + i] ? " disabled" : ""}>${spin(busy["r" + i], "Editing…", "Revise with AI")}</button><button class="btn sec" data-act="regenFrame" data-v="${i}"${busy["r" + i] ? " disabled" : ""}>New take</button></div><p class="note">Manual edit may still be needed after AI revisions.</p>` : ""}</div>` : ""}
    <h3>Prompt to video <span class="note">Handed to production for Flow</span></h3>
    <div class="g2">${VIDEO_FIELDS.map(([k, l, r]) => `<div class="f"><label for="vp_${i}_${k}">${l}</label><textarea id="vp_${i}_${k}" rows="${r}" data-vp="${i}:${k}"${can ? "" : " readonly"}>${esc(b.video[k])}</textarea></div>`).join("")}</div>
    </section>
    ${mine && nEdit ? `<section class="card"><h2>Satisfied with the boards?</h2><div class="actions"><button class="btn" data-act="submitBoard">${rev ? `Send ${nEdit} revised board(s) to joint re-review` : `Submit ${nEdit} board(s) for internal review`}</button>${S.boards.length > 1 ? `<span class="note">Every open board needs its images first</span>` : ""}</div></section>` : ""}`;
}
function scriptTable(s) {
  return `${s.follows ? `<p class="follows"><b>Follows the direction:</b> ${esc(s.follows)}</p>` : ""}<table class="beats"><tbody>${s.beats.map((b, k) => `<tr><td style="white-space:nowrap;color:#55577A">Scene ${k + 1}<br>${esc(b.time)}</td><td>${esc(b.visual)}<br><i style="color:#55577A">“${esc(b.voiceover)}”</i>${b.onscreen ? `<br><b>On screen:</b> ${esc(b.onscreen)}` : ""}</td></tr>`).join("")}</tbody></table>`;
}
function boardHTML(i) {
  const b = S.boards[i];
  return `${scriptTable(S.scripts[i])}
  <div class="frames">${b.frames.map((f, k) => { const v = f.versions[f.cur]; return `<div class="frame"><div class="img" style="cursor:default">${v ? `<img src="${v.img}" alt="Board ${i + 1} scene ${k + 1}">` : ""}<span class="lab">Scene ${k + 1}</span></div></div>`; }).join("")}</div>
  <details><summary class="note">Prompt to video</summary><pre class="prompt">${esc(VIDEO_FIELDS.map(([k, l]) => `${l}:\n${b.video[k]}`).join("\n\n"))}</pre></details>`;
}
function boardDecision(i, opts, mine) {
  const d = (typeof S.decision[S.stage] === "object" ? S.decision[S.stage] : {})[i];
  return `<div class="decision"><div class="g2">${opts.map(([v, t, sub]) => `<label class="radio${d === v ? " sel" : ""}"><input type="radio" name="dec_${i}" data-change="pickDecision" value="${i}:${v}"${d === v ? " checked" : ""}${mine ? "" : " disabled"}><span><b style="font-size:14px">${t}</b><br><span class="note">${sub}</span></span></label>`).join("")}</div>
  ${mine ? `<div class="f"><label for="cm_${i}">Comment on board ${i + 1}${d === "revise" ? " (what should change?)" : " (optional)"}</label><textarea id="cm_${i}" rows="2" placeholder="${S.stage === "client_board" ? "e.g. Make the Fold8 bigger in scene 2" : "Feedback for the team"}"></textarea></div>` : ""}</div>`;
}
function decisionHTML(opts, mine) {
  const d = S.decision[S.stage];
  return `<div class="decision">${opts.map(([v, t, sub]) => `<label class="radio${d === v ? " sel" : ""}"><input type="radio" name="dec" data-change="pickDecision" value="${v}"${d === v ? " checked" : ""}${mine ? "" : " disabled"}><span><b style="font-size:14px">${t}</b><br><span class="note">${sub}</span></span></label>`).join("")}
  ${mine ? `<div class="f"><label for="comment">Comment ${S.stage.startsWith("client") ? "(one combined set of feedback)" : "(optional)"}</label><textarea id="comment" rows="2" placeholder="Feedback for the team"></textarea></div><div class="actions"><button class="btn" data-act="decide">Send decision</button></div>` : ""}</div>`;
}
function boardReview(st, mine, wait, bp) {
  const client = st.id !== "internal_board", joint = st.id === "joint_rereview";
  const idx = pendingBoards(), others = S.boards.map((b, i) => i).filter((i) => !idx.includes(i));
  const title = st.id === "internal_board" ? "Internal board review" : st.id === "client_board" ? "Board review" : "Joint re-review (Cheil + Samsung)";
  const opts = st.id === "internal_board" ? [["approve", "Approve", "Goes to Samsung once every board is approved."], ["revise", "Request revision", "Creative revises this board by prompt."]]
    : [["approve", "Approve this board", "Ready for production."], ["revise", "Request changes", "One round: Cheil revises, then we re-review together."]];
  const dec = typeof S.decision[st.id] === "object" ? S.decision[st.id] : {};
  const nDone = idx.filter((i) => dec[i]).length;
  return `${briefPanel()}<section class="card${client ? " portal" : ""}">${client ? '<span class="portal-tag">Samsung review portal</span>' : ""}<h2>${title} <span class="pill ok">Step: ${fmtH(st.hours)}</span></h2>${bp(st.id === "internal_board" ? "Creative Leads · Internal review → Approved? (per board)" : st.id === "client_board" ? "Samsung · Review board → Approved? (per board; BAU: one revision, then joint re-review)" : "Cheil + Samsung · Re-review revised boards together")}${wait}
    <p class="muted">${idx.length} board${idx.length > 1 ? "s" : ""} to review${joint ? "" : ", each approved or sent back on its own"}.${others.length ? ` Already settled: ${others.map((i) => `board ${i + 1} (${(STATUS[S.boards[i].status] || [""])[0].toLowerCase()})`).join(", ")}.` : ""}</p>
    ${st.id === "internal_board" ? `<div class="actions">${mine ? `<button class="btn ai" data-act="aiCheckAll"${busy.check ? " disabled" : ""}>${spin(busy.check, "Checking…", "AI pre-check: all boards against the brief")}</button>` : ""}<span class="note">The AI flags anything off-brief before Samsung sees it.</span></div>` : ""}</section>
    ${idx.map((i) => { const b = S.boards[i]; return `<section class="card${client ? " portal" : ""}"><h2><span>Board ${i + 1} · ${esc(S.scripts[i].title)} <span class="note">→ Video ${i + 1}</span></span>${statusPill(b)}</h2>
      ${joint && b.fb[0] ? `<div class="alert"><b>Samsung's feedback:</b> ${esc(b.fb[0].text)}</div>` : ""}
      ${boardHTML(i)}
      ${b.check ? `<div class="checks">${b.check.map((c) => `<div class="check"><span class="pill ${c.status === "pass" ? "ok" : "warn"}">${c.status === "pass" ? "Pass" : "Check"}</span><span><b>${esc(c.item)}</b> · ${esc(c.note)}</span></div>`).join("")}${b.check[0]._fb ? '<span class="tag-fb">sample</span>' : ""}</div>` : ""}
      ${joint ? "" : boardDecision(i, opts, mine)}</section>`; }).join("")}
    ${mine ? `<section class="card"><div class="actions"><button class="btn" data-act="decide">${joint ? "Approved together · start production" : `Send decisions (${nDone} of ${idx.length} chosen)`}</button></div></section>` : ""}`;
}
function playerHTML(v, i) {
  const b = S.boards[v.board] || { frames: [] };
  return `<div class="vid"><div class="player" data-player="${i}"><div class="prog"><i></i></div>${b.frames.map((f, k) => `<img src="${(f.versions[f.cur] || {}).img || ""}" alt="" class="${k === 0 ? "on" : ""}">`).join("")}<div class="cap">${esc(v.caps[0] || "")}</div><div class="end"><span style="font-size:18px">SAMSUNG</span><span style="font-size:13px;font-weight:500">${esc(S.brief.product)}</span><span style="font-size:12px;font-weight:500">${esc(S.form.must)}</span></div><div class="ctrl"><button data-act="play" data-v="${i}">▶ Play 0:15</button></div></div><b style="font-size:13px">${esc(v.name)}</b></div>`;
}
function productionView(st, mine, wait, bp) {
  const fb = S.comments.find((c) => c.stage === "client_content");
  return `${briefPanel()}<section class="card"><h2>${st.id === "content_revision" ? "Content revision" : "Video production"} <span class="pill ok">Step: ${fmtH(st.hours)}</span></h2>${bp(st.id === "content_revision" ? "Creative · Revise content (Samsung feedback) → internal re-review" : "Creative · Produce videos in Flow, After Effects and Suno → upload")}${wait}
    ${st.id === "content_revision" && fb ? `<div class="alert"><b>Samsung's feedback:</b> ${esc(fb.text)}</div>` : ""}
    <p class="muted">One video per approved board. Production animates each board's images in Flow with its prompt to video, then finishes in After Effects and Suno. In this demo the boards become animated previews.</p>
    <details><summary class="note">Prompts to video for Flow (${S.boards.length})</summary>${S.boards.map((b, i) => `<p style="margin:10px 0 4px"><b>Video ${i + 1} · ${esc(S.scripts[i].title)}</b></p><pre class="prompt">${esc(VIDEO_FIELDS.map(([k, l]) => `${l}:\n${b.video[k]}`).join("\n\n"))}\n\n—\nManual edit is required.</pre>`).join("")}</details>
    ${mine && st.id === "production" ? `<div class="actions"><button class="btn ai" data-act="render"${busy.render ? " disabled" : ""}>${spin(busy.render, "Producing…", S.videos.length ? "Produce again" : `Produce and upload ${S.boards.length} video${S.boards.length > 1 ? "s" : ""}`)}</button></div>` : ""}
    ${S.videos.length ? `<div class="vids">${S.videos.map(playerHTML).join("")}</div>` : ""}
    ${st.id === "content_revision" && S.videos.length ? `<h3>Edit on-screen text</h3>${S.videos.map((v, i) => `<div class="f"><label>${esc(v.name)}</label><div class="g3">${v.caps.map((c, k) => `<input id="cap_${i}_${k}" data-cap="${i}:${k}" value="${esc(c)}" aria-label="${esc(v.name)} beat ${k + 1}"${mine ? "" : " readonly"}>`).join("")}</div></div>`).join("")}${mine ? '<div class="actions"><button class="btn" data-act="applyRevision">Re-render and send to internal re-review</button></div>' : ""}` : ""}
    ${mine && st.id === "production" && S.videos.length ? `<div class="actions"><button class="btn" data-act="sendContent">Send to internal content review</button></div>` : ""}</section>`;
}
function contentReview(st, mine, wait, bp) {
  const client = st.id === "client_content";
  const opts = st.id === "internal_content" ? [["approve", "Approve and send to Samsung", "Account sends the videos to Samsung."], ["revise", "Send back to production", "The video editor revises."]]
    : st.id === "client_content" ? [["approve", "Approve all", "Cheil closes the task and delivers the final files."], ["revise", "Request changes", "One round. Later changes need a new brief."]]
    : [["approve", "Re-review passed", "Account closes the task."]];
  const title = st.id === "internal_content" ? "Internal content review" : st.id === "client_content" ? "Content review" : "Internal re-review";
  return `${briefPanel()}<section class="card${client ? " portal" : ""}">${client ? '<span class="portal-tag">Samsung review portal</span>' : ""}<h2>${title} <span class="pill ok">Step: ${fmtH(st.hours)}</span></h2>${bp(st.id === "client_content" ? "Samsung · Review content → Approved? (No: Cheil revises once, internal re-review)" : st.id === "internal_content" ? "Creative Leads · Internal content review" : "Creative Leads · Internal re-review → process complete")}${wait}
    <div class="vids">${S.videos.map(playerHTML).join("")}</div></section>
    <section class="card"><h2>Your decision</h2>${decisionHTML(opts, mine)}</section>`;
}
function closedView() {
  const met = S.elapsed <= SLA_H;
  return `${briefPanel()}<section class="card"><h2>Task closed <span class="pill ${met ? "ok" : "bad"}">${met ? "SLA met" : "SLA missed"} · ${fmtH(S.elapsed)} of 45 h</span></h2>
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
document.addEventListener("toggle", (e) => { if (e.target.classList && e.target.classList.contains("bp")) ui.bpOpen = e.target.open; }, true);
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const f = A[b.dataset.act]; if (f) { e.preventDefault(); syncAll(); f(b.dataset.v, b); }
});
document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-change]"); if (el) { syncAll(); const f = A[el.dataset.change]; if (f) f(el.value, el); return; }
  if (e.target.matches(BOUND)) { syncAll(); save(); }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.matches(BOUND)) syncAll();
  else if (t.id && /^(dirrev|rv_|refine_|cm_|comment)/.test(t.id)) drafts[t.id] = t.value;
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
    else { aiStatus = { ok: true, msg: "AI: ready" + (j.textModels && j.textModels[0] ? " (" + j.textModels[0] + ")" : "") }; const el = document.getElementById("aistat"); if (el) { el.className = "pill ok"; el.textContent = aiStatus.msg; } if (j.hasPasscode && !passcode()) askPass(); }
  } catch { setAI(false, "API not reachable"); }
}

// ---------- boot ----------
(async () => {
  const saved = await DB.get("state");
  if (saved && saved.v === fresh().v) { S = saved; S.hist = S.hist || []; }
  render(); checkAI();
})();
})();
