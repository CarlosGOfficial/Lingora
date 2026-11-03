/**
 * Chinese: one more unit for each of the HSK 2 and HSK 3 sections, so the later
 * sections grow toward the size of HSK 1.
 */
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

export const zhSectionUnits: Unit[] = [
  /* ---------------- HSK 2 ---------------- */
  {
    id: 'zh-u15',
    title: 'Comparisons & Experiences',
    level: 'HSK 2',
    canDo: ['Compare two things with 比', 'Say what you have and haven’t done with 过', 'Describe what people look like'],
    lessons: [
      {
        id: 'zh-u15-l1',
        title: 'Bigger, Newer, Cheaper',
        goal: 'Compare two things',
        items: [
          w('u15-bi', '比', 'bǐ', 'compared with', { meaningAlt: ['than'] }),
          w('u15-chang', '长', 'cháng', 'long'),
          w('u15-duan', '短', 'duǎn', 'short (length)', { meaningAlt: ['short'] }),
          w('u15-xin', '新', 'xīn', 'new'),
          w('u15-jiu', '旧', 'jiù', 'old (not new)', { meaningAlt: ['used', 'worn'] }),
          w('u15-zhong', '重', 'zhòng', 'heavy'),
          w('u15-qing', '轻', 'qīng', 'light (in weight)', { meaningAlt: ['light'] }),
          w('u15-chabuduo', '差不多', 'chàbuduō', 'about the same', { meaningAlt: ['almost', 'roughly'] }),
        ],
        sentences: [
          s('u15-s-zhegebinagegui', '这个比那个贵。', 'zhège bǐ nàge guì.', 'This one is more expensive than that one.', ['这个', '比', '那个', '贵']),
          s('u15-s-shubinixin', '我的书比你的新。', 'wǒ de shū bǐ nǐ de xīn.', 'My book is newer than yours.', ['我', '的', '书', '比', '你', '的', '新']),
          s('u15-s-chabuduo', '这两个差不多。', 'zhè liǎng ge chàbuduō.', 'These two are about the same.', ['这', '两', '个', '差不多']),
        ],
      },
      {
        id: 'zh-u15-l2',
        title: 'Have You Ever…?',
        goal: 'Talk about experiences',
        items: [
          w('u15-zhidao', '知道', 'zhīdào', 'to know (a fact)', { meaningAlt: ['to know'] }),
          w('u15-tingshuo', '听说', 'tīngshuō', 'to hear (that)', { meaningAlt: ['I heard', 'they say'] }),
          w('u15-chang-taste', '尝', 'cháng', 'to taste'),
          w('u15-shi', '试', 'shì', 'to try'),
          w('u15-waiguo', '外国', 'wàiguó', 'foreign country', { meaningAlt: ['abroad', 'foreign'] }),
          w('u15-qunian', '去年', 'qùnián', 'last year'),
          w('u15-mingnian', '明年', 'míngnián', 'next year'),
          w('u15-conglai', '从来', 'cónglái', 'never before (with 没)', { meaningAlt: ['ever', 'always'], note: 'Used as 从来没 + verb + 过: have never ever done it.' }),
        ],
        sentences: [
          s('u15-s-quguozhongguo', '你去过中国吗？', 'nǐ qù guo Zhōngguó ma?', 'Have you ever been to China?', ['你', '去', '过', '中国', '吗']),
          s('u15-s-meichiguokaoya', '我没吃过北京烤鸭。', 'wǒ méi chī guo Běijīng kǎoyā.', 'I’ve never had Peking duck.', ['我', '没', '吃', '过', '北京', '烤鸭'], {
            note: '烤鸭 (kǎoyā) = roast duck',
          }),
          s('u15-s-tingshuohaochi', '我听说这个菜很好吃。', 'wǒ tīngshuō zhège cài hěn hǎochī.', 'I hear this dish is delicious.', ['我', '听说', '这个', '菜', '很', '好吃']),
        ],
      },
      {
        id: 'zh-u15-l3',
        title: 'What Do They Look Like?',
        goal: 'Describe people',
        items: [
          w('u15-yanjing', '眼睛', 'yǎnjing', 'eye', { meaningAlt: ['eyes'] }),
          w('u15-toufa', '头发', 'tóufa', 'hair'),
          w('u15-shuai', '帅', 'shuài', 'handsome'),
          w('u15-keai', '可爱', 'kě’ài', 'cute', { alt: ['keai'] }),
          w('u15-congming', '聪明', 'cōngming', 'clever', { meaningAlt: ['smart', 'intelligent'] }),
          w('u15-xiao', '笑', 'xiào', 'to laugh', { meaningAlt: ['to smile'] }),
          w('u15-ku', '哭', 'kū', 'to cry'),
          w('u15-nianqing', '年轻', 'niánqīng', 'young'),
        ],
        sentences: [
          s('u15-s-toufachang', '她的头发很长。', 'tā de tóufa hěn cháng.', 'Her hair is long.', ['她', '的', '头发', '很', '长']),
          s('u15-s-yougaoyoushuai', '他又高又帅。', 'tā yòu gāo yòu shuài.', 'He’s tall and handsome.', ['他', '又', '高', '又', '帅'], { note: '又…又… = both … and …' }),
          s('u15-s-maozhenkeai', '你的猫真可爱！', 'nǐ de māo zhēn kě’ài!', 'Your cat is so cute!', ['你', '的', '猫', '真', '可爱']),
        ],
      },
    ],
    reading: {
      id: 'zh-u15-r',
      title: '我的好朋友 · My Best Friend',
      sentences: [
        s('r15-1', '我的好朋友叫小明，他比我高。', 'wǒ de hǎo péngyou jiào Xiǎo Míng, tā bǐ wǒ gāo.', 'My best friend is called Xiao Ming — he’s taller than me.', []),
        s('r15-2', '他很聪明，也很喜欢笑。', 'tā hěn cōngming, yě hěn xǐhuan xiào.', 'He’s clever, and he loves to laugh.', [], { note: '也 = also' }),
        s('r15-3', '去年我们一起去过北京。', 'qùnián wǒmen yìqǐ qù guo Běijīng.', 'Last year we went to Beijing together.', []),
        s('r15-4', '明年我们想去外国旅游。', 'míngnián wǒmen xiǎng qù wàiguó lǚyóu.', 'Next year we want to travel abroad.', []),
      ],
      questions: [
        { q: 'Who is taller?', options: ['Xiao Ming', 'The writer', 'They’re the same height'], answer: 0 },
        { q: 'Where did they go last year?', options: ['Shanghai', 'Beijing', 'Abroad'], answer: 1 },
        { q: 'What do they want to do next year?', options: ['Study together', 'Move house', 'Travel abroad'], answer: 2 },
      ],
    },
  },

  /* ---------------- HSK 3 ---------------- */
  {
    id: 'zh-u16',
    title: 'Money, Repairs & Phones',
    level: 'HSK 3',
    canDo: ['Change, borrow and spend money', 'Explain that something is broken and get it fixed', 'Talk about phones, photos and passwords'],
    lessons: [
      {
        id: 'zh-u16-l1',
        title: 'At the Bank',
        goal: 'Handle money',
        items: [
          w('u16-yinhang', '银行', 'yínháng', 'bank'),
          w('u16-huan', '换', 'huàn', 'to exchange', { meaningAlt: ['to change'] }),
          w('u16-xinyongka', '信用卡', 'xìnyòngkǎ', 'credit card'),
          w('u16-hua', '花', 'huā', 'to spend', { meaningAlt: ['flower'] }),
          w('u16-jie', '借', 'jiè', 'to borrow', { meaningAlt: ['to lend'] }),
          w('u16-huan-return', '还', 'huán', 'to give back', { meaningAlt: ['to return (a thing)'], note: 'Read huán here; the same character is hái (“still”).' }),
          w('u16-cun', '存', 'cún', 'to deposit', { meaningAlt: ['to save'] }),
          w('u16-shouji', '手机', 'shǒujī', 'mobile phone', { meaningAlt: ['cell phone', 'phone'] }),
        ],
        sentences: [
          s('u16-s-xianghuanqian', '我想换一些钱。', 'wǒ xiǎng huàn yìxiē qián.', 'I’d like to change some money.', ['我', '想', '换', '一些', '钱']),
          s('u16-s-keyixinyongka', '可以用信用卡吗？', 'kěyǐ yòng xìnyòngkǎ ma?', 'Can I pay by credit card?', ['可以', '用', '信用卡', '吗'], { note: '可以 = may; 用 = to use' }),
          s('u16-s-jieleyibai', '我借了他一百块。', 'wǒ jiè le tā yìbǎi kuài.', 'I borrowed a hundred yuan from him.', ['我', '借', '了', '他', '一百', '块']),
        ],
      },
      {
        id: 'zh-u16-l2',
        title: 'Something’s Broken',
        goal: 'Explain a problem and get it fixed',
        items: [
          w('u16-huai', '坏', 'huài', 'broken', { meaningAlt: ['bad'] }),
          w('u16-xiu', '修', 'xiū', 'to repair', { meaningAlt: ['to fix'] }),
          w('u16-wenti', '问题', 'wèntí', 'problem', { meaningAlt: ['question'] }),
          w('u16-jiejue', '解决', 'jiějué', 'to solve'),
          w('u16-bangmang', '帮忙', 'bāngmáng', 'to help out', { meaningAlt: ['to help', 'to do a favour'] }),
          w('u16-jiancha', '检查', 'jiǎnchá', 'to check', { meaningAlt: ['to inspect', 'to examine'] }),
          w('u16-qingchu', '清楚', 'qīngchu', 'clear', { meaningAlt: ['clearly'] }),
          w('u16-faxian', '发现', 'fāxiàn', 'to discover', { meaningAlt: ['to find out', 'to notice'] }),
        ],
        sentences: [
          s('u16-s-diannaohuaile', '我的电脑坏了。', 'wǒ de diànnǎo huài le.', 'My computer is broken.', ['我', '的', '电脑', '坏', '了']),
          s('u16-s-bangmangxiu', '你能帮忙修一下吗？', 'nǐ néng bāngmáng xiū yíxià ma?', 'Could you help fix it?', ['你', '能', '帮忙', '修', '一下', '吗'], {
            note: '一下 = a bit (softens a request)',
          }),
          s('u16-s-wentijiejuele', '问题已经解决了。', 'wèntí yǐjīng jiějué le.', 'The problem has been solved.', ['问题', '已经', '解决', '了']),
        ],
      },
      {
        id: 'zh-u16-l3',
        title: 'Phones & the Internet',
        goal: 'Talk about apps, photos and messages',
        items: [
          w('u16-wangzhan', '网站', 'wǎngzhàn', 'website'),
          w('u16-mima', '密码', 'mìmǎ', 'password'),
          w('u16-xiazai', '下载', 'xiàzài', 'to download'),
          w('u16-zhaopian', '照片', 'zhàopiàn', 'photo', { meaningAlt: ['picture', 'photograph'] }),
          w('u16-duanxin', '短信', 'duǎnxìn', 'text message', { meaningAlt: ['text', 'SMS'] }),
          w('u16-shengyin', '声音', 'shēngyīn', 'sound', { meaningAlt: ['voice', 'noise'] }),
          w('u16-guan', '关', 'guān', 'to turn off', { meaningAlt: ['to close', 'to shut'] }),
          w('u16-dakai', '打开', 'dǎkāi', 'to open', { meaningAlt: ['to turn on'] }),
        ],
        sentences: [
          s('u16-s-bashoujiguanle', '请把手机关了。', 'qǐng bǎ shǒujī guān le.', 'Please turn your phone off.', ['请', '把', '手机', '关', '了'], { note: '把 moves the object before the verb.' }),
          s('u16-s-wangjimima', '我忘记密码了。', 'wǒ wàngjì mìmǎ le.', 'I’ve forgotten my password.', ['我', '忘记', '密码', '了']),
          s('u16-s-fazhaopian', '他给我发了一张照片。', 'tā gěi wǒ fā le yì zhāng zhàopiàn.', 'He sent me a photo.', ['他', '给', '我', '发', '了', '一', '张', '照片'], {
            note: '给 = to / for; 张 = measure word for flat things',
          }),
        ],
      },
    ],
    reading: {
      id: 'zh-u16-r',
      title: '手机坏了 · A Broken Phone',
      sentences: [
        s('r16-1', '昨天我的手机突然坏了。', 'zuótiān wǒ de shǒujī tūrán huài le.', 'Yesterday my phone suddenly broke.', [], { note: '突然 = suddenly' }),
        s('r16-2', '我去商店，请他们帮忙检查。', 'wǒ qù shāngdiàn, qǐng tāmen bāngmáng jiǎnchá.', 'I went to the shop and asked them to check it.', []),
        s('r16-3', '他们发现问题不大，半个小时就修好了。', 'tāmen fāxiàn wèntí bú dà, bàn ge xiǎoshí jiù xiū hǎo le.', 'They found it wasn’t a big problem and fixed it in half an hour.', []),
        s('r16-4', '我只花了五十块。', 'wǒ zhǐ huā le wǔshí kuài.', 'It only cost me fifty yuan.', [], { note: '只 = only' }),
      ],
      questions: [
        { q: 'What happened to the phone?', options: ['It got lost', 'It broke', 'It was stolen'], answer: 1 },
        { q: 'How long did the repair take?', options: ['Half an hour', 'A whole day', 'Two hours'], answer: 0 },
        { q: 'How much did it cost?', options: ['500 yuan', '15 yuan', '50 yuan'], answer: 2 },
      ],
    },
  },
]

