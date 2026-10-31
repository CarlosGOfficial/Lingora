import type { GrammarExample, GrammarPoint } from '../types'

/** reading is omitted when the target is already kana-only. */
const ex = (target: string, reading: string | null, romanization: string, meaning: string): GrammarExample => ({
  target,
  ...(reading ? { reading } : {}),
  romanization,
  meaning,
})

export const jaGrammar: Record<string, GrammarPoint[]> = {
  'ja-u1-l1': [
    {
      title: 'Casual vs polite',
      explanation:
        'おはよう and ありがとう are casual. Add ございます to make them polite. Use the polite forms with strangers, teachers and at work.',
      examples: [ex('おはようございます。', null, 'ohayou gozaimasu', 'Good morning. (polite)'), ex('ありがとうございます。', null, 'arigatou gozaimasu', 'Thank you very much.')],
    },
    {
      title: 'Greetings by time of day',
      explanation: 'Say おはよう in the morning, こんにちは during the day and こんばんは in the evening. The final は is pronounced “wa”.',
      examples: [ex('こんにちは。', null, 'konnichiwa', 'Hello. (daytime)'), ex('こんばんは。', null, 'konbanwa', 'Good evening.')],
    },
  ],
  'ja-u1-l2': [
    {
      title: 'A は B です',
      pattern: 'A は B です',
      explanation:
        'This pattern means “A is B”. は (written “ha”, pronounced “wa”) marks the topic, the thing you’re talking about, and です politely ends the sentence.',
      examples: [ex('私は学生です。', 'わたしはがくせいです。', 'watashi wa gakusei desu', 'I am a student.'), ex('先生は日本人です。', 'せんせいはにほんじんです。', 'sensei wa nihonjin desu', 'The teacher is Japanese.')],
    },
    {
      title: 'Leave out the obvious',
      explanation: 'When it’s clear who you mean, Japanese usually drops “I” or “you”. 学生です on its own already means “(I) am a student.”',
      examples: [ex('学生です。', 'がくせいです。', 'gakusei desu', '(I) am a student.')],
    },
    {
      title: 'Negative: じゃありません',
      pattern: 'A は B じゃありません',
      explanation: 'To say “is not”, replace です with じゃありません.',
      examples: [ex('私は先生じゃありません。', 'わたしはせんせいじゃありません。', 'watashi wa sensei ja arimasen', 'I am not a teacher.')],
    },
  ],
  'ja-u1-l3': [
    {
      title: 'Questions with か',
      pattern: 'Sentence + か',
      explanation: 'Adding か to the end of a sentence turns it into a question. Japanese often writes 。 instead of ？ after it.',
      examples: [ex('これは何ですか。', 'これはなんですか。', 'kore wa nan desu ka', 'What is this?'), ex('学生ですか。', 'がくせいですか。', 'gakusei desu ka', 'Are you a student?')],
    },
    {
      title: 'こ・そ・あ・ど',
      explanation:
        'これ means “this” (near me), それ means “that” (near you), あれ means “that over there”, and どれ means “which”. The same こ・そ・あ・ど pattern comes back later for places.',
      examples: [ex('それは本です。', 'それはほんです。', 'sore wa hon desu', 'That is a book.'), ex('あれは何ですか。', 'あれはなんですか。', 'are wa nan desu ka', 'What is that over there?')],
    },
  ],
  'ja-u2-l1': [
    {
      title: 'Numbers 11–99',
      explanation: 'Bigger numbers are built like arithmetic: 十一 = 10 + 1 = 11, 二十 = 2 × 10 = 20, and 三十五 = 35.',
      examples: [ex('十一', 'じゅういち', 'juuichi', '11'), ex('二十', 'にじゅう', 'nijuu', '20'), ex('三十五', 'さんじゅうご', 'sanjuugo', '35')],
    },
    {
      title: 'Two readings for 4, 7 and 9',
      explanation:
        '4 can be よん or し, 7 can be なな or しち, and 9 can be きゅう or く. For counting, よん, なな and きゅう are the safest. Clock times use よじ, しちじ and くじ.',
      examples: [ex('四時', 'よじ', 'yoji', '4 o’clock'), ex('九時', 'くじ', 'kuji', '9 o’clock')],
    },
  ],
  'ja-u2-l2': [
    {
      title: 'The verb comes last',
      pattern: 'Object を Verb',
      explanation: 'Japanese word order is Subject – Object – Verb. を (pronounced “o”) marks the object of the verb.',
      examples: [ex('お茶を飲みます。', 'おちゃをのみます。', 'ocha wo nomimasu', 'I drink tea.'), ex('すしを食べます。', 'すしをたべます。', 'sushi wo tabemasu', 'I eat sushi.')],
    },
    {
      title: 'Negative: ません',
      explanation: 'To say “don’t”, change ます to ません.',
      examples: [ex('お茶を飲みません。', 'おちゃをのみません。', 'ocha wo nomimasen', 'I don’t drink tea.')],
    },
    {
      title: '好き takes が',
      pattern: 'Thing が 好きです',
      explanation: '好き is an adjective (“liked”), not a verb, so the thing you like is marked with が, not を.',
      examples: [ex('すしが好きです。', 'すしがすきです。', 'sushi ga suki desu', 'I like sushi.')],
    },
  ],
  'ja-u3-l1': [
    {
      title: 'Your family vs. someone else’s',
      explanation:
        'Use humble words for your own family: 父, 母, 兄, 姉. For someone else’s family, use the polite お〜さん forms: お父さん, お母さん, お兄さん, お姉さん.',
      examples: [ex('父は先生です。', 'ちちはせんせいです。', 'chichi wa sensei desu', 'My father is a teacher.'), ex('お母さんは日本人ですか。', 'おかあさんはにほんじんですか。', 'okaasan wa nihonjin desu ka', 'Is your mother Japanese?')],
    },
    {
      title: 'います vs あります',
      pattern: 'Thing が います / あります',
      explanation: 'Both mean “there is” or “I have”. Use います for living things (people and animals) and あります for objects.',
      examples: [ex('姉がいます。', 'あねがいます。', 'ane ga imasu', 'I have an older sister.'), ex('本があります。', 'ほんがあります。', 'hon ga arimasu', 'There is a book.')],
    },
  ],
  'ja-u3-l2': [
    {
      title: 'い-adjectives',
      pattern: 'Noun は Adj-い です',
      explanation: 'Adjectives that end in い can go before a noun or at the end of a sentence before です.',
      examples: [ex('このペンは安いです。', 'このペンはやすいです。', 'kono pen wa yasui desu', 'This pen is cheap.'), ex('新しい本', 'あたらしいほん', 'atarashii hon', 'a new book')],
    },
    {
      title: 'Negative い-adjectives',
      explanation: 'To make one negative, replace the final い with くない. いい is irregular: its negative is よくない.',
      examples: [ex('高くないです。', 'たかくないです。', 'takakunai desu', 'It’s not expensive.'), ex('よくないです。', null, 'yokunai desu', 'It’s not good.')],
    },
  ],
  'ja-u4-l1': [
    {
      title: 'Telling the time',
      pattern: 'Number + 時 (+ 半)',
      explanation: 'Number + 時 (じ) means “o’clock”, and adding 半 (はん) makes it half past. To ask the time, say 何時ですか.',
      examples: [ex('三時', 'さんじ', 'sanji', '3:00'), ex('三時半', 'さんじはん', 'sanjihan', '3:30'), ex('何時ですか。', 'なんじですか。', 'nanji desu ka', 'What time is it?')],
    },
    {
      title: 'Which time words take に',
      explanation: 'Relative time words like 今日, 明日, 毎日 and 今 don’t take に. Specific clock times do: 七時に.',
      examples: [ex('毎日飲みます。', 'まいにちのみます。', 'mainichi nomimasu', 'I drink it every day.'), ex('七時に起きます。', 'しちじにおきます。', 'shichiji ni okimasu', 'I get up at seven.')],
    },
  ],
  'ja-u4-l2': [
    {
      title: 'に for time, へ for direction',
      explanation: 'に marks a point in time (七時に). へ (pronounced “e”) marks a direction (学校へ). に can also mark where you’re going: 学校に行きます.',
      examples: [ex('学校へ行きます。', 'がっこうへいきます。', 'gakkou e ikimasu', 'I go to school.'), ex('八時に寝ます。', 'はちじにねます。', 'hachiji ni nemasu', 'I go to bed at eight.')],
    },
    {
      title: 'ます for now and the future',
      explanation: 'The ます form covers both present and future: 行きます means “I go” or “I will go”. For the past, use ました.',
      examples: [ex('明日行きます。', 'あしたいきます。', 'ashita ikimasu', 'I’ll go tomorrow.'), ex('昨日行きました。', 'きのういきました。', 'kinou ikimashita', 'I went yesterday.')],
    },
  ],
  'ja-u5-l1': [
    {
      title: 'ここ・そこ・あそこ・どこ',
      pattern: 'Place は どこ ですか',
      explanation: 'These words for places follow the same pattern as これ・それ・あれ・どれ: here, there (near you), over there, and where.',
      examples: [ex('駅はどこですか。', 'えきはどこですか。', 'eki wa doko desu ka', 'Where is the station?'), ex('ここです。', null, 'koko desu', 'It’s here.')],
    },
    {
      title: 'Start with すみません',
      explanation: 'When you ask a stranger something, open with すみません (“excuse me”).',
      examples: [ex('すみません、トイレはどこですか。', null, 'sumimasen, toire wa doko desu ka', 'Excuse me, where is the toilet?')],
    },
  ],
  'ja-u5-l2': [
    {
      title: 'Asking for things: 〜をください',
      pattern: 'Thing を ください',
      explanation: 'This is the simplest polite way to ask for something in a shop or restaurant.',
      examples: [ex('これをください。', null, 'kore wo kudasai', 'This one, please.'), ex('お茶をください。', 'おちゃをください。', 'ocha wo kudasai', 'Tea, please.')],
    },
    {
      title: 'Hundreds and thousands',
      explanation:
        '百 is 100 and 千 is 1,000. Some combinations change sound: 三百 (さんびゃく), 六百 (ろっぴゃく), 八百 (はっぴゃく) and 三千 (さんぜん).',
      examples: [ex('三百円', 'さんびゃくえん', 'sanbyaku en', '300 yen'), ex('千円', 'せんえん', 'sen en', '1,000 yen')],
    },
  ],
}
