/* =========================================================
   听 · mw.js — 量词 Measure words: browse deck + "which measure word?" quiz
   Uses globals from app.js (srs, days, store, speak, toneHTML, esc, settings…).
   ========================================================= */
const MW_KEY = m => "量词:"+m;
let mwOpen = false, mwMode = "browse";
const MW_NOUNS = {};                       // noun → Set of measure words that take it
MEASURE.forEach(m => m[3].forEach(n => { (MW_NOUNS[n[0]] = MW_NOUNS[n[0]] || new Set()).add(m[0]); }));
const MW_ITEMS = [];                       // quiz items: one per (measure word, noun)
MEASURE.forEach((m, mi) => m[3].forEach(n => MW_ITEMS.push({ mi, noun:n })));

// 一 + measure word: yí before a 4th tone, yì otherwise (一个 → yí ge)
function yiFor(py){
  const first = py.split(/[\s\/]/)[0];
  let t = 0; for(const ch of [...first]){ const d = ch.normalize("NFD"); for(const m of d.slice(1)) if(TONE_MARK[m]) t = TONE_MARK[m]; if(t) break; }
  return t === 4 ? "yí" : "yì";
}
const mwPy = m => m[1].split(" / ")[0];

/* ---------- open / close ---------- */
function openMW(on){
  if(on === mwOpen) return;
  if(on && typeof openTutor === "function") openTutor(false);
  mwOpen = on;
  if(on) stop();
  $("main").hidden = on; $("mw").hidden = !on;
  $("tab-mw").setAttribute("aria-pressed", on);
  if(on){ $("tab-vocab").setAttribute("aria-pressed", false); $("tab-rad").setAttribute("aria-pressed", false); renderMW(); }
  else { $("tab-vocab").setAttribute("aria-pressed", !isRad()); $("tab-rad").setAttribute("aria-pressed", isRad()); }
}
$("tab-mw").onclick = e => { e.preventDefault(); openMW(true); };
["tab-vocab","tab-rad","tab-tutor"].forEach(id => $(id).addEventListener("click", () => openMW(false)));
if(location.hash === "#measure") setTimeout(() => openMW(true), 0);

/* ---------- SRS for measure words (same SM-2 lite as the deck, keyed 量词:X) ---------- */
function mwGrade(mw, ok){
  const k = MW_KEY(mw), now = Date.now();
  const s = srs[k] || { r:0, e:2.5, iv:0, due:0, l:0 };
  if(ok){ s.r += 1; s.iv = s.r === 1 ? 1 : s.r === 2 ? 3 : Math.round(s.iv * s.e); s.e = Math.min(3, s.e + 0.05); s.due = now + s.iv * DAY; }
  else { s.r = 0; s.l += 1; s.iv = 0; s.e = Math.max(1.3, s.e - 0.2); s.due = now + 10 * MIN; }
  s.last = ok ? 1 : 0; s.t = now; srs[k] = s; store.set(SRS_KEY, srs);
  const day = dayKey(new Date()); days[day] = (days[day]||0) + 1; store.set(DAYS_KEY, days);
  updateStats(); if(typeof showSurvey === "function") showSurvey();
}
const mwState = mw => { const s = srs[MW_KEY(mw)]; return !s ? "new" : s.last === 0 ? "hard" : s.due <= Date.now() ? "due" : "ok"; };

/* ---------- browse ---------- */
function renderMW(){
  [...$("mw-mode").children].forEach(c => c.setAttribute("aria-pressed", c.dataset.m === mwMode));
  $("mw-browse").hidden = mwMode !== "browse"; $("mw-quiz").hidden = mwMode !== "quiz";
  const rated = MEASURE.filter(m => srs[MW_KEY(m[0])]).length, hard = MEASURE.filter(m => mwState(m[0]) === "hard").length;
  $("mw-stats").textContent = rated ? rated+" of "+MEASURE.length+" rated · "+hard+" hard" : MEASURE.length+" measure words · quiz to start tracking";
  if(mwMode === "browse") renderMWBrowse(); else if(!mwQuiz.cur) nextMWQuestion();
}
function renderMWBrowse(){
  $("mw-grid").innerHTML = MEASURE.map((m, mi) => {
    const yi = yiFor(mwPy(m));
    return '<div class="mwcard" data-s="'+mwState(m[0])+'">' +
      '<div class="mw-head"><span class="mw-ch">'+esc(m[0])+'</span><span class="mw-py">'+toneHTML(m[1])+'</span><button class="chip mw-say" data-say="'+esc(m[0])+'" title="Hear it">🔊</button></div>' +
      '<div class="mw-use">'+esc(m[2])+'</div>' +
      '<div class="mw-nouns">'+m[3].map(n => '<button class="mw-noun" data-say="一'+esc(m[0]+n[0])+'" title="'+esc(yi+" "+mwPy(m)+" "+n[1]+" — "+n[2])+'">一'+esc(m[0])+'<b>'+esc(n[0])+'</b></button>').join("")+'</div>' +
      '<div class="mw-ex"><div class="mw-ezh">'+esc(m[4][0])+'</div><div class="mw-epy">'+toneHTML(m[4][1])+'</div><div class="mw-een">'+esc(m[4][2])+'</div><button class="chip mw-say" data-say="'+esc(m[4][0].replace(/[，。！？]/g," "))+'">🔊 sentence</button></div>' +
    '</div>';
  }).join("");
}
$("mw-grid").addEventListener("click", e => {
  const b = e.target.closest("[data-say]"); if(!b) return;
  speechSynthesis.cancel(); speak(b.dataset.say, "zh-CN", settings.rate);
});
$("mw-mode").addEventListener("click", e => { const b = e.target.closest("[data-m]"); if(!b) return; mwMode = b.dataset.m; renderMW(); });

