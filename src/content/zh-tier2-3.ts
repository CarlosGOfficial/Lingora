/** Chinese tiers 2–3: HSK 2 and HSK 3 units, with their grammar notes. */
import type { GrammarExample, GrammarPoint, Item, Unit } from './types'

const w = (id: string, target: string, reading: string, meaning: string, extra: Partial<Item> = {}): Item => ({
  id: `zh-${id}`,
  kind: 'word',
  target,
  reading,
  meaning,
  ...extra,
})

const s = (id: string, target: string, reading: string, meaning: string, tokens: string[], extra: Partial<Item> = {}): Item => ({
  id: `zh-${id}`,
  kind: 'sentence',
  target,
  reading,
  meaning,
  tokens,
  ...extra,
})

const ex = (target: string, reading: string, meaning: string): GrammarExample => ({ target, reading, meaning })

export const zhTier23Units: Unit[] = [
  /* ---------------- HSK 2 ---------------- */
  {
    id: 'zh-u6',
    title: 'Getting Around',
    level: 'HSK 2',
    canDo: ['Say how you travel somewhere', 'Ask how far a place is', 'Give simple directions'],
    lessons: [
      {
        id: 'zh-u6-l1',
        title: 'Transport',
        goal: 'Say how you get places',
        items: [
          w('u6-zuo', '坐', 'zuò', 'to take (transport)', { meaningAlt: ['to sit'] }),
          w('u6-chuzuche', '出租车', 'chūzūchē', 'taxi'),
          w('u6-feiji', '飞机', 'fēijī', 'airplane', { meaningAlt: ['plane'] }),
          w('u6-huochezhan', '火车站', 'huǒchēzhàn', 'train station'),
          w('u6-jichang', '机场', 'jīchǎng', 'airport'),
          w('u6-gonggongqiche', '公共汽车', 'gōnggòng qìchē', 'bus'),
          w('u6-li', '离', 'lí', 'away from (distance)'),
          w('u6-yuan', '远', 'yuǎn', 'far'),
        ],
        sentences: [
          s('u6-s-zuochuzuche', '我坐出租车去机场。', 'wǒ zuò chūzūchē qù jīchǎng.', 'I take a taxi to the airport.', ['我', '坐', '出租车', '去', '机场']),
          s('u6-s-huochezhanyuan', '火车站离这儿远吗？', 'huǒchēzhàn lí zhèr yuǎn ma?', 'Is the train station far from here?', ['火车站', '离', '这儿', '远', '吗']),
          s('u6-s-zuogonggongqiche', '他坐公共汽车。', 'tā zuò gōnggòng qìchē.', 'He takes the bus.', ['他', '坐', '公共汽车']),
        ],
      },
      {
        id: 'zh-u6-l2',
        title: 'Directions',
        goal: 'Describe where things are',
        items: [
          w('u6-zuobian', '左边', 'zuǒbian', 'left side', { meaningAlt: ['left'] }),
          w('u6-youbian', '右边', 'yòubian', 'right side', { meaningAlt: ['right'] }),
          w('u6-qianmian', '前面', 'qiánmiàn', 'in front'),
          w('u6-houmian', '后面', 'hòumiàn', 'behind'),
          w('u6-pangbian', '旁边', 'pángbiān', 'beside', { meaningAlt: ['next to'] }),
          w('u6-wang', '往', 'wǎng', 'towards'),
          w('u6-dao', '到', 'dào', 'to arrive', { meaningAlt: ['to reach'] }),
          w('u6-lu', '路', 'lù', 'road'),
        ],
        sentences: [
          s('u6-s-pangbian', '商店在学校旁边。', 'shāngdiàn zài xuéxiào pángbiān.', 'The shop is next to the school.', ['商店', '在', '学校', '旁边']),
          s('u6-s-youbian', '医院在右边。', 'yīyuàn zài yòubian.', 'The hospital is on the right.', ['医院', '在', '右边']),
          s('u6-s-daole', '我们到了。', 'wǒmen dào le.', 'We’ve arrived.', ['我们', '到', '了']),
        ],
      },
    ],
    reading: {
      id: 'zh-u6-r',
      title: '去机场 · To the Airport',
      sentences: [
        s('r6-1', '我家离机场很远。', 'wǒ jiā lí jīchǎng hěn yuǎn.', 'My home is far from the airport.', []),
        s('r6-2', '今天我坐出租车去机场。', 'jīntiān wǒ zuò chūzūchē qù jīchǎng.', 'Today I’m taking a taxi to the airport.', []),
        s('r6-3', '机场旁边有一个饭店。', 'jīchǎng pángbiān yǒu yí ge fàndiàn.', 'There’s a restaurant next to the airport.', []),
        s('r6-4', '我在饭店喝了一杯茶。', 'wǒ zài fàndiàn hē le yì bēi chá.', 'I had a cup of tea at the restaurant.', [], { note: '杯 (bēi) = cup (measure word)' }),
      ],
      questions: [
        { q: 'How does the writer get to the airport?', options: ['By bus', 'By taxi', 'On foot'], answer: 1 },
        { q: 'What is next to the airport?', options: ['A restaurant', 'A hospital', 'A school'], answer: 0 },
        { q: 'What did the writer drink?', options: ['Water', 'Coffee', 'Tea'], answer: 2 },
      ],
    },
  },
  {
    id: 'zh-u7',
    title: 'Weather & Health',
    level: 'HSK 2',
    canDo: ['Talk about the weather', 'Say how you feel', 'Explain that you are sick'],
    lessons: [
      {
        id: 'zh-u7-l1',
        title: 'The Weather',
        goal: 'Describe the weather',
        items: [
          w('u7-tianqi', '天气', 'tiānqì', 'weather'),
          w('u7-leng', '冷', 'lěng', 'cold'),
          w('u7-re', '热', 'rè', 'hot'),
          w('u7-xiayu', '下雨', 'xià yǔ', 'to rain'),
          w('u7-xue', '雪', 'xuě', 'snow'),
          w('u7-qing', '晴', 'qíng', 'sunny', { meaningAlt: ['clear'] }),
          w('u7-zenmeyang', '怎么样', 'zěnmeyàng', 'how is it', { meaningAlt: ['how about'] }),
          w('u7-juede', '觉得', 'juéde', 'to feel (think)'),
        ],
        sentences: [
          s('u7-s-tianqizenmeyang', '今天天气怎么样？', 'jīntiān tiānqì zěnmeyàng?', 'How’s the weather today?', ['今天', '天气', '怎么样']),
          s('u7-s-henleng', '今天很冷。', 'jīntiān hěn lěng.', 'It’s cold today.', ['今天', '很', '冷']),
          s('u7-s-xiayu', '明天下雨。', 'míngtiān xià yǔ.', 'It will rain tomorrow.', ['明天', '下雨']),
        ],
      },
      {
        id: 'zh-u7-l2',
        title: 'Feeling Sick',
        goal: 'Say you’re unwell',
        items: [
          w('u7-shenti', '身体', 'shēntǐ', 'body', { meaningAlt: ['health'] }),
          w('u7-shengbing', '生病', 'shēngbìng', 'to get sick'),
          w('u7-yisheng', '医生', 'yīshēng', 'doctor'),
          w('u7-yao-medicine', '药', 'yào', 'medicine'),
          w('u7-xiuxi', '休息', 'xiūxi', 'to rest'),
          w('u7-lei', '累', 'lèi', 'tired'),
          w('u7-yao-need', '要', 'yào', 'to need', { meaningAlt: ['to want', 'will'] }),
        ],
        sentences: [
          s('u7-s-shengbingle', '我生病了。', 'wǒ shēngbìng le.', 'I’m sick.', ['我', '生病', '了']),
          s('u7-s-yaoxiuxi', '你要休息。', 'nǐ yào xiūxi.', 'You need to rest.', ['你', '要', '休息']),
          s('u7-s-henlei', '医生，我很累。', 'yīshēng, wǒ hěn lèi.', 'Doctor, I’m very tired.', ['医生', '我', '很', '累']),
        ],
      },
    ],
    reading: {
      id: 'zh-u7-r',
      title: '李文生病了 · Li Wen Is Sick',
      sentences: [
        s('r7-1', '今天天气不好，下雨了。', 'jīntiān tiānqì bù hǎo, xià yǔ le.', 'The weather is bad today; it’s raining.', []),
        s('r7-2', '李文生病了，他很累。', 'Lǐ Wén shēngbìng le, tā hěn lèi.', 'Li Wen is sick; he’s very tired.', []),
        s('r7-3', '医生说他要多休息。', 'yīshēng shuō tā yào duō xiūxi.', 'The doctor says he needs to rest a lot.', [], { note: '说 (shuō) = to say' }),
        s('r7-4', '他今天不去学校。', 'tā jīntiān bú qù xuéxiào.', 'He isn’t going to school today.', []),
      ],
      questions: [
        { q: 'What is the weather like?', options: ['Sunny', 'Raining', 'Snowing'], answer: 1 },
        { q: 'What’s wrong with Li Wen?', options: ['He’s sick', 'He’s late', 'He’s hungry'], answer: 0 },
        { q: 'What did the doctor say?', options: ['Go to school', 'Drink tea', 'Rest a lot'], answer: 2 },
      ],
    },
  },

  /* ---------------- HSK 3 ---------------- */
  {
    id: 'zh-u8',
    title: 'Work & Study',
    level: 'HSK 3',
    canDo: ['Talk about your job and workplace', 'Say what you have already done', 'Describe how well someone does something'],
    lessons: [
      {
        id: 'zh-u8-l1',
        title: 'At Work',
        goal: 'Talk about work',
        items: [
          w('u8-gongzuo', '工作', 'gōngzuò', 'to work', { meaningAlt: ['job'] }),
          w('u8-gongsi', '公司', 'gōngsī', 'company'),
          w('u8-jingli', '经理', 'jīnglǐ', 'manager'),
          w('u8-huiyi', '会议', 'huìyì', 'meeting'),
          w('u8-yijing', '已经', 'yǐjīng', 'already'),
          w('u8-wancheng', '完成', 'wánchéng', 'to complete', { meaningAlt: ['to finish'] }),
          w('u8-jihui', '机会', 'jīhuì', 'opportunity', { meaningAlt: ['chance'] }),
          w('u8-mang', '忙', 'máng', 'busy'),
        ],
        sentences: [
          s('u8-s-gongsigongzuo', '我在一家公司工作。', 'wǒ zài yì jiā gōngsī gōngzuò.', 'I work at a company.', ['我', '在', '一', '家', '公司', '工作'], {
            note: '家 is the measure word for companies and shops.',
          }),
          s('u8-s-yijingwancheng', '我已经完成了。', 'wǒ yǐjīng wánchéng le.', 'I’ve already finished.', ['我', '已经', '完成', '了']),
          s('u8-s-haojihui', '这是一个好机会。', 'zhè shì yí ge hǎo jīhuì.', 'This is a good opportunity.', ['这', '是', '一', '个', '好', '机会']),
        ],
      },
      {
        id: 'zh-u8-l2',
        title: 'Studying',
        goal: 'Talk about learning',
        items: [
          w('u8-xuexi', '学习', 'xuéxí', 'to study', { meaningAlt: ['to learn'] }),
          w('u8-kaoshi', '考试', 'kǎoshì', 'exam', { meaningAlt: ['test'] }),
          w('u8-zuoye', '作业', 'zuòyè', 'homework'),
          w('u8-renzhen', '认真', 'rènzhēn', 'conscientious', { meaningAlt: ['serious', 'careful'] }),
          w('u8-tigao', '提高', 'tígāo', 'to improve'),
          w('u8-shuiping', '水平', 'shuǐpíng', 'level', { meaningAlt: ['standard'] }),
          w('u8-lianxi', '练习', 'liànxí', 'to practise'),
          w('u8-rongyi', '容易', 'róngyì', 'easy'),
        ],
        sentences: [
          s('u8-s-youkaoshi', '明天有考试。', 'míngtiān yǒu kǎoshì.', 'There’s an exam tomorrow.', ['明天', '有', '考试']),
          s('u8-s-lianxizhongwen', '我每天练习中文。', 'wǒ měitiān liànxí Zhōngwén.', 'I practise Chinese every day.', ['我', '每天', '练习', '中文'], {
            note: '每天 = every day; 中文 = Chinese (language)',
          }),
          s('u8-s-renzhen', '他学习很认真。', 'tā xuéxí hěn rènzhēn.', 'He studies very conscientiously.', ['他', '学习', '很', '认真']),
        ],
      },
    ],
    reading: {
      id: 'zh-u8-r',
      title: '我的工作 · My Job',
      sentences: [
        s('r8-1', '我在一家中国公司工作。', 'wǒ zài yì jiā Zhōngguó gōngsī gōngzuò.', 'I work at a Chinese company.', []),
        s('r8-2', '经理说我的中文提高得很快。', 'jīnglǐ shuō wǒ de Zhōngwén tígāo de hěn kuài.', 'My manager says my Chinese is improving quickly.', [], { note: '快 (kuài) = fast' }),
        s('r8-3', '下个月有一个考试。', 'xià ge yuè yǒu yí ge kǎoshì.', 'There’s an exam next month.', [], { note: '下个月 = next month' }),
        s('r8-4', '所以我每天都练习。', 'suǒyǐ wǒ měitiān dōu liànxí.', 'So I practise every day.', [], { note: '所以 = so; 都 = all / always' }),
      ],
      questions: [
        { q: 'Where does the writer work?', options: ['At a school', 'At a Chinese company', 'At a hospital'], answer: 1 },
        { q: 'What does the manager say?', options: ['Their Chinese is improving fast', 'Work harder', 'Take a rest'], answer: 0 },
        { q: 'When is the exam?', options: ['Tomorrow', 'Next week', 'Next month'], answer: 2 },
      ],
    },
  },
  {
    id: 'zh-u9',
    title: 'Plans & Opinions',
    level: 'HSK 3',
    canDo: ['Talk about travel plans', 'Give reasons with 因为…所以…', 'Compare things with 比'],
    lessons: [
      {
        id: 'zh-u9-l1',
        title: 'Travel Plans',
        goal: 'Make plans and suggestions',
        items: [
          w('u9-dasuan', '打算', 'dǎsuàn', 'to plan'),
          w('u9-lvyou', '旅游', 'lǚyóu', 'to travel', { meaningAlt: ['tourism'] }),
          w('u9-huzhao', '护照', 'hùzhào', 'passport'),
          w('u9-xinglixiang', '行李箱', 'xínglixiāng', 'suitcase'),
          w('u9-ditu', '地图', 'dìtú', 'map'),
          w('u9-zhunbei', '准备', 'zhǔnbèi', 'to prepare', { meaningAlt: ['to get ready'] }),
          w('u9-yiqi', '一起', 'yìqǐ', 'together'),
          w('u9-ruguo', '如果', 'rúguǒ', 'if'),
        ],
        sentences: [
          s('u9-s-dasuanlvyou', '我打算去旅游。', 'wǒ dǎsuàn qù lǚyóu.', 'I plan to go travelling.', ['我', '打算', '去', '旅游']),
          s('u9-s-zhunbeihaole', '你准备好了吗？', 'nǐ zhǔnbèi hǎo le ma?', 'Are you ready?', ['你', '准备', '好', '了', '吗']),
          s('u9-s-yiqiqu', '我们一起去吧。', 'wǒmen yìqǐ qù ba.', 'Let’s go together.', ['我们', '一起', '去', '吧']),
        ],
      },
      {
        id: 'zh-u9-l2',
        title: 'Opinions & Reasons',
        goal: 'Give opinions and reasons',
        items: [
          w('u9-renwei', '认为', 'rènwéi', 'to think (have an opinion)', { meaningAlt: ['to believe'] }),
          w('u9-tongyi', '同意', 'tóngyì', 'to agree'),
          w('u9-danshi', '但是', 'dànshì', 'but'),
          w('u9-yinwei', '因为', 'yīnwèi', 'because'),
          w('u9-suoyi', '所以', 'suǒyǐ', 'so (therefore)'),
          w('u9-bijiao', '比较', 'bǐjiào', 'relatively', { meaningAlt: ['rather', 'to compare'] }),
          w('u9-youyisi', '有意思', 'yǒu yìsi', 'interesting'),
          w('u9-dangran', '当然', 'dāngrán', 'of course'),
        ],
        sentences: [
          s('u9-s-youyisi', '我认为这个很有意思。', 'wǒ rènwéi zhège hěn yǒu yìsi.', 'I think this is very interesting.', ['我', '认为', '这', '个', '很', '有意思']),
          s('u9-s-yinweisuoyi', '因为下雨，所以我不去。', 'yīnwèi xià yǔ, suǒyǐ wǒ bú qù.', 'Because it’s raining, I’m not going.', ['因为', '下雨', '所以', '我', '不', '去']),
          s('u9-s-dangrankeyi', '当然可以！', 'dāngrán kěyǐ!', 'Of course you can!', ['当然', '可以'], { note: '可以 (kěyǐ) = can, may' }),
        ],
      },
    ],
    reading: {
      id: 'zh-u9-r',
      title: '坐火车还是坐飞机？ · Train or Plane?',
      sentences: [
        s('r9-1', '我和朋友打算去旅游。', 'wǒ hé péngyou dǎsuàn qù lǚyóu.', 'My friend and I are planning a trip.', []),
        s('r9-2', '我认为坐火车比较有意思。', 'wǒ rènwéi zuò huǒchē bǐjiào yǒu yìsi.', 'I think taking the train is more interesting.', [], { note: '火车 (huǒchē) = train' }),
        s('r9-3', '但是朋友不同意，他想坐飞机。', 'dànshì péngyou bù tóngyì, tā xiǎng zuò fēijī.', 'But my friend disagrees; he wants to fly.', []),
        s('r9-4', '因为飞机比火车快，所以我们坐飞机。', 'yīnwèi fēijī bǐ huǒchē kuài, suǒyǐ wǒmen zuò fēijī.', 'Because planes are faster than trains, we’re flying.', []),
      ],
      questions: [
        { q: 'What are they planning?', options: ['A trip', 'An exam', 'A meeting'], answer: 0 },
        { q: 'What does the writer prefer?', options: ['The plane', 'The train', 'The bus'], answer: 1 },
        { q: 'How do they travel in the end?', options: ['By train', 'By bus', 'By plane'], answer: 2 },
      ],
    },
  },
]

