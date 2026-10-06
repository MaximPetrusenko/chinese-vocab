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
/* ---------- two decks: vocabulary and radicals ---------- */
const RAD_RANK = {}; RAD_ORDER.split(" ").forEach((r,k)=>{ RAD_RANK[r]=k; });
const isRad = () => settings.tab === "radicals";
const count = () => isRad() ? RADICALS.length : WORDS.length;
const range = () => Array.from({length:count()}, (_,i)=>i);
const card  = i => isRad()
  ? { zh:RADICALS[i][0], py:RADICALS[i][1], en:RADICALS[i][2] }
  : { zh:WORDS[i][0],    py:WORDS[i][1],    en:WORDS[i][2] };
const radRank = i => RAD_RANK[RADICALS[i][0]] ?? 99;
const tierOf = i => isRad() ? (radRank(i) < 13 ? 1 : radRank(i) < 27 ? 2 : 3) : (FREQ[WORDS[i][0]] || 2);
const freqKey = i => isRad() ? radRank(i) : tierOf(i)*1e4 + i;
// character → radical index (dictionary radical, plus each radical card's example characters)
const CHAR_RAD = {};
RADICALS.forEach((r,ri)=>{ (RAD_CHARS[r[0]]||"").split("").forEach(ch=>{ if(!(ch in CHAR_RAD)) CHAR_RAD[ch]=ri; }); });
RADICALS.forEach((r,ri)=>r[4].forEach(e=>{ if(!(e[0] in CHAR_RAD)) CHAR_RAD[e[0]]=ri; }));
const RAD_WORDS = RADICALS.map(()=>[]);
WORDS.forEach((w,wi)=>{ const seen=new Set(); [...w[0]].forEach(ch=>{ const ri=CHAR_RAD[ch]; if(ri!==undefined && !seen.has(ri)){ seen.add(ri); RAD_WORDS[ri].push(wi); } }); });
const stars  = t => "★★★".slice(0, 4-t);

/* ---------- confusable pairs ---------- */
// Each pair gives two drill items: one sentence per word. Items reference word indices so ratings land on the real words.
const WORD_IDX = {}; WORDS.forEach((w,i)=>{ WORD_IDX[w[0]] = i; });
const PAIR_ITEMS = [];
PAIRS.forEach((p,pi)=>{
  const a = WORD_IDX[p[0]], b = WORD_IDX[p[1]];
  if(a === undefined || b === undefined) return;
  PAIR_ITEMS.push({ pi, target:a, other:b, sent:p[3], note:p[2] });
  PAIR_ITEMS.push({ pi, target:b, other:a, sent:p[4], note:p[2] });
});
let pairMode = false;                       // true while the "Confusable pairs" list is selected
let pairAnswer = null;                      // "right" | "wrong" after the user picks
const pairItem = () => pairMode && order.length ? PAIR_ITEMS[order[pos]] : null;

const POS = {};
Object.entries(POS_GROUPS).forEach(([p,s])=>s.split(" ").forEach(w=>{ if(w) POS[w]=p; }));
const posOf = i => POS[WORDS[i][0]] || "n";

/* ---------- tone colours: split pinyin into syllables, colour each by its tone ---------- */
const PY_INI = ["","b","p","m","f","d","t","n","l","g","k","h","j","q","x","zh","ch","sh","r","z","c","s","y","w"];
const PY_FIN = ["a","o","e","ai","ei","ao","ou","an","en","ang","eng","ong","er","i","ia","ie","iao","iu","ian","in","iang","ing","iong","u","ua","uo","uai","ui","uan","un","uang","ue","v","ve"];
const PY_SYL = new Set(); PY_INI.forEach(a=>PY_FIN.forEach(b=>PY_SYL.add(a+b)));
const TONE_MARK = {}; [[0x304,1],[0x301,2],[0x30c,3],[0x300,4]].forEach(([c,t])=>{ TONE_MARK[String.fromCharCode(c)] = t; });
const NBSP = String.fromCharCode(160);
const COMBINING = new RegExp("["+String.fromCharCode(0x300)+"-"+String.fromCharCode(0x36f)+"]","g");
function pyChar(ch){
  const d = ch.normalize("NFD");
  let tone = 0; for(const m of d.slice(1)) if(TONE_MARK[m]) tone = TONE_MARK[m];
  return { base: d[0].toLowerCase(), tone };
}
function toneSegments(run){                 // run = letters only; returns [[start,end,tone],...] or null
  const cs = [...run].map(pyChar), n = cs.length, best = Array(n+1).fill(null); best[0] = {cost:0, seg:[]};
  for(let i=0;i<n;i++){
    if(!best[i]) continue;
    for(let L=1; L<=6 && i+L<=n; L++){
      const syl = cs.slice(i,i+L).map(c=>c.base).join("");
      const tones = cs.slice(i,i+L).map(c=>c.tone).filter(Boolean);
      let cost;
      if(syl === "r" && i > 0) cost = 0.6;                       // erhua: 点儿 → diǎnr
      else if(PY_SYL.has(syl) && tones.length <= 1) cost = 1 + (i>0 && /^[aeo]/.test(syl) ? 0.5 : 0);
      else continue;
      const c = best[i].cost + cost;
      if(!best[i+L] || c < best[i+L].cost) best[i+L] = { cost:c, seg: best[i].seg.concat([[i, i+L, tones[0] || 5]]) };
    }
  }
  return best[n] ? best[n].seg : null;
}
function toneHTML(py){
  if(!settings.tones) return esc(py);
  const chars = [...py]; let out = "", i = 0;
  while(i < chars.length){
    if(/[a-zA-ZüÜ]/.test(pyChar(chars[i]).base)){
      let j = i; while(j < chars.length && /[a-zA-ZüÜ]/.test(pyChar(chars[j]).base)) j++;
      const run = chars.slice(i,j).join(""), seg = toneSegments(run);
      if(seg) seg.forEach(([a,b,t])=>{ out += '<span class="t'+t+'">'+esc(chars.slice(i+a,i+b).join(""))+'</span>'; });
      else out += esc(run);
      i = j;
    } else { out += esc(chars[i]); i++; }
  }
  return out;
}
const plainPy = s => s.normalize("NFD").replace(COMBINING,"").replace(/[^a-z]/gi,"").toLowerCase();

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
const keyOf = i => isRad() ? "部首:"+RADICALS[i][0] : WORDS[i][0];
const stateOf = i => srs[keyOf(i)];

