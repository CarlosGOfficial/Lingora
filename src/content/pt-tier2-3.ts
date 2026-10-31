/** Portuguese tiers 2–3: CEFR A2 and B1 units, with their grammar notes. */
import type { GrammarExample, GrammarPoint, Item, Unit } from './types'

const w = (id: string, target: string, meaning: string, extra: Partial<Item> = {}): Item => ({
  id: `pt-${id}`,
  kind: 'word',
  target,
  meaning,
  ...extra,
})

const s = (id: string, target: string, meaning: string, extra: Partial<Item> = {}): Item => ({
  id: `pt-${id}`,
  kind: 'sentence',
  target,
  meaning,
  tokens: target.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean),
  ...extra,
})

const ex = (target: string, meaning: string): GrammarExample => ({ target, meaning })

export const ptTier23Units: Unit[] = [
  /* ---------------- A2 ---------------- */
  {
    id: 'pt-u6',
    title: 'The Weekend',
    level: 'A2',
    canDo: ['Say what you did in the past', 'Tell a short story in order', 'Give reasons with porque'],
    lessons: [
      {
        id: 'pt-u6-l1',
        title: 'What Did You Do?',
        goal: 'Talk about the past',
        items: [
          w('u6-fui', 'fui', 'I went', { meaningAlt: ['I was'], note: 'ir and ser share the same past forms.' }),
          w('u6-comi', 'comi', 'I ate'),
          w('u6-bebi', 'bebi', 'I drank'),
          w('u6-vi', 'vi', 'I saw'),
          w('u6-fiz', 'fiz', 'I did', { meaningAlt: ['I made'] }),
          w('u6-fimdesemana', 'fim de semana', 'weekend'),
          w('u6-praia', 'praia', 'beach'),
          w('u6-amigo', 'amigo', 'friend', { alt: ['amiga'] }),
        ],
        sentences: [
          s('u6-s-fuiapraia', 'Eu fui à praia.', 'I went to the beach.'),
          s('u6-s-viumfilme', 'Eu vi um filme.', 'I saw a film.', { note: 'filme = film, movie' }),
          s('u6-s-oquevocefez', 'O que você fez no fim de semana?', 'What did you do at the weekend?', { note: 'no = em + o (“in the / at the”)' }),
        ],
      },
      {
        id: 'pt-u6-l2',
        title: 'Telling a Story',
        goal: 'Put events in order',
        items: [
          w('u6-primeiro', 'primeiro', 'first'),
          w('u6-depois', 'depois', 'afterwards', { meaningAlt: ['then', 'after'] }),
          w('u6-entao', 'então', 'so (then)'),
          w('u6-finalmente', 'finalmente', 'finally'),
          w('u6-quando', 'quando', 'when'),
          w('u6-porque', 'porque', 'because'),
          w('u6-mas', 'mas', 'but'),
          w('u6-tambem', 'também', 'also', { meaningAlt: ['too'] }),
        ],
        sentences: [
          s('u6-s-primeirocomi', 'Primeiro, eu comi.', 'First, I ate.'),
          s('u6-s-depoisfomos', 'Depois, nós fomos à praia.', 'Afterwards, we went to the beach.', { note: 'nós fomos = we went' }),
          s('u6-s-fiqueiemcasa', 'Eu fiquei em casa porque choveu.', 'I stayed home because it rained.', { note: 'fiquei = I stayed; choveu = it rained' }),
        ],
      },
    ],
    reading: {
      id: 'pt-u6-r',
      title: 'Um sábado na praia · A Saturday at the Beach',
      sentences: [
        s('r6-1', 'No sábado, eu fui à praia com uma amiga.', 'On Saturday, I went to the beach with a friend.'),
        s('r6-2', 'Primeiro, nós comemos peixe.', 'First, we ate fish.', { note: 'peixe = fish; comemos = we ate' }),
        s('r6-3', 'Depois, vimos o pôr do sol.', 'Afterwards, we watched the sunset.', { note: 'pôr do sol = sunset; vimos = we saw' }),
        s('r6-4', 'Foi um fim de semana muito bom!', 'It was a really good weekend!'),
      ],
      questions: [
        { q: 'Where did the writer go on Saturday?', options: ['To the beach', 'To the market', 'To the bank'], answer: 0 },
        { q: 'What did they eat?', options: ['Bread', 'Fish', 'Rice'], answer: 1 },
        { q: 'What did they see afterwards?', options: ['A film', 'The sunrise', 'The sunset'], answer: 2 },
      ],
    },
  },
  {
    id: 'pt-u7',
    title: 'Weather & Clothes',
    level: 'A2',
    canDo: ['Talk about the weather and seasons', 'Shop for clothes', 'Say what you need with precisar de'],
    lessons: [
      {
        id: 'pt-u7-l1',
        title: 'The Weather',
        goal: 'Describe the weather',
        items: [
          w('u7-tempo', 'tempo', 'weather', { meaningAlt: ['time'] }),
          w('u7-sol', 'sol', 'sun'),
          w('u7-chuva', 'chuva', 'rain'),
          w('u7-frio', 'frio', 'cold'),
          w('u7-calor', 'calor', 'heat'),
          w('u7-nublado', 'nublado', 'cloudy'),
          w('u7-vento', 'vento', 'wind'),
          w('u7-verao', 'verão', 'summer'),
          w('u7-inverno', 'inverno', 'winter'),
        ],
        sentences: [
          s('u7-s-comoestaotempo', 'Como está o tempo?', 'What’s the weather like?'),
          s('u7-s-fazendocalor', 'Hoje está fazendo calor.', 'It’s hot today.', { note: 'Literally “today it’s making heat”.' }),
          s('u7-s-invernofazfrio', 'No inverno faz frio.', 'In winter it’s cold.'),
        ],
      },
      {
        id: 'pt-u7-l2',
        title: 'Clothes',
        goal: 'Shop for clothes',
        items: [
          w('u7-roupa', 'roupa', 'clothes', { meaningAlt: ['clothing'] }),
          w('u7-camisa', 'camisa', 'shirt'),
          w('u7-calca', 'calça', 'trousers', { meaningAlt: ['pants'] }),
          w('u7-sapato', 'sapato', 'shoe'),
          w('u7-casaco', 'casaco', 'coat', { meaningAlt: ['jacket'] }),
          w('u7-vestido', 'vestido', 'dress'),
          w('u7-usar', 'usar', 'to wear', { meaningAlt: ['to use'] }),
          w('u7-tamanho', 'tamanho', 'size'),
        ],
        sentences: [
          s('u7-s-precisodecasaco', 'Eu preciso de um casaco.', 'I need a coat.', { note: 'preciso de = I need' }),
          s('u7-s-quetamanho', 'Que tamanho você usa?', 'What size do you wear?'),
          s('u7-s-camisacara', 'Esta camisa é muito cara.', 'This shirt is very expensive.'),
        ],
      },
    ],
    reading: {
      id: 'pt-u7-r',
      title: 'Um casaco novo · A New Coat',
      sentences: [
        s('r7-1', 'Hoje está fazendo frio e está chovendo.', 'It’s cold today and it’s raining.', { note: 'chovendo = raining' }),
        s('r7-2', 'Eu preciso de um casaco novo.', 'I need a new coat.'),
        s('r7-3', 'Fui à loja e vi um casaco azul.', 'I went to the shop and saw a blue coat.', { note: 'loja = shop; azul = blue' }),
        s('r7-4', 'O tamanho era perfeito!', 'The size was perfect!', { note: 'era = was' }),
      ],
      questions: [
        { q: 'What’s the weather like?', options: ['Hot and sunny', 'Cold and rainy', 'Windy'], answer: 1 },
        { q: 'What does the writer need?', options: ['A coat', 'Shoes', 'A dress'], answer: 0 },
        { q: 'What colour was the coat?', options: ['Red', 'Black', 'Blue'], answer: 2 },
      ],
    },
  },

  /* ---------------- B1 ---------------- */
  {
    id: 'pt-u8',
    title: 'Work & Opinions',
    level: 'B1',
    canDo: ['Talk about jobs and job hunting', 'Describe ongoing actions and past habits', 'Give and defend opinions'],
    lessons: [
      {
        id: 'pt-u8-l1',
        title: 'Jobs & Careers',
        goal: 'Talk about work',
        items: [
          w('u8-emprego', 'emprego', 'job'),
          w('u8-empresa', 'empresa', 'company'),
          w('u8-chefe', 'chefe', 'boss'),
          w('u8-reuniao', 'reunião', 'meeting'),
          w('u8-salario', 'salário', 'salary', { meaningAlt: ['wages'] }),
          w('u8-experiencia', 'experiência', 'experience'),
          w('u8-curriculo', 'currículo', 'CV', { meaningAlt: ['résumé', 'resume'] }),
          w('u8-entrevista', 'entrevista', 'interview'),
        ],
        sentences: [
          s('u8-s-tenhoentrevista', 'Eu tenho uma entrevista amanhã.', 'I have an interview tomorrow.'),
          s('u8-s-reuniaocancelada', 'A reunião foi cancelada.', 'The meeting was cancelled.', { note: 'foi + participle = passive voice' }),
          s('u8-s-procurandoemprego', 'Estou procurando emprego.', 'I’m looking for a job.', { note: 'procurar = to look for' }),
        ],
      },
      {
        id: 'pt-u8-l2',
        title: 'Opinions',
        goal: 'Agree, disagree and hedge',
        items: [
          w('u8-acho', 'acho', 'I think', { note: 'From achar (to find / to think).' }),
          w('u8-concordo', 'concordo', 'I agree'),
          w('u8-discordo', 'discordo', 'I disagree'),
          w('u8-opiniao', 'opinião', 'opinion'),
          w('u8-importante', 'importante', 'important'),
          w('u8-talvez', 'talvez', 'maybe', { meaningAlt: ['perhaps'] }),
          w('u8-certeza', 'certeza', 'certainty', { meaningAlt: ['sure'] }),
          w('u8-embora', 'embora', 'although'),
        ],
        sentences: [
          s('u8-s-achoquerazao', 'Eu acho que você tem razão.', 'I think you’re right.', { note: 'ter razão = to be right' }),
          s('u8-s-naoconcordo', 'Eu não concordo.', 'I don’t agree.'),
          s('u8-s-talvezeuva', 'Talvez eu vá amanhã.', 'Maybe I’ll go tomorrow.', { note: 'vá = subjunctive of ir' }),
        ],
      },
    ],
    reading: {
      id: 'pt-u8-r',
      title: 'A entrevista da Marina · Marina’s Interview',
      sentences: [
        s('r8-1', 'A Marina trabalha numa empresa de tecnologia.', 'Marina works at a tech company.', { note: 'numa = em + uma' }),
        s('r8-2', 'Ela gosta do emprego, mas o salário é baixo.', 'She likes the job, but the salary is low.', { note: 'baixo = low' }),
        s('r8-3', 'Amanhã ela tem uma entrevista em outra empresa.', 'Tomorrow she has an interview at another company.'),
        s('r8-4', 'Eu acho que ela vai conseguir!', 'I think she’s going to make it!', { note: 'conseguir = to manage, to succeed' }),
      ],
      questions: [
        { q: 'Where does Marina work?', options: ['At a tech company', 'At a school', 'At a bank'], answer: 0 },
        { q: 'What’s the problem with her job?', options: ['The boss', 'The salary', 'The hours'], answer: 1 },
        { q: 'What is happening tomorrow?', options: ['A meeting', 'A holiday', 'An interview'], answer: 2 },
      ],
    },
  },
  {
    id: 'pt-u9',
    title: 'Travel & Feelings',
    level: 'B1',
    canDo: ['Plan a trip and make bookings', 'Talk about the future and hypotheticals', 'Describe feelings and emotions'],
    lessons: [
      {
        id: 'pt-u9-l1',
        title: 'Planning a Trip',
        goal: 'Book and plan travel',
        items: [
          w('u9-viagem', 'viagem', 'trip', { meaningAlt: ['journey'] }),
          w('u9-passagem', 'passagem', 'ticket', { meaningAlt: ['fare'] }),
          w('u9-hotel', 'hotel', 'hotel'),
          w('u9-reserva', 'reserva', 'reservation', { meaningAlt: ['booking'] }),
          w('u9-mala', 'mala', 'suitcase'),
          w('u9-aeroporto', 'aeroporto', 'airport'),
          w('u9-voo', 'voo', 'flight'),
          w('u9-passaporte', 'passaporte', 'passport'),
        ],
        sentences: [
          s('u9-s-vouviajar', 'Eu vou viajar em julho.', 'I’m going to travel in July.', { note: 'julho = July' }),
          s('u9-s-jafizreserva', 'Já fiz a reserva do hotel.', 'I’ve already booked the hotel.', { note: 'já = already' }),
          s('u9-s-vooatrasado', 'O voo está atrasado.', 'The flight is delayed.'),
        ],
      },
      {
        id: 'pt-u9-l2',
        title: 'Feelings',
        goal: 'Describe how you feel',
        items: [
          w('u9-feliz', 'feliz', 'happy'),
          w('u9-triste', 'triste', 'sad'),
          w('u9-preocupado', 'preocupado', 'worried', { alt: ['preocupada'] }),
          w('u9-cansado', 'cansado', 'tired', { alt: ['cansada'] }),
          w('u9-animado', 'animado', 'excited', { alt: ['animada'] }),
          w('u9-nervoso', 'nervoso', 'nervous', { alt: ['nervosa'] }),
          w('u9-saudade', 'saudade', 'longing', { meaningAlt: ['missing someone'], note: 'A famously “untranslatable” word: the ache of missing someone or something.' }),
          w('u9-surpreso', 'surpreso', 'surprised', { alt: ['surpresa'] }),
        ],
        sentences: [
          s('u9-s-saudadedevoce', 'Estou com saudade de você.', 'I miss you.'),
          s('u9-s-fiqueifeliz', 'Fiquei muito feliz!', 'I was really happy!', { note: 'fiquei = I became / got' }),
          s('u9-s-naofiquenervoso', 'Não fique nervoso.', 'Don’t be nervous.', { note: 'fique = subjunctive/command of ficar' }),
        ],
      },
    ],
    reading: {
      id: 'pt-u9-r',
      title: 'Saudade de Lisboa · Missing Lisbon',
      sentences: [
        s('r9-1', 'No ano passado, eu viajei para Portugal.', 'Last year, I travelled to Portugal.', { note: 'ano passado = last year' }),
        s('r9-2', 'Eu estava um pouco nervoso no aeroporto.', 'I was a little nervous at the airport.', { note: 'estava = was (imperfect of estar)' }),
        s('r9-3', 'Mas a viagem foi incrível e eu fiquei muito feliz.', 'But the trip was amazing and I was very happy.'),
        s('r9-4', 'Agora estou com saudade de Lisboa.', 'Now I miss Lisbon.'),
      ],
      questions: [
        { q: 'Where did the writer travel?', options: ['Spain', 'Portugal', 'Brazil'], answer: 1 },
        { q: 'How did the writer feel at the airport?', options: ['A bit nervous', 'Very tired', 'Sad'], answer: 0 },
        { q: 'What does the writer miss now?', options: ['Home', 'The airport', 'Lisbon'], answer: 2 },
      ],
    },
  },
]

