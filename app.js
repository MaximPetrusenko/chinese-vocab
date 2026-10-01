/* =========================================================
   听 · Chinese Vocabulary Loop — app logic
   Data comes from words.js, examples-a/b.js, lessons.js, meta.js
   ========================================================= */

/* ---------- data assembly ---------- */
const EXAMPLES = [...EXAMPLES_A, ...EXAMPLES_B];
const LESSONS = [];
LESSON_SPEC.forEach(([name,count])=>{ for(let i=0;i<count;i++) LESSONS.push(name); });

const FREQ = {};
Object.entries(FREQ_TIERS).forEach(([t,s])=>s.split(" ").forEach(w=>{ if(w) FREQ[w]=+t; }));
const TIER_LABEL = {1:"★★★ Most common · HSK 1–2", 2:"★★ Common · HSK 3–4", 3:"★ Less common · HSK 5+"};
const tierOf = i => FREQ[WORDS[i][0]] || 2;
const stars  = t => "★★★".slice(0, 4-t);

const POS = {};
Object.entries(POS_GROUPS).forEach(([p,s])=>s.split(" ").forEach(w=>{ if(w) POS[w]=p; }));
const posOf = i => POS[WORDS[i][0]] || "n";

/* ---------- storage (survives reloads; wrapped because file:// and private mode can throw) ---------- */
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const SRS_KEY = "ting.srs.v1", SET_KEY = "ting.settings.v1";

/* ---------- spaced repetition (SM-2 lite), keyed by hanzi so it survives deck edits ---------- */
// state per word: { r: streak, e: ease, iv: interval days, due: ms, l: lapses, last: 1|0, t: ms }
let srs = store.get(SRS_KEY, {}) || {};
const DAY = 864e5, MIN = 6e4;
const stateOf = i => srs[WORDS[i][0]];

function grade(i, ok){
  const k = WORDS[i][0], now = Date.now();
  const s = srs[k] || { r:0, e:2.5, iv:0, due:0, l:0 };
  if(ok){
    s.r += 1;
    s.iv = s.r === 1 ? 1 : s.r === 2 ? 3 : Math.round(s.iv * s.e);
    s.e  = Math.min(3, s.e + 0.05);
    s.due = now + s.iv * DAY;
  } else {
    s.r = 0; s.l += 1; s.iv = 0;
    s.e = Math.max(1.3, s.e - 0.2);
    s.due = now + 10 * MIN;            // missed words come back in 10 minutes
  }
  s.last = ok ? 1 : 0; s.t = now;
  srs[k] = s;
  store.set(SRS_KEY, srs);
}
const isNew  = i => !stateOf(i);
const isDue  = i => { const s = stateOf(i); return !!s && s.due <= Date.now(); };
const isHard = i => { const s = stateOf(i); return !!s && (s.last === 0 || (s.l >= 2 && s.iv < 7)); };

function statusOf(i){
  const s = stateOf(i), now = Date.now();
  if(!s) return { cls:"new", text:"new" };
  if(s.last === 0){
    const m = Math.ceil((s.due - now) / MIN);
    return { cls:"hard", text: m > 0 ? "missed · back in "+m+" min" : "missed · review now" };
  }
  if(s.due <= now) return { cls:"due", text:"due for review" };
  const d = Math.max(1, Math.round((s.due - now) / DAY));
  return { cls:"ok", text:"known · next in "+d+(d===1?" day":" days") };
}

/* ---------- settings (persisted) ---------- */
const DEFAULTS = { rate:0.8, repeat:2, gap:1.2, think:1.5, english:true, example:false, shuffle:false,
                   byFreq:false, slowFirst:false, quiz:"off", lesson:"__all__", voice:"" };
const settings = Object.assign({}, DEFAULTS, store.get(SET_KEY, {}) || {});
const saveSettings = () => store.set(SET_KEY, settings);

/* ---------- DOM ---------- */
const $ = id => document.getElementById(id);
const han=$("han"), pinyin=$("pinyin"), gloss=$("gloss"), cur=$("cur"),
      pbar=$("pbar"), seal=$("seal"), playicon=$("playicon"), wlist=$("wlist"), hint=$("hint"),
      exampleBox=$("example"), exzh=$("exzh"), expy=$("expy"), exen=$("exen"), moreBox=$("more");

