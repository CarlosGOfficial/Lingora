/** Japanese: one more unit for each of the N4 and N3 sections. */
import type { GrammarExample, GrammarPoint, Item, Unit } from './types'

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

const ex = (target: string, reading: string | null, romanization: string, meaning: string): GrammarExample => ({
  target,
  ...(reading ? { reading } : {}),
  romanization,
  meaning,
})

export const jaSectionUnits: Unit[] = [
  /* ---------------- N4 ---------------- */
  {
    id: 'ja-u14',
    title: 'Giving, Comparing & Experiences',
    level: 'N4',
    canDo: ['Say who gave what with あげる / もらう / くれる', 'Compare things with より and 一番', 'Talk about what you have done before'],
    lessons: [
      {
        id: 'ja-u14-l1',
        title: 'Giving & Receiving',
        goal: 'Say who gave what to whom',
        items: [
          w('u14-agemasu', 'あげます', null, 'agemasu', 'to give (to others)', { note: 'You (or someone) give away from yourself.' }),
          w('u14-moraimasu', 'もらいます', null, 'moraimasu', 'to receive', { meaningAlt: ['to get'] }),
          w('u14-kuremasu', 'くれます', null, 'kuremasu', 'to give (to me)', { note: 'Someone gives to me or my family.' }),
          w('u14-purezento', 'プレゼント', null, 'purezento', 'present', { meaningAlt: ['gift'] }),
          w('u14-tanjoubi', '誕生日', 'たんじょうび', 'tanjoubi', 'birthday', { alt: ['tanjobi'] }),
          w('u14-hana', '花', 'はな', 'hana', 'flower', { meaningAlt: ['flowers'] }),
          w('u14-omiyage', 'お土産', 'おみやげ', 'omiyage', 'souvenir'),
          w('u14-tegami', '手紙', 'てがみ', 'tegami', 'letter'),
        ],
        sentences: [
          s('u14-s-hanaagemashita', '友達に花をあげました。', 'ともだちにはなをあげました。', 'tomodachi ni hana wo agemashita', 'I gave a friend some flowers.', ['友達', 'に', '花', 'を', 'あげました'], {
            alt: ['tomodachi ni hana o agemashita'],
          }),
          s('u14-s-purezentomoraimashita', '母にプレゼントをもらいました。', 'ははにプレゼントをもらいました。', 'haha ni purezento wo moraimashita', 'I got a present from my mother.', ['母', 'に', 'プレゼント', 'を', 'もらいました'], {
            alt: ['haha ni purezento o moraimashita'],
          }),
          s('u14-s-omiyagekuremashita', '姉がお土産をくれました。', 'あねがおみやげをくれました。', 'ane ga omiyage wo kuremashita', 'My sister gave me a souvenir.', ['姉', 'が', 'お土産', 'を', 'くれました'], {
            alt: ['ane ga omiyage o kuremashita'],
          }),
        ],
      },
      {
        id: 'ja-u14-l2',
        title: 'Better & Best',
        goal: 'Compare with より and 一番',
        items: [
          w('u14-yori', 'より', null, 'yori', 'than'),
          w('u14-ichiban', '一番', 'いちばん', 'ichiban', 'the most', { meaningAlt: ['best', 'number one'] }),
          w('u14-hou', 'ほう', null, 'hou', 'the side (of a comparison)', { alt: ['ho'], note: 'AのほうがB = A is more B.' }),
          w('u14-onaji', '同じ', 'おなじ', 'onaji', 'same'),
          w('u14-chigau', '違う', 'ちがう', 'chigau', 'different', { meaningAlt: ['wrong'] }),
          w('u14-omoi', '重い', 'おもい', 'omoi', 'heavy'),
          w('u14-karui', '軽い', 'かるい', 'karui', 'light (in weight)', { meaningAlt: ['light'] }),
          w('u14-nagai', '長い', 'ながい', 'nagai', 'long'),
        ],
        sentences: [
          s('u14-s-denshayorihayai', '電車はバスより速いです。', 'でんしゃはバスよりはやいです。', 'densha wa basu yori hayai desu', 'The train is faster than the bus.', ['電車', 'は', 'バス', 'より', '速い', 'です'], {
            note: '速い (はやい) = fast',
          }),
          s('u14-s-natsugaichiban', '夏が一番好きです。', 'なつがいちばんすきです。', 'natsu ga ichiban suki desu', 'I like summer best.', ['夏', 'が', '一番', '好き', 'です']),
          s('u14-s-kabannohou', 'この鞄のほうが軽いです。', 'このかばんのほうがかるいです。', 'kono kaban no hou ga karui desu', 'This bag is lighter.', ['この', '鞄', 'の', 'ほう', 'が', '軽い', 'です']),
        ],
      },
      {
        id: 'ja-u14-l3',
        title: 'Have You Ever…?',
        goal: 'Talk about experiences with 〜たことがある',
        items: [
          w('u14-kotogaarimasu', 'ことがあります', null, 'koto ga arimasu', 'have done (experience)', { note: 'After a た-form verb: 行ったことがあります = I have been.' }),
          w('u14-ichido', '一度', 'いちど', 'ichido', 'once', { meaningAlt: ['one time'] }),
          w('u14-mada', 'まだ', null, 'mada', 'not yet', { meaningAlt: ['still'] }),
          w('u14-mou', 'もう', null, 'mou', 'already', { alt: ['mo'] }),
          w('u14-hajimete', '初めて', 'はじめて', 'hajimete', 'for the first time'),
          w('u14-gaikoku', '外国', 'がいこく', 'gaikoku', 'foreign country', { meaningAlt: ['abroad'] }),
          w('u14-yama', '山', 'やま', 'yama', 'mountain'),
          w('u14-noborimasu', '登ります', 'のぼります', 'noborimasu', 'to climb'),
        ],
        sentences: [
          s('u14-s-fujisan', '富士山に登ったことがあります。', 'ふじさんにのぼったことがあります。', 'fujisan ni nobotta koto ga arimasu', 'I’ve climbed Mount Fuji.', ['富士山', 'に', '登った', 'こと', 'が', 'あります'], {
            note: '富士山 (ふじさん) = Mount Fuji',
          }),
          s('u14-s-sushitabeta', 'すしを食べたことがありますか。', 'すしをたべたことがありますか。', 'sushi wo tabeta koto ga arimasu ka', 'Have you ever eaten sushi?', ['すし', 'を', '食べた', 'こと', 'が', 'あります', 'か'], {
            alt: ['sushi o tabeta koto ga arimasu ka'],
          }),
          s('u14-s-madagaikoku', 'まだ外国に行ったことがありません。', 'まだがいこくにいったことがありません。', 'mada gaikoku ni itta koto ga arimasen', 'I haven’t been abroad yet.', ['まだ', '外国', 'に', '行った', 'こと', 'が', 'ありません']),
        ],
      },
    ],
    reading: {
      id: 'ja-u14-r',
      title: '初めての富士山 · My First Fuji',
      sentences: [
        s('r14-1', '去年の夏、初めて富士山に登りました。', 'きょねんのなつ、はじめてふじさんにのぼりました。', 'kyonen no natsu, hajimete fujisan ni noborimashita', 'Last summer I climbed Mount Fuji for the first time.', []),
        s('r14-2', '山はとても高くて、少し寒かったです。', 'やまはとてもたかくて、すこしさむかったです。', 'yama wa totemo takakute, sukoshi samukatta desu', 'The mountain was very high, and it was a little cold.', []),
        s('r14-3', '友達がお土産をくれました。', 'ともだちがおみやげをくれました。', 'tomodachi ga omiyage wo kuremashita', 'A friend gave me a souvenir.', []),
        s('r14-4', '富士山は日本で一番高い山です。', 'ふじさんはにほんでいちばんたかいやまです。', 'fujisan wa nihon de ichiban takai yama desu', 'Mount Fuji is the highest mountain in Japan.', []),
      ],
      questions: [
        { q: 'When did they climb Fuji?', options: ['Last winter', 'Last summer', 'This spring'], answer: 1 },
        { q: 'What was it like at the top?', options: ['A little cold', 'Very hot', 'Rainy'], answer: 0 },
        { q: 'What is Mount Fuji?', options: ['Japan’s oldest city', 'A famous temple', 'Japan’s highest mountain'], answer: 2 },
      ],
    },
  },

  /* ---------------- N3 ---------------- */
  {
    id: 'ja-u15',
    title: 'Tech, Hearsay & Casual Speech',
    level: 'N3',
    canDo: ['Talk about phones and apps, and things going wrong', 'Pass on what you heard with そうです and 多分', 'Chat casually with friends'],
    lessons: [
      {
        id: 'ja-u15-l1',
        title: 'Phones & Apps',
        goal: 'Say what went wrong with 〜てしまう',
        items: [
          w('u15-sumaho', 'スマホ', null, 'sumaho', 'smartphone', { meaningAlt: ['phone'] }),
          w('u15-apuri', 'アプリ', null, 'apuri', 'app'),
          w('u15-pasuwaado', 'パスワード', null, 'pasuwaado', 'password', { alt: ['pasuwado'] }),
          w('u15-juuden', '充電', 'じゅうでん', 'juuden', 'charging (battery)', { alt: ['juden'], meaningAlt: ['charge'] }),
          w('u15-kowareru', '壊れる', 'こわれる', 'kowareru', 'to break', { meaningAlt: ['to get broken'] }),
          w('u15-naosu', '直す', 'なおす', 'naosu', 'to fix', { meaningAlt: ['to repair'] }),
          w('u15-benri', '便利', 'べんり', 'benri', 'convenient', { meaningAlt: ['handy', 'useful'] }),
          w('u15-fuben', '不便', 'ふべん', 'fuben', 'inconvenient'),
        ],
        sentences: [
          s('u15-s-sumahokowarete', 'スマホが壊れてしまいました。', 'スマホがこわれてしまいました。', 'sumaho ga kowarete shimaimashita', 'My phone broke (and I’m stuck).', ['スマホ', 'が', '壊れて', 'しまいました']),
          s('u15-s-apuribenri', 'このアプリはとても便利です。', 'このアプリはとてもべんりです。', 'kono apuri wa totemo benri desu', 'This app is really handy.', ['この', 'アプリ', 'は', 'とても', '便利', 'です']),
          s('u15-s-pasuwaadowasurete', 'パスワードを忘れてしまいました。', 'パスワードをわすれてしまいました。', 'pasuwaado wo wasurete shimaimashita', 'I’ve gone and forgotten my password.', ['パスワード', 'を', '忘れて', 'しまいました'], {
            alt: ['pasuwaado o wasurete shimaimashita'],
          }),
        ],
      },
      {
        id: 'ja-u15-l2',
        title: 'Hearsay & Guesses',
        goal: 'Pass on what you heard',
        items: [
          w('u15-soudesu', 'そうです', null, 'sou desu', 'I hear that (hearsay)', { alt: ['so desu'], note: 'After a plain-form verb or adjective: 雨が降るそうです.' }),
          w('u15-rashii', 'らしい', null, 'rashii', 'apparently'),
          w('u15-mitai', 'みたい', null, 'mitai', 'seems like', { meaningAlt: ['looks like'] }),
          w('u15-tabun', '多分', 'たぶん', 'tabun', 'probably', { meaningAlt: ['maybe'] }),
          w('u15-kitto', 'きっと', null, 'kitto', 'surely', { meaningAlt: ['definitely'] }),
          w('u15-uwasa', '噂', 'うわさ', 'uwasa', 'rumour', { meaningAlt: ['rumor', 'gossip'] }),
          w('u15-hontou', '本当', 'ほんとう', 'hontou', 'true', { alt: ['honto'], meaningAlt: ['really', 'truth'] }),
          w('u15-uso', '嘘', 'うそ', 'uso', 'lie', { meaningAlt: ['no way!'] }),
        ],
        sentences: [
          s('u15-s-amegafurusou', '明日は雨が降るそうです。', 'あしたはあめがふるそうです。', 'ashita wa ame ga furu sou desu', 'I hear it’s going to rain tomorrow.', ['明日', 'は', '雨', 'が', '降る', 'そうです'], {
            note: '降る (ふる) = to fall (rain, snow)',
          }),
          s('u15-s-hontoudesuka', 'それは本当ですか。', 'それはほんとうですか。', 'sore wa hontou desu ka', 'Is that true?', ['それ', 'は', '本当', 'です', 'か']),
          s('u15-s-tabunkonai', '彼は多分来ないでしょう。', 'かれはたぶんこないでしょう。', 'kare wa tabun konai deshou', 'He probably won’t come.', ['彼', 'は', '多分', '来ない', 'でしょう'], { note: '彼 (かれ) = he' }),
        ],
      },
      {
        id: 'ja-u15-l3',
        title: 'Talking Like Friends',
        goal: 'Use casual speech',
        items: [
          w('u15-un', 'うん', null, 'un', 'yeah', { meaningAlt: ['yes (casual)'] }),
          w('u15-uun', 'ううん', null, 'uun', 'nope', { meaningAlt: ['no (casual)'] }),
          w('u15-jaa', 'じゃあ', null, 'jaa', 'well then', { alt: ['ja'], meaningAlt: ['so'] }),
          w('u15-yappari', 'やっぱり', null, 'yappari', 'as expected', { meaningAlt: ['after all'] }),
          w('u15-sugoi', 'すごい', null, 'sugoi', 'amazing', { meaningAlt: ['great', 'awesome'] }),
          w('u15-chotto', 'ちょっと', null, 'chotto', 'a bit', { meaningAlt: ['a moment'] }),
          w('u15-tanoshii', '楽しい', 'たのしい', 'tanoshii', 'fun', { meaningAlt: ['enjoyable'] }),
          w('u15-tsumaranai', 'つまらない', null, 'tsumaranai', 'boring', { meaningAlt: ['dull'] }),
        ],
        sentences: [
          s('u15-s-eigadoudatta', '映画、どうだった？', 'えいが、どうだった？', 'eiga, dou datta', 'How was the movie?', ['映画', 'どう', 'だった']),
          s('u15-s-unsugoku', 'うん、すごく面白かった！', 'うん、すごくおもしろかった！', 'un, sugoku omoshirokatta', 'Yeah, it was really good!', ['うん', 'すごく', '面白かった']),
          s('u15-s-jaamataashita', 'じゃあ、また明日ね。', 'じゃあ、またあしたね。', 'jaa, mata ashita ne', 'Well then, see you tomorrow.', ['じゃあ', 'また', '明日', 'ね']),
        ],
      },
    ],
    reading: {
      id: 'ja-u15-r',
      title: 'うわさ · The Rumour',
      sentences: [
        s('r15-1', 'クラスで面白いうわさを聞きました。', 'クラスでおもしろいうわさをききました。', 'kurasu de omoshiroi uwasa wo kikimashita', 'I heard an interesting rumour in class.', []),
        s('r15-2', '先生が来月結婚するそうです。', 'せんせいがらいげつけっこんするそうです。', 'sensei ga raigetsu kekkon suru sou desu', 'Apparently our teacher is getting married next month.', [], { note: '結婚 (けっこん) = marriage' }),
        s('r15-3', 'でも、それは本当かどうか分かりません。', 'でも、それはほんとうかどうかわかりません。', 'demo, sore wa hontou ka dou ka wakarimasen', 'But I don’t know whether it’s true.', []),
        s('r15-4', '明日、先生に聞いてみます。', 'あした、せんせいにきいてみます。', 'ashita, sensei ni kiite mimasu', 'Tomorrow I’ll try asking the teacher.', []),
      ],
      questions: [
        { q: 'Where did they hear the rumour?', options: ['On the news', 'In class', 'From their mother'], answer: 1 },
        { q: 'What is the rumour?', options: ['The teacher is moving away', 'The teacher is getting married', 'A new student is coming'], answer: 1 },
        { q: 'What will they do tomorrow?', options: ['Ask the teacher', 'Tell everyone', 'Nothing'], answer: 0 },
      ],
    },
  },
]

