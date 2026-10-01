const EXAMPLES = [...EXAMPLES_A, ...EXAMPLES_B];
// Example sentences, one per word, same order as WORDS: [Chinese, pinyin, English]

// Lesson/topic for each word, in the same order as WORDS. Built from group sizes.
const LESSONS = [];
LESSON_SPEC.forEach(([name,count])=>{ for(let i=0;i<count;i++) LESSONS.push(name); });

// Usage-frequency tier per word (approx. HSK band). 1 = most common, 3 = least common.
// Words not listed default to tier 2.
const FREQ_TIERS = {
  1: "只 高 老 头发 长 黑 红 一边……一边…… 休息 学习 学校 早 早一点 一节课 下节课 数学 生活 时候 什么时候 工作 上班 下班 电影 想一想 不同的 一定 街道 现代 楼 快 走路 忙 周末 累 以后 商店 少 认识 开始 事情 山 号 便宜 贵 多少钱 怎么样 衣服 卖 房子 因为 所以 要是 天气 热 冷 下雨 生病 医院 医生 次 饭后 睡前 电脑 午饭 桌子 公司 做饭 近 远 一直 飞机 火车 开车 送 碗 鱼 鸡蛋 牛肉 一般 最近 然后 一起 可能 觉得 需要 一点儿也不 穿 帽子 包 刀 灯 窗户 电视 床 椅子 放 上课 做作业 起床 又 花 树 岛 教室 大家 为了 买 该 中午 时间 见面 问题 生气 可是 知道 意思 地方 谁 汉语 中文 好好儿 再 还 唱 歌 旅行 英语 高兴 难 听说 那么 告诉 这样 有点儿 不用 岁 教 后来 茶 菜 家人 找 快……了 用 当 好吃 自己 明白 错 西瓜 下车 东西 老师 出门 雨 一……就…… 先 打开 邮件 成了 收到 极了 得 发 微信 身体 话 眼睛 有空 常 祝 手机 第一次 希望 您 想 别 真的 太……了 对不起 出去",
  2: "推荐 通常 介绍 歌手 演员 流行 心情 影响 帅 美 漂亮 好看 矮 胖 瘦 不到 短 直 颜色 蓝 绿 深 浅 性格 安静 比较 聪明 受欢迎 也许 继续 发生 已经 结束 逃课 人生 离开 有时 偶尔 经常 等一会 活动 电视剧 应该 简单 复习 城市 著名 首都 热闹 慢 安全 商场 地铁 特别 公园 交通 快乐 完全 骑 自行车 或者 古老 传统 建筑 文化 着急 聊天 生活方式 年轻人 购物中心 电影院 放松 自然 爬山 课程 咖啡店 艺术 博物馆 旁边 市中心 休假 文章 适应 环境 容易 刚 吵 声音 满 习惯 发现 方便 到处 便利店 餐厅 出租车 游客 有意思 选择 关门 变 好像 适合 参加 享受 空间 看法 改变 久 精彩 美丽 重要 无论 身边 通过 健身 语言 尝试 打招呼 当地 友好 想家 森林 帮助 幸福 吸引 国外 购物 打折 试 试衣间 当然 裙子 裤子 衬衫 鞋 支付 信用卡 礼物 寄 明信片 纪念品 租 合适 位置 厨房 卫生间 卧室 客厅 阳台 家具 电梯 小区 房东 搬 满意 宠物 季节 春天 夏天 秋天 冬天 暖和 凉快 晴 阴 多云 刮风 下雪 度 零下 天气预报 准 伞 南方 北方 游泳 滑雪 野餐 散步 感冒 咳嗽 发烧 头疼 肚子疼 疼 药 吃药 药店 过敏 片 办公室 网络 同事 解决 安排 方式 自由 困难 体验 老板 客户 压力 担心 假期 推迟 赚钱 越来越 主意 认真 调查 约会 爱好 感兴趣 下棋 跳舞 做运动 健身房 打羽毛球 音乐会 老年人 相同 离 公里 换乘 高铁 船 公共汽车 坐车 做菜 美食 火锅 煮 炒 烤 锅 筷子 酱油 盐 糖 辣椒 辣 甜 酸 虽然 不过 而且 差不多 大概 决定 不得不 大自然 接受 戴 围巾 手表 眼镜 袜子 外套 盘子 勺子 机票 火车站 地铁站 乘客 航班 登机 往返 单程 电动车 空调 沙发 书柜 衣柜 冰箱 墙 钟 挂 早睡早起 熬夜 按时 预习 加班 素食主义 不是……而是…… 好起来 带 不好意思 记得 迟到 堵车 跑步 减肥 考试 有名 对……来说 家乡 市区 郊区 农村 优点 缺点 机会 工资 历史 逛街 高楼 长大 空气 新鲜 高速公路 值得 舒服 想念 记忆 永远 变化 熟悉 风景 温暖 超市 渐渐 比如 进 闹钟 尽管 感谢 设置 有些 问好 奇怪 邻居 对话 外面 如果 跟 挺 关心 回答 成语 风俗 后悔 交朋友 玩具 食物 当心 过程 哪些 方面 阅读 平时 努力 首 小时候 其实 怕 提高 能力 方法 功夫 不但……而且…… 道理 没用 挣钱 留学 学费 打工 进步 毕业 饭馆 厨师 想起来 导游 不错 讨厌 关系 越……越…… 懂 表扬 有趣 上网 电子邮箱 电子邮件 情况 消息 放心 小孩子 讲课 听得懂 吃得惯 可惜 没电 充电 充电器 护照 条件 亲爱的 每次 笑脸 闻 香味儿 饭菜 许多 一切 为 学会 西红柿 室友 打算 附近 秘密 班 姑娘 又……又…… 健康 其他 咖啡馆",
  3: "海边 豆腐 游戏 外表 外貌 长什么样 丑 不好看 一米八多 卷 胡子 留胡子 戴眼镜 金边眼镜 脸红 棕 金 外向 开朗 阳光 内向 害羞 忧郁 e人 i人 幽默 仍然 无聊的 有趣的 北部 节奏 各有各的 魅力 四通八达 轻轨 夜生活 丰富 酒吧 夜市 即使 拥挤 总的来说 堵 寺庙 浓 繁华 瀑布 农场 瑜伽 冥想 展览 逛 气息 摩托车 响 挤 区域 感受 平静 活泼 独处 偏远 志愿者 旅居 租金 中介 朝南 雨季 旱季 打喷嚏 流鼻涕 嗓子疼 远程工作 孤独 分心 自由职业 存款 攀岩 射箭 摄影 编程 驾照 安全帽 煎 蒸 洋葱 姜 奶酪 背 领带 皮带 项链 戒指 耳环 袋子 首饰 打扮 微波炉 烤箱 菜板 虾 醋 胡椒粉 蒜 白菜 香肠 拌 炖 炸 清淡 油腻 调料 头等舱 经济舱 私家车 长途汽车 始发站 终点站 电风扇 地毯 窗帘 摆 夜猫子 作息时间 口味清淡 口味重 八成饱 喝茶/咖啡 着 看情况 普通人 画家 小镇 物价 质量 单纯 商业中心 胡同 四合院 田野 珍贵 入乡随俗 或许 潮湿 晚睡晚起 懒虫 亲切 榴莲 缘分 做人 出息 元素 书架 唐装 宫保鸡丁 麻婆豆腐 流口水 咖啡师 想好 误解 拿到 西红柿炒鸡蛋 空心菜",
};
const FREQ = {};
Object.entries(FREQ_TIERS).forEach(([t,s])=>s.split(" ").forEach(w=>{ FREQ[w]=+t; }));
const TIER_LABEL = {1:"★★★ Most common · HSK 1–2", 2:"★★ Common · HSK 3–4", 3:"★ Less common · HSK 5+"};
const tierOf = i => FREQ[WORDS[i][0]] || 2;


