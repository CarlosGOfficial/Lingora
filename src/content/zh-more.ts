/** Chinese: a third lesson for units 2–9, continuing each unit's theme. */
import type { GrammarExample, GrammarPoint, Item, Lesson } from './types'

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

export const zhMoreLessons: Record<string, Lesson[]> = {
  'zh-u2': [
    {
      id: 'zh-u2-l3',
      title: 'At the Restaurant',
      goal: 'Order food and say how it tastes',
      items: [
        w('u2-cai', '菜', 'cài', 'dish', { meaningAlt: ['vegetables', 'food'] }),
        w('u2-miantiao', '面条', 'miàntiáo', 'noodles'),
        w('u2-jidan', '鸡蛋', 'jīdàn', 'egg'),
        w('u2-haochi', '好吃', 'hǎochī', 'delicious', { meaningAlt: ['tasty'] }),
        w('u2-e', '饿', 'è', 'hungry'),
        w('u2-wan', '碗', 'wǎn', 'bowl', { note: 'Also a measure word: 一碗米饭 = a bowl of rice.' }),
        w('u2-qing', '请', 'qǐng', 'please', { meaningAlt: ['to invite'] }),
      ],
      sentences: [
        s('u2-s-wohene', '我很饿。', 'wǒ hěn è.', 'I’m very hungry.', ['我', '很', '饿']),
        s('u2-s-miantiaohaochi', '面条很好吃。', 'miàntiáo hěn hǎochī.', 'The noodles are delicious.', ['面条', '很', '好吃']),
        s('u2-s-qinghecha', '请喝茶。', 'qǐng hē chá.', 'Please have some tea.', ['请', '喝', '茶']),
      ],
    },
  ],
  'zh-u3': [
    {
      id: 'zh-u3-l3',
      title: 'Describing People',
      goal: 'Describe the people you know',
      items: [
        w('u3-gao', '高', 'gāo', 'tall', { meaningAlt: ['high'] }),
        w('u3-piaoliang', '漂亮', 'piàoliang', 'pretty', { meaningAlt: ['beautiful'] }),
        w('u3-haokan', '好看', 'hǎokàn', 'good-looking', { meaningAlt: ['nice to look at'] }),
        w('u3-he', '和', 'hé', 'and', { note: 'Joins nouns only — never two sentences.' }),
        w('u3-gege', '哥哥', 'gēge', 'older brother'),
        w('u3-jiejie', '姐姐', 'jiějie', 'older sister'),
        w('u3-renshi', '认识', 'rènshi', 'to know (a person)', { meaningAlt: ['to meet'] }),
      ],
      sentences: [
        s('u3-s-renshita', '我认识他。', 'wǒ rènshi tā.', 'I know him.', ['我', '认识', '他']),
        s('u3-s-jiejiepiaoliang', '我姐姐很漂亮。', 'wǒ jiějie hěn piàoliang.', 'My older sister is very pretty.', ['我', '姐姐', '很', '漂亮']),
        s('u3-s-gegehewo', '哥哥和我是学生。', 'gēge hé wǒ shì xuésheng.', 'My older brother and I are students.', ['哥哥', '和', '我', '是', '学生']),
      ],
    },
  ],
  'zh-u4': [
    {
      id: 'zh-u4-l3',
      title: 'Daily Life',
      goal: 'Talk about your daily habits',
      items: [
        w('u4-qichuang', '起床', 'qǐchuáng', 'to get up'),
        w('u4-shuijiao', '睡觉', 'shuìjiào', 'to sleep', { meaningAlt: ['to go to bed'] }),
        w('u4-kan', '看', 'kàn', 'to look', { meaningAlt: ['to watch', 'to read'] }),
        w('u4-shu', '书', 'shū', 'book'),
        w('u4-dianshi', '电视', 'diànshì', 'TV', { meaningAlt: ['television'] }),
        w('u4-meitian', '每天', 'měitiān', 'every day'),
        w('u4-huijia', '回家', 'huíjiā', 'to go home'),
      ],
      sentences: [
        s('u4-s-qidianqichuang', '我七点起床。', 'wǒ qī diǎn qǐchuáng.', 'I get up at seven.', ['我', '七', '点', '起床']),
        s('u4-s-meitiankanshu', '我每天看书。', 'wǒ měitiān kàn shū.', 'I read every day.', ['我', '每天', '看', '书']),
        s('u4-s-kandianshi', '他下午看电视。', 'tā xiàwǔ kàn diànshì.', 'He watches TV in the afternoon.', ['他', '下午', '看', '电视']),
      ],
    },
  ],
  'zh-u5': [
    {
      id: 'zh-u5-l3',
      title: 'Bargaining',
      goal: 'Talk about prices and haggle',
      items: [
        w('u5-qian', '钱', 'qián', 'money'),
        w('u5-duoshao', '多少', 'duōshao', 'how much', { meaningAlt: ['how many'] }),
        w('u5-gui', '贵', 'guì', 'expensive'),
        w('u5-pianyi', '便宜', 'piányi', 'cheap'),
        w('u5-tai', '太', 'tài', 'too', { meaningAlt: ['too much'] }),
        w('u5-yifu', '衣服', 'yīfu', 'clothes'),
        w('u5-yidianr', '一点儿', 'yìdiǎnr', 'a little', { meaningAlt: ['a bit'] }),
      ],
      sentences: [
        s('u5-s-taiguile', '太贵了！', 'tài guì le!', 'Too expensive!', ['太', '贵', '了'], { note: '太 … 了 = too … (with feeling).' }),
        s('u5-s-yifupianyi', '衣服很便宜。', 'yīfu hěn piányi.', 'The clothes are cheap.', ['衣服', '很', '便宜']),
        s('u5-s-pianyiyidianr', '便宜一点儿吧。', 'piányi yìdiǎnr ba.', 'Make it a bit cheaper.', ['便宜', '一点儿', '吧']),
      ],
    },
  ],
  'zh-u6': [
    {
      id: 'zh-u6-l3',
      title: 'Asking the Way',
      goal: 'Ask for and follow directions',
      items: [
        w('u6-zenme', '怎么', 'zěnme', 'how (to do)'),
        w('u6-zou', '走', 'zǒu', 'to walk', { meaningAlt: ['to go', 'to leave'] }),
        w('u6-yizhi', '一直', 'yìzhí', 'straight ahead', { meaningAlt: ['all the way'] }),
        w('u6-guai', '拐', 'guǎi', 'to turn'),
        w('u6-jin', '近', 'jìn', 'near', { meaningAlt: ['close'] }),
        w('u6-mi', '米', 'mǐ', 'metre', { meaningAlt: ['meter'] }),
        w('u6-guo', '过', 'guò', 'to cross', { meaningAlt: ['to pass'] }),
        w('u6-lukou', '路口', 'lùkǒu', 'intersection', { meaningAlt: ['crossroads'] }),
      ],
      sentences: [
        s('u6-s-zenmezou', '去机场怎么走？', 'qù jīchǎng zěnme zǒu?', 'How do I get to the airport?', ['去', '机场', '怎么', '走']),
        s('u6-s-yizhiwangqian', '一直往前走。', 'yìzhí wǎng qián zǒu.', 'Go straight ahead.', ['一直', '往', '前', '走']),
        s('u6-s-wangyouguai', '到路口往右拐。', 'dào lùkǒu wǎng yòu guǎi.', 'Turn right at the intersection.', ['到', '路口', '往', '右', '拐']),
      ],
    },
  ],
  'zh-u7': [
    {
      id: 'zh-u7-l3',
      title: 'The Four Seasons',
      goal: 'Talk about seasons and how you feel',
      items: [
        w('u7-chuntian', '春天', 'chūntiān', 'spring'),
        w('u7-xiatian', '夏天', 'xiàtiān', 'summer'),
        w('u7-qiutian', '秋天', 'qiūtiān', 'autumn', { meaningAlt: ['fall'] }),
        w('u7-dongtian', '冬天', 'dōngtiān', 'winter'),
        w('u7-jijie', '季节', 'jìjié', 'season'),
        w('u7-zui', '最', 'zuì', 'most', { meaningAlt: ['the most'] }),
        w('u7-shufu', '舒服', 'shūfu', 'comfortable', { meaningAlt: ['well'] }),
      ],
      sentences: [
        s('u7-s-zuixihuanqiutian', '我最喜欢秋天。', 'wǒ zuì xǐhuan qiūtiān.', 'I like autumn best.', ['我', '最', '喜欢', '秋天']),
        s('u7-s-dongtianleng', '冬天很冷。', 'dōngtiān hěn lěng.', 'Winter is cold.', ['冬天', '很', '冷']),
        s('u7-s-bushufu', '我不舒服。', 'wǒ bù shūfu.', 'I don’t feel well.', ['我', '不', '舒服']),
      ],
    },
  ],
  'zh-u8': [
    {
      id: 'zh-u8-l3',
      title: 'Calls & Emails',
      goal: 'Communicate at the office',
      items: [
        w('u8-dianhua', '电话', 'diànhuà', 'phone call', { meaningAlt: ['telephone'] }),
        w('u8-da', '打', 'dǎ', 'to make (a call)', { meaningAlt: ['to hit', 'to play'] }),
        w('u8-fa', '发', 'fā', 'to send'),
        w('u8-youjian', '邮件', 'yóujiàn', 'email', { meaningAlt: ['mail'] }),
        w('u8-tongshi', '同事', 'tóngshì', 'colleague', { meaningAlt: ['coworker'] }),
        w('u8-bangongshi', '办公室', 'bàngōngshì', 'office'),
        w('u8-anpai', '安排', 'ānpái', 'to arrange', { meaningAlt: ['to schedule'] }),
        w('u8-jieshu', '结束', 'jiéshù', 'to end', { meaningAlt: ['to finish'] }),
      ],
      sentences: [
        s('u8-s-dadianhua', '我给经理打电话。', 'wǒ gěi jīnglǐ dǎ diànhuà.', 'I’m calling the manager.', ['我', '给', '经理', '打', '电话'], { note: '给 (gěi) = to / for (someone)' }),
        s('u8-s-fayoujian', '请发邮件给我。', 'qǐng fā yóujiàn gěi wǒ.', 'Please send me an email.', ['请', '发', '邮件', '给', '我']),
        s('u8-s-jidianjieshu', '会议几点结束？', 'huìyì jǐ diǎn jiéshù?', 'What time does the meeting end?', ['会议', '几', '点', '结束']),
      ],
    },
  ],
  'zh-u9': [
    {
      id: 'zh-u9-l3',
      title: 'Choosing & Comparing',
      goal: 'Choose between options and compare',
      items: [
        w('u9-haishi', '还是', 'háishi', 'or (in questions)'),
        w('u9-huozhe', '或者', 'huòzhě', 'or (in statements)'),
        w('u9-geng', '更', 'gèng', 'even more'),
        w('u9-yiyang', '一样', 'yíyàng', 'the same'),
        w('u9-xuanze', '选择', 'xuǎnzé', 'to choose', { meaningAlt: ['choice'] }),
        w('u9-xiguan', '习惯', 'xíguàn', 'habit', { meaningAlt: ['to be used to'] }),
        w('u9-tebie', '特别', 'tèbié', 'especially', { meaningAlt: ['special'] }),
        w('u9-manyi', '满意', 'mǎnyì', 'satisfied'),
      ],
      sentences: [
        s('u9-s-chahaishishui', '你想喝茶还是喝水？', 'nǐ xiǎng hē chá háishi hē shuǐ?', 'Would you like tea or water?', ['你', '想', '喝', '茶', '还是', '喝', '水']),
        s('u9-s-yiyangda', '我们一样大。', 'wǒmen yíyàng dà.', 'We’re the same age.', ['我们', '一样', '大']),
        s('u9-s-henmanyi', '我很满意。', 'wǒ hěn mǎnyì.', 'I’m very satisfied.', ['我', '很', '满意']),
      ],
    },
  ],
}