function grade(i, ok){
  const k = keyOf(i), now = Date.now();
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
  const day = dayKey(new Date()); days[day] = (days[day]||0) + 1; store.set(DAYS_KEY, days);
}
/* ---------- daily goal + streak ---------- */
const DAYS_KEY = "ting.days.v1";
let days = {};
function dayKey(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function streakInfo(){
  const goal = settings.goal, d = new Date(), today = days[dayKey(d)] || 0;
  if(today < goal) d.setDate(d.getDate()-1);          // today not done yet: streak can still continue
  let streak = 0;
  while((days[dayKey(d)] || 0) >= goal){ streak++; d.setDate(d.getDate()-1); }
  return { today, goal, streak, met: today >= goal };
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
                   byFreq:false, slowFirst:false, quiz:"off", lesson:"__all__", voice:"", enVoice:"", tab:"vocab", tones:true, goal:20, clips:true };
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
  __new:  "Words you've never rated. Tap ✓ or ✗ on each to start tracking it.",
  __pairs:"Two words that are easy to mix up. Read the sentence and tap the word that fits — the answer is rated for you."
};
const EMPTY_NOTE = {
  __due:  "Nothing due right now. Rate words with ✓ / ✗ and they'll come back here on schedule.",
  __hard: "No hard words yet — anything you mark ✗ lands here.",
  __new:  "You've rated every word in the deck."
};
const esc = s => String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const opt = (v, label) => '<option value="'+esc(v)+'">'+esc(label)+'</option>';

function lessonLabel(v){
  if(v === "__all__") return "All lessons ("+WORDS.length+")";
  const all = WORDS.map((_,i)=>i), n = f => all.filter(f).length;
  if(v === "__due")  return "⟳ Review due ("+n(isDue)+")";
  if(v === "__hard") return "✗ Hard words ("+n(isHard)+")";
  if(v === "__new")  return "○ New — never rated ("+n(isNew)+")";
  if(v === "__pairs") return "⚖ Confusable pairs ("+PAIR_ITEMS.length+")";
  if(v.startsWith("__tier")) return TIER_LABEL[+v.slice(6)];
  if(v.startsWith("__pos_")) return POS_LABEL[v.slice(6)];
  const l = LESSON_SPEC.find(x=>x[0]===v); return l ? l[0]+" ("+l[1]+")" : v;
}
let openUnits = store.get("ting.picker.v1", {}) || {};
function buildPicker(){
  const all = WORDS.map((_,i)=>i), n = f => all.filter(f).length;
  const item = (v, label, extra) => '<button class="pk-item'+(v===currentLesson?' on':'')+'" data-v="'+esc(v)+'">'+label+(extra!==undefined?'<span class="pk-n">'+extra+'</span>':'')+'</button>';
  const unitOf = name => (UNITS.find(u=>u[1].includes(name))||[])[0];
  const curUnit = unitOf(currentLesson);
  let h = '<div class="pk-sec"><div class="pk-head">Study</div><div class="pk-grid">'
    + item("__all__","All lessons",WORDS.length) + item("__due","⟳ Review due",n(isDue)) + item("__hard","✗ Hard words",n(isHard))
    + item("__new","○ New",n(isNew)) + item("__pairs","⚖ Confusable pairs",PAIR_ITEMS.length) + '</div></div>';
  h += '<div class="pk-sec"><div class="pk-head">Lessons</div>';
  const listed = new Set();
  UNITS.forEach(([u, names])=>{
    const open = openUnits[u] || u === curUnit;
    const cnt = names.reduce((a,nm)=>a+((LESSON_SPEC.find(l=>l[0]===nm)||[0,0])[1]),0);
    h += '<details class="pk-unit"'+(open?' open':'')+' data-u="'+esc(u)+'"><summary>'+esc(u)+'<span class="pk-n">'+names.length+' lessons · '+cnt+'</span></summary>';
    names.forEach(nm=>{ const l = LESSON_SPEC.find(x=>x[0]===nm); if(!l) return; listed.add(nm); h += item(nm, esc(nm), l[1]); });
    h += '</details>';
  });
  const other = LESSON_SPEC.filter(l=>!listed.has(l[0]));
  if(other.length){ h += '<details class="pk-unit"'+(openUnits.Other||other.some(l=>l[0]===currentLesson)?' open':'')+' data-u="Other"><summary>Other<span class="pk-n">'+other.length+'</span></summary>'; other.forEach(l=>{ h += item(l[0], esc(l[0]), l[1]); }); h += '</details>'; }
  h += '</div>';
  h += '<details class="pk-unit pk-filter"'+(openUnits.__freq||currentLesson.startsWith("__tier")?' open':'')+' data-u="__freq"><summary>By frequency<span class="pk-n">across all lessons</span></summary>'
    + [1,2,3].map(t=>item("__tier"+t, TIER_LABEL[t], n(i=>tierOf(i)===t))).join("") + '</details>';
  h += '<details class="pk-unit pk-filter"'+(openUnits.__pos||currentLesson.startsWith("__pos_")?' open':'')+' data-u="__pos"><summary>By word type<span class="pk-n">across all lessons</span></summary>'
    + Object.keys(POS_LABEL).map(p=>{ const c=n(i=>posOf(i)===p); return c ? item("__pos_"+p, POS_LABEL[p], c) : ""; }).join("") + '</details>';
  $("picker").innerHTML = h;
}
function buildLessonMenu(){
  if(isRad()) return;                    // radicals have no lesson menu
  $("lessonbtn").textContent = lessonLabel(currentLesson);
  if(!$("picker").hidden) buildPicker();
  const sel = $("lesson");
  const all = WORDS.map((_,i)=>i);
  const n = f => all.filter(f).length;
  const o = [opt("__all__", "All lessons ("+WORDS.length+")")];
  o.push('<optgroup label="Study · spaced repetition">');
  o.push(opt("__due",  "⟳ Review due ("+n(isDue)+")"));
  o.push(opt("__hard", "✗ Hard words ("+n(isHard)+")"));
  o.push(opt("__new",  "○ New — never rated ("+n(isNew)+")"));
  o.push(opt("__pairs", "⚖ Confusable pairs ("+PAIR_ITEMS.length+")"));
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
  if(isRad()) return range();
  const all = WORDS.map((_,i)=>i);
  if(v === "__all__") return all;
  if(v === "__due")  return all.filter(isDue).sort((a,b)=>stateOf(a).due - stateOf(b).due);
  if(v === "__hard") return all.filter(isHard);
  if(v === "__new")  return all.filter(isNew);
  if(v === "__pairs") return PAIR_ITEMS.map((_,k)=>k);
  if(v.startsWith("__tier")){ const t = +v.slice(6); return all.filter(i=>tierOf(i)===t); }
  if(v.startsWith("__pos_")){ const p = v.slice(6);  return all.filter(i=>posOf(i)===p); }
  return all.filter(i=>LESSONS[i]===v);
}

