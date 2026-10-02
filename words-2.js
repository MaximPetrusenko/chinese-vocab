// Lessons added after the deck was split into files. Appends to the arrays from words.js / examples / lessons / meta.
const NEW_LESSONS = [
  ["Feelings & habits · 感觉 情绪", [
    ["对……感兴趣","duì……gǎn xìngqù","To be interested in…","我对中国文化很感兴趣。","Wǒ duì Zhōngguó wénhuà hěn gǎn xìngqù.","I'm very interested in Chinese culture.","pat",2],
    ["兴趣","xìngqù","Interest","我的兴趣是摄影。","Wǒ de xìngqù shì shèyǐng.","My interest is photography.","n",2],
    ["之前","zhīqián","Before","睡觉之前我会看书。","Shuìjiào zhīqián wǒ huì kàn shū.","I read before going to sleep.","n",2],
    ["之后","zhīhòu","After","下班之后我去健身。","Xiàbān zhīhòu wǒ qù jiànshēn.","After work I go to the gym.","n",2],
    ["只要……就……","zhǐyào……jiù……","As long as…, then…","只要你努力，就会进步。","Zhǐyào nǐ nǔlì, jiù huì jìnbù.","As long as you work hard, you'll improve.","pat",2],
    ["想法","xiǎngfǎ","Idea / thought","这是一个好想法。","Zhè shì yí ge hǎo xiǎngfǎ.","That's a good idea.","n",2],
    ["记住","jìzhù","To remember (firmly)","请记住我的电话号码。","Qǐng jìzhù wǒ de diànhuà hàomǎ.","Please remember my phone number.","v",2],
    ["每天","měitiān","Every day","我每天学习中文。","Wǒ měitiān xuéxí Zhōngwén.","I study Chinese every day.","adv",1],
    ["咸","xián","Salty","这个菜太咸了。","Zhège cài tài xián le.","This dish is too salty.","adj",2],
    ["造句","zàojù","To make a sentence","请用这个词造句。","Qǐng yòng zhège cí zàojù.","Please make a sentence with this word.","v",3],
    ["稳定","wěndìng","Stable","我想要一个稳定的工作。","Wǒ xiǎng yào yí ge wěndìng de gōngzuò.","I want a stable job.","adj",2],
    ["试试","shìshi","To give it a try","这件衣服你试试吧。","Zhè jiàn yīfu nǐ shìshi ba.","Try this piece of clothing on.","v",1],
    ["开心","kāixīn","Happy","今天我很开心。","Jīntiān wǒ hěn kāixīn.","I'm very happy today.","adj",1],
    ["空闲","kòngxián","Free / leisure (time)","空闲时间你喜欢做什么？","Kòngxián shíjiān nǐ xǐhuan zuò shénme?","What do you like to do in your free time?","adj",3],
    ["感觉","gǎnjué","Feeling / to feel","我感觉有点累。","Wǒ gǎnjué yǒudiǎn lèi.","I feel a bit tired.","v",1],
    ["情绪","qíngxù","Emotion / mood","他今天情绪不太好。","Tā jīntiān qíngxù bú tài hǎo.","He's not in a good mood today.","n",3],
    ["难受","nánshòu","Uncomfortable / feel bad","在热闹的城市我觉得很难受。","Zài rènao de chéngshì wǒ juéde hěn nánshòu.","I feel uncomfortable in a busy city.","adj",2],
    ["紧张","jǐnzhāng","Nervous","我很紧张，因为我的中文还不太好。","Wǒ hěn jǐnzhāng, yīnwèi wǒ de Zhōngwén hái bú tài hǎo.","I'm nervous because my Chinese isn't very good yet.","adj",2],
    ["正常","zhèngcháng","Normal","在曼谷每天下雨很正常。","Zài Màngǔ měitiān xiàyǔ hěn zhèngcháng.","In Bangkok it's normal for it to rain every day.","adj",2],
    ["换","huàn","To change / swap","我最近换了工作。","Wǒ zuìjìn huàn le gōngzuò.","I changed jobs recently.","v",1],
    ["复杂","fùzá","Complicated","我的工作很复杂。","Wǒ de gōngzuò hěn fùzá.","My work is complicated.","adj",2]
  ]]
];
NEW_LESSONS.forEach(([name, rows])=>{
  rows.forEach(([zh,py,en,ezh,epy,een,pos,tier])=>{
    WORDS.push([zh,py,en]);
    EXAMPLES_B.push([ezh,epy,een]);
    POS_GROUPS[pos] += " "+zh;
    FREQ_TIERS[tier] += " "+zh;
  });
  LESSON_SPEC.push([name, rows.length]);
});
