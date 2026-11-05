/* =========================================================
   听 · forgot-ui.js — "⚠ My forgotten characters" study lists
   Adds the two tiers from forgot.js to the lesson picker (pinned at the top) and
   hides the raw card lessons (names starting with "_") from the lesson lists.
   ========================================================= */
const FORGOT = {};
FORGOT_TIERS.forEach(([key, label, note, chars]) => { FORGOT[key] = { label, note, chars }; STUDY_NOTE[key] = note; });
const isForgot = v => !isRad() && !!FORGOT[v];
const forgotIds = v => FORGOT[v].chars.map(z => WORD_IDX[z]).filter(i => i !== undefined);

const _selectionFor = selectionFor;
selectionFor = function(v){ return isForgot(v) ? forgotIds(v) : _selectionFor(v); };

const _lessonLabel = lessonLabel;
lessonLabel = function(v){ return FORGOT[v] ? FORGOT[v].label+" ("+FORGOT[v].chars.length+")" : _lessonLabel(v); };

const _sortByFreq = sortByFreq;                 // keep the lists in most-forgotten order
sortByFreq = function(){ if(isForgot(currentLesson)) return; _sortByFreq(); };

const _buildPicker = buildPicker;
buildPicker = function(){
  _buildPicker();
  const pk = $("picker");
  const item = (v) => '<button class="pk-item'+(v===currentLesson?' on':'')+'" data-v="'+esc(v)+'">'+esc(FORGOT[v].label)+'<span class="pk-n">'+FORGOT[v].chars.length+'</span></button>';
  const sec = '<div class="pk-sec pk-forgot"><div class="pk-head">My forgotten characters</div><div class="pk-grid">'+Object.keys(FORGOT).map(item).join("")+'</div></div>';
  pk.innerHTML = sec + pk.innerHTML;
  if(pk.querySelectorAll){
    pk.querySelectorAll('[data-v^="_"]').forEach(b => b.remove());
    pk.querySelectorAll('details.pk-unit').forEach(d => { if(!d.querySelector('.pk-item')) d.remove(); });
  }
};

const _buildLessonMenu = buildLessonMenu;
buildLessonMenu = function(){
  const cur = currentLesson, f = isForgot(cur);
  if(f) currentLesson = "__all__";             // let the original build without resetting us
  _buildLessonMenu();
  if(isRad()){ currentLesson = cur; return; }
  const sel = $("lesson");
  sel.innerHTML = sel.innerHTML.replace(/<option value="_forgot\d">[^<]*<\/option>/g, "") +
    '<optgroup label="My forgotten characters">' + Object.keys(FORGOT).map(k => opt(k, lessonLabel(k))).join("") + '</optgroup>';
  if(f){ currentLesson = cur; sel.value = cur; $("lessonbtn").textContent = lessonLabel(cur); }
};

// restore a saved forgotten-characters list on reload (app.js ran before this file existed)
if(FORGOT[settings.lesson] && !isRad()){ currentLesson = settings.lesson; buildLessonMenu(); applyLesson(); }
else buildLessonMenu();