export const jaSectionUnitsGrammar: Record<string, GrammarPoint[]> = {
  'ja-u14-l1': [
    {
      title: 'あげる, もらう, くれる',
      explanation: 'あげる = give away from me (or from anyone to someone else). もらう = receive, with に marking the giver. くれる = someone gives to me or my family.',
      examples: [
        ex('友達に本をあげます。', 'ともだちにほんをあげます。', 'tomodachi ni hon wo agemasu', 'I’ll give my friend a book.'),
        ex('先生が本をくれました。', 'せんせいがほんをくれました。', 'sensei ga hon wo kuremashita', 'The teacher gave me a book.'),
      ],
    },
  ],
  'ja-u14-l2': [
    {
      title: 'A は B より + adjective',
      pattern: 'A は B より + Adjective',
      explanation: 'より means “than” and follows the thing you compare against.',
      examples: [ex('東京は大阪より大きいです。', 'とうきょうはおおさかよりおおきいです。', 'toukyou wa oosaka yori ookii desu', 'Tokyo is bigger than Osaka.')],
    },
    {
      title: 'The most: 一番',
      pattern: 'X の中で Y が一番 + Adjective',
      explanation: 'Pick the top one out of a group with の中で … 一番.',
      examples: [ex('果物の中でりんごが一番好きです。', 'くだもののなかでりんごがいちばんすきです。', 'kudamono no naka de ringo ga ichiban suki desu', 'Of all fruit, I like apples best.')],
    },
  ],
  'ja-u14-l3': [
    {
      title: 'Experiences: 〜たことがあります',
      pattern: 'Verb (た-form) + ことがあります',
      explanation: 'Say you have done something at least once. The negative is 〜たことがありません.',
      examples: [ex('日本に行ったことがあります。', 'にほんにいったことがあります。', 'nihon ni itta koto ga arimasu', 'I’ve been to Japan.')],
    },
    {
      title: 'Already and not yet: もう / まだ',
      explanation: 'もう + past = already. まだ + negative = not yet; on its own, まだです means “not yet”.',
      examples: [ex('もう食べました。', 'もうたべました。', 'mou tabemashita', 'I’ve already eaten.'), ex('まだです。', null, 'mada desu', 'Not yet.')],
    },
  ],
  'ja-u15-l1': [
    {
      title: '〜てしまう: done (and it’s too bad)',
      pattern: 'Verb (て-form) + しまう',
      explanation: 'Adds that something happened completely, often by accident or with regret.',
      examples: [ex('財布をなくしてしまいました。', 'さいふをなくしてしまいました。', 'saifu wo nakushite shimaimashita', 'I’ve lost my wallet (oh no).')],
    },
    {
      title: 'な-adjectives before nouns',
      pattern: 'な-Adjective + な + Noun',
      explanation: 'Words like 便利 and 不便 take な before a noun, and です at the end of a sentence.',
      examples: [ex('便利なアプリ', 'べんりなアプリ', 'benri na apuri', 'a handy app')],
    },
  ],
  'ja-u15-l2': [
    {
      title: 'Hearsay: plain form + そうです',
      pattern: 'Plain form + そうです',
      explanation: 'Pass on information you heard or read somewhere.',
      examples: [ex('彼は来ないそうです。', 'かれはこないそうです。', 'kare wa konai sou desu', 'I hear he isn’t coming.')],
    },
    {
      title: 'Guesses: 多分 … でしょう',
      explanation: '多分 (probably) often pairs with でしょう at the end of the sentence.',
      examples: [ex('多分大丈夫でしょう。', 'たぶんだいじょうぶでしょう。', 'tabun daijoubu deshou', 'It’ll probably be fine.')],
    },
  ],
  'ja-u15-l3': [
    {
      title: 'Casual past: だった / かった',
      explanation: 'With friends, drop です and ました: どうだった？ 面白かった！',
      examples: [ex('楽しかった！', 'たのしかった！', 'tanoshikatta', 'That was fun!')],
    },
    {
      title: 'Sentence endings ね and よ',
      explanation: 'ね looks for agreement (“…, right?”); よ tells the listener something new.',
      examples: [ex('いい天気だね。', 'いいてんきだね。', 'ii tenki da ne', 'Nice weather, isn’t it?'), ex('明日は休みだよ。', 'あしたはやすみだよ。', 'ashita wa yasumi da yo', 'Tomorrow’s a day off, you know.')],
    },
  ],
}
