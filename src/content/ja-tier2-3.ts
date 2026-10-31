/** Japanese tiers 2–3: JLPT N4 and N3 units, with their grammar notes. */
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

export const jaTier23Units: Unit[] = [
  /* ---------------- N4 ---------------- */
  {
    id: 'ja-u6',
    title: 'Hobbies & Abilities',
    level: 'N4',
    canDo: ['Talk about your hobbies', 'Invite someone with 〜ませんか', 'Say what you can do and want to do'],
    lessons: [
      {
        id: 'ja-u6-l1',
        title: 'Hobbies',
        goal: 'Talk about free time',
        items: [
          w('u6-shumi', '趣味', 'しゅみ', 'shumi', 'hobby'),
          w('u6-ongaku', '音楽', 'おんがく', 'ongaku', 'music'),
          w('u6-eiga', '映画', 'えいが', 'eiga', 'movie', { meaningAlt: ['film'] }),
          w('u6-shashin', '写真', 'しゃしん', 'shashin', 'photo', { meaningAlt: ['photograph'] }),
          w('u6-ryokou', '旅行', 'りょこう', 'ryokou', 'travel', { alt: ['ryoko'], meaningAlt: ['trip'] }),
          w('u6-ryouri', '料理', 'りょうり', 'ryouri', 'cooking', { alt: ['ryori'], meaningAlt: ['cuisine'] }),
          w('u6-shuumatsu', '週末', 'しゅうまつ', 'shuumatsu', 'weekend', { alt: ['shumatsu'] }),
          w('u6-isshoni', '一緒に', 'いっしょに', 'issho ni', 'together'),
        ],
        sentences: [
          s('u6-s-shumiongaku', '趣味は音楽です。', 'しゅみはおんがくです。', 'shumi wa ongaku desu', 'My hobby is music.', ['趣味', 'は', '音楽', 'です']),
          s('u6-s-shuumatsueiga', '週末、映画を見ます。', 'しゅうまつ、えいがをみます。', 'shuumatsu, eiga wo mimasu', 'I watch movies at the weekend.', ['週末', '映画', 'を', '見ます'], {
            alt: ['shuumatsu eiga o mimasu'],
            note: '見ます (みます) = to watch / see',
          }),
          s('u6-s-isshoniikimasenka', '一緒に行きませんか。', 'いっしょにいきませんか。', 'issho ni ikimasen ka', 'Would you like to go together?', ['一緒に', '行きません', 'か']),
        ],
      },
      {
        id: 'ja-u6-l2',
        title: 'Can & Want',
        goal: 'Say what you can do and want',
        items: [
          w('u6-dekimasu', 'できます', null, 'dekimasu', 'can do', { meaningAlt: ['to be able to'] }),
          w('u6-jouzu', '上手', 'じょうず', 'jouzu', 'good at', { alt: ['jozu'], meaningAlt: ['skilful'] }),
          w('u6-heta', '下手', 'へた', 'heta', 'bad at', { meaningAlt: ['unskilled'] }),
          w('u6-hoshii', '欲しい', 'ほしい', 'hoshii', 'want (a thing)'),
          w('u6-uta', '歌', 'うた', 'uta', 'song', { meaningAlt: ['singing'] }),
          w('u6-oyogimasu', '泳ぎます', 'およぎます', 'oyogimasu', 'to swim'),
          w('u6-piano', 'ピアノ', null, 'piano', 'piano'),
          w('u6-sukoshi', '少し', 'すこし', 'sukoshi', 'a little', { meaningAlt: ['a bit'] }),
        ],
        sentences: [
          s('u6-s-nihongodekimasu', '日本語が少しできます。', 'にほんごがすこしできます。', 'nihongo ga sukoshi dekimasu', 'I can speak a little Japanese.', ['日本語', 'が', '少し', 'できます'], {
            note: '日本語 (にほんご) = Japanese (language)',
          }),
          s('u6-s-utagajouzu', '母は歌が上手です。', 'はははうたがじょうずです。', 'haha wa uta ga jouzu desu', 'My mother is good at singing.', ['母', 'は', '歌', 'が', '上手', 'です']),
          s('u6-s-pianogahoshii', '新しいピアノが欲しいです。', 'あたらしいピアノがほしいです。', 'atarashii piano ga hoshii desu', 'I want a new piano.', ['新しい', 'ピアノ', 'が', '欲しい', 'です']),
        ],
      },
    ],
    reading: {
      id: 'ja-u6-r',
      title: '私の趣味 · My Hobbies',
      sentences: [
        s('r6-1', '私の趣味は旅行と写真です。', 'わたしのしゅみはりょこうとしゃしんです。', 'watashi no shumi wa ryokou to shashin desu', 'My hobbies are travel and photography.', []),
        s('r6-2', '週末、友達と山へ行きました。', 'しゅうまつ、ともだちとやまへいきました。', 'shuumatsu, tomodachi to yama e ikimashita', 'At the weekend I went to the mountains with a friend.', [], {
          note: '山 (やま) = mountain',
        }),
        s('r6-3', '友達は写真が上手です。', 'ともだちはしゃしんがじょうずです。', 'tomodachi wa shashin ga jouzu desu', 'My friend is good at photography.', []),
        s('r6-4', '来週、一緒に海へ行きたいです。', 'らいしゅう、いっしょにうみへいきたいです。', 'raishuu, issho ni umi e ikitai desu', 'Next week I want to go to the sea together.', [], {
          note: '来週 = next week; 海 (うみ) = sea',
        }),
      ],
      questions: [
        { q: 'What are the writer’s hobbies?', options: ['Music and cooking', 'Travel and photography', 'Movies and singing'], answer: 1 },
        { q: 'Where did they go at the weekend?', options: ['The mountains', 'The sea', 'The station'], answer: 0 },
        { q: 'Where does the writer want to go next week?', options: ['The cinema', 'The mountains', 'The sea'], answer: 2 },
      ],
    },
  },
  {
    id: 'ja-u7',
    title: 'Health & Requests',
    level: 'N4',
    canDo: ['Say what hurts and how you feel', 'Talk about the past with ました', 'Make polite requests with 〜てください'],
    lessons: [
      {
        id: 'ja-u7-l1',
        title: 'At the Doctor',
        goal: 'Describe symptoms',
        items: [
          w('u7-atama', '頭', 'あたま', 'atama', 'head'),
          w('u7-onaka', 'お腹', 'おなか', 'onaka', 'stomach', { meaningAlt: ['belly'] }),
          w('u7-itai', '痛い', 'いたい', 'itai', 'painful', { meaningAlt: ['hurts'] }),
          w('u7-byouki', '病気', 'びょうき', 'byouki', 'illness', { alt: ['byoki'], meaningAlt: ['sick'] }),
          w('u7-byouin', '病院', 'びょういん', 'byouin', 'hospital', { alt: ['byoin'] }),
          w('u7-kusuri', '薬', 'くすり', 'kusuri', 'medicine'),
          w('u7-netsu', '熱', 'ねつ', 'netsu', 'fever'),
          w('u7-kaze', '風邪', 'かぜ', 'kaze', 'a cold (illness)'),
        ],
        sentences: [
          s('u7-s-atamagaitai', '頭が痛いです。', 'あたまがいたいです。', 'atama ga itai desu', 'I have a headache.', ['頭', 'が', '痛い', 'です']),
          s('u7-s-kazewohiita', '風邪をひきました。', 'かぜをひきました。', 'kaze wo hikimashita', 'I caught a cold.', ['風邪', 'を', 'ひきました'], {
            alt: ['kaze o hikimashita'],
            note: '風邪をひく = to catch a cold',
          }),
          s('u7-s-netsugaarimasu', '熱があります。', 'ねつがあります。', 'netsu ga arimasu', 'I have a fever.', ['熱', 'が', 'あります']),
        ],
      },
      {
        id: 'ja-u7-l2',
        title: 'Please…',
        goal: 'Make polite requests',
        items: [
          w('u7-matte', '待って', 'まって', 'matte', 'wait (て-form)'),
          w('u7-misete', '見せて', 'みせて', 'misete', 'show (て-form)'),
          w('u7-oshiete', '教えて', 'おしえて', 'oshiete', 'tell / teach (て-form)'),
          w('u7-tetsudatte', '手伝って', 'てつだって', 'tetsudatte', 'help (て-form)'),
          w('u7-akete', '開けて', 'あけて', 'akete', 'open (て-form)'),
          w('u7-yukkuri', 'ゆっくり', null, 'yukkuri', 'slowly'),
          w('u7-mouichido', 'もう一度', 'もういちど', 'mou ichido', 'once more', { alt: ['mo ichido'], meaningAlt: ['again'] }),
          w('u7-mado', '窓', 'まど', 'mado', 'window'),
        ],
        sentences: [
          s('u7-s-chottomatte', 'ちょっと待ってください。', 'ちょっとまってください。', 'chotto matte kudasai', 'Please wait a moment.', ['ちょっと', '待って', 'ください']),
          s('u7-s-mouichidoitte', 'もう一度言ってください。', 'もういちどいってください。', 'mou ichido itte kudasai', 'Please say it once more.', ['もう一度', '言って', 'ください'], {
            note: '言って (いって) = say (て-form)',
          }),
          s('u7-s-madowoakete', '窓を開けてください。', 'まどをあけてください。', 'mado wo akete kudasai', 'Please open the window.', ['窓', 'を', '開けて', 'ください'], {
            alt: ['mado o akete kudasai'],
          }),
        ],
      },
    ],
    reading: {
      id: 'ja-u7-r',
      title: '風邪 · A Cold',
      sentences: [
        s('r7-1', '昨日から頭が痛いです。', 'きのうからあたまがいたいです。', 'kinou kara atama ga itai desu', 'I’ve had a headache since yesterday.', [], { note: 'から = since / from' }),
        s('r7-2', '熱もあります。', 'ねつもあります。', 'netsu mo arimasu', 'I have a fever too.', []),
        s('r7-3', '病院で先生は「風邪ですね」と言いました。', 'びょういんでせんせいは「かぜですね」といいました。', 'byouin de sensei wa “kaze desu ne” to iimashita', 'At the hospital the doctor said, “It’s a cold.”', [], {
          note: 'で = at (place of action); と言いました = said',
        }),
        s('r7-4', '薬を飲んで、ゆっくり休みます。', 'くすりをのんで、ゆっくりやすみます。', 'kusuri wo nonde, yukkuri yasumimasu', 'I’ll take medicine and rest well.', [], { note: '休みます (やすみます) = to rest' }),
      ],
      questions: [
        { q: 'Since when has the writer had a headache?', options: ['Today', 'Yesterday', 'Last week'], answer: 1 },
        { q: 'What did the doctor say?', options: ['It’s a cold', 'It’s nothing', 'Go back to work'], answer: 0 },
        { q: 'What will the writer do?', options: ['Go to school', 'Eat sushi', 'Take medicine and rest'], answer: 2 },
      ],
    },
  },

  /* ---------------- N3 ---------------- */
  {
    id: 'ja-u8',
    title: 'Work & Opinions',
    level: 'N3',
    canDo: ['Talk about work and obligations', 'Use basic keigo to introduce yourself', 'Give opinions and reasons'],
    lessons: [
      {
        id: 'ja-u8-l1',
        title: 'At the Office',
        goal: 'Talk about work',
        items: [
          w('u8-kaisha', '会社', 'かいしゃ', 'kaisha', 'company'),
          w('u8-kaigi', '会議', 'かいぎ', 'kaigi', 'meeting'),
          w('u8-shachou', '社長', 'しゃちょう', 'shachou', 'company president', { alt: ['shacho'] }),
          w('u8-shigoto', '仕事', 'しごと', 'shigoto', 'work', { meaningAlt: ['job'] }),
          w('u8-zangyou', '残業', 'ざんぎょう', 'zangyou', 'overtime', { alt: ['zangyo'] }),
          w('u8-shimekiri', '締め切り', 'しめきり', 'shimekiri', 'deadline'),
          w('u8-shorui', '書類', 'しょるい', 'shorui', 'documents', { meaningAlt: ['paperwork'] }),
          w('u8-okureru', '遅れる', 'おくれる', 'okureru', 'to be late'),
        ],
        sentences: [
          s('u8-s-kaiginiokuremashita', '会議に遅れました。', 'かいぎにおくれました。', 'kaigi ni okuremashita', 'I was late for the meeting.', ['会議', 'に', '遅れました']),
          s('u8-s-shimekiriashita', '締め切りは明日です。', 'しめきりはあしたです。', 'shimekiri wa ashita desu', 'The deadline is tomorrow.', ['締め切り', 'は', '明日', 'です']),
          s('u8-s-zangyou', '今日は残業しなければなりません。', 'きょうはざんぎょうしなければなりません。', 'kyou wa zangyou shinakereba narimasen', 'I have to work overtime today.', [
            '今日',
            'は',
            '残業',
            'しなければなりません',
          ]),
        ],
      },
      {
        id: 'ja-u8-l2',
        title: 'Opinions',
        goal: 'Say what you think and why',
        items: [
          w('u8-omoimasu', '思います', 'おもいます', 'omoimasu', 'to think'),
          w('u8-riyuu', '理由', 'りゆう', 'riyuu', 'reason', { alt: ['riyu'] }),
          w('u8-tatoeba', '例えば', 'たとえば', 'tatoeba', 'for example'),
          w('u8-tokuni', '特に', 'とくに', 'toku ni', 'especially'),
          w('u8-hitsuyou', '必要', 'ひつよう', 'hitsuyou', 'necessary', { alt: ['hitsuyo'] }),
          w('u8-keiken', '経験', 'けいけん', 'keiken', 'experience'),
          w('u8-iken', '意見', 'いけん', 'iken', 'opinion'),
          w('u8-hantai', '反対', 'はんたい', 'hantai', 'against', { meaningAlt: ['opposed', 'opposite'] }),
        ],
        sentences: [
          s('u8-s-sououomoimasu', '私もそう思います。', 'わたしもそうおもいます。', 'watashi mo sou omoimasu', 'I think so too.', ['私', 'も', 'そう', '思います']),
          s('u8-s-keikengahitsuyou', '経験が必要です。', 'けいけんがひつようです。', 'keiken ga hitsuyou desu', 'Experience is necessary.', ['経験', 'が', '必要', 'です']),
          s('u8-s-ikennihantai', 'その意見に反対です。', 'そのいけんにはんたいです。', 'sono iken ni hantai desu', 'I’m against that opinion.', ['その', '意見', 'に', '反対', 'です']),
        ],
      },
    ],
    reading: {
      id: 'ja-u8-r',
      title: '会社の毎日 · Office Life',
      sentences: [
        s('r8-1', '私は東京の会社で働いています。', 'わたしはとうきょうのかいしゃではたらいています。', 'watashi wa toukyou no kaisha de hataraite imasu', 'I work at a company in Tokyo.', [], {
          note: '働いています = am working (ongoing)',
        }),
        s('r8-2', '毎日忙しくて、よく残業します。', 'まいにちいそがしくて、よくざんぎょうします。', 'mainichi isogashikute, yoku zangyou shimasu', 'I’m busy every day and often work overtime.', [], {
          note: '忙しい = busy; よく = often',
        }),
        s('r8-3', '社長は「仕事は経験が大切だ」と言います。', 'しゃちょうは「しごとはけいけんがたいせつだ」といいます。', 'shachou wa “shigoto wa keiken ga taisetsu da” to iimasu', 'The president says, “In work, experience is what matters.”', [], {
          note: '大切 (たいせつ) = important',
        }),
        s('r8-4', '私もそう思います。', 'わたしもそうおもいます。', 'watashi mo sou omoimasu', 'I think so too.', []),
      ],
      questions: [
        { q: 'Where does the writer work?', options: ['At a school', 'At a company in Tokyo', 'At a hospital'], answer: 1 },
        { q: 'What does the writer often do?', options: ['Work overtime', 'Travel', 'Go to bed early'], answer: 0 },
        { q: 'What does the president say matters in work?', options: ['Money', 'Speed', 'Experience'], answer: 2 },
      ],
    },
  },
  {
    id: 'ja-u9',
    title: 'Plans & Feelings',
    level: 'N3',
    canDo: ['Talk about intentions and experiences', 'Make plans and reservations', 'Express feelings and conditions'],
    lessons: [
      {
        id: 'ja-u9-l1',
        title: 'Making Plans',
        goal: 'Talk about plans and experiences',
        items: [
          w('u9-yotei', '予定', 'よてい', 'yotei', 'schedule', { meaningAlt: ['plans'] }),
          w('u9-yoyaku', '予約', 'よやく', 'yoyaku', 'reservation', { meaningAlt: ['booking'] }),
          w('u9-keikaku', '計画', 'けいかく', 'keikaku', 'plan', { meaningAlt: ['project'] }),
          w('u9-junbi', '準備', 'じゅんび', 'junbi', 'preparation'),
          w('u9-kimeru', '決める', 'きめる', 'kimeru', 'to decide'),
          w('u9-tanoshimi', '楽しみ', 'たのしみ', 'tanoshimi', 'something to look forward to'),
          w('u9-shourai', '将来', 'しょうらい', 'shourai', 'future', { alt: ['shorai'] }),
          w('u9-yume', '夢', 'ゆめ', 'yume', 'dream'),
        ],
        sentences: [
          s('u9-s-yoteiwokimemashou', '来週の予定を決めましょう。', 'らいしゅうのよていをきめましょう。', 'raishuu no yotei wo kimemashou', 'Let’s decide next week’s schedule.', ['来週', 'の', '予定', 'を', '決めましょう'], {
            alt: ['raishuu no yotei o kimemashou'],
          }),
          s('u9-s-hoteruyoyaku', 'ホテルを予約しました。', 'ホテルをよやくしました。', 'hoteru wo yoyaku shimashita', 'I booked a hotel.', ['ホテル', 'を', '予約しました'], {
            alt: ['hoteru o yoyaku shimashita'],
          }),
          s('u9-s-ryokougatanoshimi', '旅行が楽しみです。', 'りょこうがたのしみです。', 'ryokou ga tanoshimi desu', 'I’m looking forward to the trip.', ['旅行', 'が', '楽しみ', 'です']),
        ],
      },
      {
        id: 'ja-u9-l2',
        title: 'Feelings',
        goal: 'Express emotions',
        items: [
          w('u9-ureshii', '嬉しい', 'うれしい', 'ureshii', 'happy', { meaningAlt: ['glad'] }),
          w('u9-kanashii', '悲しい', 'かなしい', 'kanashii', 'sad'),
          w('u9-shinpai', '心配', 'しんぱい', 'shinpai', 'worry', { meaningAlt: ['worried'] }),
          w('u9-anshin', '安心', 'あんしん', 'anshin', 'relief', { meaningAlt: ['relieved'] }),
          w('u9-odoroku', '驚く', 'おどろく', 'odoroku', 'to be surprised'),
          w('u9-okoru', '怒る', 'おこる', 'okoru', 'to get angry'),
          w('u9-sabishii', '寂しい', 'さびしい', 'sabishii', 'lonely'),
          w('u9-hazukashii', '恥ずかしい', 'はずかしい', 'hazukashii', 'embarrassed', { meaningAlt: ['shy'] }),
        ],
        sentences: [
          s('u9-s-aeteureshii', '会えて嬉しいです。', 'あえてうれしいです。', 'aete ureshii desu', 'I’m happy to see you.', ['会えて', '嬉しい', 'です']),
          s('u9-s-shinpaishinaide', '心配しないでください。', 'しんぱいしないでください。', 'shinpai shinaide kudasai', 'Please don’t worry.', ['心配', 'しないで', 'ください']),
          s('u9-s-hitoridesabishii', '一人で寂しいです。', 'ひとりでさびしいです。', 'hitori de sabishii desu', 'I’m lonely on my own.', ['一人', 'で', '寂しい', 'です'], {
            note: '一人 (ひとり) = one person, alone',
          }),
        ],
      },
    ],
    reading: {
      id: 'ja-u9-r',
      title: '京都旅行 · A Trip to Kyoto',
      sentences: [
        s('r9-1', '来月、友達と京都へ旅行するつもりです。', 'らいげつ、ともだちときょうとへりょこうするつもりです。', 'raigetsu, tomodachi to kyouto e ryokou suru tsumori desu', 'Next month I plan to travel to Kyoto with a friend.', [], {
          note: '来月 = next month',
        }),
        s('r9-2', 'もうホテルを予約しました。', 'もうホテルをよやくしました。', 'mou hoteru wo yoyaku shimashita', 'I’ve already booked the hotel.', [], { note: 'もう = already' }),
        s('r9-3', '京都に行ったことがないので、とても楽しみです。', 'きょうとにいったことがないので、とてもたのしみです。', 'kyouto ni itta koto ga nai node, totemo tanoshimi desu', 'I’ve never been to Kyoto, so I’m really looking forward to it.', []),
        s('r9-4', 'でも、雨が降ったら、少し心配です。', 'でも、あめがふったら、すこししんぱいです。', 'demo, ame ga futtara, sukoshi shinpai desu', 'But if it rains, I’ll be a little worried.', [], {
          note: '雨が降る (あめがふる) = to rain',
        }),
      ],
      questions: [
        { q: 'Where are they travelling?', options: ['Tokyo', 'Kyoto', 'Osaka'], answer: 1 },
        { q: 'What has the writer already done?', options: ['Booked a hotel', 'Bought train tickets', 'Packed'], answer: 0 },
        { q: 'What is the writer worried about?', options: ['Money', 'The hotel', 'Rain'], answer: 2 },
      ],
    },
  },
]

