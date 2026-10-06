/* =========================================================
   听 · AI tutor — a conversation partner limited to your deck
   Uses globals from app.js (WORDS, WORD_IDX, settings, speak…).
   Your Anthropic API key is stored only in this browser.
   ========================================================= */
const TUTOR_KEY = "ting.tutor.v1";
const tutor = Object.assign({ key:"", model:"claude-haiku-4-5-20251001", style:"teacher", scope:"lesson", showEn:true },
                            store.get(TUTOR_KEY, {}) || {});
const saveTutor = () => store.set(TUTOR_KEY, tutor);
let tutorHistory = [];              // [{role, content}] as sent to the API
let tutorCost = 0;                  // running USD estimate for this chat
let tutorBusy = false;
let tutorOpen = false;

// Price per million tokens (USD): [input, cache write, cache read, output]
const TUTOR_PRICE = { "claude-haiku-4-5-20251001":[1,1.25,0.1,5], "claude-sonnet-5-5":[3,3.75,0.3,15] };

/* ---------- open / close ---------- */
function openTutor(on){
  if(on === tutorOpen) return;
  tutorOpen = on;
  if(on){ stop(); }
  $("main").hidden = on; $("tutor").hidden = !on;
  $("tab-tutor").setAttribute("aria-pressed", on);
  if(on){ $("tab-vocab").setAttribute("aria-pressed", false); $("tab-rad").setAttribute("aria-pressed", false); }
  else { $("tab-vocab").setAttribute("aria-pressed", !isRad()); $("tab-rad").setAttribute("aria-pressed", isRad()); }
  if(on){ renderTutorSetup(); if(!tutorHistory.length) tutorGreeting(); $("tutor-in").focus(); }
}
$("tab-tutor").onclick = e=>{ e.preventDefault(); openTutor(true); };
$("tab-vocab").addEventListener("click", ()=>openTutor(false));
$("tab-rad").addEventListener("click", ()=>openTutor(false));
if(location.hash === "#tutor") setTimeout(()=>openTutor(true), 0);

/* ---------- setup card ---------- */
function renderTutorSetup(){
  const has = !!tutor.key;
  $("tutor-setup").hidden = has && !$("tutor-setup").dataset.force;
  $("tutor-chat").hidden = !has;
  $("tutor-key").value = tutor.key;
  $("tutor-model").value = tutor.model;
  [...$("tutor-style").children].forEach(c=>c.setAttribute("aria-pressed", c.dataset.s===tutor.style));
  $("tutor-scope").value = tutor.scope;
  $("tutor-en").setAttribute("aria-pressed", tutor.showEn);
}
$("tutor-save").onclick = ()=>{
  tutor.key = $("tutor-key").value.trim(); tutor.model = $("tutor-model").value; saveTutor();
  delete $("tutor-setup").dataset.force; renderTutorSetup();
  if(tutor.key && !tutorHistory.length) tutorGreeting();
};
$("tutor-gear").onclick = ()=>{ $("tutor-setup").dataset.force = "1"; renderTutorSetup(); };
$("tutor-style").addEventListener("click", e=>{
  const b = e.target.closest("[data-s]"); if(!b) return;
  tutor.style = b.dataset.s; saveTutor(); renderTutorSetup();
});
$("tutor-scope").addEventListener("change", e=>{ tutor.scope = e.target.value; saveTutor(); });
$("tutor-en").onclick = ()=>{ tutor.showEn = !tutor.showEn; saveTutor(); renderTutorSetup(); $("tutor-log").classList.toggle("hide-en", !tutor.showEn); };
$("tutor-new").onclick = ()=>{ tutorHistory = []; tutorCost = 0; $("tutor-log").innerHTML = ""; updateTutorCost(); tutorGreeting(); };