export const zhMoreGrammar: Record<string, GrammarPoint[]> = {
  'zh-u2-l3': [
    {
      title: 'Bowls and other containers',
      pattern: 'Number + 碗 + Food',
      explanation: 'Containers work as measure words. Before a measure word, “two” is 两 (liǎng), not 二.',
      examples: [ex('一碗米饭', 'yì wǎn mǐfàn', 'a bowl of rice'), ex('两碗面条', 'liǎng wǎn miàntiáo', 'two bowls of noodles')],
    },
    {
      title: 'Polite offers with 请',
      pattern: '请 + Verb',
      explanation: 'Put 请 before a verb to politely invite someone to do something.',
      examples: [ex('请进。', 'qǐng jìn.', 'Come in, please.'), ex('请喝水。', 'qǐng hē shuǐ.', 'Please have some water.')],
    },
  ],
  'zh-u3-l3': [
    {
      title: '和 joins nouns',
      pattern: 'Noun + 和 + Noun',
      explanation: '和 means “and” only between nouns or pronouns. To join two sentences, Chinese just puts them side by side.',
      examples: [ex('爸爸和妈妈', 'bàba hé māma', 'Dad and Mom'), ex('茶和水', 'chá hé shuǐ', 'tea and water')],
    },
    {
      title: 'Older and younger siblings',
      explanation: 'Chinese always says whether a sibling is older or younger, and the words repeat a syllable.',
      examples: [ex('弟弟', 'dìdi', 'younger brother'), ex('妹妹', 'mèimei', 'younger sister')],
    },
  ],
  'zh-u4-l3': [
    {
      title: '看: look, watch and read',
      explanation: '看 covers many kinds of looking. The object tells you which one.',
      examples: [ex('看书', 'kàn shū', 'to read (a book)'), ex('看电视', 'kàn diànshì', 'to watch TV'), ex('看朋友', 'kàn péngyou', 'to visit a friend')],
    },
    {
      title: 'Habits with 每天',
      pattern: 'Subject + 每天 + (Time) + Verb',
      explanation: '每天 (every day) goes before the verb, together with any clock time.',
      examples: [ex('我每天七点起床。', 'wǒ měitiān qī diǎn qǐchuáng.', 'I get up at seven every day.')],
    },
  ],
  'zh-u5-l3': [
    {
      title: 'A bit more: Adjective + 一点儿',
      pattern: 'Adjective + 一点儿',
      explanation: 'Put 一点儿 after an adjective to ask for a bit more of that quality, which is perfect for bargaining.',
      examples: [ex('便宜一点儿', 'piányi yìdiǎnr', 'a bit cheaper'), ex('大一点儿', 'dà yìdiǎnr', 'a bit bigger')],
    },
    {
      title: '多少 or 几?',
      explanation: '几 expects a small number and needs a measure word. 多少 works for any amount and can stand alone.',
      examples: [ex('多少钱？', 'duōshao qián?', 'How much money?'), ex('你有几个朋友？', 'nǐ yǒu jǐ ge péngyou?', 'How many friends do you have?')],
    },
  ],
  'zh-u6-l3': [
    {
      title: 'How to do it: 怎么 + verb',
      pattern: '怎么 + Verb',
      explanation: '怎么 before a verb asks how to do something. 怎么走 literally means “how to walk there”.',
      examples: [ex('你怎么去学校？', 'nǐ zěnme qù xuéxiào?', 'How do you get to school?'), ex('这个怎么吃？', 'zhège zěnme chī?', 'How do you eat this?')],
    },
    {
      title: 'Directions with 往',
      pattern: '往 + Direction + Verb',
      explanation: '往 points the way. Distances use 米 (metres).',
      examples: [ex('往左拐', 'wǎng zuǒ guǎi', 'turn left'), ex('走一百米', 'zǒu yìbǎi mǐ', 'walk 100 metres')],
    },
  ],
  'zh-u7-l3': [
    {
      title: 'The most: 最',
      pattern: '最 + Adjective / Verb',
      explanation: '最 before an adjective or a feeling verb makes it “the most”.',
      examples: [ex('最好', 'zuì hǎo', 'the best'), ex('我最喜欢夏天。', 'wǒ zuì xǐhuan xiàtiān.', 'I like summer best.')],
    },
    {
      title: 'Seasons end in 天',
      explanation: 'Each season is a character plus 天 (day / sky): 春天, 夏天, 秋天, 冬天.',
      examples: [ex('夏天很热。', 'xiàtiān hěn rè.', 'Summer is hot.')],
    },
  ],
  'zh-u8-l3': [
    {
      title: 'For someone: 给 + person + verb',
      pattern: 'Subject + 给 + Person + Verb',
      explanation: '给 before a person shows who the action is for or directed at.',
      examples: [ex('我给你打电话。', 'wǒ gěi nǐ dǎ diànhuà.', 'I’ll call you.'), ex('她给我发邮件。', 'tā gěi wǒ fā yóujiàn.', 'She sends me emails.')],
    },
    {
      title: 'Verb-object words split',
      explanation: 'Words like 打电话 are a verb plus its object, so 了 and measure words go in the middle.',
      examples: [ex('我打了一个电话。', 'wǒ dǎ le yí ge diànhuà.', 'I made a phone call.')],
    },
  ],
  'zh-u9-l3': [
    {
      title: '还是 or 或者?',
      explanation: 'Use 还是 for “or” in questions and 或者 for “or” in statements.',
      examples: [ex('你去还是我去？', 'nǐ qù háishi wǒ qù?', 'Are you going or am I?'), ex('今天或者明天都可以。', 'jīntiān huòzhě míngtiān dōu kěyǐ.', 'Today or tomorrow both work.')],
    },
    {
      title: 'The same: A 跟 B 一样',
      pattern: 'A + 跟 + B + 一样 + (Adjective)',
      explanation: '一样 says two things are the same. Add 更 to a 比 sentence to mean “even more”.',
      examples: [ex('他跟我一样高。', 'tā gēn wǒ yíyàng gāo.', 'He’s as tall as me.'), ex('今天比昨天更冷。', 'jīntiān bǐ zuótiān gèng lěng.', 'Today is even colder than yesterday.')],
    },
  ],
}