export const zhTier23Grammar: Record<string, GrammarPoint[]> = {
  'zh-u6-l1': [
    {
      title: 'Means of transport with 坐',
      pattern: 'Subject + 坐 + Vehicle + 去 + Place',
      explanation: 'How you travel comes before the destination: “sit” the vehicle, then “go” to the place.',
      examples: [ex('我坐飞机去中国。', 'wǒ zuò fēijī qù Zhōngguó.', 'I’m flying to China.'), ex('她坐出租车来。', 'tā zuò chūzūchē lái.', 'She’s coming by taxi.')],
    },
    {
      title: 'Distance with 离',
      pattern: 'A + 离 + B + 远 / 近',
      explanation: '离 measures the distance between two places. 远 means far and 近 (jìn) means near; they usually take 很 in statements.',
      examples: [ex('学校离我家很远。', 'xuéxiào lí wǒ jiā hěn yuǎn.', 'The school is far from my home.'), ex('医院离这儿很近。', 'yīyuàn lí zhèr hěn jìn.', 'The hospital is close to here.')],
    },
  ],
  'zh-u6-l2': [
    {
      title: 'Location words follow the reference point',
      pattern: 'Thing + 在 + Place + 旁边 / 前面 / 后面…',
      explanation: 'Unlike English, the place comes first and the position word second: 学校旁边 = “school’s side” = beside the school.',
      examples: [ex('饭店在商店后面。', 'fàndiàn zài shāngdiàn hòumiàn.', 'The restaurant is behind the shop.'), ex('我在你左边。', 'wǒ zài nǐ zuǒbian.', 'I’m on your left.')],
    },
    {
      title: '了 for completed actions',
      pattern: 'Verb + 了',
      explanation: '了 after a verb shows the action has happened. Chinese has no past tense; 了 marks completion instead.',
      examples: [ex('我到了。', 'wǒ dào le.', 'I’ve arrived.'), ex('他来了。', 'tā lái le.', 'He’s here. (He has come.)')],
    },
  ],
  'zh-u7-l1': [
    {
      title: 'Asking “how is it?” with 怎么样',
      pattern: 'Topic + 怎么样？',
      explanation: 'Put 怎么样 after something to ask how it is or what someone thinks of it.',
      examples: [ex('天气怎么样？', 'tiānqì zěnmeyàng?', 'How’s the weather?'), ex('你觉得怎么样？', 'nǐ juéde zěnmeyàng?', 'What do you think?')],
    },
    {
      title: 'Too / so: 太…了',
      pattern: '太 + Adjective + 了',
      explanation: '太…了 adds strong emotion: “too …” or “so …!” depending on context.',
      examples: [ex('太热了！', 'tài rè le!', 'It’s too hot!'), ex('太好了！', 'tài hǎo le!', 'That’s great!')],
    },
  ],
  'zh-u7-l2': [
    {
      title: '要 + verb',
      pattern: 'Subject + 要 + Verb',
      explanation: '要 before a verb means “need to”, “want to” or “going to”, depending on context.',
      examples: [ex('我要吃药。', 'wǒ yào chī yào.', 'I need to take medicine.'), ex('明天我要去医院。', 'míngtiān wǒ yào qù yīyuàn.', 'Tomorrow I’m going to the hospital.')],
    },
    {
      title: '了 for a new situation',
      pattern: 'Sentence + 了',
      explanation: '了 at the very end of a sentence signals a change: something is now true that wasn’t before.',
      examples: [ex('天冷了。', 'tiān lěng le.', 'It’s gotten cold.'), ex('我累了。', 'wǒ lèi le.', 'I’m tired now.')],
    },
  ],
  'zh-u8-l1': [
    {
      title: 'Where you do something: 在 + place + verb',
      pattern: 'Subject + 在 + Place + Verb',
      explanation: 'The place phrase with 在 comes before the verb, never after it as in English.',
      examples: [ex('我在公司工作。', 'wǒ zài gōngsī gōngzuò.', 'I work at a company.'), ex('她在学校学习。', 'tā zài xuéxiào xuéxí.', 'She studies at school.')],
    },
    {
      title: '已经…了',
      pattern: 'Subject + 已经 + Verb + 了',
      explanation: '已经 (already) almost always pairs with 了 at the end.',
      examples: [ex('他已经来了。', 'tā yǐjīng lái le.', 'He has already come.'), ex('我已经吃了。', 'wǒ yǐjīng chī le.', 'I’ve already eaten.')],
    },
  ],
  'zh-u8-l2': [
    {
      title: 'How well: Verb + 得 + adjective',
      pattern: 'Subject + Verb + 得 + (很) + Adjective',
      explanation: 'To describe how an action is done, put 得 after the verb and then the description.',
      examples: [ex('他说得很好。', 'tā shuō de hěn hǎo.', 'He speaks well.'), ex('你写得很快。', 'nǐ xiě de hěn kuài.', 'You write quickly.')],
    },
    {
      title: 'More and more: 越来越',
      pattern: '越来越 + Adjective',
      explanation: '越来越 shows something is gradually increasing.',
      examples: [ex('天气越来越热。', 'tiānqì yuè lái yuè rè.', 'The weather is getting hotter and hotter.'), ex('我的中文水平越来越高。', 'wǒ de Zhōngwén shuǐpíng yuè lái yuè gāo.', 'My Chinese keeps getting better.')],
    },
  ],
  'zh-u9-l1': [
    {
      title: 'If…, then…: 如果…就…',
      pattern: '如果 + Condition，Subject + 就 + Result',
      explanation: '就 goes after the subject of the second clause, before the verb.',
      examples: [ex('如果下雨，我就不去。', 'rúguǒ xià yǔ, wǒ jiù bú qù.', 'If it rains, I won’t go.'), ex('如果你累，就休息吧。', 'rúguǒ nǐ lèi, jiù xiūxi ba.', 'If you’re tired, rest.')],
    },
    {
      title: 'Suggestions with 吧',
      pattern: 'Sentence + 吧',
      explanation: '吧 at the end softens a sentence into a suggestion: “let’s …” or “…, OK?”',
      examples: [ex('我们走吧。', 'wǒmen zǒu ba.', 'Let’s go.'), ex('我们一起吃吧。', 'wǒmen yìqǐ chī ba.', 'Let’s eat together.')],
    },
  ],
  'zh-u9-l2': [
    {
      title: 'Because…, so…: 因为…所以…',
      pattern: '因为 + Reason，所以 + Result',
      explanation: 'Chinese often marks both halves of a cause-and-effect sentence. Either word can also be used alone.',
      examples: [ex('因为我很累，所以我想休息。', 'yīnwèi wǒ hěn lèi, suǒyǐ wǒ xiǎng xiūxi.', 'Because I’m tired, I want to rest.')],
    },
    {
      title: 'Comparisons with 比',
      pattern: 'A + 比 + B + Adjective',
      explanation: 'Never add 很 in a 比 comparison. To say “much more”, add 多了 after the adjective.',
      examples: [ex('今天比昨天冷。', 'jīntiān bǐ zuótiān lěng.', 'Today is colder than yesterday.'), ex('他比我大。', 'tā bǐ wǒ dà.', 'He is older than me.')],
    },
  ],
}
