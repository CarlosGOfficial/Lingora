import type { GrammarExample, GrammarPoint } from '../types'

const ex = (target: string, reading: string, meaning: string): GrammarExample => ({ target, reading, meaning })

export const zhGrammar: Record<string, GrammarPoint[]> = {
  'zh-u1-l1': [
    {
      title: 'Yes/no questions with 吗',
      pattern: 'Statement + 吗？',
      explanation: 'To make a yes/no question, add 吗 (ma) to the end of any statement. The word order stays the same.',
      examples: [ex('你好吗？', 'nǐ hǎo ma?', 'How are you?'), ex('你是老师吗？', 'nǐ shì lǎoshī ma?', 'Are you a teacher?')],
    },
    {
      title: 'Adjectives with 很',
      pattern: 'Subject + 很 + Adjective',
      explanation:
        'Chinese adjectives work like verbs, so they never take 是. 很 (hěn) links the subject to the adjective. Here it usually just means “is”, not strongly “very”.',
      examples: [ex('我很好。', 'wǒ hěn hǎo.', 'I’m fine.'), ex('茶很好。', 'chá hěn hǎo.', 'The tea is good.')],
    },
    {
      title: 'Tone changes',
      explanation:
        'When two 3rd tones come together, the first one becomes a 2nd tone, so 你好 is said ní hǎo. 不 (bù) becomes bú before another 4th tone.',
      examples: [ex('你好', 'ní hǎo', 'hello (as pronounced)'), ex('不客气', 'bú kèqi', 'you’re welcome')],
    },
  ],
  'zh-u1-l2': [
    {
      title: '是 links two nouns',
      pattern: 'A + 是 + B',
      explanation: '是 (shì) means “to be”, but only between two nouns. Verbs never change for the person: 我是, 你是 and 她是 all use 是.',
      examples: [ex('我是学生。', 'wǒ shì xuésheng.', 'I am a student.'), ex('她是老师。', 'tā shì lǎoshī.', 'She is a teacher.')],
    },
    {
      title: 'Saying “not” with 不',
      pattern: 'Subject + 不 + Verb',
      explanation: 'Put 不 directly before the verb. 不是 means “is not”. 是 is a 4th tone, so 不 is said bú here.',
      examples: [ex('我不是老师。', 'wǒ bú shì lǎoshī.', 'I am not a teacher.'), ex('他不是学生。', 'tā bú shì xuésheng.', 'He is not a student.')],
    },
  ],
  'zh-u1-l3': [
    {
      title: 'Question words stay in place',
      explanation: 'Chinese puts the question word where the answer will go. It doesn’t move to the front like English “what”.',
      examples: [ex('你叫什么名字？', 'nǐ jiào shénme míngzi?', 'What is your name?'), ex('我叫王明。', 'wǒ jiào Wáng Míng.', 'My name is Wang Ming.')],
    },
    {
      title: 'Nationality: country + 人',
      pattern: 'Country + 人',
      explanation: 'To say someone’s nationality, add 人 (rén, person) after the country name.',
      examples: [ex('中国人', 'Zhōngguó rén', 'Chinese person'), ex('他是美国人。', 'tā shì Měiguó rén.', 'He is American.')],
    },
  ],
  'zh-u2-l1': [
    {
      title: 'Numbers 11–99',
      explanation: 'Bigger numbers are built like arithmetic: 十一 = 10 + 1 = 11, 二十 = 2 × 10 = 20, and 二十五 = 25.',
      examples: [ex('十一', 'shíyī', '11'), ex('二十', 'èrshí', '20'), ex('九十九', 'jiǔshíjiǔ', '99')],
    },
    {
      title: 'The tone of 一 changes',
      explanation: '一 is yī on its own or when counting. It becomes yí before a 4th tone and yì before the other tones.',
      examples: [ex('一个', 'yí ge', 'one (thing)'), ex('一年', 'yì nián', 'one year')],
    },
  ],
  'zh-u2-l2': [
    {
      title: 'Subject – Verb – Object',
      pattern: 'Subject + Verb + Object',
      explanation: 'The basic word order is the same as in English. Verbs never change for tense or person.',
      examples: [ex('我喝茶。', 'wǒ hē chá.', 'I drink tea.'), ex('你吃米饭。', 'nǐ chī mǐfàn.', 'You eat rice.')],
    },
    {
      title: 'Want to: 想 + verb',
      pattern: 'Subject + 想 + Verb + Object',
      explanation: '想 (xiǎng) before a verb means “want to” or “would like to”. To say you don’t want to, use 不想.',
      examples: [ex('我想喝水。', 'wǒ xiǎng hē shuǐ.', 'I want to drink water.'), ex('我不想吃。', 'wǒ bù xiǎng chī.', 'I don’t want to eat.')],
    },
  ],
  'zh-u3-l1': [
    {
      title: 'Measure words',
      pattern: 'Number + 个 + Noun',
      explanation: 'A number can’t go straight before a noun; a measure word comes between them. 个 (ge) is the general measure word that works for most things.',
      examples: [ex('一个儿子', 'yí ge érzi', 'one son'), ex('三个人', 'sān ge rén', 'three people')],
    },
    {
      title: '有 and 没有',
      explanation: '有 (yǒu) means “to have” or “there is”. Its negative is always 没有, never 不有.',
      examples: [ex('我有女儿。', 'wǒ yǒu nǚ’ér.', 'I have a daughter.'), ex('我没有儿子。', 'wǒ méiyǒu érzi.', 'I don’t have a son.')],
    },
  ],
  'zh-u3-l2': [
    {
      title: 'Possession with 的',
      pattern: 'Owner + 的 + Thing',
      explanation: '的 (de) works like English “’s”. With close family and relationships it is usually dropped: 我妈妈.',
      examples: [ex('我的朋友', 'wǒ de péngyou', 'my friend'), ex('老师的茶', 'lǎoshī de chá', 'the teacher’s tea')],
    },
    {
      title: 'Asking age with 几',
      pattern: 'Subject + Number + 岁',
      explanation: '几 (jǐ) asks “how many” when you expect a small number. Ages don’t need 是.',
      examples: [ex('你几岁？', 'nǐ jǐ suì?', 'How old are you? (to a child)'), ex('我七岁。', 'wǒ qī suì.', 'I am seven.')],
    },
  ],
  'zh-u4-l1': [
    {
      title: 'Dates go from big to small',
      pattern: 'Year + 月 + 号 + 星期',
      explanation:
        'Dates start with the largest unit and end with the smallest. Weekdays are 星期 + 1 to 6 (Monday to Saturday), and Sunday is 星期天.',
      examples: [ex('五月八号', 'wǔ yuè bā hào', 'May 8th'), ex('星期三', 'xīngqīsān', 'Wednesday'), ex('星期天', 'xīngqītiān', 'Sunday')],
    },
  ],
  'zh-u4-l2': [
    {
      title: 'Time words come before the verb',
      pattern: 'Subject + Time + Verb',
      explanation: '“When” goes before the verb, either right after the subject or at the very start of the sentence. It never goes at the end.',
      examples: [ex('我明天来。', 'wǒ míngtiān lái.', 'I’ll come tomorrow.'), ex('下午我去。', 'xiàwǔ wǒ qù.', 'I’ll go in the afternoon.')],
    },
    {
      title: 'Telling the time',
      pattern: 'Number + 点 (+ 半)',
      explanation: 'Number + 点 means “o’clock”, and adding 半 (bàn) makes it half past. For 2 o’clock, use 两 (liǎng) instead of 二.',
      examples: [ex('三点', 'sān diǎn', '3:00'), ex('三点半', 'sān diǎn bàn', '3:30'), ex('两点', 'liǎng diǎn', '2:00')],
    },
  ],
  'zh-u5-l1': [
    {
      title: 'Location with 在',
      pattern: 'Subject + 在 + Place',
      explanation: '在 (zài) means “to be at” and needs no 是. To ask where something is, use 在哪儿.',
      examples: [ex('我在学校。', 'wǒ zài xuéxiào.', 'I’m at school.'), ex('老师在哪儿？', 'lǎoshī zài nǎr?', 'Where is the teacher?')],
    },
    {
      title: '这儿 · 那儿 · 哪儿',
      explanation:
        '这 means “this” (near), 那 means “that” (far), and 哪 means “which”. Adding 儿 turns them into places: here, there, where. Watch the tones: 哪 nǎ is a 3rd tone, 那 nà is a 4th.',
      examples: [ex('在这儿', 'zài zhèr', '(it’s) here'), ex('在那儿', 'zài nàr', '(it’s) over there')],
    },
  ],
  'zh-u5-l2': [
    {
      title: 'This one, that one',
      pattern: '这 / 那 + 个 + Noun',
      explanation: '这 and 那 need a measure word before a noun. On its own, 这个 or 那个 means “this one” or “that one”.',
      examples: [ex('这个杯子', 'zhège bēizi', 'this cup'), ex('我喜欢那个。', 'wǒ xǐhuan nàge.', 'I like that one.')],
    },
    {
      title: 'Saying prices',
      pattern: 'Thing + Number + 块(钱)',
      explanation: 'A price needs no verb. To ask the price, say 多少钱？',
      examples: [ex('苹果五块钱。', 'píngguǒ wǔ kuài qián.', 'Apples are 5 yuan.'), ex('多少钱？', 'duōshao qián?', 'How much is it?')],
    },
  ],
}