let order = [];
let pos = 0;                 // position within `order`
let playing = false;
let gen = 0;                 // invalidates stale async chains
let currentLesson = settings.lesson;
let revealedFor = -1;        // word index whose answer is currently revealed (quiz modes)
let zhVoice=null, enVoice=null;

const idx = () => order[pos];
const alive = my => playing && my === gen;

/* ---------- lesson menu ---------- */
const STUDY = { __due:isDue, __hard:isHard, __new:isNew };
const STUDY_NOTE = {
  __due:  "Words you've rated that are due again. ✓ clears a word until its next review; ✗ sends it to the back of the queue.",
  __hard: "Words you missed last time or keep forgetting. Get one right and it leaves this list.",
  __new:  "Words you've never rated. Tap ✓ or ✗ on each to start tracking it."
};
const EMPTY_NOTE = {
  __due:  "Nothing due right now. Rate words with ✓ / ✗ and they'll come back here on schedule.",
  __hard: "No hard words yet — anything you mark ✗ lands here.",
  __new:  "You've rated every word in the deck."
};
const esc = s => String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const opt = (v, label) => '<option value="'+esc(v)+'">'+esc(label)+'</option>';

function buildLessonMenu(){
  const sel = $("lesson");
  const all = WORDS.map((_,i)=>i);
  const n = f => all.filter(f).length;
  const o = [opt("__all__", "All lessons ("+WORDS.length+")")];
  o.push('<optgroup label="Study · spaced repetition">');
  o.push(opt("__due",  "⟳ Review due ("+n(isDue)+")"));
  o.push(opt("__hard", "✗ Hard words ("+n(isHard)+")"));
  o.push(opt("__new",  "○ New — never rated ("+n(isNew)+")"));
  o.push('</optgroup><optgroup label="Lessons">');
  LESSON_SPEC.forEach(([name,count])=>o.push(opt(name, name+" ("+count+")")));
  o.push('</optgroup><optgroup label="By frequency · across all lessons">');
  [1,2,3].forEach(t=>o.push(opt("__tier"+t, TIER_LABEL[t]+" ("+n(i=>tierOf(i)===t)+")")));
  o.push('</optgroup><optgroup label="By word type · across all lessons">');
  Object.keys(POS_LABEL).forEach(p=>{ const c=n(i=>posOf(i)===p); if(c) o.push(opt("__pos_"+p, POS_LABEL[p]+" ("+c+")")); });
  o.push('</optgroup>');
  sel.innerHTML = o.join("");
  sel.value = currentLesson;
  if(sel.value !== currentLesson){ currentLesson = "__all__"; sel.value = "__all__"; }
}

function selectionFor(v){
  const all = WORDS.map((_,i)=>i);
  if(v === "__all__") return all;
  if(v === "__due")  return all.filter(isDue).sort((a,b)=>stateOf(a).due - stateOf(b).due);
  if(v === "__hard") return all.filter(isHard);
  if(v === "__new")  return all.filter(isNew);
  if(v.startsWith("__tier")){ const t = +v.slice(6); return all.filter(i=>tierOf(i)===t); }
  if(v.startsWith("__pos_")){ const p = v.slice(6);  return all.filter(i=>posOf(i)===p); }
  return all.filter(i=>LESSONS[i]===v);
}

function sortByFreq(){ order.sort((a,b)=> (tierOf(a)-tierOf(b)) || (a-b)); }
function reshuffle(){
  for(let i=order.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [order[i],order[j]]=[order[j],order[i]]; }
}

function applyLesson(){
  order = selectionFor(currentLesson);
  if(settings.byFreq && currentLesson !== "__due") sortByFreq();
  if(settings.shuffle) reshuffle();
  pos = 0; revealedFor = -1;
  $("lessonnote").textContent = STUDY_NOTE[currentLesson] || "";
  $("lessonnote").hidden = !STUDY_NOTE[currentLesson];
  buildList(); render(); updateStats();
}

