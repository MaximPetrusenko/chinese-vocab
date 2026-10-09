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
  ]],
  ["快乐其实很简单 · Happiness is simple", [
    ["过期","guòqī","Expired / to expire","我的签证下个月过期。","Wǒ de qiānzhèng xià ge yuè guòqī.","My visa expires next month.","v",2],
    ["签证","qiānzhèng","Visa","我要去办签证。","Wǒ yào qù bàn qiānzhèng.","I need to go and apply for a visa.","n",2],
    ["受不了","shòubuliǎo","Can't stand / can't bear","我受不了这么热的天气。","Wǒ shòubuliǎo zhème rè de tiānqì.","I can't stand such hot weather.","v",2],
    ["让","ràng","To let / to make (someone do)","妈妈不让我晚上出去。","Māma bú ràng wǒ wǎnshang chūqù.","Mom doesn't let me go out at night.","v",1],
    ["以前","yǐqián","Before / in the past","我以前住在北京。","Wǒ yǐqián zhù zài Běijīng.","I used to live in Beijing.","n",1],
    ["抱怨","bàoyuàn","To complain","他总是抱怨工作太多。","Tā zǒngshì bàoyuàn gōngzuò tài duō.","He always complains there's too much work.","v",2],
    ["才","cái","Only then / not until","他十二点才睡觉。","Tā shí'èr diǎn cái shuìjiào.","He didn't go to sleep until twelve.","adv",1],
    ["同意","tóngyì","To agree","我同意你的看法。","Wǒ tóngyì nǐ de kànfǎ.","I agree with your view.","v",2],
    ["理解","lǐjiě","To understand / understanding","我理解你的感受。","Wǒ lǐjiě nǐ de gǎnshòu.","I understand how you feel.","v",2],
    ["职责","zhízé","Duty / responsibility","照顾孩子是父母的职责。","Zhàogù háizi shì fùmǔ de zhízé.","Taking care of children is the parents' duty.","n",3],
    ["结果","jiéguǒ","Result / in the end","我们不用想结果。","Wǒmen búyòng xiǎng jiéguǒ.","We don't need to think about the result.","n",2],
    ["平平安安","píngpíng'ān'ān","Safe and sound","希望你平平安安回家。","Xīwàng nǐ píngpíng'ān'ān huí jiā.","I hope you get home safe and sound.","adj",2],
    ["只能","zhǐnéng","Can only","如果只能选一个，你选哪个？","Rúguǒ zhǐnéng xuǎn yí ge, nǐ xuǎn nǎge?","If you can only pick one, which do you pick?","adv",2],
    ["选","xuǎn","To choose / to pick","你选一个吧。","Nǐ xuǎn yí ge ba.","You pick one.","v",1],
    ["有钱","yǒuqián","Rich / to have money","他很有钱，但是不快乐。","Tā hěn yǒuqián, dànshì bú kuàilè.","He's rich, but not happy.","adj",1],
    ["普通","pǔtōng","Ordinary / normal","我只是一个普通人。","Wǒ zhǐshì yí ge pǔtōng rén.","I'm just an ordinary person.","adj",2],
    ["手","shǒu","Hand","吃饭以前请洗手。","Chīfàn yǐqián qǐng xǐ shǒu.","Please wash your hands before eating.","n",1],
    ["善良","shànliáng","Kind / kind-hearted","她是一个善良的人。","Tā shì yí ge shànliáng de rén.","She is a kind person.","adj",2],
    ["辛苦","xīnkǔ","Hard / tiring (of work)","每天工作十个小时很辛苦。","Měitiān gōngzuò shí ge xiǎoshí hěn xīnkǔ.","Working ten hours a day is tiring.","adj",2],
    ["等于","děngyú","To equal / to amount to","善良不等于不会拒绝。","Shànliáng bù děngyú bú huì jùjué.","Being kind doesn't mean never saying no.","v",3],
    ["拒绝","jùjué","To refuse / to reject","他拒绝了我的帮助。","Tā jùjué le wǒ de bāngzhù.","He refused my help.","v",2],
    ["别人","biérén","Other people","我们要体谅别人。","Wǒmen yào tǐliàng biérén.","We should be considerate of others.","n",1],
    ["体谅","tǐliàng","To be considerate / to make allowances","请体谅我，我最近太忙了。","Qǐng tǐliàng wǒ, wǒ zuìjìn tài máng le.","Please understand, I've been too busy lately.","v",3],
    ["贫穷","pínqióng","Poor / poverty","他们帮助贫穷的人。","Tāmen bāngzhù pínqióng de rén.","They help poor people.","adj",3],
    ["猫","māo","Cat","我家有一只猫。","Wǒ jiā yǒu yì zhī māo.","There's a cat at my home.","n",1],
    ["喂","wèi","To feed","她每天喂小区的猫。","Tā měitiān wèi xiǎoqū de māo.","She feeds the neighbourhood cats every day.","v",2]
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