function sortByFreq(){ order.sort((a,b)=> freqKey(a)-freqKey(b)); }
function reshufflePairs(){                 // shuffle, but keep the two items of one pair apart
  reshuffle();
  for(let i=1;i<order.length;i++) if(PAIR_ITEMS[order[i]].pi === PAIR_ITEMS[order[i-1]].pi){ const j=(i+1)%order.length; [order[i],order[j]]=[order[j],order[i]]; }
}
function reshuffle(){
  for(let i=order.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [order[i],order[j]]=[order[j],order[i]]; }
}

function applyLesson(){
  pairMode = !isRad() && currentLesson === "__pairs";
  pairAnswer = null;
  $("moderow").hidden = pairMode;              // the Mode row doesn't apply to the pairs drill
  $("grade-no").hidden = pairMode; $("grade-yes").hidden = pairMode;   // the two word buttons replace ✓/✗
  order = selectionFor(currentLesson);
  if(pairMode){
    reshufflePairs(); pos = 0; revealedFor = -1;
    $("lessonnote").textContent = STUDY_NOTE.__pairs; $("lessonnote").hidden = false;
    buildList(); render(); updateStats(); return;
  }
  if(!isRad() && settings.quiz === "cloze") order = order.filter(canCloze);
  if(settings.byFreq && (isRad() || currentLesson !== "__due")) sortByFreq();
  if(settings.shuffle) reshuffle();
  pos = 0; revealedFor = -1;
  $("lessonnote").textContent = STUDY_NOTE[currentLesson] || "";
  $("lessonnote").hidden = isRad() || !STUDY_NOTE[currentLesson];
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
  // English: rank by how natural the voice sounds (neural/premium first), not by offline-ness
  let en = allVoices.filter(v=>/^en/i.test(v.lang));
  en.sort((x,y)=> enQuality(y)-enQuality(x) || x.name.localeCompare(y.name));
  enVoices = en;
  const es = $("envoice"); es.innerHTML = "";
  if(!en.length){ es.innerHTML = '<option>No English voice found</option>'; enVoice = null; }
  else {
    en.forEach(v=>{
      const o=document.createElement("option"); o.value=v.voiceURI;
      o.textContent = v.name+" — "+v.lang+(enQuality(v)>=4 ? "  ✦ natural" : v.localService ? "" : "  (online)");
      es.appendChild(o);
    });
    enVoice = en.find(v=>v.voiceURI===settings.enVoice) || en[0];
    es.value = enVoice.voiceURI;
  }
}
// Higher = more natural. Neural/online voices (Edge "Natural", Google, Siri, Apple Premium/Enhanced) beat the
// old compact system voices by a wide margin.
function enQuality(v){
  const n=(v.name||"").toLowerCase();
  let q=0;
  if(/natural|neural|premium|enhanced|siri|wavenet|journey|studio/.test(n)) q+=4;
  if(/google/.test(n)) q+=3;
  if(/samantha|ava|zoe|allison|daniel|karen|moira|tessa|serena|evan|nathan|tom|alex/.test(n)) q+=2;   // Apple's better stock voices
  if(/compact|espeak|eloquence|fred|albert|bad news|bells|boing|bubbles|cellos|deranged|good news|hysterical|junior|kathy|organ|ralph|trinoids|whisper|zarvox|novelty/.test(n)) q-=5;
  if(/^en[-_]us/i.test(v.lang)) q+=1;
  return q;
}
let enVoices=[];
function sampleEn(){
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance("To recommend"); u.lang="en-US"; u.rate=Math.max(0.9,settings.rate); if(enVoice) u.voice=enVoice;
  speechSynthesis.speak(u);
}
$("envoice").addEventListener("change", e=>{
  enVoice = allVoices.find(v=>v.voiceURI===e.target.value) || enVoice;
  settings.enVoice = enVoice ? enVoice.voiceURI : ""; saveSettings();
  sampleEn();
});
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
const quizMode = () => (isRad() && settings.quiz === "cloze") ? "en2zh" : settings.quiz;
const masked = () => quizMode() !== "off" && order.length && revealedFor !== idx();
const zhChunksOf = t => t.split(/……|…|\/|\.\.\./).map(x=>x.trim()).filter(Boolean);
const canCloze = i => { const ex = EXAMPLES[i]; return !!ex && zhChunksOf(WORDS[i][0]).every(ch=>ex[0].includes(ch)); };
const clozeText = i => { let t = EXAMPLES[i][0]; zhChunksOf(WORDS[i][0]).forEach(ch=>{ t = t.replace(ch, "＿＿"); }); return t; };
function linkChars(zh){
  return [...zh].map(ch=>{
    const ri = CHAR_RAD[ch];
    if(ri === undefined) return esc(ch);
    const r = RADICALS[ri];
    return '<span class="rlink" data-ri="'+ri+'" title="'+esc(ch+" — radical "+r[0]+" ("+r[2].split(" / ")[0]+") · tap to open")+'">'+esc(ch)+'</span>';
  }).join("");
}