/* ---------- voices ---------- */
let allVoices=[];
let zhVoices=[];   // cached, sorted Chinese voices

// Best-effort gender from the voice name (Web Speech doesn't reliably expose it).
const MALE_NAMES=["kangkang","yunyang","yunxi","yunjian","yunze","yunfeng","yunhao","yunye","yunxia","han","bobo","binbin","男"];
const FEMALE_NAMES=["tingting","婷婷","huihui","yaoyao","xiaoxiao","xiaoyi","xiaohan","xiaomeng","xiaomo","xiaoxuan","xiaorui","xiaoshuang","mengmeng","xiaobei","xiaoni","meijia","sinji","女"];
function voiceGender(v){
  if(v && typeof v.gender==="string"){
    if(/female/i.test(v.gender)) return "f";
    if(/male/i.test(v.gender))   return "m";
  }
  const n=(v && v.name||"").toLowerCase();
  if(FEMALE_NAMES.some(t=>n.includes(t))) return "f";   // check female first ("female" contains "male")
  if(MALE_NAMES.some(t=>n.includes(t)))   return "m";
  return "?";
}
function sampleVoice(){
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance("你好");
  u.lang="zh-CN"; u.rate=settings.rate; if(zhVoice) u.voice=zhVoice;
  speechSynthesis.speak(u);
}
function loadVoices(){
  allVoices = speechSynthesis.getVoices();
  let zh = allVoices.filter(v=>/^zh/i.test(v.lang));
  // Offline ("local") voices are far more reliable than cloud voices,
  // which often end instantly with no sound. List local ones first.
  zh.sort((a,b)=> (b.localService===true) - (a.localService===true));
  zhVoices = zh;
  const sel = $("voice");
  sel.innerHTML="";
  if(zh.length===0){
    sel.innerHTML='<option>No Chinese voice found</option>';
    hint.classList.add("warn");
    hint.innerHTML="No Chinese text-to-speech voice is installed on this device, so playback may fall back to a default voice. To fix it, add a Chinese (Mandarin) voice in your system's language / speech settings, then reload.";
  }else{
    zh.forEach(v=>{
      const o=document.createElement("option");
      o.value=v.voiceURI;
      const g=voiceGender(v); const mark = g==="m"?"  ♂":g==="f"?"  ♀":"";
      o.textContent=v.name+" — "+v.lang+(v.localService?"  (offline)":"  (online)")+mark;
      sel.appendChild(o);
    });
    zhVoice = zh.find(v=>v.voiceURI===settings.voice) || zh[0];
    sel.value = zhVoice.voiceURI;
  }
  // prefer an offline English voice too
  let en = allVoices.filter(v=>/^en/i.test(v.lang));
  en.sort((a,b)=> (b.localService===true) - (a.localService===true));
  enVoice = en[0] || null;
}
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();
// Some browsers populate voices late — re-check a couple of times.
let voiceTries=0;
const voiceTimer=setInterval(()=>{ loadVoices(); if(++voiceTries>5||allVoices.length) clearInterval(voiceTimer); }, 400);

$("voice").addEventListener("change", e=>{
  zhVoice = allVoices.find(v=>v.voiceURI===e.target.value) || zhVoice;
  settings.voice = zhVoice ? zhVoice.voiceURI : ""; saveSettings();
  sampleVoice();   // quick sample so you can hear the chosen voice works
});

// Male / Female / Any quick picker
$("gender").addEventListener("click", e=>{
  const b=e.target.closest("[data-g]"); if(!b) return;
  [...e.currentTarget.children].forEach(c=>c.setAttribute("aria-pressed", c===b));
  const g=b.dataset.g;
  $("gendernote").textContent="";
  if(g==="any") return;
  const match = zhVoices.filter(v=>voiceGender(v)===g);
  if(match.length){
    zhVoice = match[0];
    $("voice").value = zhVoice.voiceURI;
    settings.voice = zhVoice.voiceURI; saveSettings();
    sampleVoice();
  } else {
    $("gendernote").textContent = g==="m"
      ? "No male Chinese voice is installed on this device."
      : "No female Chinese voice found on this device.";
  }
});