export const ptTier23Grammar: Record<string, GrammarPoint[]> = {
  'pt-u6-l1': [
    {
      title: 'The simple past (pretérito perfeito)',
      pattern: 'eu -ei / -i · você/ele/ela -ou / -eu / -iu',
      explanation: 'Regular verbs: falar → falei / falou, comer → comi / comeu, abrir → abri / abriu. It’s used for finished actions.',
      examples: [ex('Eu comi pão.', 'I ate bread.'), ex('Ela falou com o professor.', 'She spoke with the teacher.')],
    },
    {
      title: 'Fui: went or was',
      explanation: 'ir (to go) and ser (to be) share identical past forms: fui, foi, fomos. Context tells you which.',
      examples: [ex('Eu fui ao mercado.', 'I went to the market.'), ex('Foi ótimo!', 'It was great!')],
    },
  ],
  'pt-u6-l2': [
    {
      title: 'Ordering events',
      explanation: 'primeiro (first) → depois (afterwards) → então (so / then) → finalmente (finally). A comma usually follows them at the start of a sentence.',
      examples: [ex('Primeiro eu acordei, depois tomei café.', 'First I woke up, then I had breakfast.')],
    },
    {
      title: 'porque vs por que',
      explanation: 'porque (one word) means “because”. por que (two words) means “why” in questions.',
      examples: [ex('Por que você não foi?', 'Why didn’t you go?'), ex('Porque eu estava cansado.', 'Because I was tired.')],
    },
  ],
  'pt-u7-l1': [
    {
      title: 'Weather with fazer and estar',
      explanation: 'Use fazer for general weather (faz frio, faz sol) and estar for right now (está chovendo, está nublado).',
      examples: [ex('Faz sol hoje.', 'It’s sunny today.'), ex('Está chovendo.', 'It’s raining.')],
    },
    {
      title: 'Ser vs estar',
      explanation: 'ser is for lasting traits and identity; estar is for temporary states and conditions.',
      examples: [ex('O céu está nublado.', 'The sky is cloudy.'), ex('Ela é alta.', 'She is tall.')],
    },
  ],
  'pt-u7-l2': [
    {
      title: 'Precisar de',
      pattern: 'preciso de + noun · preciso + verb',
      explanation: 'precisar takes de before a noun, but not before a verb.',
      examples: [ex('Preciso de ajuda.', 'I need help.'), ex('Preciso comprar sapatos.', 'I need to buy shoes.')],
    },
    {
      title: 'This and that: este / esse',
      explanation: 'Demonstratives agree in gender: este / esta (this), esse / essa (that). In everyday Brazilian speech, esse / essa often mean “this” too.',
      examples: [ex('Este vestido é bonito.', 'This dress is pretty.'), ex('Essa calça é cara.', 'Those trousers are expensive.')],
    },
  ],
  'pt-u8-l1': [
    {
      title: 'Ongoing actions: estar + gerund',
      pattern: 'estar + -ando / -endo / -indo',
      explanation: 'Brazilian Portuguese uses this exactly like English “-ing”.',
      examples: [ex('Estou trabalhando.', 'I’m working.'), ex('Ela está estudando.', 'She’s studying.')],
    },
    {
      title: 'Past habits: the imperfect',
      pattern: '-ava (for -ar verbs) · -ia (for -er / -ir verbs)',
      explanation: 'The imperfect describes what used to happen, or background in the past.',
      examples: [ex('Eu trabalhava em São Paulo.', 'I used to work in São Paulo.'), ex('Quando eu era criança, eu brincava muito.', 'When I was a child, I played a lot.')],
    },
  ],
  'pt-u8-l2': [
    {
      title: 'Achar que…',
      pattern: 'acho que + indicative',
      explanation: 'acho que is the most natural way to say “I think that…”.',
      examples: [ex('Acho que vai chover.', 'I think it’s going to rain.')],
    },
    {
      title: 'The present subjunctive',
      explanation:
        'After talvez, é importante que, espero que and similar words, use the subjunctive. Take the eu form, drop -o and swap the vowel: falo → fale, como → coma.',
      examples: [ex('É importante que você estude.', 'It’s important that you study.'), ex('Talvez ele venha.', 'Maybe he’ll come.')],
    },
  ],
  'pt-u9-l1': [
    {
      title: 'The near future: ir + infinitive',
      pattern: 'vou / vai / vamos + infinitive',
      explanation: 'This is how Brazilians usually talk about the future in conversation.',
      examples: [ex('Nós vamos visitar Lisboa.', 'We’re going to visit Lisbon.')],
    },
    {
      title: 'Would: the conditional',
      pattern: 'infinitive + -ia',
      explanation: 'Add -ia to the infinitive for “would”. gostaria de is the polite way to ask for things.',
      examples: [ex('Eu gostaria de um quarto.', 'I would like a room.'), ex('Seria ótimo!', 'That would be great!')],
    },
  ],
  'pt-u9-l2': [
    {
      title: 'Estar com + noun',
      explanation: 'Many feelings use estar com + a noun: fome (hunger), sede (thirst), medo (fear), saudade (longing).',
      examples: [ex('Estou com fome.', 'I’m hungry.'), ex('Ela está com medo.', 'She’s scared.')],
    },
    {
      title: 'Ficar + adjective = to become',
      explanation: 'ficar describes a change of state: getting happy, sad, tired, etc.',
      examples: [ex('Ele ficou triste.', 'He got sad.'), ex('Fiquei cansado.', 'I got tired.')],
    },
  ],
}