/* ---------- prompt ---------- */
const deckLine = w => w[0]+" "+w[1]+" — "+w[2];
function deckBlock(){                      // stable → cached across turns
  return "DECK (the learner's full vocabulary; you may use these words freely):\n" + WORDS.map(deckLine).join("\n");
}
function focusBlock(){
  const all = WORDS.map((_,i)=>i);
  let focus = all;
  if(tutor.scope === "lesson" && !currentLesson.startsWith("__")) focus = all.filter(i=>LESSONS[i]===currentLesson);
  else if(tutor.scope === "due") focus = all.filter(i=>isDue(i)||isHard(i));
  if(focus.length > 40) focus = focus.slice().sort(()=>Math.random()-0.5).slice(0,40);
  const weak = all.filter(isHard).slice(0,15), known = all.filter(i=>{ const s = srs[WORDS[i][0]]; return s && s.last===1 && s.iv>=3; }).length;
  const label = tutor.scope==="lesson" && !currentLesson.startsWith("__") ? currentLesson : tutor.scope==="due" ? "words due for review" : "the whole deck";
  return "FOCUS words to practise (" + label + "):\n" + focus.map(i=>deckLine(WORDS[i])).join("\n") +
    (weak.length ? "\n\nWEAK words the learner keeps missing — bring these into the conversation naturally:\n" + weak.map(i=>deckLine(WORDS[i])).join("\n") : "") +
    "\n\nThe learner knows about " + known + " words well.\nSTYLE: " + (tutor.style === "immersive"
      ? "immersive — stay in Chinese; only switch to English if the learner explicitly asks."
      : "patient teacher — explain briefly in English when the learner is stuck or makes a mistake.");
}
const TUTOR_RULES = `You are a warm Mandarin conversation partner for an adult beginner (HSK 1–3 level).
Rules:
- Use ONLY words from the DECK plus the most basic function words (是 的 了 吗 呢 不 很 和 在 有 我 你 他 她 我们 你们 他们 这 那 什么 怎么 哪 也 都 要 想 会 可以 没 吧 呀 啊 好 对 再 还 就 一 二 三 四 五 六 七 八 九 十 个). Never use other vocabulary.
- Short: 1–2 sentences, each at most 12 characters. End with a question that invites the learner to use a FOCUS word.
- Work FOCUS and WEAK words into the dialogue naturally; vary topics.
- If the learner's Chinese has a mistake, put the corrected sentence and a one-line explanation in "fix". Otherwise "fix" is "".
- If the learner writes English or pinyin, reply in Chinese anyway and gently invite them to try Chinese.
- "good" = DECK words the learner just used correctly. "bad" = DECK words they misused or clearly didn't understand.
Reply with ONLY a JSON object, no prose, no code fences:
{"zh": string, "py": string (tone-marked pinyin of zh, one group per word, e.g. "nǐ xǐhuan hē chá ma?"), "en": string (natural English translation of zh), "fix": string, "good": string[], "bad": string[]}`;

/* ---------- API ---------- */
async function callTutor(){
  const price = TUTOR_PRICE[tutor.model] || TUTOR_PRICE["claude-haiku-4-5-20251001"];
  const body = {
    model: tutor.model, max_tokens: 400,
    system: [ { type:"text", text: deckBlock(), cache_control:{ type:"ephemeral" } },
              { type:"text", text: TUTOR_RULES + "\n\n" + focusBlock() } ],
    messages: tutorHistory.slice(-24)
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "content-type":"application/json", "x-api-key":tutor.key, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
    body: JSON.stringify(body)
  });
  const data = await r.json().catch(()=>({}));
  if(!r.ok){ const m = (data.error && data.error.message) || ("HTTP "+r.status); throw new Error(r.status===401 ? "API key rejected — check it in ⚙ settings." : m); }
  const u = data.usage || {};
  tutorCost += ((u.input_tokens||0)*price[0] + (u.cache_creation_input_tokens||0)*price[1] + (u.cache_read_input_tokens||0)*price[2] + (u.output_tokens||0)*price[3]) / 1e6;
  const text = (data.content||[]).filter(c=>c.type==="text").map(c=>c.text).join("");
  return parseTutor(text);
}
function parseTutor(text){
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  let o = null;
  if(a >= 0 && b > a){ try{ o = JSON.parse(text.slice(a, b+1)); }catch(e){} }
  if(!o || typeof o.zh !== "string") o = { zh: text.trim(), py:"", en:"", fix:"", good:[], bad:[] };
  o.good = Array.isArray(o.good) ? o.good : []; o.bad = Array.isArray(o.bad) ? o.bad : [];
  o.py = o.py || ""; o.en = o.en || ""; o.fix = o.fix || "";
  return o;
}

