/** Japanese: more units inside the existing tiers — two N5, one N4, one N3. */
import type { GrammarExample, GrammarPoint, Item, Unit } from './types'

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

const ex = (target: string, reading: string | null, romanization: string, meaning: string): GrammarExample => ({
  target,
  ...(reading ? { reading } : {}),
  romanization,
  meaning,
})

export const jaMoreUnits: Unit[] = [
  /* ---------------- N5 ---------------- */
  {
    id: 'ja-u10',
    title: 'Things & Places Around Me',
    level: 'N5',
    canDo: ['Say what’s in a room with あります', 'Describe where things are', 'Talk about colours and clothes'],
    lessons: [
      {
        id: 'ja-u10-l1',
        title: 'In My Room',
        goal: 'Name everyday objects',
        items: [
          w('u10-tsukue', '机', 'つくえ', 'tsukue', 'desk'),
          w('u10-isu', '椅子', 'いす', 'isu', 'chair'),
          w('u10-kaban', '鞄', 'かばん', 'kaban', 'bag'),
          w('u10-tokei', '時計', 'とけい', 'tokei', 'clock', { meaningAlt: ['watch'] }),
          w('u10-kasa', '傘', 'かさ', 'kasa', 'umbrella'),
          w('u10-kuruma', '車', 'くるま', 'kuruma', 'car'),
          w('u10-heya', '部屋', 'へや', 'heya', 'room'),
          w('u10-arimasu', 'あります', null, 'arimasu', 'there is (things)', { meaningAlt: ['to have (things)'], note: 'Objects use あります; people and animals use います.' }),
        ],
        sentences: [
          s('u10-s-heyanitsukue', '部屋に机があります。', 'へやにつくえがあります。', 'heya ni tsukue ga arimasu', 'There’s a desk in the room.', ['部屋', 'に', '机', 'が', 'あります']),
          s('u10-s-kasawadoko', '傘はどこですか。', 'かさはどこですか。', 'kasa wa doko desu ka', 'Where’s the umbrella?', ['傘', 'は', 'どこ', 'です', 'か']),
          s('u10-s-watashinokaban', 'これは私の鞄です。', 'これはわたしのかばんです。', 'kore wa watashi no kaban desu', 'This is my bag.', ['これ', 'は', '私', 'の', '鞄', 'です']),
        ],
      },
      {
        id: 'ja-u10-l2',
        title: 'Where Is It?',
        goal: 'Use position words',
        items: [
          w('u10-ue', '上', 'うえ', 'ue', 'on top', { meaningAlt: ['above'] }),
          w('u10-shita', '下', 'した', 'shita', 'under', { meaningAlt: ['below'] }),
          w('u10-naka', '中', 'なか', 'naka', 'inside', { meaningAlt: ['in'] }),
          w('u10-mae', '前', 'まえ', 'mae', 'in front', { meaningAlt: ['before'] }),
          w('u10-ushiro', '後ろ', 'うしろ', 'ushiro', 'behind'),
          w('u10-tonari', '隣', 'となり', 'tonari', 'next to'),
          w('u10-aida', '間', 'あいだ', 'aida', 'between'),
        ],
        sentences: [
          s('u10-s-nekoshita', '猫は机の下にいます。', 'ねこはつくえのしたにいます。', 'neko wa tsukue no shita ni imasu', 'The cat is under the desk.', ['猫', 'は', '机', 'の', '下', 'に', 'います'], {
            note: '猫 (ねこ) = cat',
          }),
          s('u10-s-ginkouekimae', '銀行は駅の前です。', 'ぎんこうはえきのまえです。', 'ginkou wa eki no mae desu', 'The bank is in front of the station.', ['銀行', 'は', '駅', 'の', '前', 'です']),
          s('u10-s-kabannonaka', 'かばんの中に本があります。', 'かばんのなかにほんがあります。', 'kaban no naka ni hon ga arimasu', 'There’s a book in the bag.', ['かばん', 'の', '中', 'に', '本', 'が', 'あります']),
        ],
      },
      {
        id: 'ja-u10-l3',
        title: 'Colours & Clothes',
        goal: 'Describe what people wear',
        items: [
          w('u10-akai', '赤い', 'あかい', 'akai', 'red'),
          w('u10-aoi', '青い', 'あおい', 'aoi', 'blue'),
          w('u10-shiroi', '白い', 'しろい', 'shiroi', 'white'),
          w('u10-kuroi', '黒い', 'くろい', 'kuroi', 'black'),
          w('u10-fuku', '服', 'ふく', 'fuku', 'clothes'),
          w('u10-kutsu', '靴', 'くつ', 'kutsu', 'shoes'),
          w('u10-boushi', '帽子', 'ぼうし', 'boushi', 'hat', { alt: ['boshi'], meaningAlt: ['cap'] }),
        ],
        sentences: [
          s('u10-s-akaifuku', '赤い服を買いました。', 'あかいふくをかいました。', 'akai fuku wo kaimashita', 'I bought red clothes.', ['赤い', '服', 'を', '買いました'], {
            alt: ['akai fuku o kaimashita'],
          }),
          s('u10-s-shiroikutsu', '白い靴です。', 'しろいくつです。', 'shiroi kutsu desu', 'They’re white shoes.', ['白い', '靴', 'です']),
          s('u10-s-boushikuroi', 'その帽子は黒いです。', 'そのぼうしはくろいです。', 'sono boushi wa kuroi desu', 'That hat is black.', ['その', '帽子', 'は', '黒い', 'です']),
        ],
      },
    ],
    reading: {
      id: 'ja-u10-r',
      title: '私の部屋 · My Room',
      sentences: [
        s('r10-1', '私の部屋は小さいです。', 'わたしのへやはちいさいです。', 'watashi no heya wa chiisai desu', 'My room is small.', []),
        s('r10-2', '机と椅子があります。', 'つくえといすがあります。', 'tsukue to isu ga arimasu', 'There’s a desk and a chair.', []),
        s('r10-3', '机の上に時計と本があります。', 'つくえのうえにとけいとほんがあります。', 'tsukue no ue ni tokei to hon ga arimasu', 'On the desk there’s a clock and a book.', []),
        s('r10-4', '猫はいつも椅子の下にいます。', 'ねこはいつもいすのしたにいます。', 'neko wa itsumo isu no shita ni imasu', 'The cat is always under the chair.', [], { note: 'いつも = always' }),
      ],
      questions: [
        { q: 'What is the room like?', options: ['Big', 'Small', 'New'], answer: 1 },
        { q: 'What is on the desk?', options: ['A clock and a book', 'A bag', 'An umbrella'], answer: 0 },
        { q: 'Where is the cat?', options: ['On the desk', 'In the bag', 'Under the chair'], answer: 2 },
      ],
    },
  },
  {
    id: 'ja-u11',
    title: 'Verbs, Weeks & Questions',
    level: 'N5',
    canDo: ['Use everyday ます verbs', 'Talk about last week and next year', 'Ask who, when, why and how'],
    lessons: [
      {
        id: 'ja-u11-l1',
        title: 'Everyday Verbs',
        goal: 'Say what you do',
        items: [
          w('u11-mimasu', '見ます', 'みます', 'mimasu', 'to see', { meaningAlt: ['to watch', 'to look'] }),
          w('u11-kikimasu', '聞きます', 'ききます', 'kikimasu', 'to listen', { meaningAlt: ['to hear', 'to ask'] }),
          w('u11-yomimasu', '読みます', 'よみます', 'yomimasu', 'to read'),
          w('u11-kakimasu', '書きます', 'かきます', 'kakimasu', 'to write'),
          w('u11-hanashimasu', '話します', 'はなします', 'hanashimasu', 'to speak', { meaningAlt: ['to talk'] }),
          w('u11-aimasu', '会います', 'あいます', 'aimasu', 'to meet'),
          w('u11-machimasu', '待ちます', 'まちます', 'machimasu', 'to wait'),
          w('u11-wakarimasu', '分かります', 'わかります', 'wakarimasu', 'to understand'),
        ],
        sentences: [
          s('u11-s-honwoyomimasu', '毎日本を読みます。', 'まいにちほんをよみます。', 'mainichi hon wo yomimasu', 'I read every day.', ['毎日', '本', 'を', '読みます'], {
            alt: ['mainichi hon o yomimasu'],
          }),
          s('u11-s-nihongogawakarimasu', '日本語が分かります。', 'にほんごがわかります。', 'nihongo ga wakarimasu', 'I understand Japanese.', ['日本語', 'が', '分かります']),
          s('u11-s-tomodachiniaimasu', '友達に会います。', 'ともだちにあいます。', 'tomodachi ni aimasu', 'I’m meeting a friend.', ['友達', 'に', '会います']),
        ],
      },
      {
        id: 'ja-u11-l2',
        title: 'Last Week, Next Year',
        goal: 'Talk about past and future',
        items: [
          w('u11-senshuu', '先週', 'せんしゅう', 'senshuu', 'last week', { alt: ['senshu'] }),
          w('u11-konshuu', '今週', 'こんしゅう', 'konshuu', 'this week', { alt: ['konshu'] }),
          w('u11-raishuu', '来週', 'らいしゅう', 'raishuu', 'next week', { alt: ['raishu'] }),
          w('u11-sengetsu', '先月', 'せんげつ', 'sengetsu', 'last month'),
          w('u11-raigetsu', '来月', 'らいげつ', 'raigetsu', 'next month'),
          w('u11-kyonen', '去年', 'きょねん', 'kyonen', 'last year'),
          w('u11-rainen', '来年', 'らいねん', 'rainen', 'next year'),
        ],
        sentences: [
          s('u11-s-senshuukyouto', '先週、京都へ行きました。', 'せんしゅう、きょうとへいきました。', 'senshuu, kyouto e ikimashita', 'Last week I went to Kyoto.', ['先週', '京都', 'へ', '行きました']),
          s('u11-s-rainennihon', '来年、日本へ行きます。', 'らいねん、にほんへいきます。', 'rainen, nihon e ikimasu', 'Next year I’m going to Japan.', ['来年', '日本', 'へ', '行きます']),
          s('u11-s-kyonenisogashikatta', '去年は忙しかったです。', 'きょねんはいそがしかったです。', 'kyonen wa isogashikatta desu', 'Last year I was busy.', ['去年', 'は', '忙しかった', 'です'], {
            note: '忙しい (いそがしい) = busy',
          }),
        ],
      },
      {
        id: 'ja-u11-l3',
        title: 'Question Words',
        goal: 'Ask who, when, why and how',
        items: [
          w('u11-dare', 'だれ', null, 'dare', 'who', { alt: ['誰'] }),
          w('u11-itsu', 'いつ', null, 'itsu', 'when'),
          w('u11-naze', 'なぜ', null, 'naze', 'why', { alt: ['どうして', 'doushite'] }),
          w('u11-dou', 'どう', null, 'dou', 'how', { alt: ['do'] }),
          w('u11-donna', 'どんな', null, 'donna', 'what kind of'),
          w('u11-dore', 'どれ', null, 'dore', 'which one'),
          w('u11-nannin', '何人', 'なんにん', 'nannin', 'how many people'),
          w('u11-ikutsu', 'いくつ', null, 'ikutsu', 'how many (things)', { meaningAlt: ['how old'] }),
        ],
        sentences: [
          s('u11-s-anohitodare', 'あの人はだれですか。', 'あのひとはだれですか。', 'ano hito wa dare desu ka', 'Who is that person?', ['あの', '人', 'は', 'だれ', 'です', 'か']),
          s('u11-s-tanjoubiitsu', '誕生日はいつですか。', 'たんじょうびはいつですか。', 'tanjoubi wa itsu desu ka', 'When is your birthday?', ['誕生日', 'は', 'いつ', 'です', 'か'], {
            note: '誕生日 (たんじょうび) = birthday',
          }),
          s('u11-s-donnaongaku', 'どんな音楽が好きですか。', 'どんなおんがくがすきですか。', 'donna ongaku ga suki desu ka', 'What kind of music do you like?', ['どんな', '音楽', 'が', '好き', 'です', 'か']),
        ],
      },
    ],
    reading: {
      id: 'ja-u11-r',
      title: '友達のケンさん · My Friend Ken',
      sentences: [
        s('r11-1', '先週、友達のケンさんに会いました。', 'せんしゅう、ともだちのケンさんにあいました。', 'senshuu, tomodachi no ken san ni aimashita', 'Last week I met my friend Ken.', []),
        s('r11-2', 'ケンさんは毎日日本語の本を読みます。', 'ケンさんはまいにちにほんごのほんをよみます。', 'ken san wa mainichi nihongo no hon wo yomimasu', 'Ken reads Japanese books every day.', []),
        s('r11-3', '私も本を読みます。', 'わたしもほんをよみます。', 'watashi mo hon wo yomimasu', 'I read books too.', []),
        s('r11-4', '来週、また会います。', 'らいしゅう、またあいます。', 'raishuu, mata aimasu', 'We’ll meet again next week.', [], { note: 'また = again' }),
      ],
      questions: [
        { q: 'Who did the writer meet?', options: ['A teacher', 'Ken', 'Their sister'], answer: 1 },
        { q: 'What does Ken read every day?', options: ['Japanese books', 'Newspapers', 'Comics'], answer: 0 },
        { q: 'When will they meet again?', options: ['Tomorrow', 'Next month', 'Next week'], answer: 2 },
      ],
    },
  },

  /* ---------------- N4 ---------------- */
  {
    id: 'ja-u12',
    title: 'Getting Around Japan',
    level: 'N4',
    canDo: ['Take trains and change lines', 'Ask for and follow directions', 'Check in at a hotel'],
    lessons: [
      {
        id: 'ja-u12-l1',
        title: 'Taking the Train',
        goal: 'Ride trains and buy tickets',
        items: [
          w('u12-norimasu', '乗ります', 'のります', 'norimasu', 'to ride', { meaningAlt: ['to get on'] }),
          w('u12-orimasu', '降ります', 'おります', 'orimasu', 'to get off'),
          w('u12-norikae', '乗り換え', 'のりかえ', 'norikae', 'transfer', { meaningAlt: ['change (trains)'] }),
          w('u12-kippu', '切符', 'きっぷ', 'kippu', 'ticket'),
          w('u12-shinkansen', '新幹線', 'しんかんせん', 'shinkansen', 'bullet train'),
          w('u12-tsugi', '次', 'つぎ', 'tsugi', 'next'),
          w('u12-bansen', '番線', 'ばんせん', 'bansen', 'platform (number)', { meaningAlt: ['track'] }),
        ],
        sentences: [
          s('u12-s-tsuginoeki', '次の駅で降ります。', 'つぎのえきでおります。', 'tsugi no eki de orimasu', 'I get off at the next station.', ['次', 'の', '駅', 'で', '降ります']),
          s('u12-s-shinkansennoritai', '新幹線に乗りたいです。', 'しんかんせんにのりたいです。', 'shinkansen ni noritai desu', 'I want to ride the bullet train.', ['新幹線', 'に', '乗りたい', 'です']),
          s('u12-s-kippukatte', '切符を買ってください。', 'きっぷをかってください。', 'kippu wo katte kudasai', 'Please buy a ticket.', ['切符', 'を', '買って', 'ください'], { alt: ['kippu o katte kudasai'] }),
        ],
      },
      {
        id: 'ja-u12-l2',
        title: 'Finding the Way',
        goal: 'Follow directions in town',
        items: [
          w('u12-michi', '道', 'みち', 'michi', 'road', { meaningAlt: ['way', 'street'] }),
          w('u12-chizu', '地図', 'ちず', 'chizu', 'map'),
          w('u12-kousaten', '交差点', 'こうさてん', 'kousaten', 'intersection', { alt: ['kosaten'] }),
          w('u12-shingou', '信号', 'しんごう', 'shingou', 'traffic light', { alt: ['shingo'] }),
          w('u12-kado', '角', 'かど', 'kado', 'corner'),
          w('u12-watarimasu', '渡ります', 'わたります', 'watarimasu', 'to cross'),
          w('u12-massugu', 'まっすぐ', null, 'massugu', 'straight ahead'),
        ],
        sentences: [
          s('u12-s-massuguitte', 'まっすぐ行ってください。', 'まっすぐいってください。', 'massugu itte kudasai', 'Please go straight ahead.', ['まっすぐ', '行って', 'ください']),
          s('u12-s-shingouwatatte', '信号を渡ってください。', 'しんごうをわたってください。', 'shingou wo watatte kudasai', 'Please cross at the lights.', ['信号', 'を', '渡って', 'ください'], {
            alt: ['shingou o watatte kudasai'],
          }),
          s('u12-s-kadowomigi', '角を右に曲がります。', 'かどをみぎにまがります。', 'kado wo migi ni magarimasu', 'Turn right at the corner.', ['角', 'を', '右', 'に', '曲がります'], {
            alt: ['kado o migi ni magarimasu'],
          }),
        ],
      },
      {
        id: 'ja-u12-l3',
        title: 'At the Hotel',
        goal: 'Check in and ask for things',
        items: [
          w('u12-tomarimasu', '泊まります', 'とまります', 'tomarimasu', 'to stay (overnight)'),
          w('u12-kagi', '鍵', 'かぎ', 'kagi', 'key'),
          w('u12-nimotsu', '荷物', 'にもつ', 'nimotsu', 'luggage', { meaningAlt: ['baggage'] }),
          w('u12-uketsuke', '受付', 'うけつけ', 'uketsuke', 'reception', { meaningAlt: ['front desk'] }),
          w('u12-asagohan', '朝ご飯', 'あさごはん', 'asagohan', 'breakfast'),
          w('u12-nanpaku', '何泊', 'なんぱく', 'nanpaku', 'how many nights'),
          w('u12-aiteimasu', '空いています', 'あいています', 'aite imasu', 'vacant', { meaningAlt: ['available', 'free'] }),
        ],
        sentences: [
          s('u12-s-nihaku', '二泊します。', 'にはくします。', 'nihaku shimasu', 'I’ll stay two nights.', ['二泊', 'します']),
          s('u12-s-nimotsuazukete', '荷物を預けてもいいですか。', 'にもつをあずけてもいいですか。', 'nimotsu wo azukete mo ii desu ka', 'May I leave my luggage?', ['荷物', 'を', '預けて', 'も', 'いい', 'です', 'か'], {
            alt: ['nimotsu o azukete mo ii desu ka'],
            note: '預ける (あずける) = to leave in someone’s care',
          }),
          s('u12-s-kagiwokudasai', '鍵をください。', 'かぎをください。', 'kagi wo kudasai', 'The key, please.', ['鍵', 'を', 'ください'], { alt: ['kagi o kudasai'] }),
        ],
      },
    ],
    reading: {
      id: 'ja-u12-r',
      title: '京都へ · To Kyoto',
      sentences: [
        s('r12-1', '東京から新幹線に乗りました。', 'とうきょうからしんかんせんにのりました。', 'toukyou kara shinkansen ni norimashita', 'I took the bullet train from Tokyo.', []),
        s('r12-2', '京都駅で降りて、地図を見ながらホテルまで歩きました。', 'きょうとえきでおりて、ちずをみながらホテルまであるきました。', 'kyouto eki de orite, chizu wo minagara hoteru made arukimashita', 'I got off at Kyoto Station and walked to the hotel, looking at a map.', [], {
          note: '〜ながら = while …; 歩く = to walk',
        }),
        s('r12-3', '受付で鍵をもらいました。', 'うけつけでかぎをもらいました。', 'uketsuke de kagi wo moraimashita', 'I got the key at reception.', [], { note: 'もらう = to receive' }),
        s('r12-4', '明日の朝ご飯が楽しみです。', 'あしたのあさごはんがたのしみです。', 'ashita no asagohan ga tanoshimi desu', 'I’m looking forward to tomorrow’s breakfast.', []),
      ],
      questions: [
        { q: 'How did the writer travel to Kyoto?', options: ['By bus', 'By bullet train', 'By plane'], answer: 1 },
        { q: 'How did they get to the hotel?', options: ['They walked with a map', 'By taxi', 'By subway'], answer: 0 },
        { q: 'What did they get at reception?', options: ['A map', 'Breakfast', 'The key'], answer: 2 },
      ],
    },
  },

  /* ---------------- N3 ---------------- */
  {
    id: 'ja-u13',
    title: 'Society & Manners',
    level: 'N3',
    canDo: ['Talk about environmental issues', 'Report what you heard in the news', 'Understand rules and public manners'],
    lessons: [
      {
        id: 'ja-u13-l1',
        title: 'The Environment',
        goal: 'Discuss environmental problems',
        items: [
          w('u13-kankyou', '環境', 'かんきょう', 'kankyou', 'environment', { alt: ['kankyo'] }),
          w('u13-mondai', '問題', 'もんだい', 'mondai', 'problem', { meaningAlt: ['question', 'issue'] }),
          w('u13-heru', '減る', 'へる', 'heru', 'to decrease'),
          w('u13-fueru', '増える', 'ふえる', 'fueru', 'to increase'),
          w('u13-mamoru', '守る', 'まもる', 'mamoru', 'to protect', { meaningAlt: ['to keep (a rule)'] }),
          w('u13-shizen', '自然', 'しぜん', 'shizen', 'nature'),
          w('u13-shigen', '資源', 'しげん', 'shigen', 'resources'),
          w('u13-suteru', '捨てる', 'すてる', 'suteru', 'to throw away'),
        ],
        sentences: [
          s('u13-s-gomisutenaide', 'ごみを捨てないでください。', null, 'gomi wo sutenaide kudasai', 'Please don’t throw rubbish away.', ['ごみ', 'を', '捨てないで', 'ください'], {
            alt: ['gomi o sutenaide kudasai'],
            note: 'ごみ = rubbish, trash',
          }),
          s('u13-s-shizenmamori', '自然を守りましょう。', 'しぜんをまもりましょう。', 'shizen wo mamorimashou', 'Let’s protect nature.', ['自然', 'を', '守りましょう'], { alt: ['shizen o mamorimashou'] }),
          s('u13-s-jinkouhette', '人口が減っています。', 'じんこうがへっています。', 'jinkou ga hette imasu', 'The population is decreasing.', ['人口', 'が', '減って', 'います'], {
            note: '人口 (じんこう) = population',
          }),
        ],
      },
      {
        id: 'ja-u13-l2',
        title: 'In the News',
        goal: 'Report what you heard',
        items: [
          w('u13-nyuusu', 'ニュース', null, 'nyuusu', 'news', { alt: ['nyusu'] }),
          w('u13-kiji', '記事', 'きじ', 'kiji', 'article'),
          w('u13-jouhou', '情報', 'じょうほう', 'jouhou', 'information', { alt: ['joho'] }),
          w('u13-shiraberu', '調べる', 'しらべる', 'shiraberu', 'to look up', { meaningAlt: ['to investigate'] }),
          w('u13-tsutaeru', '伝える', 'つたえる', 'tsutaeru', 'to convey', { meaningAlt: ['to tell'] }),
          w('u13-jiko', '事故', 'じこ', 'jiko', 'accident'),
          w('u13-genin', '原因', 'げんいん', 'gen’in', 'cause', { alt: ['genin'] }),
          w('u13-kekka', '結果', 'けっか', 'kekka', 'result'),
        ],
        sentences: [
          s('u13-s-nyuusuniyoruto', 'ニュースによると、事故があったそうです。', 'ニュースによると、じこがあったそうです。', 'nyuusu ni yoru to, jiko ga atta sou desu', 'According to the news, there was an accident.', [
            'ニュース',
            'に',
            'よると',
            '事故',
            'が',
            'あった',
            'そうです',
          ]),
          s('u13-s-intaanettoshirabe', 'インターネットで調べました。', 'インターネットでしらべました。', 'intaanetto de shirabemashita', 'I looked it up online.', ['インターネット', 'で', '調べました']),
          s('u13-s-geninwamada', '原因はまだ分かりません。', 'げんいんはまだわかりません。', 'gen’in wa mada wakarimasen', 'The cause still isn’t known.', ['原因', 'は', 'まだ', '分かりません'], {
            alt: ['genin wa mada wakarimasen'],
            note: 'まだ = still / not yet',
          }),
        ],
      },
      {
        id: 'ja-u13-l3',
        title: 'Rules & Manners',
        goal: 'Understand public manners',
        items: [
          w('u13-kisoku', '規則', 'きそく', 'kisoku', 'rule', { meaningAlt: ['regulation'] }),
          w('u13-chuui', '注意', 'ちゅうい', 'chuui', 'caution', { alt: ['chui'], meaningAlt: ['attention', 'warning'] }),
          w('u13-meiwaku', '迷惑', 'めいわく', 'meiwaku', 'nuisance', { meaningAlt: ['trouble'] }),
          w('u13-shizuka', '静か', 'しずか', 'shizuka', 'quiet'),
          w('u13-sawagu', '騒ぐ', 'さわぐ', 'sawagu', 'to make noise'),
          w('u13-narabu', '並ぶ', 'ならぶ', 'narabu', 'to line up', { meaningAlt: ['to queue'] }),
          w('u13-kinen', '禁煙', 'きんえん', 'kin’en', 'no smoking', { alt: ['kinen'] }),
          w('u13-manaa', 'マナー', null, 'manaa', 'manners', { alt: ['mana'] }),
        ],
        sentences: [
          s('u13-s-densyanonakade', '電車の中で騒がないでください。', 'でんしゃのなかでさわがないでください。', 'densha no naka de sawaganaide kudasai', 'Please don’t make noise on the train.', ['電車', 'の', '中', 'で', '騒がないで', 'ください']),
          s('u13-s-kokohakinen', 'ここは禁煙です。', 'ここはきんえんです。', 'koko wa kin’en desu', 'This is a no-smoking area.', ['ここ', 'は', '禁煙', 'です'], { alt: ['koko wa kinen desu'] }),
          s('u13-s-retsuninarande', '列に並んでください。', 'れつにならんでください。', 'retsu ni narande kudasai', 'Please line up.', ['列', 'に', '並んで', 'ください'], { note: '列 (れつ) = line, queue' }),
        ],
      },
    ],
    reading: {
      id: 'ja-u13-r',
      title: '日本のマナー · Manners in Japan',
      sentences: [
        s('r13-1', '日本では電車の中で電話をしません。', 'にほんではでんしゃのなかででんわをしません。', 'nihon de wa densha no naka de denwa wo shimasen', 'In Japan, people don’t make phone calls on trains.', []),
        s('r13-2', '他の人の迷惑になるからです。', 'ほかのひとのめいわくになるからです。', 'hoka no hito no meiwaku ni naru kara desu', 'That’s because it bothers other people.', [], { note: '他の (ほかの) = other' }),
        s('r13-3', '駅ではきちんと並んで電車を待ちます。', 'えきではきちんとならんででんしゃをまちます。', 'eki de wa kichinto narande densha wo machimasu', 'At stations, people line up neatly and wait for the train.', [], {
          note: 'きちんと = neatly, properly',
        }),
        s('r13-4', 'ごみは決められた日に捨てます。', 'ごみはきめられたひにすてます。', 'gomi wa kimerareta hi ni sutemasu', 'Rubbish is thrown out on set days.', [], { note: '決められた = decided, set' }),
      ],
      questions: [
        { q: 'What don’t people do on trains?', options: ['Make phone calls', 'Read', 'Sit down'], answer: 0 },
        { q: 'Why not?', options: ['It’s expensive', 'It bothers other people', 'Phones don’t work'], answer: 1 },
        { q: 'When is rubbish thrown out?', options: ['Any time', 'Every morning', 'On set days'], answer: 2 },
      ],
    },
  },
]

