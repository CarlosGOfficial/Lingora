/** Japanese: a third lesson for units 2–9, continuing each unit's theme. */
import type { GrammarExample, GrammarPoint, Item, Lesson } from './types'

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

export const jaMoreLessons: Record<string, Lesson[]> = {
  'ja-u2': [
    {
      id: 'ja-u2-l3',
      title: 'At a Restaurant',
      goal: 'Order and talk about food',
      items: [
        w('u2-menyuu', 'メニュー', null, 'menyuu', 'menu', { alt: ['menyu'] }),
        w('u2-niku', '肉', 'にく', 'niku', 'meat'),
        w('u2-sakana', '魚', 'さかな', 'sakana', 'fish'),
        w('u2-yasai', '野菜', 'やさい', 'yasai', 'vegetables'),
        w('u2-oishii', 'おいしい', null, 'oishii', 'delicious', { meaningAlt: ['tasty'] }),
        w('u2-pan', 'パン', null, 'pan', 'bread'),
        w('u2-tamago', '卵', 'たまご', 'tamago', 'egg'),
      ],
      sentences: [
        s('u2-s-menyuuwokudasai', 'メニューをください。', null, 'menyuu wo kudasai', 'The menu, please.', ['メニュー', 'を', 'ください'], {
          alt: ['menyuu o kudasai', 'menyu o kudasai'],
        }),
        s('u2-s-sakanagasuki', '魚が好きです。', 'さかながすきです。', 'sakana ga suki desu', 'I like fish.', ['魚', 'が', '好き', 'です']),
        s('u2-s-panoishii', 'このパンはおいしいです。', null, 'kono pan wa oishii desu', 'This bread is delicious.', ['この', 'パン', 'は', 'おいしい', 'です']),
      ],
    },
  ],
  'ja-u3': [
    {
      id: 'ja-u3-l3',
      title: 'What Are They Like?',
      goal: 'Describe people’s personalities',
      items: [
        w('u3-yasashii', '優しい', 'やさしい', 'yasashii', 'kind', { meaningAlt: ['gentle'] }),
        w('u3-omoshiroi', '面白い', 'おもしろい', 'omoshiroi', 'interesting', { meaningAlt: ['funny'] }),
        w('u3-genki', '元気', 'げんき', 'genki', 'healthy', { meaningAlt: ['energetic', 'well'] }),
        w('u3-kirei', 'きれい', null, 'kirei', 'pretty', { meaningAlt: ['clean'] }),
        w('u3-otouto', '弟', 'おとうと', 'otouto', '(my) younger brother', { alt: ['ototo'] }),
        w('u3-imouto', '妹', 'いもうと', 'imouto', '(my) younger sister', { alt: ['imoto'] }),
        w('u3-wakai', '若い', 'わかい', 'wakai', 'young'),
      ],
      sentences: [
        s('u3-s-imoutokirei', '妹はきれいです。', 'いもうとはきれいです。', 'imouto wa kirei desu', 'My younger sister is pretty.', ['妹', 'は', 'きれい', 'です']),
        s('u3-s-otoutogenki', '弟は元気です。', 'おとうとはげんきです。', 'otouto wa genki desu', 'My younger brother is well.', ['弟', 'は', '元気', 'です']),
        s('u3-s-senseiyasashii', '先生は優しいです。', 'せんせいはやさしいです。', 'sensei wa yasashii desu', 'The teacher is kind.', ['先生', 'は', '優しい', 'です']),
      ],
    },
  ],
  'ja-u4': [
    {
      id: 'ja-u4-l3',
      title: 'Days of the Week',
      goal: 'Name the days and make plans',
      items: [
        w('u4-getsuyoubi', '月曜日', 'げつようび', 'getsuyoubi', 'Monday', { alt: ['getsuyobi'] }),
        w('u4-kayoubi', '火曜日', 'かようび', 'kayoubi', 'Tuesday', { alt: ['kayobi'] }),
        w('u4-suiyoubi', '水曜日', 'すいようび', 'suiyoubi', 'Wednesday', { alt: ['suiyobi'] }),
        w('u4-mokuyoubi', '木曜日', 'もくようび', 'mokuyoubi', 'Thursday', { alt: ['mokuyobi'] }),
        w('u4-kinyoubi', '金曜日', 'きんようび', 'kinyoubi', 'Friday', { alt: ['kinyobi'] }),
        w('u4-doyoubi', '土曜日', 'どようび', 'doyoubi', 'Saturday', { alt: ['doyobi'] }),
        w('u4-nichiyoubi', '日曜日', 'にちようび', 'nichiyoubi', 'Sunday', { alt: ['nichiyobi'] }),
        w('u4-yasumi', '休み', 'やすみ', 'yasumi', 'day off', { meaningAlt: ['holiday', 'break'] }),
      ],
      sentences: [
        s('u4-s-getsuyoubidesu', '今日は月曜日です。', 'きょうはげつようびです。', 'kyou wa getsuyoubi desu', 'Today is Monday.', ['今日', 'は', '月曜日', 'です']),
        s('u4-s-nichiyoubiyasumi', '日曜日は休みです。', 'にちようびはやすみです。', 'nichiyoubi wa yasumi desu', 'Sunday is my day off.', ['日曜日', 'は', '休み', 'です']),
        s('u4-s-kinyoubiniaimashou', '金曜日に会いましょう。', 'きんようびにあいましょう。', 'kinyoubi ni aimashou', 'Let’s meet on Friday.', ['金曜日', 'に', '会いましょう'], {
          note: '会う (あう) = to meet',
        }),
      ],
    },
  ],
  'ja-u5': [
    {
      id: 'ja-u5-l3',
      title: 'Getting Around Town',
      goal: 'Say how you travel and give directions',
      items: [
        w('u5-densha', '電車', 'でんしゃ', 'densha', 'train'),
        w('u5-basu', 'バス', null, 'basu', 'bus'),
        w('u5-chikatetsu', '地下鉄', 'ちかてつ', 'chikatetsu', 'subway', { meaningAlt: ['underground', 'metro'] }),
        w('u5-aruite', '歩いて', 'あるいて', 'aruite', 'on foot', { meaningAlt: ['walking'] }),
        w('u5-migi', '右', 'みぎ', 'migi', 'right'),
        w('u5-hidari', '左', 'ひだり', 'hidari', 'left'),
        w('u5-chikai', '近い', 'ちかい', 'chikai', 'near', { meaningAlt: ['close'] }),
        w('u5-tooi', '遠い', 'とおい', 'tooi', 'far', { alt: ['toi'] }),
      ],
      sentences: [
        s('u5-s-ekichikai', '駅は近いです。', 'えきはちかいです。', 'eki wa chikai desu', 'The station is close.', ['駅', 'は', '近い', 'です']),
        s('u5-s-denshadeikimasu', '電車で行きます。', 'でんしゃでいきます。', 'densha de ikimasu', 'I’ll go by train.', ['電車', 'で', '行きます']),
        s('u5-s-miginimagatte', '右に曲がってください。', 'みぎにまがってください。', 'migi ni magatte kudasai', 'Please turn right.', ['右', 'に', '曲がって', 'ください'], {
          note: '曲がる (まがる) = to turn',
        }),
      ],
    },
  ],
  'ja-u6': [
    {
      id: 'ja-u6-l3',
      title: 'Weather & Seasons',
      goal: 'Talk about the weather',
      items: [
        w('u6-tenki', '天気', 'てんき', 'tenki', 'weather'),
        w('u6-ame', '雨', 'あめ', 'ame', 'rain'),
        w('u6-yuki', '雪', 'ゆき', 'yuki', 'snow'),
        w('u6-atsui', '暑い', 'あつい', 'atsui', 'hot (weather)'),
        w('u6-samui', '寒い', 'さむい', 'samui', 'cold (weather)'),
        w('u6-haru', '春', 'はる', 'haru', 'spring'),
        w('u6-natsu', '夏', 'なつ', 'natsu', 'summer'),
        w('u6-fuyu', '冬', 'ふゆ', 'fuyu', 'winter'),
      ],
      sentences: [
        s('u6-s-atsuidesune', '今日は暑いですね。', 'きょうはあついですね。', 'kyou wa atsui desu ne', 'It’s hot today, isn’t it?', ['今日', 'は', '暑い', 'です', 'ね']),
        s('u6-s-amegafutte', '雨が降っています。', 'あめがふっています。', 'ame ga futte imasu', 'It’s raining.', ['雨', 'が', '降って', 'います'], {
          note: '降る (ふる) = to fall (rain, snow)',
        }),
        s('u6-s-fuyusamui', '冬は寒いです。', 'ふゆはさむいです。', 'fuyu wa samui desu', 'Winter is cold.', ['冬', 'は', '寒い', 'です']),
      ],
    },
  ],
  'ja-u7': [
    {
      id: 'ja-u7-l3',
      title: 'Allowed & Not Allowed',
      goal: 'Ask permission and understand rules',
      items: [
        w('u7-haitte', '入って', 'はいって', 'haitte', 'enter (て-form)'),
        w('u7-suwatte', '座って', 'すわって', 'suwatte', 'sit (て-form)'),
        w('u7-tsukatte', '使って', 'つかって', 'tsukatte', 'use (て-form)'),
        w('u7-totte', '撮って', 'とって', 'totte', 'take a photo (て-form)'),
        w('u7-kinshi', '禁止', 'きんし', 'kinshi', 'prohibited', { meaningAlt: ['forbidden'] }),
        w('u7-daijoubu', '大丈夫', 'だいじょうぶ', 'daijoubu', 'all right', { alt: ['daijobu'], meaningAlt: ['OK', 'fine'] }),
        w('u7-denwa', '電話', 'でんわ', 'denwa', 'phone', { meaningAlt: ['telephone'] }),
      ],
      sentences: [
        s('u7-s-haittemoii', '入ってもいいですか。', 'はいってもいいですか。', 'haitte mo ii desu ka', 'May I come in?', ['入って', 'も', 'いい', 'です', 'か']),
        s('u7-s-tottewaikemasen', 'ここで写真を撮ってはいけません。', 'ここでしゃしんをとってはいけません。', 'koko de shashin wo totte wa ikemasen', 'You mustn’t take photos here.', [
          'ここ',
          'で',
          '写真',
          'を',
          '撮って',
          'は',
          'いけません',
        ], { alt: ['koko de shashin o totte wa ikemasen'] }),
        s('u7-s-daijoubudesu', '大丈夫です。', 'だいじょうぶです。', 'daijoubu desu', 'It’s fine.', ['大丈夫', 'です'], { alt: ['daijobu desu'] }),
      ],
    },
  ],
  'ja-u8': [
    {
      id: 'ja-u8-l3',
      title: 'Emails & Calls',
      goal: 'Handle polite business communication',
      items: [
        w('u8-renraku', '連絡', 'れんらく', 'renraku', 'contact', { meaningAlt: ['to get in touch'] }),
        w('u8-kakunin', '確認', 'かくにん', 'kakunin', 'confirmation', { meaningAlt: ['check'] }),
        w('u8-henji', '返事', 'へんじ', 'henji', 'reply', { meaningAlt: ['answer'] }),
        w('u8-tantou', '担当', 'たんとう', 'tantou', 'person in charge', { alt: ['tanto'] }),
        w('u8-onegai', 'お願い', 'おねがい', 'onegai', 'request', { meaningAlt: ['favour', 'please'] }),
        w('u8-okuru', '送る', 'おくる', 'okuru', 'to send'),
        w('u8-todoku', '届く', 'とどく', 'todoku', 'to arrive (deliveries)', { meaningAlt: ['to be delivered'] }),
        w('u8-atode', '後で', 'あとで', 'atode', 'later'),
      ],
      sentences: [
        s('u8-s-kakuninonegai', '確認をお願いします。', 'かくにんをおねがいします。', 'kakunin wo onegai shimasu', 'Please check it.', ['確認', 'を', 'お願いします'], {
          alt: ['kakunin o onegai shimasu'],
        }),
        s('u8-s-atoderenraku', '後で連絡します。', 'あとでれんらくします。', 'atode renraku shimasu', 'I’ll contact you later.', ['後で', '連絡します']),
        s('u8-s-shoruiokurimashita', '書類を送りました。', 'しょるいをおくりました。', 'shorui wo okurimashita', 'I sent the documents.', ['書類', 'を', '送りました'], {
          alt: ['shorui o okurimashita'],
        }),
      ],
    },
  ],
  'ja-u9': [
    {
      id: 'ja-u9-l3',
      title: 'Goals & Advice',
      goal: 'Give advice and talk about goals',
      items: [
        w('u9-kenkou', '健康', 'けんこう', 'kenkou', 'health', { alt: ['kenko'] }),
        w('u9-undou', '運動', 'うんどう', 'undou', 'exercise', { alt: ['undo'] }),
        w('u9-shuukan', '習慣', 'しゅうかん', 'shuukan', 'habit', { alt: ['shukan'] }),
        w('u9-ganbaru', '頑張る', 'がんばる', 'ganbaru', 'to do one’s best', { meaningAlt: ['to try hard'] }),
        w('u9-tsuzukeru', '続ける', 'つづける', 'tsuzukeru', 'to continue', { meaningAlt: ['to keep going'] }),
        w('u9-akirameru', '諦める', 'あきらめる', 'akirameru', 'to give up'),
        w('u9-mokuhyou', '目標', 'もくひょう', 'mokuhyou', 'goal', { alt: ['mokuhyo'], meaningAlt: ['target'] }),
        w('u9-jishin', '自信', 'じしん', 'jishin', 'confidence'),
      ],
      sentences: [
        s('u9-s-undoushitahou', '毎日運動したほうがいいです。', 'まいにちうんどうしたほうがいいです。', 'mainichi undou shita hou ga ii desu', 'You should exercise every day.', [
          '毎日',
          '運動した',
          'ほうが',
          'いい',
          'です',
        ]),
        s('u9-s-akiramenaide', '諦めないでください。', 'あきらめないでください。', 'akiramenaide kudasai', 'Please don’t give up.', ['諦めないで', 'ください']),
        s('u9-s-ganbatte', '頑張ってください。', 'がんばってください。', 'ganbatte kudasai', 'Good luck! (Do your best.)', ['頑張って', 'ください']),
      ],
    },
  ],
}