/* ---------- rendering ---------- */
const DECK_BY_LEN = WORDS.map(w=>w[0]).filter(z=>/^\p{Script=Han}+$/u.test(z)).sort((a,b)=>b.length-a.length);
function markDeckWords(zh){                 // wrap deck words so they can be tapped
  let out = "", i = 0;
  while(i < zh.length){
    const hit = DECK_BY_LEN.find(z => zh.startsWith(z, i));
    if(hit){ out += '<span class="tw" data-wi="'+WORD_IDX[hit]+'" title="'+esc(WORDS[WORD_IDX[hit]][1]+" — "+WORDS[WORD_IDX[hit]][2])+'">'+esc(hit)+'</span>'; i += hit.length; }
    else { out += esc(zh[i]); i++; }
  }
  return out;
}
function addMsg(role, o){
  const log = $("tutor-log"), d = document.createElement("div");
  d.className = "tmsg "+role;
  if(role === "user") d.innerHTML = '<div class="tzh">'+esc(o.zh)+'</div>';
  else d.innerHTML =
    (o.fix ? '<div class="tfix">'+esc(o.fix)+'</div>' : '') +
    '<div class="tzh">'+markDeckWords(o.zh)+'</div>' +
    (o.py ? '<div class="tpy">'+toneHTML(o.py)+'</div>' : '') +
    (o.en ? '<div class="ten">'+esc(o.en)+'</div>' : '') +
    '<div class="tact"><button class="chip" data-say>🔊 Again</button>' + (!tutor.showEn && o.en ? '<button class="chip" data-en>Show English</button>' : '') + '</div>';
  log.appendChild(d); log.scrollTop = log.scrollHeight;
  return d;
}
$("tutor-log").addEventListener("click", e=>{
  const w = e.target.closest("[data-wi]"); if(w){ openTutor(false); jumpToWord(+w.dataset.wi); return; }
  const m = e.target.closest(".tmsg");
  if(e.target.closest("[data-say]") && m){ const zh = m.querySelector(".tzh").textContent; speakZh(zh, settings.rate); }
  if(e.target.closest("[data-en]") && m){ m.querySelector(".ten").style.display = "block"; e.target.remove(); }
});
function updateTutorCost(){
  $("tutor-cost").textContent = tutorHistory.length ? "≈ $"+(tutorCost < 0.01 ? tutorCost.toFixed(4) : tutorCost.toFixed(3))+" this chat" : "";
}
function tutorStatus(t){ $("tutor-status").textContent = t || ""; }

/* ---------- conversation ---------- */
async function tutorSend(text){
  text = (text||"").trim(); if(!text || tutorBusy || !tutor.key) return;
  $("tutor-in").value = "";
  addMsg("user", { zh:text });
  tutorHistory.push({ role:"user", content:text });
  tutorBusy = true; $("tutor-send").disabled = true; tutorStatus("…");
  try{
    const o = await callTutor();
    tutorHistory.push({ role:"assistant", content: JSON.stringify(o) });
    addMsg("tutor", o);
    // conversation feeds the SRS
    let graded = 0;
    o.good.forEach(z=>{ const i = WORD_IDX[z]; if(i !== undefined){ grade(i, true); graded++; } });
    o.bad.forEach(z=>{ const i = WORD_IDX[z]; if(i !== undefined){ grade(i, false); graded++; } });
    if(graded){ buildLessonMenu(); buildList(); updateStats(); }
    updateTutorCost(); tutorStatus("");
    await speakZh(o.zh.replace(/[，。！？、,.!?]/g," "), settings.rate);
  }catch(err){
    tutorStatus("⚠ "+err.message);
    tutorHistory.pop();
  }finally{ tutorBusy = false; $("tutor-send").disabled = false; }
}
async function tutorGreeting(){
  if(!tutor.key || tutorBusy) return;
  tutorHistory = [];
  tutorBusy = true; tutorStatus("…");
  try{
    tutorHistory.push({ role:"user", content:"(The learner just opened the chat. Greet them in one short sentence and ask an easy question using a FOCUS word.)" });
    const o = await callTutor();
    tutorHistory.push({ role:"assistant", content: JSON.stringify(o) });
    addMsg("tutor", o); updateTutorCost(); tutorStatus("");
    await speakZh(o.zh.replace(/[，。！？、,.!?]/g," "), settings.rate);
  }catch(err){ tutorStatus("⚠ "+err.message); tutorHistory = []; }
  finally{ tutorBusy = false; }
}
$("tutor-send").onclick = ()=>tutorSend($("tutor-in").value);
$("tutor-in").addEventListener("keydown", e=>{ if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); tutorSend(e.target.value); } });

/* ---------- speech input (Chrome / Safari) ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if(!SR) $("tutor-mic").hidden = true;
let rec = null, recOn = false;
$("tutor-mic").onclick = ()=>{
  if(recOn){ rec && rec.stop(); return; }
  rec = new SR(); rec.lang = "zh-CN"; rec.interimResults = true; rec.maxAlternatives = 1;
  let finalText = "";
  rec.onresult = e=>{ let s = ""; for(const r of e.results){ s += r[0].transcript; if(r.isFinal) finalText = s; } $("tutor-in").value = s; };
  rec.onend = ()=>{ recOn = false; $("tutor-mic").classList.remove("live"); if(finalText.trim()) tutorSend(finalText); };
  rec.onerror = ()=>{ recOn = false; $("tutor-mic").classList.remove("live"); tutorStatus("Microphone unavailable — type instead."); };
  speechSynthesis.cancel();
  try{ rec.start(); recOn = true; $("tutor-mic").classList.add("live"); tutorStatus("Listening… speak Chinese"); }catch(e){ recOn = false; }
};
$("tutor-log").classList.toggle("hide-en", !tutor.showEn);
