import { addLessons, insertUnits } from './extend'
import { jaMoreUnits } from './ja-units-more'
import { jaMoreLessons } from './ja-more'
import { jaTier23Units } from './ja-tier2-3'
import type { Course, Item } from './types'

/** reading is omitted when the target is already kana-only. */
const w = (id: string, target: string, reading: string | null, romanization: string, meaning: string, extra: Partial<Item> = {}): Item => ({
  id: `ja-${id}`,
  kind: 'word',
  target,
  ...(reading ? { reading } : {}),
  romanization,
  meaning,
  ...extra,
})

const s = (
  id: string,
  target: string,
  reading: string | null,
  romanization: string,
  meaning: string,
  tokens: string[],
  extra: Partial<Item> = {},
): Item => ({
  id: `ja-${id}`,
  kind: 'sentence',
  target,
  ...(reading ? { reading } : {}),
  romanization,
  meaning,
  tokens,
  ...extra,
})

export const ja: Course = {
  lang: 'ja',
  name: 'Japanese',
  nativeName: '日本語',
  badge: '日',
  standard: 'JLPT',
  standardFull: 'Japanese-Language Proficiency Test (N5 → N1)',
  bcp47: 'ja-JP',
  readingLabel: 'Kana',
  typingHint: 'Type in kana, kanji or romaji.',
  units: insertUnits(addLessons([
    {
      id: 'ja-u1',
      title: 'Greetings & Introductions',
      level: 'N5',
      canDo: ['Greet people at different times of day', 'Introduce yourself with です', 'Ask and answer “what is this?”'],
      lessons: [
        {
          id: 'ja-u1-l1',
          title: 'Greetings',
          goal: 'Greet people politely',
          items: [
            w('ohayou', 'おはよう', null, 'ohayou', 'good morning', { alt: ['ohayo'] }),
            w('konnichiwa', 'こんにちは', null, 'konnichiwa', 'hello', { alt: ['konnichiha'], note: 'The final は is pronounced “wa”.' }),
            w('konbanwa', 'こんばんは', null, 'konbanwa', 'good evening', { alt: ['konbanha'] }),
            w('arigatou', 'ありがとう', null, 'arigatou', 'thank you', { alt: ['arigato'], meaningAlt: ['thanks'] }),
            w('sumimasen', 'すみません', null, 'sumimasen', 'excuse me', { meaningAlt: ['sorry'] }),
            w('sayounara', 'さようなら', null, 'sayounara', 'goodbye', { alt: ['sayonara'] }),
          ],
          sentences: [
            s('s-ohayougozaimasu', 'おはようございます。', null, 'ohayou gozaimasu', 'Good morning. (polite)', ['おはよう', 'ございます'], {
              alt: ['ohayo gozaimasu'],
              note: 'Add ございます to make it polite.',
            }),
            s('s-arigatougozaimasu', 'ありがとうございます。', null, 'arigatou gozaimasu', 'Thank you very much.', ['ありがとう', 'ございます'], {
              alt: ['arigato gozaimasu'],
            }),
          ],
        },
        {
          id: 'ja-u1-l2',
          title: 'Self-introduction',
          goal: 'Say who you are',
          items: [
            w('watashi', '私', 'わたし', 'watashi', 'I', { meaningAlt: ['me'] }),
            w('gakusei', '学生', 'がくせい', 'gakusei', 'student'),
            w('sensei', '先生', 'せんせい', 'sensei', 'teacher'),
            w('nihonjin', '日本人', 'にほんじん', 'nihonjin', 'Japanese person', { note: 'Country + 人 (じん) = a person from that country.' }),
            w('amerikajin', 'アメリカ人', 'アメリカじん', 'amerikajin', 'American (person)'),
            w('hai', 'はい', null, 'hai', 'yes'),
            w('iie', 'いいえ', null, 'iie', 'no'),
          ],
          sentences: [
            s('s-watashiwagakusei', '私は学生です。', 'わたしはがくせいです。', 'watashi wa gakusei desu', 'I am a student.', ['私', 'は', '学生', 'です'], {
              note: 'は (wa) marks the topic; です makes it polite “is/am”.',
            }),
            s('s-senseiwanihonjin', '先生は日本人です。', 'せんせいはにほんじんです。', 'sensei wa nihonjin desu', 'The teacher is Japanese.', [
              '先生',
              'は',
              '日本人',
              'です',
            ]),
            s('s-haisoudesu', 'はい、そうです。', null, 'hai, sou desu', 'Yes, that’s right.', ['はい', 'そう', 'です'], { alt: ['hai sodesu'] }),
          ],
        },
        {
          id: 'ja-u1-l3',
          title: 'What is this?',
          goal: 'Ask and name things',
          items: [
            w('kore', 'これ', null, 'kore', 'this'),
            w('sore', 'それ', null, 'sore', 'that'),
            w('nan', '何', 'なん', 'nan', 'what', { alt: ['なに', 'nani'] }),
            w('hon', '本', 'ほん', 'hon', 'book'),
            w('pen', 'ペン', null, 'pen', 'pen'),
            w('mizu', '水', 'みず', 'mizu', 'water'),
          ],
          sentences: [
            s('s-korewanan', 'これは何ですか。', 'これはなんですか。', 'kore wa nan desu ka', 'What is this?', ['これ', 'は', '何', 'です', 'か'], {
              note: 'か at the end makes a question.',
            }),
            s('s-sorewahon', 'それは本です。', 'それはほんです。', 'sore wa hon desu', 'That is a book.', ['それ', 'は', '本', 'です']),
            s('s-korewapen', 'これはペンです。', null, 'kore wa pen desu', 'This is a pen.', ['これ', 'は', 'ペン', 'です']),
          ],
        },
      ],
      reading: {
        id: 'ja-u1-r',
        title: 'はじめまして · Nice to meet you',
        sentences: [
          s('r1-1', 'はじめまして。私はケンです。', 'はじめまして。わたしはケンです。', 'hajimemashite. watashi wa ken desu', 'Nice to meet you. I am Ken.', []),
          s('r1-2', '日本人です。学生です。', 'にほんじんです。がくせいです。', 'nihonjin desu. gakusei desu', 'I’m Japanese. I’m a student.', []),
          s('r1-3', 'こちらはスミス先生です。', 'こちらはスミスせんせいです。', 'kochira wa sumisu sensei desu', 'This is Professor Smith.', [], {
            note: 'こちら (kochira) is a polite “this person”.',
          }),
          s('r1-4', '先生はアメリカ人です。', 'せんせいはアメリカじんです。', 'sensei wa amerikajin desu', 'The teacher is American.', []),
        ],
        questions: [
          { q: 'What nationality is Ken?', options: ['American', 'Japanese', 'Chinese'], answer: 1 },
          { q: 'What is Smith’s job?', options: ['Student', 'Teacher', 'Doctor'], answer: 1 },
          { q: 'Where is Smith from?', options: ['Japan', 'America', 'Brazil'], answer: 1 },
        ],
      },
    },
    {
      id: 'ja-u2',
      title: 'Numbers & Food',
      level: 'N5',
      canDo: ['Count from one to ten', 'Say what you eat and drink with を', 'Say what you like with が好き'],
      lessons: [
        {
          id: 'ja-u2-l1',
          title: 'Numbers 1–10',
          goal: 'Count from one to ten',
          items: [
            w('ichi', '一', 'いち', 'ichi', 'one', { meaningAlt: ['1'] }),
            w('ni', '二', 'に', 'ni', 'two', { meaningAlt: ['2'] }),
            w('san', '三', 'さん', 'san', 'three', { meaningAlt: ['3'] }),
            w('yon', '四', 'よん', 'yon', 'four', { alt: ['し', 'shi'], meaningAlt: ['4'] }),
            w('go', '五', 'ご', 'go', 'five', { meaningAlt: ['5'] }),
            w('roku', '六', 'ろく', 'roku', 'six', { meaningAlt: ['6'] }),
            w('nana', '七', 'なな', 'nana', 'seven', { alt: ['しち', 'shichi'], meaningAlt: ['7'] }),
            w('hachi', '八', 'はち', 'hachi', 'eight', { meaningAlt: ['8'] }),
            w('kyuu', '九', 'きゅう', 'kyuu', 'nine', { alt: ['く', 'ku', 'kyu'], meaningAlt: ['9'] }),
            w('juu', '十', 'じゅう', 'juu', 'ten', { alt: ['ju'], meaningAlt: ['10'] }),
          ],
          sentences: [s('s-ikuradesuka', 'いくらですか。', null, 'ikura desu ka', 'How much is it?', ['いくら', 'です', 'か'])],
        },
        {
          id: 'ja-u2-l2',
          title: 'Eating & Drinking',
          goal: 'Say what you eat, drink and like',
          items: [
            w('tabemasu', '食べます', 'たべます', 'tabemasu', 'to eat'),
            w('nomimasu', '飲みます', 'のみます', 'nomimasu', 'to drink'),
            w('ocha', 'お茶', 'おちゃ', 'ocha', 'tea', { meaningAlt: ['green tea'] }),
            w('gohan', 'ご飯', 'ごはん', 'gohan', 'rice', { meaningAlt: ['meal'] }),
            w('sushi', 'すし', null, 'sushi', 'sushi', { alt: ['寿司'] }),
            w('suki', '好き', 'すき', 'suki', 'like', { meaningAlt: ['to like'] }),
          ],
          sentences: [
            s('s-ochawonomimasu', 'お茶を飲みます。', 'おちゃをのみます。', 'ocha wo nomimasu', 'I drink tea.', ['お茶', 'を', '飲みます'], {
              alt: ['ocha o nomimasu'],
              note: 'を (o) marks the object of the verb.',
            }),
            s('s-gohanwotabemasu', 'ご飯を食べます。', 'ごはんをたべます。', 'gohan wo tabemasu', 'I eat rice.', ['ご飯', 'を', '食べます'], {
              alt: ['gohan o tabemasu'],
            }),
            s('s-sushigasuki', 'すしが好きです。', 'すしがすきです。', 'sushi ga suki desu', 'I like sushi.', ['すし', 'が', '好き', 'です']),
          ],
        },
      ],
      reading: {
        id: 'ja-u2-r',
        title: 'すきなもの · Things I like',
        sentences: [
          s('r2-1', '私はケンです。すしが好きです。', 'わたしはケンです。すしがすきです。', 'watashi wa ken desu. sushi ga suki desu', 'I am Ken. I like sushi.', []),
          s('r2-2', 'お茶も好きです。', 'おちゃもすきです。', 'ocha mo suki desu', 'I like tea too.', [], { note: 'も (mo) = also / too' }),
          s('r2-3', '朝、ご飯を食べます。', 'あさ、ごはんをたべます。', 'asa, gohan wo tabemasu', 'In the morning, I eat rice.', [], { note: '朝 (あさ) = morning' }),
        ],
        questions: [
          { q: 'What food does Ken like?', options: ['Sushi', 'Bread', 'Noodles'], answer: 0 },
          { q: 'What else does Ken like?', options: ['Coffee', 'Water', 'Tea'], answer: 2 },
          { q: 'What does Ken eat in the morning?', options: ['Rice', 'Sushi', 'Nothing'], answer: 0 },
        ],
      },
    },
    {
      id: 'ja-u3',
      title: 'Family & Describing',
      level: 'N5',
      canDo: ['Talk about your own family (humble terms)', 'Describe things with い-adjectives', 'Say someone is there with います'],
      lessons: [
        {
          id: 'ja-u3-l1',
          title: 'My Family',
          goal: 'Name your family members',
          items: [
            w('u3-kazoku', '家族', 'かぞく', 'kazoku', 'family'),
            w('u3-chichi', '父', 'ちち', 'chichi', '(my) father', { meaningAlt: ['dad'], note: 'Humble word for your own father; someone else’s is お父さん.' }),
            w('u3-haha', '母', 'はは', 'haha', '(my) mother', { meaningAlt: ['mom'], note: 'Someone else’s mother is お母さん.' }),
            w('u3-ani', '兄', 'あに', 'ani', '(my) older brother'),
            w('u3-ane', '姉', 'あね', 'ane', '(my) older sister'),
            w('u3-tomodachi', '友達', 'ともだち', 'tomodachi', 'friend'),
            w('u3-kodomo', '子供', 'こども', 'kodomo', 'child', { meaningAlt: ['children', 'kid'] }),
            w('u3-imasu', 'います', null, 'imasu', 'there is (people/animals)', { meaningAlt: ['to have (family)'], note: 'Living things use います; objects use あります.' }),
          ],
          sentences: [
            s('u3-s-chichisensei', '父は先生です。', 'ちちはせんせいです。', 'chichi wa sensei desu', 'My father is a teacher.', ['父', 'は', '先生', 'です']),
            s('u3-s-anegaimasu', '姉がいます。', 'あねがいます。', 'ane ga imasu', 'I have an older sister.', ['姉', 'が', 'います'], {
              note: 'Literally “an older sister exists”.',
            }),
            s('u3-s-tomodachinihonjin', '友達は日本人です。', 'ともだちはにほんじんです。', 'tomodachi wa nihonjin desu', 'My friend is Japanese.', [
              '友達',
              'は',
              '日本人',
              'です',
            ]),
          ],
        },
        {
          id: 'ja-u3-l2',
          title: 'Big, Small, New, Old',
          goal: 'Describe things',
          items: [
            w('u3-ookii', '大きい', 'おおきい', 'ookii', 'big', { meaningAlt: ['large'] }),
            w('u3-chiisai', '小さい', 'ちいさい', 'chiisai', 'small', { meaningAlt: ['little'] }),
            w('u3-atarashii', '新しい', 'あたらしい', 'atarashii', 'new'),
            w('u3-furui', '古い', 'ふるい', 'furui', 'old (things)', { note: 'For things only — not for people’s age.' }),
            w('u3-ii', 'いい', null, 'ii', 'good'),
            w('u3-takai', '高い', 'たかい', 'takai', 'expensive', { meaningAlt: ['tall', 'high'] }),
            w('u3-yasui', '安い', 'やすい', 'yasui', 'cheap'),
            w('u3-kono', 'この', null, 'kono', 'this (+ noun)', { note: 'これ stands alone; この needs a noun: このペン.' }),
          ],
          sentences: [
            s('u3-s-konopenyasui', 'このペンは安いです。', 'このペンはやすいです。', 'kono pen wa yasui desu', 'This pen is cheap.', ['この', 'ペン', 'は', '安い', 'です']),
            s('u3-s-honfurui', '本は古いです。', 'ほんはふるいです。', 'hon wa furui desu', 'The book is old.', ['本', 'は', '古い', 'です']),
            s('u3-s-hahaiisensei', '母はいい先生です。', 'はははいいせんせいです。', 'haha wa ii sensei desu', 'My mother is a good teacher.', [
              '母',
              'は',
              'いい',
              '先生',
              'です',
            ]),
          ],
        },
      ],
      reading: {
        id: 'ja-u3-r',
        title: '私の家族 · My Family',
        sentences: [
          s('r3-1', '私の家族は四人です。', 'わたしのかぞくはよにんです。', 'watashi no kazoku wa yonin desu', 'There are four people in my family.', [], {
            note: 'の = possessive (’s); 四人 (よにん) = four people',
          }),
          s('r3-2', '父と母と姉と私です。', 'ちちとははとあねとわたしです。', 'chichi to haha to ane to watashi desu', 'My father, mother, older sister and me.', [], {
            note: 'と = and',
          }),
          s('r3-3', '父は先生です。姉は学生です。', 'ちちはせんせいです。あねはがくせいです。', 'chichi wa sensei desu. ane wa gakusei desu', 'My father is a teacher. My sister is a student.', []),
          s('r3-4', '母はいい人です。', 'はははいいひとです。', 'haha wa ii hito desu', 'My mother is a good person.', [], { note: '人 (ひと) = person' }),
        ],
        questions: [
          { q: 'How many people are in the family?', options: ['Three', 'Four', 'Five'], answer: 1 },
          { q: 'What does the father do?', options: ['He is a teacher', 'He is a student', 'He is a doctor'], answer: 0 },
          { q: 'Who is a student?', options: ['The mother', 'The father', 'The older sister'], answer: 2 },
        ],
      },
    },
    {
      id: 'ja-u4',
      title: 'Time & Daily Routine',
      level: 'N5',
      canDo: ['Ask and tell the time', 'Talk about your daily routine with ます verbs', 'Use に for times and へ for destinations'],
      lessons: [
        {
          id: 'ja-u4-l1',
          title: 'Today & Now',
          goal: 'Talk about days and times',
          items: [
            w('u4-kyou', '今日', 'きょう', 'kyou', 'today', { alt: ['kyo'] }),
            w('u4-ashita', '明日', 'あした', 'ashita', 'tomorrow'),
            w('u4-kinou', '昨日', 'きのう', 'kinou', 'yesterday', { alt: ['kino'] }),
            w('u4-ima', '今', 'いま', 'ima', 'now'),
            w('u4-ji', '時', 'じ', 'ji', 'o’clock', { note: 'Number + 時: 三時 (さんじ) = 3:00. Watch 四時 (よじ) and 九時 (くじ).' }),
            w('u4-asa', '朝', 'あさ', 'asa', 'morning'),
            w('u4-ban', '晩', 'ばん', 'ban', 'evening', { meaningAlt: ['night'] }),
            w('u4-mainichi', '毎日', 'まいにち', 'mainichi', 'every day'),
          ],
          sentences: [
            s('u4-s-imananji', '今、何時ですか。', 'いま、なんじですか。', 'ima, nanji desu ka', 'What time is it now?', ['今', '何時', 'です', 'か']),
            s('u4-s-imasanji', '今、三時です。', 'いま、さんじです。', 'ima, sanji desu', 'It’s three o’clock now.', ['今', '三時', 'です']),
            s('u4-s-mainichiocha', '毎日お茶を飲みます。', 'まいにちおちゃをのみます。', 'mainichi ocha wo nomimasu', 'I drink tea every day.', ['毎日', 'お茶', 'を', '飲みます'], {
              alt: ['mainichi ocha o nomimasu'],
            }),
          ],
        },
        {
          id: 'ja-u4-l2',
          title: 'Daily Routine',
          goal: 'Say what you do each day',
          items: [
            w('u4-ikimasu', '行きます', 'いきます', 'ikimasu', 'to go'),
            w('u4-kimasu', '来ます', 'きます', 'kimasu', 'to come'),
            w('u4-kaerimasu', '帰ります', 'かえります', 'kaerimasu', 'to go home', { meaningAlt: ['to return'] }),
            w('u4-okimasu', '起きます', 'おきます', 'okimasu', 'to get up', { meaningAlt: ['to wake up'] }),
            w('u4-nemasu', '寝ます', 'ねます', 'nemasu', 'to sleep', { meaningAlt: ['to go to bed'] }),
            w('u4-gakkou', '学校', 'がっこう', 'gakkou', 'school', { alt: ['gakko'] }),
            w('u4-ie', '家', 'いえ', 'ie', 'house', { meaningAlt: ['home'] }),
          ],
          sentences: [
            s('u4-s-gakkouikimasu', '学校へ行きます。', 'がっこうへいきます。', 'gakkou e ikimasu', 'I go to school.', ['学校', 'へ', '行きます'], {
              alt: ['gakkou he ikimasu'],
              note: 'へ (pronounced “e”) marks the destination.',
            }),
            s('u4-s-shichijiokimasu', '七時に起きます。', 'しちじにおきます。', 'shichiji ni okimasu', 'I get up at seven.', ['七時', 'に', '起きます'], {
              note: 'に marks a specific time.',
            }),
            s('u4-s-ashitakaerimasu', '明日、家へ帰ります。', 'あした、いえへかえります。', 'ashita, ie e kaerimasu', 'Tomorrow I’ll go home.', ['明日', '家', 'へ', '帰ります'], {
              alt: ['ashita ie he kaerimasu'],
            }),
          ],
        },
      ],
      reading: {
        id: 'ja-u4-r',
        title: '私の一日 · My Day',
        sentences: [
          s('r4-1', '私は毎日七時に起きます。', 'わたしはまいにちしちじにおきます。', 'watashi wa mainichi shichiji ni okimasu', 'I get up at seven every day.', []),
          s('r4-2', '朝ご飯を食べます。', 'あさごはんをたべます。', 'asagohan wo tabemasu', 'I eat breakfast.', [], { note: '朝ご飯 = breakfast (“morning meal”)' }),
          s('r4-3', '八時に学校へ行きます。', 'はちじにがっこうへいきます。', 'hachiji ni gakkou e ikimasu', 'At eight I go to school.', []),
          s('r4-4', '晩、十一時に寝ます。', 'ばん、じゅういちじにねます。', 'ban, juuichiji ni nemasu', 'In the evening, I go to bed at eleven.', [], {
            note: '十一 = 10 + 1 = eleven',
          }),
        ],
        questions: [
          { q: 'What time does the writer get up?', options: ['6:00', '7:00', '8:00'], answer: 1 },
          { q: 'When does the writer go to school?', options: ['8:00', '7:00', '11:00'], answer: 0 },
          { q: 'When does the writer go to bed?', options: ['10:00', '12:00', '11:00'], answer: 2 },
        ],
      },
    },
    {
      id: 'ja-u5',
      title: 'Places & Shopping',
      level: 'N5',
      canDo: ['Ask where places are with どこ', 'Point to places with ここ・そこ・あそこ', 'Ask prices and buy things politely'],
      lessons: [
        {
          id: 'ja-u5-l1',
          title: 'Where Is It?',
          goal: 'Ask for and give locations',
          items: [
            w('u5-doko', 'どこ', null, 'doko', 'where'),
            w('u5-koko', 'ここ', null, 'koko', 'here'),
            w('u5-soko', 'そこ', null, 'soko', 'there (near you)', { meaningAlt: ['there'] }),
            w('u5-asoko', 'あそこ', null, 'asoko', 'over there'),
            w('u5-eki', '駅', 'えき', 'eki', 'station'),
            w('u5-mise', '店', 'みせ', 'mise', 'shop', { meaningAlt: ['store'] }),
            w('u5-ginkou', '銀行', 'ぎんこう', 'ginkou', 'bank', { alt: ['ginko'] }),
            w('u5-toire', 'トイレ', null, 'toire', 'toilet', { meaningAlt: ['restroom', 'bathroom'] }),
          ],
          sentences: [
            s('u5-s-ekidoko', '駅はどこですか。', 'えきはどこですか。', 'eki wa doko desu ka', 'Where is the station?', ['駅', 'は', 'どこ', 'です', 'か']),
            s('u5-s-toireasoko', 'トイレはあそこです。', null, 'toire wa asoko desu', 'The toilet is over there.', ['トイレ', 'は', 'あそこ', 'です']),
            s('u5-s-ginkoukoko', '銀行はここです。', 'ぎんこうはここです。', 'ginkou wa koko desu', 'The bank is here.', ['銀行', 'は', 'ここ', 'です']),
          ],
        },
        {
          id: 'ja-u5-l2',
          title: 'Shopping',
          goal: 'Ask prices and buy things',
          items: [
            w('u5-ikura', 'いくら', null, 'ikura', 'how much'),
            w('u5-en', '円', 'えん', 'en', 'yen'),
            w('u5-hyaku', '百', 'ひゃく', 'hyaku', 'hundred', { meaningAlt: ['100'] }),
            w('u5-sen', '千', 'せん', 'sen', 'thousand', { meaningAlt: ['1000'] }),
            w('u5-kaimasu', '買います', 'かいます', 'kaimasu', 'to buy'),
            w('u5-kudasai', 'ください', null, 'kudasai', 'please (give me)', { note: 'Thing + を + ください = “… please.”' }),
          ],
          sentences: [
            s('u5-s-korewokudasai', 'これをください。', null, 'kore wo kudasai', 'This one, please.', ['これ', 'を', 'ください'], { alt: ['kore o kudasai'] }),
            s('u5-s-hyakuen', '百円です。', 'ひゃくえんです。', 'hyakuen desu', 'It’s 100 yen.', ['百円', 'です']),
            s('u5-s-honwokaimasu', '本を買います。', 'ほんをかいます。', 'hon wo kaimasu', 'I buy a book.', ['本', 'を', '買います'], { alt: ['hon o kaimasu'] }),
          ],
        },
      ],
      reading: {
        id: 'ja-u5-r',
        title: '駅の店 · The Station Shop',
        sentences: [
          s('r5-1', 'ここは駅の店です。', 'ここはえきのみせです。', 'koko wa eki no mise desu', 'This is the shop at the station.', []),
          s('r5-2', 'ケンさんはお茶を買います。', 'ケンさんはおちゃをかいます。', 'ken san wa ocha wo kaimasu', 'Ken buys some tea.', [], { note: 'さん = Mr./Ms.' }),
          s('r5-3', 'お茶は百五十円です。', 'おちゃはひゃくごじゅうえんです。', 'ocha wa hyaku gojuu en desu', 'The tea is 150 yen.', [], { note: '五十 = 5 × 10 = fifty' }),
          s('r5-4', '本も買います。', 'ほんもかいます。', 'hon mo kaimasu', 'He buys a book too.', []),
        ],
        questions: [
          { q: 'Where is the shop?', options: ['At the station', 'At the school', 'At the bank'], answer: 0 },
          { q: 'What does Ken buy first?', options: ['A pen', 'Tea', 'Sushi'], answer: 1 },
          { q: 'How much is the tea?', options: ['100 yen', '500 yen', '150 yen'], answer: 2 },
        ],
      },
    },
    ...jaTier23Units,
  ], jaMoreLessons), jaMoreUnits),
}