/* ---------- quiz: which measure word fits this noun? ---------- */
const mwQuiz = { cur:null, right:0, total:0, answered:false };
function nextMWQuestion(){
  // prefer hard / new measure words
  const weight = it => { const st = mwState(MEASURE[it.mi][0]); return st === "hard" ? 4 : st === "new" ? 3 : st === "due" ? 2 : 1; };
  const pool = []; MW_ITEMS.forEach(it => { for(let k = 0; k < weight(it); k++) pool.push(it); });
  let it = pool[Math.random()*pool.length|0];
  if(mwQuiz.cur && MW_ITEMS.length > 1) while(it.mi === mwQuiz.cur.mi && it.noun[0] === mwQuiz.cur.noun[0]) it = pool[Math.random()*pool.length|0];
  const ok = MW_NOUNS[it.noun[0]];
  const others = MEASURE.map(m => m[0]).filter(x => !ok.has(x)).sort(() => Math.random()-0.5).slice(0, 3);
  const choices = [MEASURE[it.mi][0], ...others].sort(() => Math.random()-0.5);
  mwQuiz.cur = { ...it, choices }; mwQuiz.answered = false;
  renderMWQuestion();
}
function renderMWQuestion(){
  const q = mwQuiz.cur, m = MEASURE[q.mi];
  $("mw-qnoun").innerHTML = '<span class="mw-qzh">一 <span class="mw-gap">？</span> '+esc(q.noun[0])+'</span><div class="mw-qen">'+esc(q.noun[1])+' · '+esc(q.noun[2])+'</div>';
  $("mw-choices").innerHTML = q.choices.map(c => '<button class="mw-choice" data-c="'+esc(c)+'">'+esc(c)+'</button>').join("");
  $("mw-feedback").innerHTML = ""; $("mw-next").hidden = true;
  $("mw-score").textContent = mwQuiz.total ? mwQuiz.right+" / "+mwQuiz.total+" this session" : "";
}
function answerMW(choice){
  const q = mwQuiz.cur; if(!q || mwQuiz.answered) return;
  mwQuiz.answered = true; mwQuiz.total++;
  const accepted = MW_NOUNS[q.noun[0]], ok = accepted.has(choice), m = MEASURE[q.mi];
  if(ok) mwQuiz.right++;
  mwGrade(choice, ok);                                      // the measure word you picked gets the rating
  if(!ok) mwGrade(m[0], false);                             // and the one you should have picked is marked missed
  [...$("mw-choices").children].forEach(b => {
    if(accepted.has(b.dataset.c)) b.classList.add("right");
    else if(b.dataset.c === choice) b.classList.add("wrong");
    b.disabled = true;
  });
  const correct = MEASURE.find(x => x[0] === choice && ok) || m;
  const yi = yiFor(mwPy(correct));
  $("mw-feedback").innerHTML = (ok ? '<div class="mw-fb ok">✓ 一'+esc(correct[0]+q.noun[0])+' <span class="mw-py">'+toneHTML(yi+" "+mwPy(correct)+" "+q.noun[1])+'</span></div>'
                                   : '<div class="mw-fb no">✗ It\'s 一'+esc(m[0]+q.noun[0])+' <span class="mw-py">'+toneHTML(yi+" "+mwPy(m)+" "+q.noun[1])+'</span></div>') +
    '<div class="mw-fbuse">'+esc(correct[2])+(accepted.size > 1 ? ' · also takes '+[...accepted].filter(x => x !== correct[0]).join(" / ") : '')+'</div>';
  $("mw-next").hidden = false; $("mw-next").focus();
  $("mw-score").textContent = mwQuiz.right+" / "+mwQuiz.total+" this session";
  speechSynthesis.cancel(); speak("一"+correct[0]+q.noun[0], "zh-CN", settings.rate);
}
$("mw-choices").addEventListener("click", e => { const b = e.target.closest("[data-c]"); if(b) answerMW(b.dataset.c); });
$("mw-next").onclick = nextMWQuestion;
document.addEventListener("keydown", e => {
  if(!mwOpen) return;
  const tag = e.target.tagName; if(tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if(e.key === " " || /^[1-4]$/.test(e.key) || e.key === "ArrowLeft" || e.key === "ArrowRight"){ e.preventDefault(); e.stopPropagation(); }   // keep the hidden deck's shortcuts quiet
  if(mwMode !== "quiz") return;
  if(/^[1-4]$/.test(e.key) && !mwQuiz.answered){ const b = $("mw-choices").children[+e.key-1]; if(b) answerMW(b.dataset.c); }
  else if((e.key === "Enter" || e.key === " ") && mwQuiz.answered) nextMWQuestion();
}, true);