const $ = id => document.getElementById(id);
const han=$("han"), pinyin=$("pinyin"), gloss=$("gloss"), cur=$("cur"),
      pbar=$("pbar"), seal=$("seal"), playicon=$("playicon"), wlist=$("wlist"), hint=$("hint"),
      exampleBox=$("example"), exzh=$("exzh"), expy=$("expy"), exen=$("exen");

let order = WORDS.map((_,i)=>i);
let pos = 0;                 // position within `order`
let playing = false;
let gen = 0;                 // invalidates stale async chains
let currentLesson = "__all__";
const settings = { rate:0.8, repeat:2, gap:1.2, english:true, shuffle:false, example:false, byFreq:false };
let zhVoice=null, enVoice=null;

// build the Lesson dropdown (All + each topic, with a word count)
(function buildLessonMenu(){
  const sel = $("lesson");
  const opts = ['<option value="__all__">All lessons ('+WORDS.length+')</option>'];
  LESSON_SPEC.forEach(([name])=>{
    const n = LESSONS.filter(l=>l===name).length;
    opts.push('<option value="'+name+'">'+name+' ('+n+')</option>');
  });
  opts.push('<optgroup label="By frequency · across all lessons">');
  [1,2,3].forEach(t=>{
    const n = WORDS.filter((_,i)=>tierOf(i)===t).length;
    opts.push('<option value="__tier'+t+'">'+TIER_LABEL[t]+' ('+n+')</option>');
  });
  opts.push('</optgroup>');
  sel.innerHTML = opts.join("");
})();

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
    zhVoice = zh[0];
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
    sampleVoice();
  } else {
    $("gendernote").textContent = g==="m"
      ? "No male Chinese voice is installed on this device."
      : "No female Chinese voice found on this device.";
  }
});