export const jaMoreGrammar: Record<string, GrammarPoint[]> = {
  'ja-u2-l3': [
    {
      title: 'Adjectives before nouns',
      pattern: 'Adj-い + Noun',
      explanation: 'い-adjectives such as おいしい go straight in front of a noun, with nothing in between.',
      examples: [ex('おいしいすし', null, 'oishii sushi', 'delicious sushi'), ex('新しいメニュー', 'あたらしいメニュー', 'atarashii menyuu', 'a new menu')],
    },
    {
      title: 'Also: も',
      pattern: 'Noun も',
      explanation: 'も replaces は, が or を to mean “also” or “too”.',
      examples: [ex('肉も食べます。', 'にくもたべます。', 'niku mo tabemasu', 'I eat meat too.')],
    },
  ],
  'ja-u3-l3': [
    {
      title: 'な-adjectives',
      pattern: 'Adj + な + Noun',
      explanation: 'Some adjectives, such as きれい and 元気, need な before a noun. At the end of a sentence they just take です.',
      examples: [ex('きれいな花', 'きれいなはな', 'kirei na hana', 'a pretty flower'), ex('元気な子供', 'げんきなこども', 'genki na kodomo', 'an energetic child')],
    },
    {
      title: 'Joining adjectives: 〜くて',
      pattern: 'Adj (drop い) + くて, Adj',
      explanation: 'To join two い-adjectives, change the first い to くて.',
      examples: [ex('優しくて面白い先生', 'やさしくておもしろいせんせい', 'yasashikute omoshiroi sensei', 'a kind, funny teacher')],
    },
  ],
  'ja-u4-l3': [
    {
      title: 'Weekdays come from the elements',
      explanation: '月 moon, 火 fire, 水 water, 木 wood, 金 gold, 土 earth, 日 sun — plus 曜日 (“day of the week”).',
      examples: [ex('水曜日', 'すいようび', 'suiyoubi', 'Wednesday (“water day”)')],
    },
    {
      title: 'On a day: に',
      pattern: 'Weekday に + Verb',
      explanation: 'Weekdays take に, like clock times. 今日 and 明日 don’t.',
      examples: [ex('土曜日に学校へ行きます。', 'どようびにがっこうへいきます。', 'doyoubi ni gakkou e ikimasu', 'I go to school on Saturday.')],
    },
  ],
  'ja-u5-l3': [
    {
      title: 'By train, by bus: で',
      pattern: 'Vehicle で + Verb',
      explanation: 'で marks the means of transport. Going on foot is 歩いて, with no で.',
      examples: [ex('バスで来ます。', 'バスできます。', 'basu de kimasu', 'I come by bus.'), ex('歩いて行きます。', 'あるいていきます。', 'aruite ikimasu', 'I go on foot.')],
    },
    {
      title: 'Turning: 右 / 左 に曲がる',
      explanation: 'The direction takes に, then the verb 曲がる (to turn).',
      examples: [ex('左に曲がってください。', 'ひだりにまがってください。', 'hidari ni magatte kudasai', 'Please turn left.')],
    },
  ],
  'ja-u6-l3': [
    {
      title: 'Isn’t it? ね',
      pattern: 'Sentence + ね',
      explanation: 'ね at the end invites agreement, like “isn’t it?”. It’s perfect for small talk about the weather.',
      examples: [ex('いい天気ですね。', 'いいてんきですね。', 'ii tenki desu ne', 'Nice weather, isn’t it?')],
    },
    {
      title: 'Happening now: 〜ています',
      pattern: 'て-form + います',
      explanation: 'て-form + います describes something happening right now, or an ongoing state.',
      examples: [ex('雪が降っています。', 'ゆきがふっています。', 'yuki ga futte imasu', 'It’s snowing.'), ex('音楽を聞いています。', 'おんがくをきいています。', 'ongaku wo kiite imasu', 'I’m listening to music.')],
    },
  ],
  'ja-u7-l3': [
    {
      title: 'May I? 〜てもいいですか',
      pattern: 'て-form + もいいですか',
      explanation: 'Literally “even if I do …, is it good?”. It’s the polite way to ask permission.',
      examples: [ex('座ってもいいですか。', 'すわってもいいですか。', 'suwatte mo ii desu ka', 'May I sit down?')],
    },
    {
      title: 'Must not: 〜てはいけません',
      pattern: 'て-form + はいけません',
      explanation: 'This states a rule: something is not allowed.',
      examples: [ex('電話を使ってはいけません。', 'でんわをつかってはいけません。', 'denwa wo tsukatte wa ikemasen', 'You must not use your phone.')],
    },
  ],
  'ja-u8-l3': [
    {
      title: 'Requests: 〜をお願いします',
      pattern: 'Noun を お願いします',
      explanation: 'This is the all-purpose polite way to ask for something at work.',
      examples: [ex('返事をお願いします。', 'へんじをおねがいします。', 'henji wo onegai shimasu', 'I’d appreciate a reply.')],
    },
    {
      title: 'Polite お / ご',
      explanation: 'お or ご before a noun makes it polite. Japanese words usually take お and Chinese-origin words ご.',
      examples: [ex('ご連絡ありがとうございます。', 'ごれんらくありがとうございます。', 'go-renraku arigatou gozaimasu', 'Thank you for getting in touch.')],
    },
  ],
  'ja-u9-l3': [
    {
      title: 'Advice: 〜たほうがいい',
      pattern: 'た-form + ほうがいいです',
      explanation: 'Literally “the side of having done … is good”. This is how you give advice.',
      examples: [ex('早く寝たほうがいいです。', 'はやくねたほうがいいです。', 'hayaku neta hou ga ii desu', 'You should go to bed early.')],
    },
    {
      title: 'Hoping: 〜といいですね',
      pattern: 'Plain form + といいですね',
      explanation: 'This expresses a hope for someone, like “I hope …”.',
      examples: [ex('晴れるといいですね。', 'はれるといいですね。', 'hareru to ii desu ne', 'I hope it’s sunny.')],
    },
  ],
}