/* ---------- 多音字: characters with several readings ---------- */
// Pinyin syllables of a word, in order (erhua "r" and spaces dropped), e.g. "děng yíhuìr" → ["děng","yí","huì"].
function pySyllables(py){
  const out = [], chars = [...py]; let i = 0;
  while(i < chars.length){
    if(/[a-zA-ZüÜ]/.test(pyChar(chars[i]).base)){
      let j = i; while(j < chars.length && /[a-zA-ZüÜ]/.test(pyChar(chars[j]).base)) j++;
      const run = chars.slice(i,j).join(""), seg = toneSegments(run);
      if(seg) seg.forEach(([s,e])=>{ const syl = chars.slice(i+s,i+e).join(""); if(syl !== "r") out.push(syl); });
      else out.push(run);
      i = j;
    } else i++;
  }
  return out;
}
const pyBase = s => s.normalize("NFD").replace(COMBINING,"").toLowerCase();
const pyEq = (x,y) => x.normalize("NFD").toLowerCase() === y.normalize("NFD").toLowerCase();
function polyNotes(w){
  const han = [...w[0]].filter(ch=>/\p{Script=Han}/u.test(ch));
  const syls = pySyllables(w[1]), aligned = syls.length === han.length;
  const seen = new Set(), notes = [];
  han.forEach((ch,k)=>{
    const P = POLY[ch]; if(!P || seen.has(ch)) return; seen.add(ch);
    const syl = aligned ? syls[k] : (syls.find(s=>P.some(r=>pyEq(r[0],s))) || "");
    let here = P.filter(r=>pyEq(r[0],syl));                       // exact match incl. tone
    if(!here.length && syl) here = P.filter(r=>pyBase(r[0])===pyBase(syl));  // neutral tone in this word
    if(here.length > 1){ const ex = here.find(r=>r[2] && w[0].includes(r[2])); if(ex) here = [ex]; }   // e.g. 头发 → fà
    const hereIdx = here.length === 1 ? P.indexOf(here[0]) : -1;
    const others = P.filter((r,i)=>i!==hereIdx);
    let html = '<span class="poly-tag">多音字</span> <b class="poly-ch">'+esc(ch)+'</b>';
    if(hereIdx >= 0) html += ' here <span class="mp">'+toneHTML(P[hereIdx][0])+'</span> <span class="poly-m">'+esc(P[hereIdx][1])+'</span>';
    else if(here.length > 1) html += ' here <span class="mp">'+toneHTML(syl)+'</span> <span class="poly-m">(neutral tone)</span>';
    html += others.map(r=>{
      const wi = WORD_IDX[r[2]];
      const exw = r[2] ? (wi !== undefined ? '<button class="poly-ex" data-wi="'+wi+'">'+esc(r[2])+'</button>' : '<span class="poly-ex">'+esc(r[2])+'</span>') : "";
      return '<span class="poly-alt">· also <span class="mp">'+toneHTML(r[0])+'</span> <span class="poly-m">'+esc(r[1])+'</span> '+exw+'</span>';
    }).join("");
    notes.push('<div class="poly">'+html+'</div>');
  });
  return notes.join("");
}
function renderMore(w){
  const a = ALT[w[0]];
  let html = "";
  if(a) html += '<div class="more-note">'+esc(a.note)+'</div>' +
    a.ex.map(e=>'<div class="more-ex"><span class="mz">'+esc(e[0])+'</span> <span class="mp">'+toneHTML(e[1])+'</span> <span class="me">'+esc(e[2])+'</span></div>').join("");
  html += polyNotes(w);
  moreBox.innerHTML = html; moreBox.hidden = !html;
}
moreBox.addEventListener("click", e=>{
  const b = e.target.closest && e.target.closest("[data-wi]"); if(!b) return;
  e.stopPropagation(); jumpToWord(+b.dataset.wi);
});

function render(){
  const tierEl = $("tier");
  $("radwords").hidden = true; $("pairbox").hidden = true;
  if(!order.length){
    han.textContent = "—"; han.classList.remove("masked");
    pinyin.textContent = ""; gloss.classList.remove("masked");
    gloss.textContent = EMPTY_NOTE[currentLesson] || "No words here.";
    exampleBox.hidden = true; moreBox.hidden = true; $("reveal").hidden = true;
    $("variants").hidden = true; $("grows").hidden = true;
    tierEl.textContent = ""; setStatus(null);
    cur.textContent = 0; $("total").textContent = 0; pbar.style.width = "0%";
    return;
  }
  if(pairMode){ renderPair(); return; }
  const i = idx(), c = card(i), m = masked(), q = quizMode();
  const hideEn = m && (q === "listen" || q === "cloze");
  if(m) han.textContent = "？";
  else if(isRad()) han.textContent = c.zh;
  else han.innerHTML = linkChars(c.zh);
  han.classList.toggle("masked", !!m);
  if(m) pinyin.textContent = NBSP; else pinyin.innerHTML = toneHTML(c.py);
  pinyin.classList.toggle("toned", !!settings.tones);
  gloss.textContent = !hideEn ? c.en : q === "cloze" ? "Fill the gap — which word fits?" : "Listen — what does it mean?";
  gloss.classList.toggle("masked", hideEn);
  const t = tierOf(i); tierEl.textContent = stars(t); tierEl.title = TIER_LABEL[t]; tierEl.dataset.t = t;

  if(isRad()){
    const r = RADICALS[i];
    exampleBox.hidden = true; moreBox.hidden = true;
    $("variants").hidden = m || !r[3];
    $("vforms").textContent = r[3] ? r[3].split("").join("  ") : "";
    $("grows").hidden = !!m;
    $("exgrid").innerHTML = r[4].map(e=>'<div class="ex"><div class="ec">'+e[0]+'</div><div class="ep toned">'+toneHTML(e[1])+'</div><div class="em">'+esc(e[2])+'</div></div>').join("");
    renderRadWords(i, m);
  } else {
    $("variants").hidden = true; $("grows").hidden = true;
    const ex = EXAMPLES[i];
    if(m && q === "cloze" && ex){
      exzh.textContent = clozeText(i); expy.textContent = NBSP; exen.textContent = ex[2];
      exampleBox.hidden = false;
    } else if(ex && (settings.example || (q === "cloze" && !m))){
      exzh.textContent=ex[0]; expy.innerHTML=toneHTML(ex[1]); exen.textContent=ex[2];
      exampleBox.hidden=false;
    } else exampleBox.hidden=true;
    exampleBox.classList.remove("speaking");
    if(m) moreBox.hidden = true; else renderMore(WORDS[i]);
  }
  $("reveal").hidden = !m;
  setStatus(i);

  cur.textContent = pos+1;
  $("total").textContent = order.length;
  pbar.style.width = ((pos+1)/order.length*100)+"%";
  if(!searching()) [...wlist.children].forEach((li,p)=>li.classList.toggle("active", p===pos));
  updateMediaSession();
}