/* ---------- rendering ---------- */
function idx(){ return order[pos]; }
function render(){
  const w = WORDS[idx()];
  han.textContent=w[0]; pinyin.textContent=w[1]; gloss.textContent=w[2];
  const t=tierOf(idx()); $("tier").textContent = "★★★".slice(0,4-t); $("tier").title = TIER_LABEL[t]; $("tier").dataset.t=t;
  const ex = EXAMPLES[idx()];
  if(settings.example && ex){
    exzh.textContent=ex[0]; expy.textContent=ex[1]; exen.textContent=ex[2];
    exampleBox.hidden=false;
  } else {
    exampleBox.hidden=true;
  }
  exampleBox.classList.remove("speaking");
  cur.textContent = pos+1;
  $("total").textContent = order.length;
  pbar.style.width = order.length ? ((pos+1)/order.length*100)+"%" : "0%";
  [...wlist.children].forEach((li,p)=>li.classList.toggle("active", p===pos));
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
// Retry once only if the word made no sound at all. Because the check above
// confirms via the `speaking` flag, a working-but-slow voice returns true and
// is never cancelled here.
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

let warmedUp=false;
function warmUp(){               // first speak after a user gesture primes the engine
  if(warmedUp) return; warmedUp=true;
  try{ const u=new SpeechSynthesisUtterance(""); u.volume=0; speechSynthesis.speak(u); }catch(e){}
}

async function loop(){
  const my = ++gen;
  playing = true; setIcon();
  warmUp();
  while(playing && my===gen){
    render();
    const w = WORDS[idx()];
    for(let r=0; r<settings.repeat; r++){
      if(!playing||my!==gen) return;
      await speak(w[0].replace(/[…．.]+/g," "), "zh-CN", settings.rate);
      if(my!==gen) return;
      if(r<settings.repeat-1) await wait(220);
    }
    if(my!==gen) return;
    if(settings.english && enVoice){
      await speak(w[2].replace(/\//g," or "), "en-US", Math.max(0.9, settings.rate));
      if(my!==gen) return;
    }
    if(settings.example && EXAMPLES[idx()]){
      const ex = EXAMPLES[idx()];
      await wait(300);
      if(my!==gen) return;
      exampleBox.classList.add("speaking");
      await speak(ex[0].replace(/[…．.]+/g," "), "zh-CN", settings.rate);
      if(my!==gen) return;
      if(settings.english && enVoice){
        await wait(150);
        await speak(ex[2].replace(/\//g," or "), "en-US", Math.max(0.9, settings.rate));
      }
      exampleBox.classList.remove("speaking");
      if(my!==gen) return;
    }
    await wait(settings.gap*1000);
    if(my!==gen) return;
    advance(1);
  }
}
function advance(d){
  pos += d;
  if(pos>=order.length){ pos=0; if(settings.shuffle) reshuffle(); }
  if(pos<0) pos=order.length-1;
}
function reshuffle(){
  for(let i=order.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[order[i],order[j]]=[order[j],order[i]];}
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

/* ---------- controls ---------- */
$("play").onclick = toggle;
$("stage").onclick = toggle;
$("stage").onkeydown = e=>{ if(e.key===" "||e.key==="Enter"){e.preventDefault();toggle();} };
$("next").onclick = ()=>{ const was=playing; stop(); advance(1); render(); if(was) loop(); };
$("prev").onclick = ()=>{ const was=playing; stop(); advance(-1); render(); if(was) loop(); };

$("rate").oninput = e=>{ settings.rate=+e.target.value; $("rateval").textContent=settings.rate.toFixed(2)+"×"; };
$("gap").oninput  = e=>{ settings.gap=+e.target.value; $("gapval").textContent=settings.gap.toFixed(1)+"s"; };

$("repeat").addEventListener("click", e=>{
  const b=e.target.closest("[data-r]"); if(!b) return;
  settings.repeat=+b.dataset.r;
  [...e.currentTarget.children].forEach(c=>c.setAttribute("aria-pressed", c===b));
});
function toggleChip(el,key){
  const on = el.getAttribute("aria-pressed")!=="true";
  el.setAttribute("aria-pressed", on); settings[key]=on;
}
$("english").onclick = ()=>toggleChip($("english"),"english");
$("example-toggle").onclick = ()=>{ toggleChip($("example-toggle"),"example"); render(); };
function sortByFreq(){ order.sort((a,b)=> (tierOf(a)-tierOf(b)) || (a-b)); }
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
  applyLesson();
  if(was) loop();
});

document.addEventListener("keydown", e=>{
  if(e.target.tagName==="SELECT") return;
  if(e.key===" "){e.preventDefault();toggle();}
  else if(e.key==="ArrowRight") $("next").click();
  else if(e.key==="ArrowLeft") $("prev").click();
});

// Rebuild `order` for the chosen lesson, then refresh the list.
function applyLesson(){
  const all = WORDS.map((_,i)=>i);
  if(currentLesson==="__all__") order = all;
  else if(currentLesson.startsWith("__tier")) { const t=+currentLesson.slice(6); order = all.filter(i=>tierOf(i)===t); }
  else order = all.filter(i=>LESSONS[i]===currentLesson);
  if(settings.byFreq) sortByFreq();
  if(settings.shuffle) reshuffle();
  pos = 0;
  buildList();
  render();
}

/* ---------- build word list for the current lesson ---------- */
function buildList(){
  wlist.innerHTML="";
  order.forEach((wi,p)=>{
    const w = WORDS[wi];
    const li=document.createElement("li");
    li.tabIndex=0;
    li.innerHTML=`<span class="n">${p+1}</span><span class="lz">${w[0]}</span><span class="lt" data-t="${tierOf(wi)}">${"★★★".slice(0,4-tierOf(wi))}</span><span class="lp">${w[1]}</span>`;
    const jump=()=>{ const was=playing; stop(); pos=p; render(); if(was) loop(); };
    li.onclick=jump;
    li.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();jump();} };
    wlist.appendChild(li);
  });
}

$("freqtab").onclick = e=>{
  e.preventDefault();
  const was=playing; stop();
  currentLesson="__all__"; $("lesson").value="__all__";
  if(!settings.byFreq){ settings.byFreq=true; $("byfreq").setAttribute("aria-pressed","true"); }
  $("freqtab").setAttribute("aria-pressed","true");
  applyLesson(); if(was) loop();
  window.scrollTo({top:0,behavior:"smooth"});
};
$("lesson").addEventListener("change", ()=>$("freqtab").setAttribute("aria-pressed","false"));
applyLesson();
if(location.hash==="#frequency") $("freqtab").click();