export const zhSectionUnitsGrammar: Record<string, GrammarPoint[]> = {
  'zh-u15-l1': [
    {
      title: 'Comparing with 比',
      pattern: 'A + 比 + B + Adjective',
      explanation: 'Put 比 between the two things and the adjective last. Don’t add 很 — 比 already does the comparing.',
      examples: [ex('这个比那个贵。', 'zhège bǐ nàge guì.', 'This one is pricier than that one.'), ex('今天比昨天冷。', 'jīntiān bǐ zuótiān lěng.', 'Today is colder than yesterday.')],
    },
    {
      title: 'The same: 一样 / 差不多',
      pattern: 'A + 跟 + B + 一样 (+ Adjective)',
      explanation: '一样 means exactly the same; 差不多 means about the same.',
      examples: [ex('我跟你一样高。', 'wǒ gēn nǐ yíyàng gāo.', 'I’m as tall as you.'), ex('价钱差不多。', 'jiàqián chàbuduō.', 'The prices are about the same.')],
    },
  ],
  'zh-u15-l2': [
    {
      title: 'Experiences with 过',
      pattern: 'Verb + 过',
      explanation: '过 after a verb says you have done it at some point in your life. The negative is 没 + Verb + 过.',
      examples: [ex('我去过北京。', 'wǒ qù guo Běijīng.', 'I’ve been to Beijing.'), ex('我没去过美国。', 'wǒ méi qù guo Měiguó.', 'I’ve never been to the USA.')],
    },
    {
      title: 'Never ever: 从来没…过',
      pattern: '从来没 + Verb + 过',
      explanation: '从来 makes the negative stronger: not once, ever.',
      examples: [ex('我从来没吃过鱼。', 'wǒ cónglái méi chī guo yú.', 'I’ve never ever eaten fish.')],
    },
  ],
  'zh-u15-l3': [
    {
      title: 'Both … and …: 又…又…',
      pattern: '又 + Adjective + 又 + Adjective',
      explanation: 'Join two qualities someone or something has at the same time.',
      examples: [ex('她又聪明又漂亮。', 'tā yòu cōngming yòu piàoliang.', 'She’s clever and pretty.')],
    },
    {
      title: 'Describing features',
      pattern: 'Person + 的 + Feature + 很 + Adjective',
      explanation: 'Describe a feature as something the person has: “her hair is long”.',
      examples: [ex('他的眼睛很大。', 'tā de yǎnjing hěn dà.', 'He has big eyes.')],
    },
  ],
  'zh-u16-l1': [
    {
      title: 'Borrow and give back: 借 / 还',
      explanation: '借 is to borrow (or lend, with 给). 还 read huán is to give back — the same character as 还 hái, “still”.',
      examples: [ex('我借了一本书。', 'wǒ jiè le yì běn shū.', 'I borrowed a book.'), ex('明天还你。', 'míngtiān huán nǐ.', 'I’ll give it back to you tomorrow.')],
    },
    {
      title: 'Using something: 用',
      pattern: '用 + Thing + Verb',
      explanation: '用 means “to use”, and before another verb it works like “with” or “by”.',
      examples: [ex('我用信用卡买。', 'wǒ yòng xìnyòngkǎ mǎi.', 'I’ll pay by credit card.')],
    },
  ],
  'zh-u16-l2': [
    {
      title: 'Result complements: 修好, 看清楚',
      pattern: 'Verb + Result',
      explanation: 'Add a result after a verb to say the action worked: 修好 (fix successfully), 看清楚 (see clearly).',
      examples: [ex('电脑修好了。', 'diànnǎo xiū hǎo le.', 'The computer is fixed.'), ex('我没看清楚。', 'wǒ méi kàn qīngchu.', 'I didn’t see clearly.')],
    },
    {
      title: 'Softening a request: 一下',
      pattern: 'Verb + 一下',
      explanation: '一下 after a verb means “a bit” and makes requests sound friendlier.',
      examples: [ex('请等一下。', 'qǐng děng yíxià.', 'Please wait a moment.')],
    },
  ],
  'zh-u16-l3': [
    {
      title: 'The 把 sentence',
      pattern: 'Subject + 把 + Object + Verb + Result',
      explanation: 'When you do something to a specific thing, 把 brings that thing before the verb.',
      examples: [ex('请把门关上。', 'qǐng bǎ mén guān shang.', 'Please shut the door.'), ex('我把照片发给你。', 'wǒ bǎ zhàopiàn fā gěi nǐ.', 'I’ll send you the photo.')],
    },
    {
      title: 'Measure word for flat things: 张',
      pattern: 'Number + 张 + Noun',
      explanation: 'Photos, tickets, tables and paper all use 张.',
      examples: [ex('一张照片', 'yì zhāng zhàopiàn', 'a photo'), ex('两张票', 'liǎng zhāng piào', 'two tickets')],
    },
  ],
}