export const jaMoreUnitsGrammar: Record<string, GrammarPoint[]> = {
  'ja-u10-l1': [
    {
      title: 'There is: Place に Thing が あります',
      pattern: 'Place に Thing が あります',
      explanation: 'This says that something exists somewhere. The place takes に and the thing takes が.',
      examples: [ex('机の上に本があります。', 'つくえのうえにほんがあります。', 'tsukue no ue ni hon ga arimasu', 'There’s a book on the desk.')],
    },
    {
      title: 'Possession with の',
      pattern: 'Owner の Thing',
      explanation: 'の links an owner to a thing, like English “’s”.',
      examples: [ex('先生の傘', 'せんせいのかさ', 'sensei no kasa', 'the teacher’s umbrella')],
    },
  ],
  'ja-u10-l2': [
    {
      title: 'Position words: X の 上 / 下 / 中',
      pattern: 'Reference の Position',
      explanation: 'The reference point comes first, then の, then the position word: “the desk’s top”.',
      examples: [ex('駅の前', 'えきのまえ', 'eki no mae', 'in front of the station'), ex('部屋の中', 'へやのなか', 'heya no naka', 'inside the room')],
    },
    {
      title: 'Where something is: Thing は Place に あります / います',
      explanation: 'Putting the thing first with は asks or tells where it is.',
      examples: [ex('鍵は鞄の中にあります。', 'かぎはかばんのなかにあります。', 'kagi wa kaban no naka ni arimasu', 'The key is in the bag.')],
    },
  ],
  'ja-u10-l3': [
    {
      title: 'Colours before nouns',
      explanation: 'Colours like 赤い are い-adjectives and go straight before a noun.',
      examples: [ex('青い車', 'あおいくるま', 'aoi kuruma', 'a blue car')],
    },
    {
      title: 'Past い-adjectives: 〜かった',
      pattern: 'Adj (drop い) + かったです',
      explanation: 'Swap the final い for かった to put an adjective in the past.',
      examples: [ex('高かったです。', 'たかかったです。', 'takakatta desu', 'It was expensive.')],
    },
  ],
  'ja-u11-l1': [
    {
      title: 'Particles that verbs choose',
      explanation: 'Most action verbs take を (本を読む), but 会う takes に (友達に会う) and 分かる takes が (日本語が分かる).',
      examples: [ex('英語が分かります。', 'えいごがわかります。', 'eigo ga wakarimasu', 'I understand English.')],
    },
  ],
  'ja-u11-l2': [
    {
      title: 'Last, this, next: 先 / 今 / 来',
      explanation: '先 (last), 今 (this) and 来 (next) combine with 週 (week), 月 (month) and others. Years are irregular: 去年, 今年, 来年.',
      examples: [ex('今月', 'こんげつ', 'kongetsu', 'this month'), ex('今年', 'ことし', 'kotoshi', 'this year')],
    },
    {
      title: 'Past adjectives in sentences',
      explanation: 'Use 〜かったです for how something was.',
      examples: [ex('楽しかったです。', 'たのしかったです。', 'tanoshikatta desu', 'It was fun.')],
    },
  ],
  'ja-u11-l3': [
    {
      title: 'Question word + か = some-',
      explanation: 'Adding か to a question word makes it indefinite: だれか (someone), いつか (some day), どこか (somewhere).',
      examples: [ex('だれかいますか。', null, 'dareka imasu ka', 'Is anyone there?')],
    },
    {
      title: 'What kind of: どんな + noun',
      explanation: 'どんな asks about the type or nature of something.',
      examples: [ex('どんな人ですか。', 'どんなひとですか。', 'donna hito desu ka', 'What kind of person are they?')],
    },
  ],
  'ja-u12-l1': [
    {
      title: 'に乗る, を降りる',
      explanation: 'You get on to a vehicle with に and get off from it with を.',
      examples: [ex('電車に乗ります。', 'でんしゃにのります。', 'densha ni norimasu', 'I get on the train.'), ex('バスを降ります。', 'バスをおります。', 'basu wo orimasu', 'I get off the bus.')],
    },
  ],
  'ja-u12-l2': [
    {
      title: 'Moving through a place: を',
      explanation: 'を also marks the place you move along or across: 道を歩く (walk along the road), 橋を渡る (cross a bridge).',
      examples: [ex('橋を渡ります。', 'はしをわたります。', 'hashi wo watarimasu', 'I cross the bridge.')],
    },
    {
      title: 'Chaining steps with the て-form',
      explanation: 'Join actions in order with the て-form: “go straight, then turn right”.',
      examples: [ex('まっすぐ行って、右に曲がってください。', 'まっすぐいって、みぎにまがってください。', 'massugu itte, migi ni magatte kudasai', 'Go straight, then turn right.')],
    },
  ],
  'ja-u12-l3': [
    {
      title: 'Counting nights: 〜泊',
      explanation: 'Nights use the counter 泊, which changes sound: 一泊 (いっぱく), 二泊 (にはく), 三泊 (さんぱく).',
      examples: [ex('三泊します。', 'さんぱくします。', 'sanpaku shimasu', 'I’ll stay three nights.')],
    },
    {
      title: 'Is it free? 空いていますか',
      explanation: '空いています describes a state: something is vacant or available.',
      examples: [ex('部屋は空いていますか。', 'へやはあいていますか。', 'heya wa aite imasu ka', 'Do you have a room available?')],
    },
  ],
  'ja-u13-l1': [
    {
      title: 'Changing over time: 〜ています',
      explanation: 'With verbs of change (減る, 増える), 〜ています describes a trend that is under way.',
      examples: [ex('人口が増えています。', 'じんこうがふえています。', 'jinkou ga fuete imasu', 'The population is growing.')],
    },
    {
      title: 'Appeals: 〜ましょう',
      explanation: '〜ましょう (“let’s”) is common on posters and in public announcements.',
      examples: [ex('ごみを減らしましょう。', 'ごみをへらしましょう。', 'gomi wo herashimashou', 'Let’s reduce waste.')],
    },
  ],
  'ja-u13-l2': [
    {
      title: 'Hearsay: 〜そうです',
      pattern: 'Plain form + そうです',
      explanation: 'This reports something you heard from someone else. Nouns take だ before そうです.',
      examples: [ex('明日は雨だそうです。', 'あしたはあめだそうです。', 'ashita wa ame da sou desu', 'I heard it’s going to rain tomorrow.')],
    },
    {
      title: 'According to: 〜によると',
      explanation: 'によると names the source. It often pairs with そうです.',
      examples: [ex('天気予報によると', 'てんきよほうによると', 'tenki yohou ni yoru to', 'according to the weather forecast')],
    },
  ],
  'ja-u13-l3': [
    {
      title: 'Make sure to: 〜ようにする',
      pattern: 'Plain form + ようにしてください',
      explanation: 'This asks someone to make an effort to do (or not do) something.',
      examples: [ex('遅れないようにしてください。', 'おくれないようにしてください。', 'okurenai you ni shite kudasai', 'Please make sure you’re not late.')],
    },
    {
      title: 'Causing trouble: 迷惑をかける',
      explanation: '迷惑をかける means to cause someone trouble. It’s a key idea in Japanese manners.',
      examples: [ex('人に迷惑をかけないでください。', 'ひとにめいわくをかけないでください。', 'hito ni meiwaku wo kakenaide kudasai', 'Please don’t bother other people.')],
    },
  ],
}
