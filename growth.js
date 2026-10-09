/* =========================================================
   听 · growth.js — share button, visitor counting, one-question survey
   Everything here is off until config.js is filled in (except Share).
   ========================================================= */

/* ---------- share ---------- */
$("share").onclick = async ()=>{
  const url = CONFIG.shareUrl || location.href.split("#")[0];
  const data = { title:"听 · Chinese vocabulary trainer", text:"Free Chinese vocab trainer with audio, spaced repetition and an AI tutor", url };
  try{
    if(navigator.share){ await navigator.share(data); track("share"); return; }
    await navigator.clipboard.writeText(url);
    flashShare("Link copied");
  }catch(e){ flashShare(url); }
  track("share");
};
function flashShare(t){ const b = $("share"), old = b.textContent; b.textContent = t; setTimeout(()=>{ b.textContent = old; }, 1800); }

/* ---------- visitor counting (GoatCounter) ---------- */
function track(path){
  try{ if(window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path, title: path, event: true }); }catch(e){}
}
if(CONFIG.analytics){
  const s = document.createElement("script");
  s.async = true; s.src = "https://gc.zgo.at/count.js";
  s.setAttribute("data-goatcounter", "https://"+CONFIG.analytics+".goatcounter.com/count");
  document.head.appendChild(s);
}
$("tab-tutor").addEventListener("click", ()=>track("tutor-open"));

/* ---------- survey ---------- */
const SURVEY_KEY = "ting.survey.v1";
let survey = store.get(SURVEY_KEY, {}) || {};
const surveyEligible = () => {
  if(!CONFIG.survey || survey.done) return false;
  if(survey.later && Date.now() - survey.later < 7*DAY) return false;
  const total = Object.values(days).reduce((a,b)=>a+b, 0);
  return total >= 30 || Object.keys(days).length >= 2;
};
function showSurvey(){ $("survey").hidden = !surveyEligible(); }
$("survey").addEventListener("click", async e=>{
  const b = e.target.closest("[data-ans]"); const later = e.target.closest("[data-later]");
  if(later){ survey.later = Date.now(); store.set(SURVEY_KEY, survey); $("survey").hidden = true; return; }
  if(!b) return;
  const payload = {
    answer: b.dataset.ans,
    note: $("survey-note").value.trim(),
    words_rated: Object.values(days).reduce((a,x)=>a+x,0),
    days_used: Object.keys(days).length,
    lesson: currentLesson,
    ua: String(navigator.userAgent||"").slice(0,120)
  };
  [...$("survey").querySelectorAll("button")].forEach(x=>x.disabled = true);
  try{
    const r = await fetch(CONFIG.survey, { method:"POST", headers:{ "Content-Type":"application/json", "Accept":"application/json" }, body: JSON.stringify(payload) });
    if(!r.ok) throw new Error("HTTP "+r.status);
    survey.done = Date.now(); store.set(SURVEY_KEY, survey);
    $("survey").innerHTML = '<div class="sv-q">谢谢！Thank you — that helps decide what to build next.</div>';
    track("survey-"+payload.answer);
    setTimeout(()=>{ $("survey").hidden = true; }, 2500);
  }catch(err){
    [...$("survey").querySelectorAll("button")].forEach(x=>x.disabled = false);
    $("survey-status").textContent = "Couldn't send — please try again later.";
  }
});
showSurvey();
const _grade = grade;
grade = function(i, ok){ _grade(i, ok); if($("survey").hidden) showSurvey(); };