function renderPair(){
  const it = pairItem(), t = WORDS[it.target], o = WORDS[it.other], p = PAIRS[it.pi];
  const revealed = revealedFor === order[pos];
  const first = p[0] === t[0];                      // keep the pair's natural order on the buttons
  const left = first ? t : o, right = first ? o : t;
  $("variants").hidden = true; $("grows").hidden = true; moreBox.hidden = true; $("reveal").hidden = true;
  $("tier").textContent = ""; han.classList.remove("masked"); gloss.classList.remove("masked");
  if(!revealed){
    han.textContent = "？"; han.classList.add("masked");
    pinyin.textContent = NBSP;
    gloss.textContent = "Which word fits?";
    exzh.textContent = it.sent[0]; expy.textContent = NBSP; exen.textContent = it.sent[2];
  } else {
    han.innerHTML = linkChars(t[0]); pinyin.innerHTML = toneHTML(t[1]); gloss.textContent = t[2];
    exzh.textContent = it.sent[0].replace("＿＿", t[0]); expy.innerHTML = toneHTML(it.sent[1]); exen.textContent = it.sent[2];
  }
  exampleBox.hidden = false; exampleBox.classList.remove("speaking");
  const btn = (w, side) => '<button class="pbtn'+(revealed ? (w===t ? " right" : (pairAnswer==="wrong" ? " wrong" : "")) : "")+'" data-side="'+side+'" '+(revealed?"disabled":"")+'>'
    + '<span class="pz">'+esc(w[0])+'</span><span class="pp">'+toneHTML(w[1])+'</span><span class="pe">'+esc(w[2])+'</span></button>';
  $("pairbox").innerHTML = '<div class="pair-btns">'+btn(left,"L")+btn(right,"R")+'</div>'
    + (revealed ? '<div class="pair-note">'+(pairAnswer==="right" ? "✓ Right. " : pairAnswer==="wrong" ? "✗ Not this time. " : "")+esc(it.note)+'</div>' : "");
  $("pairbox").hidden = false;
  setStatus(it.target);
  cur.textContent = pos+1; $("total").textContent = order.length;
  pbar.style.width = ((pos+1)/order.length*100)+"%";
  if(!searching()) [...wlist.children].forEach((li,q)=>li.classList.toggle("active", q===pos));
  updateMediaSession();
}
function answerPair(side){
  const it = pairItem(); if(!it || revealedFor === order[pos]) return;
  const p = PAIRS[it.pi], picked = (side === "L") ? p[0] : p[1];
  const ok = picked === WORDS[it.target][0];
  pairAnswer = ok ? "right" : "wrong";
  grade(it.target, ok);
  const stage = $("stage");
  stage.classList.remove("flash-yes","flash-no"); void stage.offsetWidth;
  stage.classList.add(ok ? "flash-yes" : "flash-no");
  setTimeout(()=>stage.classList.remove("flash-yes","flash-no"), 450);
  revealedFor = order[pos];
  buildLessonMenu(); render(); updateStats();
  if(wlist.children[pos]) wlist.children[pos].dataset.s = statusOf(it.target).cls;
  if(playing){ const my = ++gen; playing = true; (async()=>{ await speakZh(WORDS[it.target][0], settings.rate); if(!alive(my)) return; await wait(250); await speak(it.sent[0].replace("＿＿", WORDS[it.target][0]).replace(/[…．]+/g," "), "zh-CN", settings.rate); if(!alive(my)) return; await wait(settings.gap*1000); if(!alive(my)) return; advance(1); loop(); })(); }
}
function renderRadWords(ri, m){
  const box = $("radwords"), list = RAD_WORDS[ri] || [];
  if(m || !list.length){ box.hidden = true; return; }
  const known = list.filter(wi=>{ const s = srs[WORDS[wi][0]]; return s && s.last === 1; });
  const shown = list.slice().sort((a,b)=>(FREQ[WORDS[a][0]]||2)-(FREQ[WORDS[b][0]]||2) || a-b).slice(0,18);
  box.innerHTML = '<div class="rw-head">In <b>'+list.length+'</b> of your words'+(known.length ? ' · you know <b>'+known.length+'</b>' : '')+'</div>' +
    '<div class="rw-list">'+shown.map(wi=>'<button class="wchip'+(known.includes(wi)?' known':'')+'" data-wi="'+wi+'" title="'+esc(WORDS[wi][1]+" — "+WORDS[wi][2])+'">'+esc(WORDS[wi][0])+'</button>').join("")+
    (list.length > shown.length ? '<span class="rw-more">+'+(list.length-shown.length)+' more</span>' : '')+'</div>';
  box.hidden = false;
}

function setStatus(i){
  const el = $("srsstatus");
  if(i === null || i === undefined){ el.textContent = ""; el.dataset.s = ""; return; }
  const s = statusOf(i);
  el.textContent = s.text; el.dataset.s = s.cls;
}

function updateStats(){
  const all = range();
  const rated = all.filter(i=>!isNew(i)).length;
  $("stats").textContent = rated
    ? rated+" rated · "+all.filter(isDue).length+" due · "+all.filter(isHard).length+" hard · "+(all.length-rated)+" new"
    : "Tap ✓ / ✗ on a card to start tracking what you know";
  const g = streakInfo(), el = $("goal");
  el.innerHTML = '<span class="g-bar"><span style="width:'+Math.min(100, g.today/g.goal*100)+'%"></span></span>' +
    '<b>'+g.today+'</b> / '+g.goal+' reviews today'+(g.met ? ' ✓' : '') +
    (g.streak ? ' · 🔥 '+g.streak+'-day streak' : '');
  el.dataset.met = g.met;
}

function reveal(){ if(!order.length) return; revealedFor = idx(); render(); }

