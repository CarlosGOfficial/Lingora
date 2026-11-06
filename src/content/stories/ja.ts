import type { Story } from './types'

export const JA_STORIES: Story[] = [
  {
    id: 'story:ja-cafe', lang: 'ja', emoji: '☕', title: 'カフェで', titleMeaning: 'At the café', level: 'N5',
    scenes: [
      {
        lines: [
          { speaker: '店員', target: 'いらっしゃいませ！', meaning: 'Welcome!' },
          { speaker: 'ゆき', target: 'こんにちは。コーヒーをください。', meaning: 'Hello. A coffee, please.' },
          { speaker: '店員', target: 'ホットですか、アイスですか。', meaning: 'Hot or iced?' },
          { speaker: 'ゆき', target: 'ホットでおねがいします。', meaning: 'Hot, please.' },
        ],
        question: { q: 'What does Yuki order?', options: ['A hot coffee', 'An iced tea', 'A cake'], answer: 0 },
      },
      {
        lines: [
          { speaker: '店員', target: 'ケーキもいかがですか。', meaning: 'Would you like some cake too?' },
          { speaker: 'ゆき', target: 'うーん…チョコレートケーキはいくらですか。', meaning: 'Hmm… how much is the chocolate cake?' },
          { speaker: '店員', target: '四百円です。', reading: 'よんひゃくえんです。', meaning: 'It’s 400 yen.' },
          { speaker: 'ゆき', target: 'じゃあ、それもください。', meaning: 'Then I’ll have that too.' },
        ],
        question: { q: 'How much is the chocolate cake?', options: ['300 yen', '400 yen', '1,000 yen'], answer: 1 },
      },
      {
        lines: [
          { speaker: '店員', target: 'ぜんぶで九百円です。', reading: 'ぜんぶできゅうひゃくえんです。', meaning: 'That’s 900 yen altogether.' },
          { speaker: 'ゆき', target: 'はい、どうぞ。', meaning: 'Here you go.' },
          { speaker: '店員', target: 'ありがとうございます。またどうぞ！', meaning: 'Thank you. Please come again!' },
        ],
        question: { q: 'How much does Yuki pay in total?', options: ['400 yen', '500 yen', '900 yen'], answer: 2 },
      },
    ],
    glossary: {
      'いらっしゃいませ': 'welcome (said by shop staff)', 'こんにちは': 'hello', 'コーヒー': 'coffee', 'ください': 'please give me',
      'ホット': 'hot', 'アイス': 'iced', 'おねがいします': 'please', 'ケーキ': 'cake', 'いかがですか': 'how about…?',
      'チョコレート': 'chocolate', 'いくら': 'how much', '四百': 'four hundred', '九百': 'nine hundred', '円': 'yen',
      'じゃあ': 'well then', 'それ': 'that', 'ぜんぶで': 'altogether', 'どうぞ': 'here you go', 'ありがとうございます': 'thank you very much',
      'また': 'again', 'も': 'also, too',
    },
  },
  {
    id: 'story:ja-friend', lang: 'ja', emoji: '🤝', title: 'あたらしいともだち', titleMeaning: 'A new friend', level: 'N5',
    scenes: [
      {
        lines: [
          { speaker: 'ケン', target: 'はじめまして。ケンです。', meaning: 'Nice to meet you. I’m Ken.' },
          { speaker: 'ハナ', target: 'はじめまして。ハナです。よろしくおねがいします。', meaning: 'Nice to meet you. I’m Hana. Pleased to meet you.' },
          { speaker: 'ケン', target: 'ハナさんは学生ですか。', reading: 'ハナさんはがくせいですか。', meaning: 'Hana, are you a student?' },
          { speaker: 'ハナ', target: 'はい、大学生です。', reading: 'はい、だいがくせいです。', meaning: 'Yes, I’m a university student.' },
        ],
        question: { q: 'What does Hana do?', options: ['She’s a teacher', 'She’s a university student', 'She’s a doctor'], answer: 1 },
      },
      {
        lines: [
          { speaker: 'ケン', target: 'しゅみはなんですか。', meaning: 'What are your hobbies?' },
          { speaker: 'ハナ', target: 'えいがとおんがくがすきです。', meaning: 'I like movies and music.' },
          { speaker: 'ケン', target: 'ぼくもえいががすきです！', meaning: 'I like movies too!' },
        ],
        question: { q: 'What do they both like?', options: ['Movies', 'Sports', 'Cooking'], answer: 0 },
      },
      {
        lines: [
          { speaker: 'ハナ', target: 'こんどいっしょにえいがをみませんか。', meaning: 'Would you like to watch a movie together sometime?' },
          { speaker: 'ケン', target: 'いいですね！土曜日はどうですか。', reading: 'いいですね！どようびはどうですか。', meaning: 'Sounds good! How about Saturday?' },
          { speaker: 'ハナ', target: '土曜日、だいじょうぶです。', reading: 'どようび、だいじょうぶです。', meaning: 'Saturday is fine.' },
        ],
        question: { q: 'When will they see a movie?', options: ['Friday', 'Saturday', 'Sunday'], answer: 1 },
      },
    ],
    glossary: {
      'はじめまして': 'nice to meet you', 'よろしくおねがいします': 'pleased to meet you', '学生': 'student', '大学生': 'university student',
      'しゅみ': 'hobby', 'なん': 'what', 'えいが': 'movie', 'おんがく': 'music', 'すき': 'liked', 'ぼく': 'I (boys)', 'も': 'also, too',
      'こんど': 'next time, sometime', 'いっしょに': 'together', 'みませんか': 'won’t you watch…?', 'いいですね': 'sounds good',
      '土曜日': 'Saturday', 'どう': 'how', 'だいじょうぶ': 'fine, OK', 'はい': 'yes', 'さん': '(polite name ending)',
    },
  },
]