/* ---------- rendering ---------- */
const masked = () => settings.quiz !== "off" && order.length && revealedFor !== idx();

function renderMore(w){
  const a = ALT[w[0]];
  if(!a){ moreBox.hidden = true; moreBox.innerHTML = ""; return; }
  moreBox.innerHTML = '<div class="more-note">'+esc(a.note)+'</div>' +
    a.ex.map(e=>'<div class="more-ex"><span class="mz">'+esc(e[0])+'</span> <span class="mp">'+esc(e[1])+'</span> <span class="me">'+esc(e[2])+'</span></div>').join("");
  moreBox.hidden = false;
}

function render(){
  const tierEl = $("tier");
  if(!order.length){
    han.textContent = "—"; han.classList.remove("masked");
    pinyin.textContent = ""; gloss.classList.remove("masked");
    gloss.textContent = EMPTY_NOTE[currentLesson] || "No words here.";
    exampleBox.hidden = true; moreBox.hidden = true; $("reveal").hidden = true;
    tierEl.textContent = ""; setStatus(null);
    cur.textContent = 0; $("total").textContent = 0; pbar.style.width = "0%";
    return;
  }
  const i = idx(), w = WORDS[i], m = masked();
  const hideEn = m && settings.quiz === "listen";
  han.textContent = m ? "？" : w[0];
  han.classList.toggle("masked", !!m);
  pinyin.textContent = m ? " " : w[1];
  gloss.textContent = hideEn ? "Listen — what does it mean?" : w[2];
  gloss.classList.toggle("masked", hideEn);
  const t = tierOf(i); tierEl.textContent = stars(t); tierEl.title = TIER_LABEL[t]; tierEl.dataset.t = t;

  const ex = EXAMPLES[i];
  if(settings.example && ex && !m){
    exzh.textContent=ex[0]; expy.textContent=ex[1]; exen.textContent=ex[2];
    exampleBox.hidden=false;
  } else exampleBox.hidden=true;
  exampleBox.classList.remove("speaking");
  if(m) moreBox.hidden = true; else renderMore(w);
  $("reveal").hidden = !m;
  setStatus(i);

  cur.textContent = pos+1;
  $("total").textContent = order.length;
  pbar.style.width = ((pos+1)/order.length*100)+"%";
  [...wlist.children].forEach((li,p)=>li.classList.toggle("active", p===pos));
}

function setStatus(i){
  const el = $("srsstatus");
  if(i === null || i === undefined){ el.textContent = ""; el.dataset.s = ""; return; }
  const s = statusOf(i);
  el.textContent = s.text; el.dataset.s = s.cls;
}

function updateStats(){
  const all = WORDS.map((_,i)=>i);
  const rated = all.filter(i=>!isNew(i)).length;
  $("stats").textContent = rated
    ? rated+" rated · "+all.filter(isDue).length+" due · "+all.filter(isHard).length+" hard · "+(WORDS.length-rated)+" new"
    : "Tap ✓ / ✗ on a card to start tracking what you know";
}

function reveal(){ if(!order.length) return; revealedFor = idx(); render(); }

/* ---------- speech engine ---------- */
// Speak once. We confirm it actually produced sound by watching both the
// onstart event AND the speechSynthesis.speaking flag (some voices, like
// Apple's Tingting, are slow to fire onstart but DO set `speaking`). We only
// declare a silent failure if nothing is speaking after a generous wait,
// so a slow-but-working voice is never cut off.
function speakOnce(text, lang, rate){
  return new Promise(resolve=>{
    let started=false, settled=false, poll, cap;
    const finish = ok => {
      if(settled) return; settled=true;
      clearInterval(poll); clearTimeout(cap); resolve(ok);
    };
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const v = lang.startsWith("zh") ? zhVoice : enVoice;
    if(v) u.voice = v;
    u.onstart = ()=>{ started=true; };
    u.onend   = ()=>finish(started);
    u.onerror = ()=>finish(false);
    try { speechSynthesis.speak(u); } catch(e){ finish(false); return; }

    // poll: if the engine is actually speaking, it's working — let it finish.
    let waited=0;
    poll = setInterval(()=>{
      if(speechSynthesis.speaking || speechSynthesis.pending) started=true;
      waited += 150;
      // only a true silent drop reaches here: nothing ever began speaking
      if(!started && waited >= 2500) finish(false);
    }, 150);

    // absolute safety cap so a stuck utterance can never freeze the loop
    cap = setTimeout(()=>finish(started), 9000 + text.length*450);
  });
}
// Retry once only if the word made no sound at all.
async function speak(text, lang, rate){
  let ok = await speakOnce(text, lang, rate);
  if(!ok){
    speechSynthesis.cancel();
    await wait(350);
    ok = await speakOnce(text, lang, rate);
  }
  return ok;
}
const wait = ms => new Promise(r=>setTimeout(r,ms));