/* ---------- recorded audio (optional audio/manifest.js) ---------- */
// When audio/manifest.js exists (made by audio/make-audio.sh on a Mac), words are played from real
// sound files through one <audio> element. Unlike the browser voice, this keeps going with the screen
// locked and shows lock-screen controls. Anything without a clip falls back to the browser voice.
const AUDIO = (typeof AUDIO_MANIFEST !== "undefined") ? AUDIO_MANIFEST : null;
const player = $("player");
const useClips = () => !!(AUDIO && settings.clips);
const clipFor = (text, lang) => AUDIO && AUDIO.files[(lang.startsWith("zh") ? "zh|" : "en|") + text];
let clipDone = null;
function playClip(src, rate){
  return new Promise(res=>{
    let cap;
    const done = ok => { if(clipDone !== done) return; clipDone = null; clearTimeout(cap); res(ok); };
    clipDone = done;
    player.onended = ()=>done(true);
    player.onerror = ()=>done(false);
    player.defaultPlaybackRate = rate;
    player.src = src;
    player.playbackRate = rate;
    try{ player.preservesPitch = true; }catch(e){}
    const p = player.play(); if(p && p.catch) p.catch(()=>done(false));
    cap = setTimeout(()=>done(false), 30000);
  });
}
const silenceCache = {};
function silenceURL(ms){                       // tiny silent WAV built in memory, so pauses don't need timers
  if(silenceCache[ms]) return silenceCache[ms];
  const rate = 8000, n = Math.round(rate*ms/1000), buf = new ArrayBuffer(44+n), v = new DataView(buf);
  const str = (o,s)=>{ for(let k=0;k<s.length;k++) v.setUint8(o+k, s.charCodeAt(k)); };
  str(0,"RIFF"); v.setUint32(4,36+n,true); str(8,"WAVE"); str(12,"fmt "); v.setUint32(16,16,true); v.setUint16(20,1,true);
  v.setUint16(22,1,true); v.setUint32(24,rate,true); v.setUint32(28,rate,true); v.setUint16(32,1,true); v.setUint16(34,8,true);
  str(36,"data"); v.setUint32(40,n,true); for(let k=0;k<n;k++) v.setUint8(44+k,128);
  return silenceCache[ms] = URL.createObjectURL(new Blob([buf], {type:"audio/wav"}));
}
async function playSilence(ms){
  for(const d of [2000,1000,500,250,100]){ while(ms >= d){ if(!playing) return; await playClip(silenceURL(d), 1); ms -= d; } }
}
function updateMediaSession(){
  if(!("mediaSession" in navigator) || typeof MediaMetadata === "undefined" || !order.length) return;
  try{
    const c = card(idx());
    navigator.mediaSession.metadata = new MediaMetadata({ title: c.zh+"  "+c.py, artist: c.en,
      album: isRad() ? "部首 Radicals" : (currentLesson.startsWith("__") ? "听 Vocabulary" : currentLesson) });
  }catch(e){}
}
if("mediaSession" in navigator){
  try{
    navigator.mediaSession.setActionHandler("play", ()=>{ if(!playing) loop(); });
    navigator.mediaSession.setActionHandler("pause", ()=>{ if(playing) stop(); });
    navigator.mediaSession.setActionHandler("nexttrack", ()=>$("next").click());
    navigator.mediaSession.setActionHandler("previoustrack", ()=>$("prev").click());
  }catch(e){}
}

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
// Retry once only if the word made no sound at all. Recorded clips are used first when available.
async function speak(text, lang, rate){
  const clip = useClips() && clipFor(text, lang);
  if(clip){
    const g0 = gen;
    const ok = await playClip((AUDIO.base||"") + clip, Math.max(0.5, Math.min(1.6, rate/0.8)));
    if(ok || gen !== g0) return ok;           // stopped mid-clip: don't fall back to the device voice
  }
  let ok = await speakOnce(text, lang, rate);
  if(!ok){
    speechSynthesis.cancel();
    await wait(350);
    ok = await speakOnce(text, lang, rate);
  }
  return ok;
}
const wait = ms => (useClips() && playing) ? playSilence(ms) : new Promise(r=>setTimeout(r,ms));