export const jaTier23Grammar: Record<string, GrammarPoint[]> = {
  'ja-u6-l1': [
    {
      title: 'Invitations: 〜ませんか / 〜ましょう',
      pattern: 'Verb-ません + か / Verb-ましょう',
      explanation: '〜ませんか (“won’t you…?”) is a polite invitation. 〜ましょう means “let’s…”, often used to accept one.',
      examples: [ex('一緒に食べませんか。', 'いっしょにたべませんか。', 'issho ni tabemasen ka', 'Would you like to eat together?'), ex('行きましょう。', 'いきましょう。', 'ikimashou', 'Let’s go.')],
    },
    {
      title: 'Turning verbs into nouns with こと',
      pattern: 'Dictionary form + こと',
      explanation: 'A verb in its dictionary form plus こと becomes a noun phrase — handy for talking about hobbies.',
      examples: [ex('趣味は写真を撮ることです。', 'しゅみはしゃしんをとることです。', 'shumi wa shashin wo toru koto desu', 'My hobby is taking photos.')],
    },
  ],
  'ja-u6-l2': [
    {
      title: 'が with skills and desires',
      pattern: 'Thing が 上手 / 下手 / できます / 欲しい',
      explanation: 'These words describe a state, not an action, so the thing is marked with が instead of を.',
      examples: [ex('料理が上手です。', 'りょうりがじょうずです。', 'ryouri ga jouzu desu', 'I’m good at cooking.'), ex('ピアノができます。', null, 'piano ga dekimasu', 'I can play the piano.')],
    },
    {
      title: 'Want to do: 〜たい',
      pattern: 'Verb stem + たいです',
      explanation: 'Drop ます and add たい to say what you want to do. It conjugates like an い-adjective (〜たくない = don’t want to).',
      examples: [ex('泳ぎたいです。', 'およぎたいです。', 'oyogitai desu', 'I want to swim.'), ex('日本へ行きたいです。', 'にほんへいきたいです。', 'nihon e ikitai desu', 'I want to go to Japan.')],
    },
  ],
  'ja-u7-l1': [
    {
      title: 'Saying what hurts',
      pattern: 'Body part が 痛いです',
      explanation: 'The body part takes が, and 痛い (painful) describes it.',
      examples: [ex('お腹が痛いです。', 'おなかがいたいです。', 'onaka ga itai desu', 'My stomach hurts.')],
    },
    {
      title: 'Past tense: 〜ました',
      pattern: 'Verb stem + ました / ませんでした',
      explanation: 'Change ます to ました for the past and ませんでした for the negative past. Note that medicine is “drunk” in Japanese.',
      examples: [ex('病院へ行きました。', 'びょういんへいきました。', 'byouin e ikimashita', 'I went to the hospital.'), ex('薬を飲みました。', 'くすりをのみました。', 'kusuri wo nomimashita', 'I took medicine.')],
    },
  ],
  'ja-u7-l2': [
    {
      title: 'Polite requests: 〜てください',
      pattern: 'て-form + ください',
      explanation: 'The て-form is built from the dictionary form: 待つ → 待って, 見せる → 見せて, 教える → 教えて. Add ください to ask politely.',
      examples: [ex('教えてください。', 'おしえてください。', 'oshiete kudasai', 'Please tell me.'), ex('手伝ってください。', 'てつだってください。', 'tetsudatte kudasai', 'Please help me.')],
    },
    {
      title: 'Asking people to slow down',
      explanation: 'ゆっくり (slowly) and もう一度 (once more) are lifesavers in conversation.',
      examples: [ex('ゆっくり話してください。', 'ゆっくりはなしてください。', 'yukkuri hanashite kudasai', 'Please speak slowly.')],
    },
  ],
  'ja-u8-l1': [
    {
      title: 'Must: 〜なければなりません',
      pattern: 'Negative stem + なければなりません',
      explanation: 'Literally “if not doing, it won’t do”. Take the plain negative (行かない), drop い, and add ければなりません.',
      examples: [ex('行かなければなりません。', 'いかなければなりません。', 'ikanakereba narimasen', 'I must go.'), ex('書類を書かなければなりません。', 'しょるいをかかなければなりません。', 'shorui wo kakanakereba narimasen', 'I have to write the documents.')],
    },
    {
      title: 'Keigo basics',
      explanation: 'Business Japanese uses humble verbs for yourself (申します = to be called) and respectful verbs for others (いらっしゃいます = to be / come / go).',
      examples: [ex('田中と申します。', 'たなかともうします。', 'tanaka to moushimasu', 'My name is Tanaka. (humble)'), ex('社長はいらっしゃいますか。', 'しゃちょうはいらっしゃいますか。', 'shachou wa irasshaimasu ka', 'Is the president in? (respectful)')],
    },
  ],
  'ja-u8-l2': [
    {
      title: 'Opinions: 〜と思います',
      pattern: 'Plain form + と思います',
      explanation: 'Put a sentence in plain form before と思います to say “I think…”. Nouns and な-adjectives need だ.',
      examples: [ex('明日は雨だと思います。', 'あしたはあめだとおもいます。', 'ashita wa ame da to omoimasu', 'I think it will rain tomorrow.')],
    },
    {
      title: 'Reasons: から and ので',
      pattern: 'Reason + から / ので, Result',
      explanation: 'Both mean “because”. ので sounds softer and more polite; から is more direct.',
      examples: [ex('忙しいので、行けません。', 'いそがしいので、いけません。', 'isogashii node, ikemasen', 'I’m busy, so I can’t go.'), ex('雨だから、家にいます。', 'あめだから、いえにいます。', 'ame da kara, ie ni imasu', 'It’s raining, so I’m staying home.')],
    },
  ],
  'ja-u9-l1': [
    {
      title: 'Intentions: 〜つもりです',
      pattern: 'Dictionary form + つもりです',
      explanation: 'つもり expresses a firm intention or plan.',
      examples: [ex('来年、日本へ行くつもりです。', 'らいねん、にほんへいくつもりです。', 'rainen, nihon e iku tsumori desu', 'I intend to go to Japan next year.')],
    },
    {
      title: 'Experiences: 〜たことがあります',
      pattern: 'た-form + ことがあります',
      explanation: 'Use this to say you have (or haven’t, with ない) done something before.',
      examples: [ex('富士山に登ったことがあります。', 'ふじさんにのぼったことがあります。', 'fujisan ni nobotta koto ga arimasu', 'I have climbed Mt. Fuji.'), ex('すしを食べたことがありません。', 'すしをたべたことがありません。', 'sushi wo tabeta koto ga arimasen', 'I have never eaten sushi.')],
    },
  ],
  'ja-u9-l2': [
    {
      title: 'Please don’t: 〜ないでください',
      pattern: 'Plain negative + でください',
      explanation: 'Add でください to the ない-form to ask someone not to do something.',
      examples: [ex('写真を撮らないでください。', 'しゃしんをとらないでください。', 'shashin wo toranaide kudasai', 'Please don’t take photos.')],
    },
    {
      title: 'If / when: 〜たら',
      pattern: 'た-form + ら',
      explanation: 'Add ら to the past plain form for “if” or “when (once)”.',
      examples: [ex('雨が降ったら、行きません。', 'あめがふったら、いきません。', 'ame ga futtara, ikimasen', 'If it rains, I won’t go.'), ex('時間があったら、電話してください。', 'じかんがあったら、でんわしてください。', 'jikan ga attara, denwa shite kudasai', 'If you have time, please call me.')],
    },
  ],
}