// Patterns like 不是……而是…… and alternatives like 喝茶/咖啡 are spoken as separate chunks.
const zhChunks = text => text.split(/……|…|\/|\.\.\./).map(s=>s.trim()).filter(Boolean);
async function speakZh(text, rate){
  const parts = zhChunks(text);
  for(let j=0;j<parts.length;j++){
    await speak(parts[j], "zh-CN", rate);
    if(j < parts.length-1) await wait(280);
  }
}
const enText = s => s.replace(/\.\.\.|…/g," ").replace(/\//g," or ");

// Say the word `repeat` times; with "slow first" the first pass is at 0.6×.
async function sayChinese(i, my){
  for(let r=0; r<settings.repeat; r++){
    if(!alive(my)) return false;
    const rt = (settings.slowFirst && r===0) ? Math.min(settings.rate, 0.6) : settings.rate;
    await speakZh(WORDS[i][0], rt);
    if(!alive(my)) return false;
    if(r < settings.repeat-1) await wait(220);
  }
  return true;
}

let warmedUp=false;
function warmUp(){               // first speak after a user gesture primes the engine
  if(warmedUp) return; warmedUp=true;
  try{ const u=new SpeechSynthesisUtterance(""); u.volume=0; speechSynthesis.speak(u); }catch(e){}
}

async function loop(){
  if(!order.length) return;
  const my = ++gen;
  playing = true; setIcon();
  warmUp();
  while(alive(my)){
    if(!order.length){ stop(); return; }
    render();
    const i = idx(), w = WORDS[i];
    const enRate = Math.max(0.9, settings.rate);
    const think = () => wait(settings.think*1000);

    if(settings.quiz === "en2zh"){                 // English → guess the Chinese
      if(enVoice){ await speak(enText(w[2]), "en-US", enRate); if(!alive(my)) return; }
      await think(); if(!alive(my)) return;
      reveal();
      if(!await sayChinese(i, my)) return;
    } else if(settings.quiz === "listen"){         // audio only → guess the meaning
      if(!await sayChinese(i, my)) return;
      await think(); if(!alive(my)) return;
      reveal();
      if(settings.english && enVoice){ await speak(enText(w[2]), "en-US", enRate); if(!alive(my)) return; }
    } else {                                       // normal listening loop
      if(!await sayChinese(i, my)) return;
      if(settings.english && enVoice){
        if(settings.think > 0){ await think(); if(!alive(my)) return; }
        await speak(enText(w[2]), "en-US", enRate);
        if(!alive(my)) return;
      }
    }

    const ex = EXAMPLES[i];
    if(settings.example && ex){
      await wait(300);
      if(!alive(my)) return;
      exampleBox.classList.add("speaking");
      await speak(ex[0].replace(/[…．]+/g," "), "zh-CN", settings.rate);
      if(!alive(my)) return;
      if(settings.english && enVoice){
        await wait(150);
        await speak(enText(ex[2]), "en-US", enRate);
      }
      exampleBox.classList.remove("speaking");
      if(!alive(my)) return;
    }
    await wait(settings.gap*1000);
    if(!alive(my)) return;
    advance(1);
  }
}
function advance(d){
  if(!order.length) return;
  pos += d; revealedFor = -1;
  if(pos>=order.length){ pos=0; if(settings.shuffle) reshuffle(); }
  if(pos<0) pos=order.length-1;
}

function setIcon(){
  playicon.innerHTML = playing
    ? '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>'
    : '<path d="M8 5v14l11-7z"/>';
  $("play").setAttribute("aria-label", playing?"Pause":"Play");
  seal.classList.toggle("live", playing);
}
function stop(){ playing=false; gen++; speechSynthesis.cancel(); setIcon(); }
function toggle(){ if(playing) stop(); else loop(); }

/* keep Chrome from cutting speech off after ~15s */
setInterval(()=>{ if(playing && speechSynthesis.speaking) speechSynthesis.resume(); }, 6000);

/* ---------- rating ---------- */
function rateCurrent(ok){
  if(!order.length) return;
  const was = playing; stop();
  const i = idx();
  grade(i, ok);
  const stage = $("stage");
  stage.classList.remove("flash-yes","flash-no"); void stage.offsetWidth;
  stage.classList.add(ok ? "flash-yes" : "flash-no");
  setTimeout(()=>stage.classList.remove("flash-yes","flash-no"), 450);

  const q = STUDY[currentLesson];
  if(q && !ok){                       // study list: missed word goes to the back of the queue
    order.push(order.splice(pos,1)[0]);
    if(pos >= order.length) pos = 0;
  } else if(q && !q(i)){              // no longer belongs in this list
    order.splice(pos,1);
    if(pos >= order.length) pos = 0;
  } else advance(1);
  revealedFor = -1;
  buildLessonMenu(); buildList(); render(); updateStats();
  if(was && order.length) loop();
}

/* ---------- controls ---------- */
$("play").onclick = toggle;
$("stage").onclick = e=>{ if(e.target.closest && e.target.closest("button,.more")) return; toggle(); };
$("stage").onkeydown = e=>{ if(e.key===" "||e.key==="Enter"){e.preventDefault();toggle();} };
$("next").onclick = ()=>{ const was=playing; stop(); advance(1); render(); if(was) loop(); };
$("prev").onclick = ()=>{ const was=playing; stop(); advance(-1); render(); if(was) loop(); };
$("grade-no").onclick  = ()=>rateCurrent(false);
$("grade-yes").onclick = ()=>rateCurrent(true);
$("reveal").onclick = e=>{ e.stopPropagation && e.stopPropagation(); reveal(); };

$("rate").oninput  = e=>{ settings.rate=+e.target.value;  $("rateval").textContent=settings.rate.toFixed(2)+"×"; saveSettings(); };
$("gap").oninput   = e=>{ settings.gap=+e.target.value;   $("gapval").textContent=settings.gap.toFixed(1)+"s"; saveSettings(); };
$("think").oninput = e=>{ settings.think=+e.target.value; $("thinkval").textContent=settings.think.toFixed(1)+"s"; saveSettings(); };

$("repeat").addEventListener("click", e=>{
  const b=e.target.closest("[data-r]"); if(!b) return;
  settings.repeat=+b.dataset.r; saveSettings();
  [...e.currentTarget.children].forEach(c=>c.setAttribute("aria-pressed", c===b));
});
$("quizmode").addEventListener("click", e=>{
  const b=e.target.closest("[data-q]"); if(!b) return;
  settings.quiz=b.dataset.q; saveSettings();
  [...e.currentTarget.children].forEach(c=>c.setAttribute("aria-pressed", c===b));
  revealedFor=-1; render();
});
function toggleChip(el,key){
  const on = el.getAttribute("aria-pressed")!=="true";
  el.setAttribute("aria-pressed", on); settings[key]=on; saveSettings();
}
$("english").onclick = ()=>toggleChip($("english"),"english");
$("slowfirst").onclick = ()=>toggleChip($("slowfirst"),"slowFirst");
$("example-toggle").onclick = ()=>{ toggleChip($("example-toggle"),"example"); render(); };
$("byfreq").onclick = ()=>{
  toggleChip($("byfreq"),"byFreq");
  const was=playing; stop();
  const keep = idx();
  if(settings.byFreq){ if(!settings.shuffle) sortByFreq(); }
  else if(!settings.shuffle) order.sort((a,b)=>a-b);
  pos = Math.max(0, order.indexOf(keep));
  buildList(); render();
  if(was) loop();
};
$("shuffle").onclick = ()=>{
  toggleChip($("shuffle"),"shuffle");
  const keep = idx();
  if(settings.shuffle) reshuffle();
  else { order.sort((a,b)=>a-b); if(settings.byFreq) sortByFreq(); }   // back to natural (or frequency) order
  pos = Math.max(0, order.indexOf(keep));
  buildList();
  render();
};

$("lesson").addEventListener("change", e=>{
  const was = playing; stop();
  currentLesson = e.target.value;
  settings.lesson = currentLesson; saveSettings();
  $("freqtab").setAttribute("aria-pressed","false");
  applyLesson();
  if(was) loop();
});

document.addEventListener("keydown", e=>{
  const tag = e.target.tagName;
  if(tag==="SELECT" || tag==="INPUT") return;
  if(e.key===" "){e.preventDefault();toggle();}
  else if(e.key==="ArrowRight") $("next").click();
  else if(e.key==="ArrowLeft") $("prev").click();
  else if(e.key==="1") rateCurrent(false);
  else if(e.key==="2") rateCurrent(true);
  else if(e.key==="r" || e.key==="R") reveal();
});

/* ---------- word list ---------- */
function buildList(){
  wlist.innerHTML="";
  order.forEach((wi,p)=>{
    const w = WORDS[wi];
    const li=document.createElement("li");
    li.tabIndex=0;
    li.dataset.s = statusOf(wi).cls;
    li.innerHTML=`<span class="n">${p+1}</span><span class="lz">${w[0]}</span><span class="lt" data-t="${tierOf(wi)}">${stars(tierOf(wi))}</span><span class="lp">${w[1]}</span>`;
    const jump=()=>{ const was=playing; stop(); pos=p; revealedFor=-1; render(); if(was) loop(); };
    li.onclick=jump;
    li.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();jump();} };
    wlist.appendChild(li);
  });
}