// Patterns like 不是……而是…… and alternatives like 喝茶/咖啡 are spoken as separate chunks.
const zhChunks = text => text.split(/……|…|\/|\.\.\./).map(s=>s.trim()).filter(Boolean);
async function speakZh(text, rate){
  const parts = zhChunks(text);
  for(let j=0;j<parts.length;j++){
    await speak(parts[j], "zh-CN", rate);
    if(j < parts.length-1) await wait(280);
  }
}
// Spoken English: only the first meaning ("To bring / to lead / to carry" → "To bring"),
// the rest stays on screen. "tea/coffee" (no spaces) is still read as "tea or coffee".
const enText = s => s.split(" / ")[0].replace(/\.\.\.|…/g," ").replace(/\//g," or ").replace(/\s+/g," ").trim();

// Say the word `repeat` times; with "slow first" the first pass is at 0.6×.
async function sayChinese(i, my){
  for(let r=0; r<settings.repeat; r++){
    if(!alive(my)) return false;
    const rt = (settings.slowFirst && r===0) ? Math.min(settings.rate, 0.6) : settings.rate;
    await speakZh(card(i).zh, rt);
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
    if(pairMode){                                  // read the sentence with the gap, then wait for a tap
      const it = pairItem();
      if(revealedFor !== order[pos]){
        if(enVoice){ await speak(enText(it.sent[2]), "en-US", Math.max(0.9, settings.rate)); }
        return;                                    // loop resumes from answerPair()
      }
      await wait(settings.gap*1000); if(!alive(my)) return; advance(1); continue;
    }
    const i = idx(), c = card(i), w = [c.zh, c.py, c.en];
    const enRate = Math.max(0.9, settings.rate);
    const think = () => wait(settings.think*1000);

    const q = quizMode();
    let spokeExample = false;
    if(q === "cloze" && !isRad() && EXAMPLES[i]){     // sentence with a gap → guess the word
      const ex = EXAMPLES[i];
      if(enVoice){ await speak(enText(ex[2]), "en-US", enRate); if(!alive(my)) return; }
      await think(); if(!alive(my)) return;
      reveal();
      if(!await sayChinese(i, my)) return;
      await wait(300); if(!alive(my)) return;
      exampleBox.classList.add("speaking");
      await speak(ex[0].replace(/[…．]+/g," "), "zh-CN", settings.rate); if(!alive(my)) return;
      exampleBox.classList.remove("speaking");
      spokeExample = true;
    } else if(q === "en2zh"){                 // English → guess the Chinese
      if(enVoice){ await speak(enText(w[2]), "en-US", enRate); if(!alive(my)) return; }
      await think(); if(!alive(my)) return;
      reveal();
      if(!await sayChinese(i, my)) return;
    } else if(q === "listen"){         // audio only → guess the meaning
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

    if(isRad() && settings.example){             // radicals: read the three example characters
      const cells = $("exgrid").children;
      for(let j=0;j<RADICALS[i][4].length;j++){
        if(!alive(my)) return;
        const e = RADICALS[i][4][j];
        cells[j] && cells[j].classList.add("speaking");
        await wait(200);
        await speak(e[0], "zh-CN", settings.rate); if(!alive(my)) return;
        if(settings.english && enVoice){ await wait(120); await speak(enText(e[2]), "en-US", enRate); }
        cells[j] && cells[j].classList.remove("speaking");
      }
      if(!alive(my)) return;
    }
    const ex = isRad() ? null : EXAMPLES[i];
    if(settings.example && ex && !spokeExample){
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
  pos += d; revealedFor = -1; pairAnswer = null;
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
function stop(){ playing=false; gen++; speechSynthesis.cancel(); try{ player.pause(); }catch(e){} if(clipDone) clipDone(false); setIcon(); }
function toggle(){ if(playing) stop(); else loop(); }

/* keep Chrome from cutting speech off after ~15s */
setInterval(()=>{ if(playing && speechSynthesis.speaking) speechSynthesis.resume(); }, 6000);

/* ---------- rating ---------- */
function rateCurrent(ok){
  if(!order.length) return;
  if(pairMode){ answerPair(ok ? "R" : "L"); return; }   // in the drill, 1 = left word, 2 = right word
  const was = playing; stop();
  const i = idx();
  grade(i, ok);
  const stage = $("stage");
  stage.classList.remove("flash-yes","flash-no"); void stage.offsetWidth;
  stage.classList.add(ok ? "flash-yes" : "flash-no");
  setTimeout(()=>stage.classList.remove("flash-yes","flash-no"), 450);

  const q = isRad() ? null : STUDY[currentLesson];
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
$("stage").onclick = e=>{ if(e.target.closest && e.target.closest("button,.more,.rlink,.radwords,.pairbox")) return; toggle(); };
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
  const was = playing; stop();
  const keep = order.length ? idx() : -1, wasCloze = settings.quiz === "cloze";
  settings.quiz=b.dataset.q; saveSettings();
  [...e.currentTarget.children].forEach(c=>c.setAttribute("aria-pressed", c===b));
  if(wasCloze !== (settings.quiz === "cloze")){ applyLesson(); const p = order.indexOf(keep); if(p >= 0){ pos = p; } }
  revealedFor=-1; render();
  if(was) loop();
});
function toggleChip(el,key){
  const on = el.getAttribute("aria-pressed")!=="true";
  el.setAttribute("aria-pressed", on); settings[key]=on; saveSettings();
}
$("english").onclick = ()=>toggleChip($("english"),"english");
$("tones").onclick = ()=>{ toggleChip($("tones"),"tones"); if(searching()) buildSearch(); else buildList(); render(); };
$("clips").onclick = ()=>{ const was=playing; stop(); toggleChip($("clips"),"clips"); if(was) loop(); };
$("goalseg").addEventListener("click", e=>{
  const b=e.target.closest("[data-goal]"); if(!b) return;
  settings.goal=+b.dataset.goal; saveSettings();
  [...e.currentTarget.children].forEach(c=>c.setAttribute("aria-pressed", c===b));
  updateStats();
});

/* jump to a vocabulary word from anywhere (search, radical cards) */
function jumpToWord(wi){
  const was = playing; stop();
  if(isRad()) setTab("vocab");
  let p = pairMode ? -1 : order.indexOf(wi);
  if(p < 0){ currentLesson = "__all__"; settings.lesson = currentLesson; saveSettings(); $("lesson").value = "__all__"; applyLesson(); p = order.indexOf(wi); }
  if(p < 0){ settings.quiz = "off"; saveSettings(); syncControls(); applyLesson(); p = order.indexOf(wi); }
  pos = Math.max(0,p); revealedFor = -1; render();
  window.scrollTo({top:0, behavior:"smooth"});
  if(was) loop();
}
function jumpToRadical(ri){
  const was = playing; stop();
  if(!isRad()) setTab("radicals");
  pos = Math.max(0, order.indexOf(ri)); revealedFor = -1; render();
  if(was) loop();
}
han.addEventListener("click", e=>{
  const l = e.target.closest && e.target.closest(".rlink"); if(!l) return;
  e.stopPropagation(); jumpToRadical(+l.dataset.ri);
});
$("pairbox").addEventListener("click", e=>{
  const b = e.target.closest && e.target.closest("[data-side]"); if(!b) return;
  e.stopPropagation(); answerPair(b.dataset.side);
});
$("radwords").addEventListener("click", e=>{
  const b = e.target.closest && e.target.closest("[data-wi]"); if(!b) return;
  e.stopPropagation(); jumpToWord(+b.dataset.wi);
});

/* search the whole deck of the current tab */
const searching = () => $("search").value.trim() !== "";
function searchHits(q){
  const qq = q.trim().toLowerCase(), qp = plainPy(q);
  const hits = [];
  (pairMode ? WORDS.map((_,i)=>i) : range()).forEach(i=>{
    const c = card(i);
    const score = c.zh.includes(q.trim()) ? 0 : (qp && plainPy(c.py).startsWith(qp)) ? 1 : (qp && plainPy(c.py).includes(qp)) ? 2 : c.en.toLowerCase().includes(qq) ? 3 : -1;
    if(score >= 0) hits.push([score, i]);
  });
  return hits.sort((a,b)=>a[0]-b[0] || a[1]-b[1]).slice(0, 80).map(h=>h[1]);
}
function buildSearch(){
  const hits = searchHits($("search").value);
  wlist.innerHTML = "";
  $("searchnote").textContent = hits.length ? hits.length+(hits.length===80?"+":"")+" match"+(hits.length===1?"":"es")+" · tap to open" : "No matches";
  hits.forEach(wi=>{
    const c = card(wi), li = document.createElement("li");
    li.tabIndex = 0; li.dataset.s = statusOf(wi).cls;
    li.innerHTML = '<span class="lz">'+esc(c.zh)+'</span><span class="lt" data-t="'+tierOf(wi)+'">'+stars(tierOf(wi))+'</span><span class="lp">'+(isRad() ? esc(c.en.split(" / ")[0]) : toneHTML(c.py)+' · '+esc(c.en))+'</span>';
    const go = ()=>{ $("search").value = ""; $("searchnote").textContent = ""; if(isRad()) jumpToRadical(wi); else jumpToWord(wi); buildList(); render(); };
    li.onclick = go; li.onkeydown = e=>{ if(e.key==="Enter"){ e.preventDefault(); go(); } };
    wlist.appendChild(li);
  });
}
$("search").addEventListener("input", ()=>{ if(searching()) buildSearch(); else { $("searchnote").textContent = ""; buildList(); render(); } });
$("search").addEventListener("keydown", e=>{
  if(e.key === "Escape"){ $("search").value = ""; $("searchnote").textContent = ""; buildList(); render(); $("search").blur(); }
  if(e.key === "Enter" && searching()){ const first = wlist.children[0]; if(first) first.click(); }
});
$("slowfirst").onclick = ()=>toggleChip($("slowfirst"),"slowFirst");
$("example-toggle").onclick = ()=>{ toggleChip($("example-toggle"),"example"); render(); };
function setFreq(on){
  const was=playing; stop();
  settings.byFreq = on; saveSettings();
  $("freqtab").setAttribute("aria-pressed", on);
  if(!settings.shuffle){ order.sort((a,b)=>a-b); if(on) sortByFreq(); }
  pos = 0; revealedFor = -1;            // start from the top of the re-sorted list
  buildList(); render();
  if(was) loop();
}
$("shuffle").onclick = ()=>{
  toggleChip($("shuffle"),"shuffle");
  const keep = idx();
  if(settings.shuffle) reshuffle();
  else { order.sort((a,b)=>a-b); if(settings.byFreq) sortByFreq(); }   // back to natural (or frequency) order
  pos = Math.max(0, order.indexOf(keep));
  buildList();
  render();
};

function chooseLesson(v){
  const was = playing; stop();
  currentLesson = v; $("lesson").value = v;
  settings.lesson = currentLesson; saveSettings();
  buildLessonMenu(); applyLesson();
  if(was) loop();
}
$("lesson").addEventListener("change", e=>chooseLesson(e.target.value));
$("lessonbtn").onclick = ()=>{
  const pk = $("picker"), open = pk.hidden;
  if(open){ buildPicker(); pk.hidden = false; $("lessonbtn").setAttribute("aria-expanded","true"); }
  else { pk.hidden = true; $("lessonbtn").setAttribute("aria-expanded","false"); }
};
$("picker").addEventListener("click", e=>{
  const b = e.target.closest && e.target.closest("[data-v]");
  if(b){ chooseLesson(b.dataset.v); $("picker").hidden = true; $("lessonbtn").setAttribute("aria-expanded","false"); return; }
});
$("picker").addEventListener("toggle", e=>{
  const d = e.target; if(!d.dataset || !d.dataset.u) return;
  openUnits[d.dataset.u] = d.open; store.set("ting.picker.v1", openUnits);
}, true);
document.addEventListener("click", e=>{
  if($("picker").hidden) return;
  if(e.target.closest && e.target.closest("#picker,#lessonbtn")) return;
  $("picker").hidden = true; $("lessonbtn").setAttribute("aria-expanded","false");
});

document.addEventListener("keydown", e=>{
  const tag = e.target.tagName;
  if(tag==="SELECT" || tag==="INPUT" || tag==="TEXTAREA") return;
  if(e.key==="/" ){ e.preventDefault(); $("search").focus(); return; }
  if(e.key==="Escape" && !$("picker").hidden){ $("picker").hidden = true; return; }
  if(e.key===" "){e.preventDefault();toggle();}
  else if(e.key==="ArrowRight") $("next").click();
  else if(e.key==="ArrowLeft") $("prev").click();
  else if(e.key==="1") rateCurrent(false);
  else if(e.key==="2") rateCurrent(true);
  else if(e.key==="r" || e.key==="R") reveal();
});

/* ---------- word list ---------- */
function buildList(){
  if(searching()){ buildSearch(); return; }
  wlist.innerHTML="";
  order.forEach((wi,p)=>{
    const c = pairMode ? (it=>({zh:WORDS[it.target][0]+" · "+WORDS[it.other][0], py:"", en:""}))(PAIR_ITEMS[wi]) : card(wi);
    const li=document.createElement("li");
    li.tabIndex=0;
    li.dataset.s = statusOf(pairMode ? PAIR_ITEMS[wi].target : wi).cls;
    if(pairMode){ li.innerHTML='<span class="n">'+(p+1)+'</span><span class="lz">'+esc(c.zh)+'</span>'; const jump=()=>{ const was=playing; stop(); pos=p; revealedFor=-1; pairAnswer=null; render(); if(was) loop(); }; li.onclick=jump; wlist.appendChild(li); return; }
    li.innerHTML=`<span class="n">${p+1}</span><span class="lz">${c.zh}</span><span class="lt" data-t="${tierOf(wi)}">${stars(tierOf(wi))}</span><span class="lp">${isRad() ? esc(c.en.split(" / ")[0]) : toneHTML(c.py)}</span>`;
    const jump=()=>{ const was=playing; stop(); pos=p; revealedFor=-1; render(); if(was) loop(); };
    li.onclick=jump;
    li.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();jump();} };
    wlist.appendChild(li);
  });
}

$("freqtab").onclick = e=>{ e.preventDefault(); setFreq(!settings.byFreq); };

/* ---------- tabs: vocabulary / radicals ---------- */
function setTab(t){
  const was = playing; stop();
  settings.tab = t === "radicals" ? "radicals" : "vocab"; saveSettings();
  const rad = isRad();
  $("tab-vocab").setAttribute("aria-pressed", !rad);
  $("tab-rad").setAttribute("aria-pressed", rad);
  $("lessonrow").hidden = rad;
  $("brandzh").textContent = rad ? "部首" : "听";
  $("branden").textContent = rad ? "Radicals" : "Listen & Learn";
  $("listtitle").textContent = rad ? "Radicals · tap to jump" : "Words · tap to jump";
  $("example-toggle").textContent = rad ? "Example characters" : "Example sentence";
  $("radlead").hidden = !rad;
  $("q-cloze").hidden = rad;
  $("search").placeholder = rad ? "Search radicals — 心, xin or heart" : "Search all words — 想, xiang or miss";
  if(searching()){ $("search").value = ""; $("searchnote").textContent = ""; }
  document.title = rad ? "部首 · Chinese Radicals" : "听 · Chinese Vocabulary Loop";
  buildLessonMenu();
  applyLesson();
  if(was) loop();
}
$("tab-vocab").onclick = e=>{ e.preventDefault(); setTab("vocab"); };
$("tab-rad").onclick   = e=>{ e.preventDefault(); setTab("radicals"); };
window.addEventListener && window.addEventListener("hashchange", ()=>{
  if(location.hash==="#radicals") setTab("radicals");
  else if(location.hash==="#vocab") setTab("vocab");
});

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
  $("freqtab").setAttribute("aria-pressed", settings.byFreq);
  $("slowfirst").setAttribute("aria-pressed", settings.slowFirst);
  $("tones").setAttribute("aria-pressed", settings.tones);
  $("clips").setAttribute("aria-pressed", settings.clips);
  $("clips").hidden = !AUDIO;
  $("audionote").hidden = !AUDIO;
  [...$("goalseg").children].forEach(c=>c.setAttribute("aria-pressed", +c.dataset.goal===settings.goal));
}

// refresh due counts once a minute (skipped while the menu is focused so it doesn't close on you)
setInterval(()=>{
  if(document.activeElement === $("lesson") || document.activeElement === $("envoice")) return;
  buildLessonMenu(); updateStats();
  if(!playing && order.length) setStatus(idx());
}, 60000);

days = store.get(DAYS_KEY, {}) || {};
if(location.hash==="#radicals") settings.tab = "radicals";
if(location.hash==="#vocab")    settings.tab = "vocab";
if(location.hash==="#frequency") settings.byFreq = true;
syncControls();
setTab(settings.tab);
