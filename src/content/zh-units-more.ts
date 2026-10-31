/**
 * Chinese: more units inside the existing tiers. Three HSK 1 units complete the
 * classic 150-word HSK 1 list; one more unit each for HSK 2 and HSK 3.
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

export const zhMoreUnits: Unit[] = [
  /* ---------------- HSK 1 ---------------- */
  {
    id: 'zh-u10',
    title: 'Home & Everyday Things',
    level: 'HSK 1',
    canDo: ['Say where things are in a room', 'Ask who and how many', 'Talk about reading, writing and speaking Chinese'],
    lessons: [
      {
        id: 'zh-u10-l1',
        title: 'Around the House',
        goal: 'Say where things are',
        items: [
          w('u10-zhuozi', '桌子', 'zhuōzi', 'table', { meaningAlt: ['desk'] }),
          w('u10-yizi', '椅子', 'yǐzi', 'chair'),
          w('u10-diannao', '电脑', 'diànnǎo', 'computer'),
          w('u10-li', '里', 'lǐ', 'inside', { meaningAlt: ['in'] }),
          w('u10-shang', '上', 'shàng', 'on (top of)', { meaningAlt: ['above', 'up'] }),
          w('u10-xia', '下', 'xià', 'under', { meaningAlt: ['below', 'down'] }),
          w('u10-zhu', '住', 'zhù', 'to live', { meaningAlt: ['to stay'] }),
          w('u10-beijing', '北京', 'Běijīng', 'Beijing'),
        ],
        sentences: [
          s('u10-s-shuzaizhuozishang', '书在桌子上。', 'shū zài zhuōzi shang.', 'The book is on the table.', ['书', '在', '桌子', '上']),
          s('u10-s-diannaozaijiali', '电脑在家里。', 'diànnǎo zài jiā li.', 'The computer is at home.', ['电脑', '在', '家', '里']),
          s('u10-s-zhuzainar', '你住在哪儿？', 'nǐ zhù zài nǎr?', 'Where do you live?', ['你', '住', '在', '哪儿']),
        ],
      },
      {
        id: 'zh-u10-l2',
        title: 'Who & How Many',
        goal: 'Ask who, and talk about groups',
        items: [
          w('u10-shei', '谁', 'shéi', 'who', { alt: ['shui'] }),
          w('u10-dou', '都', 'dōu', 'all', { meaningAlt: ['both'] }),
          w('u10-xie', '些', 'xiē', 'some', { note: 'Usually 一些 (yìxiē) or 这些 / 那些.' }),
          w('u10-shao', '少', 'shǎo', 'few', { meaningAlt: ['little', 'less'] }),
          w('u10-mao', '猫', 'māo', 'cat'),
          w('u10-gou', '狗', 'gǒu', 'dog'),
          w('u10-ne', '呢', 'ne', 'and you? (particle)', { note: 'Bounces a question back: 你呢？ = and you?' }),
          w('u10-ma', '吗', 'ma', 'yes/no question particle'),
        ],
        sentences: [
          s('u10-s-sheidegou', '这是谁的狗？', 'zhè shì shéi de gǒu?', 'Whose dog is this?', ['这', '是', '谁', '的', '狗']),
          s('u10-s-douxihuanmao', '我们都喜欢猫。', 'wǒmen dōu xǐhuan māo.', 'We all like cats.', ['我们', '都', '喜欢', '猫']),
          s('u10-s-nine', '我很好，你呢？', 'wǒ hěn hǎo, nǐ ne?', 'I’m fine, and you?', ['我', '很', '好', '你', '呢']),
        ],
      },
      {
        id: 'zh-u10-l3',
        title: 'Reading & Writing',
        goal: 'Talk about using Chinese',
        items: [
          w('u10-du', '读', 'dú', 'to read aloud', { meaningAlt: ['to study'] }),
          w('u10-xie-write', '写', 'xiě', 'to write'),
          w('u10-zi', '字', 'zì', 'character', { meaningAlt: ['word', 'written character'] }),
          w('u10-hanyu', '汉语', 'Hànyǔ', 'Chinese (language)', { meaningAlt: ['Mandarin'] }),
          w('u10-ben', '本', 'běn', '(measure word for books)'),
          w('u10-ting', '听', 'tīng', 'to listen'),
          w('u10-shuo', '说', 'shuō', 'to speak', { meaningAlt: ['to say'] }),
          w('u10-kanjian', '看见', 'kànjiàn', 'to see', { meaningAlt: ['to catch sight of'] }),
        ],
        sentences: [
          s('u10-s-zaixiezi', '他在写字。', 'tā zài xiě zì.', 'He’s writing characters.', ['他', '在', '写', '字'], { note: '在 before a verb = in the middle of doing it.' }),
          s('u10-s-qingshuohanyu', '请说汉语。', 'qǐng shuō Hànyǔ.', 'Please speak Chinese.', ['请', '说', '汉语']),
          s('u10-s-sanbenshu', '我有三本书。', 'wǒ yǒu sān běn shū.', 'I have three books.', ['我', '有', '三', '本', '书']),
        ],
      },
    ],
    reading: {
      id: 'zh-u10-r',
      title: '我的房间 · My Room',
      sentences: [
        s('r10-1', '我住在北京。', 'wǒ zhù zài Běijīng.', 'I live in Beijing.', []),
        s('r10-2', '我家里有一个大桌子。', 'wǒ jiā li yǒu yí ge dà zhuōzi.', 'At home I have a big table.', []),
        s('r10-3', '桌子上有三本书和一个电脑。', 'zhuōzi shang yǒu sān běn shū hé yí ge diànnǎo.', 'On the table there are three books and a computer.', []),
        s('r10-4', '我的猫喜欢在椅子下面睡觉。', 'wǒ de māo xǐhuan zài yǐzi xiàmiàn shuìjiào.', 'My cat likes to sleep under the chair.', [], { note: '下面 = underneath' }),
      ],
      questions: [
        { q: 'Where does the writer live?', options: ['Shanghai', 'Beijing', 'Hong Kong'], answer: 1 },
        { q: 'What is on the table?', options: ['Books and a computer', 'A cat', 'Tea and cups'], answer: 0 },
        { q: 'Where does the cat sleep?', options: ['On the table', 'On the bed', 'Under the chair'], answer: 2 },
      ],
    },
  },
  {
    id: 'zh-u11',
    title: 'Abilities & Feelings',
    level: 'HSK 1',
    canDo: ['Say what you can and can’t do', 'Talk about likes and feelings', 'Make a simple phone call'],
    lessons: [
      {
        id: 'zh-u11-l1',
        title: 'What Can You Do?',
        goal: 'Talk about abilities',
        items: [
          w('u11-hui', '会', 'huì', 'can (know how to)'),
          w('u11-neng', '能', 'néng', 'can (be able to)'),
          w('u11-kai', '开', 'kāi', 'to drive', { meaningAlt: ['to open'] }),
          w('u11-che', '车', 'chē', 'car', { meaningAlt: ['vehicle'] }),
          w('u11-zuo-do', '做', 'zuò', 'to do', { meaningAlt: ['to make'] }),
          w('u11-fan', '饭', 'fàn', 'meal', { meaningAlt: ['food', 'cooked rice'] }),
        ],
        sentences: [
          s('u11-s-huishuohanyu', '我会说汉语。', 'wǒ huì shuō Hànyǔ.', 'I can speak Chinese.', ['我', '会', '说', '汉语']),
          s('u11-s-huikaiche', '你会开车吗？', 'nǐ huì kāi chē ma?', 'Can you drive?', ['你', '会', '开', '车', '吗']),
          s('u11-s-mamazuofan', '妈妈在做饭。', 'māma zài zuò fàn.', 'Mom is cooking.', ['妈妈', '在', '做', '饭']),
        ],
      },
      {
        id: 'zh-u11-l2',
        title: 'Likes & Feelings',
        goal: 'Say how you feel about things',
        items: [
          w('u11-gaoxing', '高兴', 'gāoxìng', 'happy', { meaningAlt: ['glad'] }),
          w('u11-ai', '爱', 'ài', 'to love'),
          w('u11-dianying', '电影', 'diànyǐng', 'movie', { meaningAlt: ['film'] }),
          w('u11-hao', '好', 'hǎo', 'good', { meaningAlt: ['well', 'OK'] }),
          w('u11-hen', '很', 'hěn', 'very'),
          w('u11-zhen', '真', 'zhēn', 'really', { meaningAlt: ['truly'] }),
          w('u11-feichang', '非常', 'fēicháng', 'extremely', { meaningAlt: ['very much'] }),
        ],
        sentences: [
          s('u11-s-renshinigaoxing', '认识你很高兴。', 'rènshi nǐ hěn gāoxìng.', 'Nice to meet you.', ['认识', '你', '很', '高兴'], { note: 'Literally “knowing you, (I’m) very happy”.' }),
          s('u11-s-woaiwodejia', '我爱我的家。', 'wǒ ài wǒ de jiā.', 'I love my family.', ['我', '爱', '我', '的', '家']),
          s('u11-s-dianyingzhenhaokan', '这个电影真好看。', 'zhège diànyǐng zhēn hǎokàn.', 'This movie is really good.', ['这', '个', '电影', '真', '好看']),
        ],
      },
      {
        id: 'zh-u11-l3',
        title: 'On the Phone',
        goal: 'Make a simple phone call',
        items: [
          w('u11-wei', '喂', 'wéi', 'hello (on the phone)'),
          w('u11-dadianhua', '打电话', 'dǎ diànhuà', 'to phone (someone)', { meaningAlt: ['to make a call'] }),
          w('u11-hui-return', '回', 'huí', 'to return', { meaningAlt: ['to go back'] }),
          w('u11-shihou', '时候', 'shíhou', 'time (when)', { note: '什么时候 = when?' }),
          w('u11-fenzhong', '分钟', 'fēnzhōng', 'minute'),
          w('u11-deng', '等', 'děng', 'to wait'),
          w('u11-xiansheng', '先生', 'xiānsheng', 'Mr.', { meaningAlt: ['sir', 'husband'] }),
          w('u11-xiaojie', '小姐', 'xiǎojiě', 'Miss', { meaningAlt: ['young lady'] }),
        ],
        sentences: [
          s('u11-s-weinihao', '喂，你好！', 'wéi, nǐ hǎo!', 'Hello? (on the phone)', ['喂', '你', '好']),
          s('u11-s-shenmeshihouhuijia', '你什么时候回家？', 'nǐ shénme shíhou huíjiā?', 'When are you coming home?', ['你', '什么', '时候', '回家']),
          s('u11-s-dengwufenzhong', '请等五分钟。', 'qǐng děng wǔ fēnzhōng.', 'Please wait five minutes.', ['请', '等', '五', '分钟']),
        ],
      },
    ],
    reading: {
      id: 'zh-u11-r',
      title: '打电话 · A Phone Call',
      sentences: [
        s('r11-1', '喂，是王先生吗？我是李小姐。', 'wéi, shì Wáng xiānsheng ma? wǒ shì Lǐ xiǎojiě.', 'Hello, is that Mr. Wang? This is Miss Li.', []),
        s('r11-2', '王先生，你什么时候回北京？', 'Wáng xiānsheng, nǐ shénme shíhou huí Běijīng?', 'Mr. Wang, when are you coming back to Beijing?', []),
        s('r11-3', '我明天下午三点回去。', 'wǒ míngtiān xiàwǔ sān diǎn huíqu.', 'I’m going back tomorrow at 3 p.m.', [], { note: '回去 = go back' }),
        s('r11-4', '好的，再见！', 'hǎo de, zàijiàn!', 'OK, goodbye!', []),
      ],
      questions: [
        { q: 'Who is calling?', options: ['Mr. Wang', 'Miss Li', 'Anna'], answer: 1 },
        { q: 'Where is Mr. Wang going back to?', options: ['Beijing', 'Shanghai', 'Home'], answer: 0 },
        { q: 'When is he going back?', options: ['Today', 'Tomorrow morning', 'Tomorrow at 3 p.m.'], answer: 2 },
      ],
    },
  },
  {
    id: 'zh-u12',
    title: 'Classmates & Daily Plans',
    level: 'HSK 1',
    canDo: ['Talk about your classmates', 'Buy fruit and other food', 'Tell the time to the half hour'],
    lessons: [
      {
        id: 'zh-u12-l1',
        title: 'Classmates',
        goal: 'Talk about groups of people',
        items: [
          w('u12-tongxue', '同学', 'tóngxué', 'classmate'),
          w('u12-women', '我们', 'wǒmen', 'we', { meaningAlt: ['us'] }),
          w('u12-nimen', '你们', 'nǐmen', 'you (plural)'),
          w('u12-tamen', '他们', 'tāmen', 'they', { meaningAlt: ['them'] }),
          w('u12-daxue', '大学', 'dàxué', 'university'),
          w('u12-na-which', '哪', 'nǎ', 'which'),
          w('u12-guo', '国', 'guó', 'country'),
        ],
        sentences: [
          s('u12-s-womenshitongxue', '我们是同学。', 'wǒmen shì tóngxué.', 'We’re classmates.', ['我们', '是', '同学']),
          s('u12-s-tamenzaidaxue', '他们在大学学习。', 'tāmen zài dàxué xuéxí.', 'They study at university.', ['他们', '在', '大学', '学习']),
          s('u12-s-naguoren', '你们是哪国人？', 'nǐmen shì nǎ guó rén?', 'Which country are you from?', ['你们', '是', '哪', '国', '人']),
        ],
      },
      {
        id: 'zh-u12-l2',
        title: 'At the Market',
        goal: 'Buy fruit, meat and fish',
        items: [
          w('u12-shuiguo', '水果', 'shuǐguǒ', 'fruit'),
          w('u12-xigua', '西瓜', 'xīguā', 'watermelon'),
          w('u12-niunai', '牛奶', 'niúnǎi', 'milk'),
          w('u12-yu', '鱼', 'yú', 'fish'),
          w('u12-rou', '肉', 'ròu', 'meat'),
          w('u12-ji', '鸡', 'jī', 'chicken'),
          w('u12-jin', '斤', 'jīn', 'jin (half a kilo)', { note: 'Markets in China price by the 斤 (500 g).' }),
        ],
        sentences: [
          s('u12-s-maiyixieshuiguo', '我想买一些水果。', 'wǒ xiǎng mǎi yìxiē shuǐguǒ.', 'I want to buy some fruit.', ['我', '想', '买', '一', '些', '水果']),
          s('u12-s-xiguayijin', '西瓜多少钱一斤？', 'xīguā duōshao qián yì jīn?', 'How much is watermelon per jin?', ['西瓜', '多少', '钱', '一', '斤']),
          s('u12-s-buchirou', '我不吃肉。', 'wǒ bù chī ròu.', 'I don’t eat meat.', ['我', '不', '吃', '肉']),
        ],
      },
      {
        id: 'zh-u12-l3',
        title: 'Clock & Calendar',
        goal: 'Tell the time and order events',
        items: [
          w('u12-shijian', '时间', 'shíjiān', 'time (duration)'),
          w('u12-xiaoshi', '小时', 'xiǎoshí', 'hour'),
          w('u12-ban', '半', 'bàn', 'half'),
          w('u12-zaoshang', '早上', 'zǎoshang', 'early morning'),
          w('u12-wanshang', '晚上', 'wǎnshang', 'evening', { meaningAlt: ['night'] }),
          w('u12-yihou', '以后', 'yǐhòu', 'after', { meaningAlt: ['later'] }),
          w('u12-yiqian', '以前', 'yǐqián', 'before', { meaningAlt: ['ago'] }),
          w('u12-le', '了', 'le', '(completed action / change)', { note: 'After a verb: done. At the end of a sentence: a new situation.' }),
        ],
        sentences: [
          s('u12-s-badianban', '现在八点半。', 'xiànzài bā diǎn bàn.', 'It’s 8:30 now.', ['现在', '八', '点', '半']),
          s('u12-s-wanshangkanshu', '我晚上看书。', 'wǒ wǎnshang kàn shū.', 'I read in the evening.', ['我', '晚上', '看', '书']),
          s('u12-s-chifanyihou', '吃饭以后我们去商店。', 'chīfàn yǐhòu wǒmen qù shāngdiàn.', 'After eating, we’ll go to the shop.', ['吃饭', '以后', '我们', '去', '商店']),
        ],
      },
    ],
    reading: {
      id: 'zh-u12-r',
      title: '我们班 · Our Class',
      sentences: [
        s('r12-1', '我们班有十个同学。', 'wǒmen bān yǒu shí ge tóngxué.', 'There are ten students in our class.', [], { note: '班 (bān) = class' }),
        s('r12-2', '我们都在北京大学学习。', 'wǒmen dōu zài Běijīng Dàxué xuéxí.', 'We all study at Peking University.', []),
        s('r12-3', '早上八点半上课。', 'zǎoshang bā diǎn bàn shàngkè.', 'Class starts at 8:30 in the morning.', [], { note: '上课 = to have class' }),
        s('r12-4', '晚上我们一起吃饭。', 'wǎnshang wǒmen yìqǐ chīfàn.', 'In the evening we eat together.', []),
      ],
      questions: [
        { q: 'How many students are in the class?', options: ['Ten', 'Five', 'Twenty'], answer: 0 },
        { q: 'Where do they study?', options: ['At a high school', 'At Peking University', 'At home'], answer: 1 },
        { q: 'When does class start?', options: ['8:00', '9:30', '8:30'], answer: 2 },
      ],
    },
  },

  /* ---------------- HSK 2 ---------------- */
  {
    id: 'zh-u13',
    title: 'Sports & Free Time',
    level: 'HSK 2',
    canDo: ['Talk about sports you play', 'Describe what you do in your free time', 'Say how well and how often you do things'],
    lessons: [
      {
        id: 'zh-u13-l1',
        title: 'Sports',
        goal: 'Talk about sports',
        items: [
          w('u13-yundong', '运动', 'yùndòng', 'sport', { meaningAlt: ['exercise'] }),
          w('u13-paobu', '跑步', 'pǎobù', 'to run', { meaningAlt: ['to jog'] }),
          w('u13-youyong', '游泳', 'yóuyǒng', 'to swim'),
          w('u13-ti', '踢', 'tī', 'to kick'),
          w('u13-zuqiu', '足球', 'zúqiú', 'football', { meaningAlt: ['soccer'] }),
          w('u13-lanqiu', '篮球', 'lánqiú', 'basketball'),
        ],
        sentences: [
          s('u13-s-meitianpaobu', '我每天跑步。', 'wǒ měitiān pǎobù.', 'I run every day.', ['我', '每天', '跑步']),
          s('u13-s-tizuqiu', '他喜欢踢足球。', 'tā xǐhuan tī zúqiú.', 'He likes playing football.', ['他', '喜欢', '踢', '足球']),
          s('u13-s-huiyouyong', '你会游泳吗？', 'nǐ huì yóuyǒng ma?', 'Can you swim?', ['你', '会', '游泳', '吗']),
        ],
      },
      {
        id: 'zh-u13-l2',
        title: 'Free Time',
        goal: 'Talk about hobbies and outings',
        items: [
          w('u13-tiaowu', '跳舞', 'tiàowǔ', 'to dance'),
          w('u13-chongge', '唱歌', 'chànggē', 'to sing'),
          w('u13-wan', '玩', 'wán', 'to play', { meaningAlt: ['to have fun'] }),
          w('u13-gongyuan', '公园', 'gōngyuán', 'park'),
          w('u13-youshihou', '有时候', 'yǒushíhou', 'sometimes'),
          w('u13-yibian', '一边', 'yìbiān', 'while (doing two things)'),
          w('u13-pashan', '爬山', 'páshān', 'to climb mountains', { meaningAlt: ['to hike'] }),
        ],
        sentences: [
          s('u13-s-qugongyuanwan', '星期天我们去公园玩。', 'xīngqītiān wǒmen qù gōngyuán wán.', 'On Sunday we’re going to the park to have fun.', ['星期天', '我们', '去', '公园', '玩']),
          s('u13-s-youshihoutiaowu', '她有时候去跳舞。', 'tā yǒushíhou qù tiàowǔ.', 'She sometimes goes dancing.', ['她', '有时候', '去', '跳舞']),
          s('u13-s-yibianchifan', '我一边吃饭一边看电视。', 'wǒ yìbiān chīfàn yìbiān kàn diànshì.', 'I watch TV while I eat.', ['我', '一边', '吃饭', '一边', '看', '电视']),
        ],
      },
      {
        id: 'zh-u13-l3',
        title: 'Fast & Slow',
        goal: 'Describe how and how often',
        items: [
          w('u13-kuai', '快', 'kuài', 'fast', { meaningAlt: ['quick'] }),
          w('u13-man', '慢', 'màn', 'slow'),
          w('u13-zao', '早', 'zǎo', 'early'),
          w('u13-wan-late', '晚', 'wǎn', 'late'),
          w('u13-mei', '每', 'měi', 'every', { meaningAlt: ['each'] }),
          w('u13-ci', '次', 'cì', 'time (occurrence)', { meaningAlt: ['times'] }),
          w('u13-diyi', '第一', 'dì-yī', 'first'),
        ],
        sentences: [
          s('u13-s-paodehenkuai', '他跑得很快。', 'tā pǎo de hěn kuài.', 'He runs fast.', ['他', '跑', '得', '很', '快']),
          s('u13-s-diyiciyouyong', '我第一次游泳。', 'wǒ dì-yī cì yóuyǒng.', 'It’s my first time swimming.', ['我', '第一', '次', '游泳']),
          s('u13-s-laiwanle', '你来晚了。', 'nǐ lái wǎn le.', 'You’re late.', ['你', '来', '晚', '了']),
        ],
      },
    ],
    reading: {
      id: 'zh-u13-r',
      title: '我的爱好 · My Hobbies',
      sentences: [
        s('r13-1', '我很喜欢运动。', 'wǒ hěn xǐhuan yùndòng.', 'I really like sport.', []),
        s('r13-2', '我每天早上跑步半个小时。', 'wǒ měitiān zǎoshang pǎobù bàn ge xiǎoshí.', 'Every morning I run for half an hour.', []),
        s('r13-3', '星期六我和朋友去踢足球。', 'xīngqīliù wǒ hé péngyou qù tī zúqiú.', 'On Saturdays I play football with friends.', []),
        s('r13-4', '我的朋友踢得比我好。', 'wǒ de péngyou tī de bǐ wǒ hǎo.', 'My friend plays better than me.', []),
      ],
      questions: [
        { q: 'When does the writer run?', options: ['Every evening', 'Every morning', 'On Saturdays'], answer: 1 },
        { q: 'What does the writer do on Saturdays?', options: ['Plays football', 'Swims', 'Goes dancing'], answer: 0 },
        { q: 'Who plays football better?', options: ['The writer', 'They’re the same', 'The friend'], answer: 2 },
      ],
    },
  },

  /* ---------------- HSK 3 ---------------- */
  {
    id: 'zh-u14',
    title: 'City Life & Culture',
    level: 'HSK 3',
    canDo: ['Describe where you live', 'Talk about festivals and gifts', 'Express worries and reassure people'],
    lessons: [
      {
        id: 'zh-u14-l1',
        title: 'City Life',
        goal: 'Describe your neighbourhood',
        items: [
          w('u14-chengshi', '城市', 'chéngshì', 'city'),
          w('u14-huanjing', '环境', 'huánjìng', 'environment', { meaningAlt: ['surroundings'] }),
          w('u14-anjing', '安静', 'ānjìng', 'quiet'),
          w('u14-ganjing', '干净', 'gānjìng', 'clean'),
          w('u14-fujin', '附近', 'fùjìn', 'nearby'),
          w('u14-fangbian', '方便', 'fāngbiàn', 'convenient'),
          w('u14-linju', '邻居', 'línjū', 'neighbour', { meaningAlt: ['neighbor'] }),
          w('u14-ban', '搬', 'bān', 'to move', { meaningAlt: ['to carry'] }),
        ],
        sentences: [
          s('u14-s-chengshiganjing', '这个城市很干净。', 'zhège chéngshì hěn gānjìng.', 'This city is very clean.', ['这', '个', '城市', '很', '干净']),
          s('u14-s-fujingongyuan', '我家附近有一个公园。', 'wǒ jiā fùjìn yǒu yí ge gōngyuán.', 'There’s a park near my home.', ['我', '家', '附近', '有', '一', '个', '公园']),
          s('u14-s-banjiale', '我们搬家了。', 'wǒmen bānjiā le.', 'We’ve moved house.', ['我们', '搬家', '了']),
        ],
      },
      {
        id: 'zh-u14-l2',
        title: 'Festivals & Gifts',
        goal: 'Talk about traditions',
        items: [
          w('u14-jieri', '节日', 'jiérì', 'festival', { meaningAlt: ['holiday'] }),
          w('u14-chunjie', '春节', 'Chūnjié', 'Spring Festival', { meaningAlt: ['Chinese New Year'] }),
          w('u14-liwu', '礼物', 'lǐwù', 'gift', { meaningAlt: ['present'] }),
          w('u14-song', '送', 'sòng', 'to give (as a gift)', { meaningAlt: ['to send off'] }),
          w('u14-wenhua', '文化', 'wénhuà', 'culture'),
          w('u14-lishi', '历史', 'lìshǐ', 'history'),
          w('u14-jide', '记得', 'jìde', 'to remember'),
          w('u14-wangji', '忘记', 'wàngjì', 'to forget'),
        ],
        sentences: [
          s('u14-s-chunjiezhongyao', '春节是中国最重要的节日。', 'Chūnjié shì Zhōngguó zuì zhòngyào de jiérì.', 'Spring Festival is China’s most important festival.', ['春节', '是', '中国', '最', '重要', '的', '节日'], {
            note: '重要 (zhòngyào) = important',
          }),
          s('u14-s-songniliwu', '我送你一个礼物。', 'wǒ sòng nǐ yí ge lǐwù.', 'I’m giving you a present.', ['我', '送', '你', '一', '个', '礼物']),
          s('u14-s-biewangji', '别忘记我的生日。', 'bié wàngjì wǒ de shēngrì.', 'Don’t forget my birthday.', ['别', '忘记', '我', '的', '生日'], { note: '别 = don’t; 生日 = birthday' }),
        ],
      },
      {
        id: 'zh-u14-l3',
        title: 'Worries & Comfort',
        goal: 'Express and ease worries',
        items: [
          w('u14-danxin', '担心', 'dānxīn', 'to worry'),
          w('u14-haipa', '害怕', 'hàipà', 'to be afraid'),
          w('u14-xiangxin', '相信', 'xiāngxìn', 'to believe', { meaningAlt: ['to trust'] }),
          w('u14-guanxin', '关心', 'guānxīn', 'to care about'),
          w('u14-zhaogu', '照顾', 'zhàogù', 'to take care of', { meaningAlt: ['to look after'] }),
          w('u14-xuyao', '需要', 'xūyào', 'to require', { meaningAlt: ['need'] }),
          w('u14-shengqi', '生气', 'shēngqì', 'angry'),
          w('u14-nanguo', '难过', 'nánguò', 'sad', { meaningAlt: ['upset'] }),
        ],
        sentences: [
          s('u14-s-biedanxin', '别担心，我会照顾你。', 'bié dānxīn, wǒ huì zhàogù nǐ.', 'Don’t worry, I’ll take care of you.', ['别', '担心', '我', '会', '照顾', '你']),
          s('u14-s-xiangxinni', '我相信你。', 'wǒ xiāngxìn nǐ.', 'I believe you.', ['我', '相信', '你']),
          s('u14-s-henanguo', '她很难过。', 'tā hěn nánguò.', 'She’s very sad.', ['她', '很', '难过']),
        ],
      },
    ],
    reading: {
      id: 'zh-u14-r',
      title: '新家 · A New Home',
      sentences: [
        s('r14-1', '上个月我们搬到了一个新城市。', 'shàng ge yuè wǒmen bān dào le yí ge xīn chéngshì.', 'Last month we moved to a new city.', [], { note: '上个月 = last month; 新 = new' }),
        s('r14-2', '这里的环境很好，又安静又干净。', 'zhèlǐ de huánjìng hěn hǎo, yòu ānjìng yòu gānjìng.', 'The environment here is great — quiet and clean.', []),
        s('r14-3', '我们的邻居很关心我们。', 'wǒmen de línjū hěn guānxīn wǒmen.', 'Our neighbours really look out for us.', []),
        s('r14-4', '春节的时候，他们还送了我们礼物。', 'Chūnjié de shíhou, tāmen hái sòng le wǒmen lǐwù.', 'At Spring Festival, they even gave us presents.', []),
      ],
      questions: [
        { q: 'When did they move?', options: ['Last month', 'Last year', 'Last week'], answer: 0 },
        { q: 'What is the new place like?', options: ['Noisy and busy', 'Quiet and clean', 'Far from everything'], answer: 1 },
        { q: 'What did the neighbours do at Spring Festival?', options: ['Had a party', 'Moved away', 'Gave them presents'], answer: 2 },
      ],
    },
  },
]

