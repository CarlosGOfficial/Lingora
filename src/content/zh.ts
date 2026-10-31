import { addLessons, insertUnits } from './extend'
import { zhMoreUnits } from './zh-units-more'
import type { Course, Item } from './types'
import { zhMoreLessons } from './zh-more'
import { zhTier23Units } from './zh-tier2-3'

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

export const zh: Course = {
  lang: 'zh',
  name: 'Chinese',
  nativeName: '中文',
  badge: '中',
  standard: 'HSK 3.0',
  standardFull: 'Hanyu Shuiping Kaoshi 3.0 (Chinese Proficiency Test, 2021 standard)',
  bcp47: 'zh-CN',
  readingLabel: 'Pinyin',
  typingHint: 'Type characters or pinyin — tone marks optional.',
  units: insertUnits(addLessons([
    {
      id: 'zh-u1',
      title: 'Greetings & Introductions',
      level: 'HSK 1',
      canDo: ['Greet people and say goodbye', 'Say who you are and what you do', 'Ask someone’s name and nationality'],
      lessons: [
        {
          id: 'zh-u1-l1',
          title: 'Hello & Thanks',
          goal: 'Greet people politely',
          items: [
            w('nihao', '你好', 'nǐ hǎo', 'hello', { meaningAlt: ['hi'] }),
            w('xiexie', '谢谢', 'xièxie', 'thank you', { meaningAlt: ['thanks'] }),
            w('bukeqi', '不客气', 'bú kèqi', 'you’re welcome'),
            w('zaijian', '再见', 'zàijiàn', 'goodbye', { meaningAlt: ['bye'] }),
            w('duibuqi', '对不起', 'duìbuqǐ', 'sorry'),
            w('meiguanxi', '没关系', 'méi guānxi', 'it’s OK', { meaningAlt: ['no problem'] }),
          ],
          sentences: [
            s('s-nihaoma', '你好吗？', 'nǐ hǎo ma?', 'How are you?', ['你', '好', '吗'], { note: '吗 (ma) turns a statement into a yes/no question.' }),
            s('s-wohenhao', '我很好。', 'wǒ hěn hǎo.', 'I’m fine.', ['我', '很', '好'], { note: '很 (hěn, “very”) links a subject to an adjective.' }),
            s('s-xiexieni', '谢谢你！', 'xièxie nǐ!', 'Thank you!', ['谢谢', '你']),
          ],
        },
        {
          id: 'zh-u1-l2',
          title: 'People',
          goal: 'Say who someone is',
          items: [
            w('wo', '我', 'wǒ', 'I', { meaningAlt: ['me'] }),
            w('ni', '你', 'nǐ', 'you'),
            w('ta-he', '他', 'tā', 'he', { meaningAlt: ['him'] }),
            w('ta-she', '她', 'tā', 'she', { meaningAlt: ['her'], note: '他 and 她 sound identical — only the character differs.' }),
            w('shi', '是', 'shì', 'to be', { meaningAlt: ['is', 'am', 'are'] }),
            w('laoshi', '老师', 'lǎoshī', 'teacher'),
            w('xuesheng', '学生', 'xuésheng', 'student'),
          ],
          sentences: [
            s('s-woshixuesheng', '我是学生。', 'wǒ shì xuésheng.', 'I am a student.', ['我', '是', '学生']),
            s('s-tashilaoshi', '她是老师。', 'tā shì lǎoshī.', 'She is a teacher.', ['她', '是', '老师']),
            s('s-nishilaoshima', '你是老师吗？', 'nǐ shì lǎoshī ma?', 'Are you a teacher?', ['你', '是', '老师', '吗']),
          ],
        },
        {
          id: 'zh-u1-l3',
          title: 'Names & Countries',
          goal: 'Ask names and nationalities',
          items: [
            w('jiao', '叫', 'jiào', 'to be called'),
            w('shenme', '什么', 'shénme', 'what'),
            w('mingzi', '名字', 'míngzi', 'name'),
            w('zhongguo', '中国', 'Zhōngguó', 'China'),
            w('meiguo', '美国', 'Měiguó', 'USA', { meaningAlt: ['America'] }),
            w('ren', '人', 'rén', 'person', { meaningAlt: ['people'], note: 'Country + 人 = a person from that country.' }),
          ],
          sentences: [
            s('s-nijiaoshenme', '你叫什么名字？', 'nǐ jiào shénme míngzi?', 'What is your name?', ['你', '叫', '什么', '名字']),
            s('s-woshizhongguoren', '我是中国人。', 'wǒ shì Zhōngguó rén.', 'I am Chinese.', ['我', '是', '中国', '人']),
            s('s-tashimeiguoren', '他是美国人。', 'tā shì Měiguó rén.', 'He is American.', ['他', '是', '美国', '人']),
          ],
        },
      ],
      reading: {
        id: 'zh-u1-r',
        title: '王明和安娜 · Wang Ming and Anna',
        sentences: [
          s('r1-1', '你好！我叫王明。', 'nǐ hǎo! wǒ jiào Wáng Míng.', 'Hello! My name is Wang Ming.', []),
          s('r1-2', '我是中国人。我是学生。', 'wǒ shì Zhōngguó rén. wǒ shì xuésheng.', 'I am Chinese. I am a student.', []),
          s('r1-3', '她叫安娜。她是美国人。', 'tā jiào Ānnà. tā shì Měiguó rén.', 'Her name is Anna. She is American.', []),
          s('r1-4', '她是老师。', 'tā shì lǎoshī.', 'She is a teacher.', []),
        ],
        questions: [
          { q: 'Where is Wang Ming from?', options: ['China', 'USA', 'Japan'], answer: 0 },
          { q: 'What does Anna do?', options: ['She is a student', 'She is a teacher', 'She is a doctor'], answer: 1 },
          { q: 'Who is a student?', options: ['Anna', 'Wang Ming', 'Both'], answer: 1 },
        ],
      },
    },
    {
      id: 'zh-u2',
      title: 'Numbers & Food',
      level: 'HSK 1',
      canDo: ['Count from one to ten', 'Say what you want to eat and drink', 'Make simple negative sentences'],
      lessons: [
        {
          id: 'zh-u2-l1',
          title: 'Numbers 1–10',
          goal: 'Count from one to ten',
          items: [
            w('yi', '一', 'yī', 'one', { meaningAlt: ['1'] }),
            w('er', '二', 'èr', 'two', { meaningAlt: ['2'] }),
            w('san', '三', 'sān', 'three', { meaningAlt: ['3'] }),
            w('si', '四', 'sì', 'four', { meaningAlt: ['4'] }),
            w('wu', '五', 'wǔ', 'five', { meaningAlt: ['5'] }),
            w('liu', '六', 'liù', 'six', { meaningAlt: ['6'] }),
            w('qi', '七', 'qī', 'seven', { meaningAlt: ['7'] }),
            w('ba', '八', 'bā', 'eight', { meaningAlt: ['8'] }),
            w('jiu', '九', 'jiǔ', 'nine', { meaningAlt: ['9'] }),
            w('shi-10', '十', 'shí', 'ten', { meaningAlt: ['10'] }),
          ],
          sentences: [s('s-duoshaoqian', '多少钱？', 'duōshao qián?', 'How much is it?', ['多少', '钱'])],
        },
        {
          id: 'zh-u2-l2',
          title: 'Eating & Drinking',
          goal: 'Say what you want',
          items: [
            w('chi', '吃', 'chī', 'to eat'),
            w('he', '喝', 'hē', 'to drink'),
            w('shui', '水', 'shuǐ', 'water'),
            w('cha', '茶', 'chá', 'tea'),
            w('mifan', '米饭', 'mǐfàn', 'rice', { meaningAlt: ['cooked rice'] }),
            w('xiang', '想', 'xiǎng', 'to want', { meaningAlt: ['would like'] }),
            w('bu', '不', 'bù', 'not', { meaningAlt: ['no'], note: '不 goes before the verb.' }),
          ],
          sentences: [
            s('s-woxianghecha', '我想喝茶。', 'wǒ xiǎng hē chá.', 'I want to drink tea.', ['我', '想', '喝', '茶']),
            s('s-nichimifanma', '你吃米饭吗？', 'nǐ chī mǐfàn ma?', 'Do you eat rice?', ['你', '吃', '米饭', '吗']),
            s('s-wobuheshui', '我不喝水。', 'wǒ bù hē shuǐ.', 'I don’t drink water.', ['我', '不', '喝', '水']),
          ],
        },
      ],
      reading: {
        id: 'zh-u2-r',
        title: '喝茶 · Drinking Tea',
        sentences: [
          s('r2-1', '我叫王明。我想喝茶。', 'wǒ jiào Wáng Míng. wǒ xiǎng hē chá.', 'My name is Wang Ming. I want to drink tea.', []),
          s('r2-2', '安娜不喝茶，她喝水。', 'Ānnà bù hē chá, tā hē shuǐ.', 'Anna doesn’t drink tea; she drinks water.', []),
          s('r2-3', '我们吃米饭。', 'wǒmen chī mǐfàn.', 'We eat rice.', [], { note: '我们 (wǒmen) = we' }),
        ],
        questions: [
          { q: 'What does Wang Ming want to drink?', options: ['Water', 'Tea', 'Coffee'], answer: 1 },
          { q: 'What does Anna drink?', options: ['Tea', 'Water', 'Nothing'], answer: 1 },
          { q: 'What do they eat?', options: ['Rice', 'Noodles', 'Bread'], answer: 0 },
        ],
      },
    },
    {
      id: 'zh-u3',
      title: 'Family & Friends',
      level: 'HSK 1',
      canDo: ['Talk about your family members', 'Say what you have and don’t have', 'Ask and say someone’s age'],
      lessons: [
        {
          id: 'zh-u3-l1',
          title: 'My Family',
          goal: 'Name family members',
          items: [
            w('u3-baba', '爸爸', 'bàba', 'dad', { meaningAlt: ['father'] }),
            w('u3-mama', '妈妈', 'māma', 'mom', { meaningAlt: ['mother'] }),
            w('u3-erzi', '儿子', 'érzi', 'son'),
            w('u3-nver', '女儿', 'nǚ’ér', 'daughter'),
            w('u3-jia', '家', 'jiā', 'home', { meaningAlt: ['family'] }),
            w('u3-you', '有', 'yǒu', 'to have', { meaningAlt: ['there is'] }),
            w('u3-meiyou', '没有', 'méiyǒu', 'not have', { note: '有 is negated with 没, never 不.' }),
            w('u3-ge', '个', 'gè', '(measure word)', { meaningAlt: ['general classifier'], note: 'Number + 个 + noun: 一个人 (one person). After 一 it reads yí ge.' }),
          ],
          sentences: [
            s('u3-s-youerzi', '我有一个儿子。', 'wǒ yǒu yí ge érzi.', 'I have a son.', ['我', '有', '一', '个', '儿子']),
            s('u3-s-womama', '她是我妈妈。', 'tā shì wǒ māma.', 'She is my mom.', ['她', '是', '我', '妈妈'], { note: 'With close family, 的 is usually dropped: 我妈妈.' }),
            s('u3-s-meiyounver', '我没有女儿。', 'wǒ méiyǒu nǚ’ér.', 'I don’t have a daughter.', ['我', '没有', '女儿']),
          ],
        },
        {
          id: 'zh-u3-l2',
          title: 'Ages & Friends',
          goal: 'Ask ages and describe people',
          items: [
            w('u3-ji', '几', 'jǐ', 'how many', { note: 'Used for small numbers (under ~10), dates and times.' }),
            w('u3-sui', '岁', 'suì', 'years old'),
            w('u3-da', '大', 'dà', 'big', { meaningAlt: ['old (age)'] }),
            w('u3-xiao', '小', 'xiǎo', 'small', { meaningAlt: ['young', 'little'] }),
            w('u3-duo', '多', 'duō', 'many', { meaningAlt: ['much', 'a lot'] }),
            w('u3-pengyou', '朋友', 'péngyou', 'friend'),
            w('u3-de', '的', 'de', '’s (possessive)', { meaningAlt: ['of'], note: '我的 = my, 你的 = your.' }),
          ],
          sentences: [
            s('u3-s-nijisui', '你几岁？', 'nǐ jǐ suì?', 'How old are you? (to a child)', ['你', '几', '岁']),
            s('u3-s-nverwusui', '我女儿五岁。', 'wǒ nǚ’ér wǔ suì.', 'My daughter is five.', ['我', '女儿', '五', '岁'], { note: 'Ages need no 是.' }),
            s('u3-s-wodepengyou', '他是我的朋友。', 'tā shì wǒ de péngyou.', 'He is my friend.', ['他', '是', '我', '的', '朋友']),
          ],
        },
      ],
      reading: {
        id: 'zh-u3-r',
        title: '我的家 · My Family',
        sentences: [
          s('r3-1', '我家有三个人。', 'wǒ jiā yǒu sān ge rén.', 'There are three people in my family.', []),
          s('r3-2', '爸爸、妈妈和我。', 'bàba, māma hé wǒ.', 'Dad, Mom and me.', [], { note: '和 (hé) = and' }),
          s('r3-3', '我爸爸是老师。', 'wǒ bàba shì lǎoshī.', 'My dad is a teacher.', []),
          s('r3-4', '我有一个朋友，他叫李文。', 'wǒ yǒu yí ge péngyou, tā jiào Lǐ Wén.', 'I have a friend; his name is Li Wen.', []),
        ],
        questions: [
          { q: 'How many people are in the family?', options: ['Two', 'Three', 'Five'], answer: 1 },
          { q: 'What does Dad do?', options: ['He is a teacher', 'He is a student', 'He is a doctor'], answer: 0 },
          { q: 'What is the friend’s name?', options: ['Wang Ming', 'Anna', 'Li Wen'], answer: 2 },
        ],
      },
    },
    {
      id: 'zh-u4',
      title: 'Dates & Time',
      level: 'HSK 1',
      canDo: ['Say today’s date and day of the week', 'Ask and tell the time', 'Say when you will come or go'],
      lessons: [
        {
          id: 'zh-u4-l1',
          title: 'Days & Dates',
          goal: 'Say the date and weekday',
          items: [
            w('u4-jintian', '今天', 'jīntiān', 'today'),
            w('u4-mingtian', '明天', 'míngtiān', 'tomorrow'),
            w('u4-zuotian', '昨天', 'zuótiān', 'yesterday'),
            w('u4-nian', '年', 'nián', 'year'),
            w('u4-yue', '月', 'yuè', 'month', { note: 'Months are numbers: 一月 = January, 五月 = May.' }),
            w('u4-hao', '号', 'hào', 'day of the month', { meaningAlt: ['date'] }),
            w('u4-xingqi', '星期', 'xīngqī', 'week', { note: '星期 + number = weekday: 星期一 = Monday … 星期六 = Saturday.' }),
          ],
          sentences: [
            s('u4-s-jihao', '今天几号？', 'jīntiān jǐ hào?', 'What’s the date today?', ['今天', '几', '号']),
            s('u4-s-xingqiyi', '明天是星期一。', 'míngtiān shì xīngqīyī.', 'Tomorrow is Monday.', ['明天', '是', '星期', '一']),
            s('u4-s-wuyuebahao', '今天是五月八号。', 'jīntiān shì wǔ yuè bā hào.', 'Today is May 8th.', ['今天', '是', '五', '月', '八', '号']),
          ],
        },
        {
          id: 'zh-u4-l2',
          title: 'What Time Is It?',
          goal: 'Tell the time and make plans',
          items: [
            w('u4-xianzai', '现在', 'xiànzài', 'now'),
            w('u4-dian', '点', 'diǎn', 'o’clock'),
            w('u4-shangwu', '上午', 'shàngwǔ', 'morning', { meaningAlt: ['a.m.'] }),
            w('u4-zhongwu', '中午', 'zhōngwǔ', 'noon'),
            w('u4-xiawu', '下午', 'xiàwǔ', 'afternoon', { meaningAlt: ['p.m.'] }),
            w('u4-lai', '来', 'lái', 'to come'),
            w('u4-qu', '去', 'qù', 'to go'),
          ],
          sentences: [
            s('u4-s-jidian', '现在几点？', 'xiànzài jǐ diǎn?', 'What time is it now?', ['现在', '几', '点']),
            s('u4-s-xiawusandian', '现在下午三点。', 'xiànzài xiàwǔ sān diǎn.', 'It’s 3 p.m. now.', ['现在', '下午', '三', '点'], { note: 'Big → small: part of day, then hour.' }),
            s('u4-s-shangwulai', '我明天上午来。', 'wǒ míngtiān shàngwǔ lái.', 'I’ll come tomorrow morning.', ['我', '明天', '上午', '来'], {
              note: 'Time words go before the verb.',
            }),
          ],
        },
      ],
      reading: {
        id: 'zh-u4-r',
        title: '星期五 · Friday',
        sentences: [
          s('r4-1', '今天是九月十号，星期五。', 'jīntiān shì jiǔ yuè shí hào, xīngqīwǔ.', 'Today is September 10th, Friday.', []),
          s('r4-2', '现在是上午十点。', 'xiànzài shì shàngwǔ shí diǎn.', 'It’s 10 a.m. now.', []),
          s('r4-3', '我下午三点去朋友家。', 'wǒ xiàwǔ sān diǎn qù péngyou jiā.', 'At 3 p.m. I’m going to my friend’s home.', []),
          s('r4-4', '明天我们去喝茶。', 'míngtiān wǒmen qù hē chá.', 'Tomorrow we’re going to drink tea.', [], { note: '我们 (wǒmen) = we' }),
        ],
        questions: [
          { q: 'What day of the week is it?', options: ['Monday', 'Friday', 'Sunday'], answer: 1 },
          { q: 'What time is it now?', options: ['10 a.m.', '3 p.m.', '10 p.m.'], answer: 0 },
          { q: 'What will they do tomorrow?', options: ['Eat rice', 'Go shopping', 'Drink tea'], answer: 2 },
        ],
      },
    },
    {
      id: 'zh-u5',
      title: 'Places & Shopping',
      level: 'HSK 1',
      canDo: ['Ask where something is', 'Say where you are', 'Ask prices and buy things'],
      lessons: [
        {
          id: 'zh-u5-l1',
          title: 'Where Is It?',
          goal: 'Ask and say where things are',
          items: [
            w('u5-nar', '哪儿', 'nǎr', 'where'),
            w('u5-zher', '这儿', 'zhèr', 'here'),
            w('u5-nar-there', '那儿', 'nàr', 'there'),
            w('u5-zai', '在', 'zài', 'to be at', { meaningAlt: ['in', 'at'], note: 'Place goes after 在: 我在学校.' }),
            w('u5-xuexiao', '学校', 'xuéxiào', 'school'),
            w('u5-shangdian', '商店', 'shāngdiàn', 'shop', { meaningAlt: ['store'] }),
            w('u5-yiyuan', '医院', 'yīyuàn', 'hospital'),
            w('u5-fandian', '饭店', 'fàndiàn', 'restaurant', { meaningAlt: ['hotel'] }),
          ],
          sentences: [
            s('u5-s-zainar', '你在哪儿？', 'nǐ zài nǎr?', 'Where are you?', ['你', '在', '哪儿']),
            s('u5-s-zaixuexiao', '我在学校。', 'wǒ zài xuéxiào.', 'I’m at school.', ['我', '在', '学校']),
            s('u5-s-shangdiannar', '商店在那儿。', 'shāngdiàn zài nàr.', 'The shop is over there.', ['商店', '在', '那儿']),
          ],
        },
        {
          id: 'zh-u5-l2',
          title: 'Shopping',
          goal: 'Buy things and ask prices',
          items: [
            w('u5-mai', '买', 'mǎi', 'to buy', { note: 'Don’t confuse with 卖 (mài, to sell).' }),
            w('u5-dongxi', '东西', 'dōngxi', 'things', { meaningAlt: ['stuff'] }),
            w('u5-kuai', '块', 'kuài', 'yuan (kuai)', { meaningAlt: ['yuan'], note: 'Spoken word for 元, the unit of money.' }),
            w('u5-zhe', '这', 'zhè', 'this'),
            w('u5-na', '那', 'nà', 'that'),
            w('u5-xihuan', '喜欢', 'xǐhuan', 'to like'),
            w('u5-pingguo', '苹果', 'píngguǒ', 'apple'),
            w('u5-beizi', '杯子', 'bēizi', 'cup', { meaningAlt: ['glass'] }),
          ],
          sentences: [
            s('u5-s-maipingguo', '我想买苹果。', 'wǒ xiǎng mǎi píngguǒ.', 'I want to buy apples.', ['我', '想', '买', '苹果']),
            s('u5-s-beiziduoshao', '这个杯子多少钱？', 'zhège bēizi duōshao qián?', 'How much is this cup?', ['这', '个', '杯子', '多少', '钱'], {
              note: '这/那 + 个 + noun = this/that (thing).',
            }),
            s('u5-s-xihuannage', '我喜欢那个。', 'wǒ xǐhuan nàge.', 'I like that one.', ['我', '喜欢', '那', '个']),
          ],
        },
      ],
      reading: {
        id: 'zh-u5-r',
        title: '在商店 · At the Shop',
        sentences: [
          s('r5-1', '安娜在商店。她想买东西。', 'Ānnà zài shāngdiàn. tā xiǎng mǎi dōngxi.', 'Anna is at the shop. She wants to buy some things.', []),
          s('r5-2', '她喜欢这个杯子。', 'tā xǐhuan zhège bēizi.', 'She likes this cup.', []),
          s('r5-3', '杯子二十块钱。', 'bēizi èrshí kuài qián.', 'The cup is 20 yuan.', [], { note: '二十 = 2 × 10 = twenty' }),
          s('r5-4', '她还想买苹果。', 'tā hái xiǎng mǎi píngguǒ.', 'She also wants to buy apples.', [], { note: '还 (hái) = also' }),
        ],
        questions: [
          { q: 'Where is Anna?', options: ['At school', 'At the shop', 'At home'], answer: 1 },
          { q: 'What does she like?', options: ['The cup', 'The apples', 'The tea'], answer: 0 },
          { q: 'How much is the cup?', options: ['2 yuan', '12 yuan', '20 yuan'], answer: 2 },
        ],
      },
    },
    ...zhTier23Units,
  ], zhMoreLessons), zhMoreUnits),
}
