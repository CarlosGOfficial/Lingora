import type { Story } from './types'

export const ZH_STORIES: Story[] = [
  {
    id: 'story:zh-restaurant', lang: 'zh', emoji: '🍜', title: '在饭馆', titleMeaning: 'At the restaurant', level: 'HSK 1',
    scenes: [
      {
        lines: [
          { speaker: '服务员', target: '你好！你们几位？', reading: 'Nǐ hǎo! Nǐmen jǐ wèi?', meaning: 'Hello! How many of you?' },
          { speaker: '小明', target: '两位。', reading: 'Liǎng wèi.', meaning: 'Two.' },
          { speaker: '服务员', target: '请坐。这是菜单。', reading: 'Qǐng zuò. Zhè shì càidān.', meaning: 'Please sit down. Here’s the menu.' },
        ],
        question: { q: 'How many people are eating?', options: ['One', 'Two', 'Three'], answer: 1 },
      },
      {
        lines: [
          { speaker: '小明', target: '我要一碗米饭和一个鸡蛋汤。', reading: 'Wǒ yào yì wǎn mǐfàn hé yí gè jīdàn tāng.', meaning: 'I’d like a bowl of rice and an egg soup.' },
          { speaker: '丽丽', target: '我想喝茶。', reading: 'Wǒ xiǎng hē chá.', meaning: 'I’d like to drink tea.' },
          { speaker: '服务员', target: '好的，请等一下。', reading: 'Hǎo de, qǐng děng yíxià.', meaning: 'OK, please wait a moment.' },
        ],
        question: { q: 'What does Lili want to drink?', options: ['Coffee', 'Tea', 'Water'], answer: 1 },
      },
      {
        lines: [
          { speaker: '小明', target: '服务员，多少钱？', reading: 'Fúwùyuán, duōshao qián?', meaning: 'Excuse me (waiter), how much is it?' },
          { speaker: '服务员', target: '一共三十五块。', reading: 'Yígòng sānshíwǔ kuài.', meaning: '35 kuai altogether.' },
          { speaker: '丽丽', target: '谢谢！再见！', reading: 'Xièxie! Zàijiàn!', meaning: 'Thanks! Goodbye!' },
        ],
        question: { q: 'How much is the bill?', options: ['15 kuai', '35 kuai', '53 kuai'], answer: 1 },
      },
    ],
    glossary: {
      '你好': 'hello', '你们': 'you (plural)', '几': 'how many', '位': '(polite measure word for people)', '两': 'two', '请': 'please',
      '坐': 'sit', '这是': 'this is', '菜单': 'menu', '我': 'I', '要': 'want', '碗': 'bowl', '米饭': 'cooked rice', '和': 'and',
      '一个': 'one, a', '鸡蛋汤': 'egg soup', '想': 'would like', '喝': 'drink', '茶': 'tea', '好的': 'OK', '等一下': 'wait a moment',
      '服务员': 'waiter, waitress', '多少钱': 'how much (money)', '一共': 'altogether', '三十五': 'thirty-five', '块': 'kuai (yuan)',
      '谢谢': 'thank you', '再见': 'goodbye',
    },
  },
  {
    id: 'story:zh-weekend', lang: 'zh', emoji: '🛍️', title: '周末', titleMeaning: 'The weekend', level: 'HSK 1',
    scenes: [
      {
        lines: [
          { speaker: '丽丽', target: '小明，你周末做什么？', reading: 'Xiǎo Míng, nǐ zhōumò zuò shénme?', meaning: 'Xiaoming, what are you doing at the weekend?' },
          { speaker: '小明', target: '我想去商店买衣服。', reading: 'Wǒ xiǎng qù shāngdiàn mǎi yīfu.', meaning: 'I want to go to the shops to buy clothes.' },
          { speaker: '丽丽', target: '我也想去！', reading: 'Wǒ yě xiǎng qù!', meaning: 'I want to go too!' },
        ],
        question: { q: 'What does Xiaoming want to buy?', options: ['Clothes', 'Books', 'Food'], answer: 0 },
      },
      {
        lines: [
          { speaker: '小明', target: '星期六上午九点，好吗？', reading: 'Xīngqīliù shàngwǔ jiǔ diǎn, hǎo ma?', meaning: 'Saturday at nine in the morning, OK?' },
          { speaker: '丽丽', target: '太早了！十点吧。', reading: 'Tài zǎo le! Shí diǎn ba.', meaning: 'Too early! Let’s say ten.' },
          { speaker: '小明', target: '好，十点见。', reading: 'Hǎo, shí diǎn jiàn.', meaning: 'OK, see you at ten.' },
        ],
        question: { q: 'What time will they meet?', options: ['9:00', '10:00', '11:00'], answer: 1 },
      },
      {
        lines: [
          { speaker: '丽丽', target: '我们坐出租车去吗？', reading: 'Wǒmen zuò chūzūchē qù ma?', meaning: 'Shall we take a taxi?' },
          { speaker: '小明', target: '不，我们坐公共汽车去。', reading: 'Bù, wǒmen zuò gōnggòng qìchē qù.', meaning: 'No, let’s take the bus.' },
          { speaker: '丽丽', target: '好的，星期六见！', reading: 'Hǎo de, xīngqīliù jiàn!', meaning: 'OK, see you on Saturday!' },
        ],
        question: { q: 'How will they get there?', options: ['By taxi', 'By bus', 'On foot'], answer: 1 },
      },
    ],
    glossary: {
      '周末': 'weekend', '做': 'do', '什么': 'what', '我': 'I', '你': 'you', '想': 'want to', '去': 'go', '商店': 'shop', '买': 'buy',
      '衣服': 'clothes', '也': 'also, too', '星期六': 'Saturday', '上午': 'morning', '九点': 'nine o’clock', '十点': 'ten o’clock',
      '好吗': 'OK?', '太': 'too', '早': 'early', '吧': '(makes a suggestion)', '见': 'see (you)', '我们': 'we', '坐': 'take (transport)',
      '出租车': 'taxi', '不': 'no, not', '公共汽车': 'bus', '好的': 'OK',
    },
  },
]