export const zhMoreUnitsGrammar: Record<string, GrammarPoint[]> = {
  'zh-u10-l1': [
    {
      title: 'Position words come after the noun',
      pattern: 'Noun + 上 / 下 / 里',
      explanation: 'Chinese says “table-on” and “home-in”: the position word follows the thing.',
      examples: [ex('桌子上', 'zhuōzi shang', 'on the table'), ex('猫在椅子下。', 'māo zài yǐzi xià.', 'The cat is under the chair.')],
    },
    {
      title: 'Where you live: 住在 + place',
      pattern: 'Subject + 住在 + Place',
      explanation: '住在 means “to live in” and is followed directly by the place.',
      examples: [ex('我住在北京。', 'wǒ zhù zài Běijīng.', 'I live in Beijing.')],
    },
  ],
  'zh-u10-l2': [
    {
      title: 'And you? 呢',
      pattern: 'Noun / Pronoun + 呢？',
      explanation: '呢 after a noun asks the same question about someone else, without repeating it.',
      examples: [ex('我是学生，你呢？', 'wǒ shì xuésheng, nǐ ne?', 'I’m a student — and you?')],
    },
    {
      title: '都 goes before the verb',
      pattern: 'Plural subject + 都 + Verb',
      explanation: '都 (all / both) always comes after the subject and before the verb, never before a noun.',
      examples: [ex('我们都是学生。', 'wǒmen dōu shì xuésheng.', 'We are all students.'), ex('这是谁的书？', 'zhè shì shéi de shū?', 'Whose book is this?')],
    },
  ],
  'zh-u10-l3': [
    {
      title: 'Measure word for books: 本',
      pattern: 'Number + 本 + 书',
      explanation: 'Books and notebooks use 本 instead of the general 个.',
      examples: [ex('一本书', 'yì běn shū', 'a book'), ex('两本书', 'liǎng běn shū', 'two books')],
    },
    {
      title: 'Doing it right now: 在 + verb',
      pattern: 'Subject + 在 + Verb',
      explanation: '在 before a verb shows an action in progress, like English “-ing”.',
      examples: [ex('他在看书。', 'tā zài kàn shū.', 'He’s reading.')],
    },
  ],
  'zh-u11-l1': [
    {
      title: '会 or 能?',
      explanation: '会 is a skill you learned (can swim, can speak Chinese). 能 is being able to right now, or being allowed.',
      examples: [ex('我会说汉语。', 'wǒ huì shuō Hànyǔ.', 'I can speak Chinese.'), ex('今天我不能来。', 'jīntiān wǒ bù néng lái.', 'I can’t come today.')],
    },
  ],
  'zh-u11-l2': [
    {
      title: 'Really, very, extremely',
      explanation: '很 is neutral, 真 adds emotion (“really!”), and 非常 is strong (“extremely”).',
      examples: [ex('真好！', 'zhēn hǎo!', 'That’s really great!'), ex('非常好', 'fēicháng hǎo', 'extremely good')],
    },
  ],
  'zh-u11-l3': [
    {
      title: 'When? 什么时候',
      pattern: 'Subject + 什么时候 + Verb？',
      explanation: '什么时候 sits before the verb, just like an ordinary time word.',
      examples: [ex('你什么时候来？', 'nǐ shénme shíhou lái?', 'When are you coming?')],
    },
    {
      title: 'How long: duration after the verb',
      pattern: 'Verb + Duration',
      explanation: 'How long you do something goes after the verb, unlike “when”, which goes before.',
      examples: [ex('等五分钟', 'děng wǔ fēnzhōng', 'wait five minutes')],
    },
  ],
  'zh-u12-l1': [
    {
      title: 'Plurals with 们',
      explanation: '们 makes pronouns plural (我们, 你们, 他们) and can follow words for people.',
      examples: [ex('老师们', 'lǎoshīmen', 'the teachers')],
    },
    {
      title: 'Which? 哪 + measure word',
      pattern: '哪 + Measure + Noun',
      explanation: '哪 asks “which” and usually needs a measure word. For countries you can say 哪国人.',
      examples: [ex('哪个学生？', 'nǎge xuésheng?', 'Which student?'), ex('哪国人', 'nǎ guó rén', 'a person from which country')],
    },
  ],
  'zh-u12-l2': [
    {
      title: 'Price per unit',
      pattern: 'Thing + 多少钱 + 一 + Unit？',
      explanation: 'At markets, ask the price per 斤 (or other unit) by putting it at the end.',
      examples: [ex('苹果多少钱一斤？', 'píngguǒ duōshao qián yì jīn?', 'How much are apples per jin?')],
    },
    {
      title: 'Some: 一些',
      explanation: '一些 means “some” and goes before a noun. 这些 / 那些 mean “these / those”.',
      examples: [ex('一些水果', 'yìxiē shuǐguǒ', 'some fruit'), ex('这些书', 'zhèxiē shū', 'these books')],
    },
  ],
  'zh-u12-l3': [
    {
      title: 'Half and quarter past',
      explanation: '半 means half past and 一刻 (yí kè) a quarter past.',
      examples: [ex('八点半', 'bā diǎn bàn', '8:30'), ex('八点一刻', 'bā diǎn yí kè', '8:15')],
    },
    {
      title: 'Before and after: 以前 / 以后',
      pattern: 'Event / Time + 以前 / 以后',
      explanation: 'Unlike English, 以前 and 以后 come after the event or time.',
      examples: [ex('吃饭以后', 'chīfàn yǐhòu', 'after eating'), ex('三点以前', 'sān diǎn yǐqián', 'before 3 o’clock')],
    },
  ],
  'zh-u13-l1': [
    {
      title: 'Playing ball games',
      explanation: 'Ball games take a verb: 踢 (kick) for football and 打 (hit) for basketball and tennis.',
      examples: [ex('踢足球', 'tī zúqiú', 'to play football'), ex('打篮球', 'dǎ lánqiú', 'to play basketball')],
    },
  ],
  'zh-u13-l2': [
    {
      title: 'At the same time: 一边…一边…',
      pattern: '一边 + Verb 1 + 一边 + Verb 2',
      explanation: 'This describes doing two things at once.',
      examples: [ex('一边走一边说', 'yìbiān zǒu yìbiān shuō', 'talking while walking')],
    },
    {
      title: 'Going to do something',
      pattern: '去 + Place + Verb',
      explanation: 'Put the purpose right after the place you’re going.',
      examples: [ex('去公园玩', 'qù gōngyuán wán', 'go to the park to have fun')],
    },
  ],
  'zh-u13-l3': [
    {
      title: 'Ordinals with 第',
      pattern: '第 + Number',
      explanation: '第 before a number makes it ordinal (first, second …). With 次, it counts occasions.',
      examples: [ex('第二次', 'dì-èr cì', 'the second time')],
    },
    {
      title: 'How it’s done: 得 recap',
      pattern: 'Verb + 得 + Adjective',
      explanation: '得 links a verb to a description of how it’s done.',
      examples: [ex('他来得很早。', 'tā lái de hěn zǎo.', 'He came early.')],
    },
  ],
  'zh-u14-l1': [
    {
      title: 'Both … and …: 又…又…',
      pattern: '又 + Adj + 又 + Adj',
      explanation: 'Use this to describe two qualities at once.',
      examples: [ex('又安静又干净', 'yòu ānjìng yòu gānjìng', 'both quiet and clean')],
    },
    {
      title: 'Near something: Place + 附近',
      explanation: '附近 follows the place it’s near.',
      examples: [ex('学校附近', 'xuéxiào fùjìn', 'near the school')],
    },
  ],
  'zh-u14-l2': [
    {
      title: 'Giving: 送 + person + thing',
      pattern: 'Subject + 送 + Person + Thing',
      explanation: '送 takes two objects: who receives it, then what it is.',
      examples: [ex('我送他一本书。', 'wǒ sòng tā yì běn shū.', 'I give him a book.')],
    },
    {
      title: 'Don’t: 别 + verb',
      explanation: '别 before a verb is a friendly “don’t”.',
      examples: [ex('别走！', 'bié zǒu!', 'Don’t go!')],
    },
  ],
  'zh-u14-l3': [
    {
      title: 'Will / likely to: 会',
      pattern: 'Subject + 会 + Verb',
      explanation: 'Besides “can”, 会 also predicts the future: something will or is likely to happen.',
      examples: [ex('明天会下雨。', 'míngtiān huì xià yǔ.', 'It will rain tomorrow.'), ex('我会照顾你。', 'wǒ huì zhàogù nǐ.', 'I will take care of you.')],
    },
  ],
}