$("freqtab").onclick = e=>{
  e.preventDefault();
  const was=playing; stop();
  currentLesson="__all__"; $("lesson").value="__all__"; settings.lesson=currentLesson;
  if(!settings.byFreq){ settings.byFreq=true; $("byfreq").setAttribute("aria-pressed","true"); }
  saveSettings();
  $("freqtab").setAttribute("aria-pressed","true");
  applyLesson(); if(was) loop();
  window.scrollTo({top:0,behavior:"smooth"});
};

/* ---------- restore saved settings into the controls ---------- */
function syncControls(){
  $("rate").value = settings.rate;   $("rateval").textContent  = (+settings.rate).toFixed(2)+"×";
  $("gap").value  = settings.gap;    $("gapval").textContent   = (+settings.gap).toFixed(1)+"s";
  $("think").value= settings.think;  $("thinkval").textContent = (+settings.think).toFixed(1)+"s";
  [...$("repeat").children].forEach(c=>c.setAttribute("aria-pressed", +c.dataset.r===settings.repeat));
  [...$("quizmode").children].forEach(c=>c.setAttribute("aria-pressed", c.dataset.q===settings.quiz));
  $("english").setAttribute("aria-pressed", settings.english);
  $("example-toggle").setAttribute("aria-pressed", settings.example);
  $("shuffle").setAttribute("aria-pressed", settings.shuffle);
  $("byfreq").setAttribute("aria-pressed", settings.byFreq);
  $("slowfirst").setAttribute("aria-pressed", settings.slowFirst);
}

// refresh due counts once a minute (skipped while the menu is focused so it doesn't close on you)
setInterval(()=>{
  if(document.activeElement === $("lesson")) return;
  buildLessonMenu(); updateStats();
  if(!playing && order.length) setStatus(idx());
}, 60000);

syncControls();
buildLessonMenu();
applyLesson();
if(location.hash==="#frequency") $("freqtab").click();
