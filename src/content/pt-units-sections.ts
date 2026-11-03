/** Portuguese: one more unit for each of the A2 and B1 sections. */
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

export const ptSectionUnits: Unit[] = [
  /* ---------------- A2 ---------------- */
  {
    id: 'pt-u14',
    title: 'Childhood, Cooking & the City',
    level: 'A2',
    canDo: ['Talk about your childhood with the imperfect', 'Follow and give a simple recipe', 'Find your way around town'],
    lessons: [
      {
        id: 'pt-u14-l1',
        title: 'When I Was Little',
        goal: 'Say what you used to do',
        items: [
          w('u14-era', 'era', 'was (used to be)', { note: 'Imperfect of ser: eu era, ele era.' }),
          w('u14-tinha', 'tinha', 'used to have', { meaningAlt: ['had'] }),
          w('u14-morava', 'morava', 'used to live', { meaningAlt: ['lived'] }),
          w('u14-brincava', 'brincava', 'used to play', { meaningAlt: ['played'] }),
          w('u14-crianca', 'criança', 'child', { meaningAlt: ['kid'] }),
          w('u14-escola', 'escola', 'school'),
          w('u14-infancia', 'infância', 'childhood'),
          w('u14-sempre', 'sempre', 'always'),
        ],
        sentences: [
          s('u14-s-eraccrianca', 'Quando eu era criança, morava no Rio.', 'When I was a child, I lived in Rio.'),
          s('u14-s-brincavanarua', 'Eu brincava na rua todos os dias.', 'I used to play in the street every day.', { note: 'todos os dias = every day' }),
          s('u14-s-escolapequena', 'Minha escola era pequena.', 'My school was small.'),
        ],
      },
      {
        id: 'pt-u14-l2',
        title: 'In the Kitchen',
        goal: 'Follow a recipe',
        items: [
          w('u14-cozinhar', 'cozinhar', 'to cook'),
          w('u14-receita', 'receita', 'recipe', { meaningAlt: ['prescription'] }),
          w('u14-panela', 'panela', 'pan', { meaningAlt: ['pot', 'saucepan'] }),
          w('u14-fogao', 'fogão', 'stove', { meaningAlt: ['cooker'] }),
          w('u14-sal', 'sal', 'salt'),
          w('u14-acucar', 'açúcar', 'sugar'),
          w('u14-cortar', 'cortar', 'to cut'),
          w('u14-misturar', 'misturar', 'to mix'),
        ],
        sentences: [
          s('u14-s-gostodecozinhar', 'Eu gosto de cozinhar.', 'I like to cook.'),
          s('u14-s-corteacebola', 'Corte a cebola e misture tudo.', 'Cut the onion and mix everything.', { note: 'cebola = onion; tudo = everything' }),
          s('u14-s-receitadaavo', 'A receita é da minha avó.', 'The recipe is my grandmother’s.', { note: 'da = de + a' }),
        ],
      },
      {
        id: 'pt-u14-l3',
        title: 'Around the City',
        goal: 'Say where places are',
        items: [
          w('u14-predio', 'prédio', 'building'),
          w('u14-praca', 'praça', 'square', { meaningAlt: ['plaza'] }),
          w('u14-ponte', 'ponte', 'bridge'),
          w('u14-igreja', 'igreja', 'church'),
          w('u14-museu', 'museu', 'museum'),
          w('u14-transito', 'trânsito', 'traffic'),
          w('u14-esquina', 'esquina', 'corner'),
          w('u14-parque', 'parque', 'park'),
        ],
        sentences: [
          s('u14-s-museupertodapraca', 'O museu fica perto da praça.', 'The museum is near the square.', { note: 'fica = is (located)' }),
          s('u14-s-muitotransito', 'Tem muito trânsito hoje.', 'There’s a lot of traffic today.'),
          s('u14-s-vireadireita', 'Vire à direita na esquina.', 'Turn right at the corner.', { note: 'vire = turn' }),
        ],
      },
    ],
    reading: {
      id: 'pt-u14-r',
      title: 'Minha infância · My Childhood',
      sentences: [
        s('r14-1', 'Quando eu era criança, morava numa cidade pequena.', 'When I was a child, I lived in a small town.', { note: 'numa = em + uma; cidade = town, city' }),
        s('r14-2', 'Todo domingo, minha avó cozinhava para a família.', 'Every Sunday, my grandmother cooked for the family.'),
        s('r14-3', 'Depois do almoço, eu brincava no parque com meus primos.', 'After lunch, I played in the park with my cousins.', { note: 'almoço = lunch' }),
        s('r14-4', 'Sinto saudade desse tempo.', 'I miss those days.'),
      ],
      questions: [
        { q: 'Where did they live as a child?', options: ['A big city', 'A small town', 'By the beach'], answer: 1 },
        { q: 'Who cooked on Sundays?', options: ['Their grandmother', 'Their mother', 'Their father'], answer: 0 },
        { q: 'Where did they play after lunch?', options: ['At school', 'At home', 'In the park'], answer: 2 },
      ],
    },
  },

  /* ---------------- B1 ---------------- */
  {
    id: 'pt-u15',
    title: 'Tech, Reported Speech & Arguments',
    level: 'B1',
    canDo: ['Talk about phones, apps and fixing things', 'Report what other people said', 'Build an argument with linking words'],
    lessons: [
      {
        id: 'pt-u15-l1',
        title: 'Phones & Apps',
        goal: 'Explain a tech problem',
        items: [
          w('u15-celular', 'celular', 'mobile phone', { meaningAlt: ['cell phone', 'phone'] }),
          w('u15-aplicativo', 'aplicativo', 'app', { alt: ['app'] }),
          w('u15-senha', 'senha', 'password'),
          w('u15-bateria', 'bateria', 'battery'),
          w('u15-carregar', 'carregar', 'to charge', { meaningAlt: ['to carry', 'to load'] }),
          w('u15-quebrar', 'quebrar', 'to break'),
          w('u15-consertar', 'consertar', 'to fix', { meaningAlt: ['to repair'] }),
          w('u15-baixar', 'baixar', 'to download', { meaningAlt: ['to lower'] }),
        ],
        sentences: [
          s('u15-s-celularquebrou', 'Meu celular quebrou ontem.', 'My phone broke yesterday.'),
          s('u15-s-esquecisenha', 'Esqueci minha senha.', 'I forgot my password.', { note: 'esqueci = I forgot' }),
          s('u15-s-carregarbateria', 'Preciso carregar a bateria.', 'I need to charge the battery.'),
        ],
      },
      {
        id: 'pt-u15-l2',
        title: 'He Said, She Said',
        goal: 'Report what someone said',
        items: [
          w('u15-disse', 'disse', 'said'),
          w('u15-perguntou', 'perguntou', 'asked'),
          w('u15-contou', 'contou', 'told'),
          w('u15-explicou', 'explicou', 'explained'),
          w('u15-avisou', 'avisou', 'warned', { meaningAlt: ['let know'] }),
          w('u15-prometeu', 'prometeu', 'promised'),
          w('u15-pediu', 'pediu', 'asked for', { meaningAlt: ['ordered', 'requested'] }),
          w('u15-respondeu', 'respondeu', 'replied', { meaningAlt: ['answered'] }),
        ],
        sentences: [
          s('u15-s-disseestavacansada', 'Ela disse que estava cansada.', 'She said she was tired.'),
          s('u15-s-perguntouseeuvinha', 'Ele perguntou se eu vinha.', 'He asked if I was coming.', { note: 'vinha = was coming' }),
          s('u15-s-prometeuajudar', 'Meu chefe prometeu que ia ajudar.', 'My boss promised he would help.', { note: 'ia + verb = was going to' }),
        ],
      },
      {
        id: 'pt-u15-l3',
        title: 'Making Your Case',
        goal: 'Link ideas in an argument',
        items: [
          w('u15-porem', 'porém', 'however'),
          w('u15-alemdisso', 'além disso', 'besides', { meaningAlt: ['moreover', 'furthermore'] }),
          w('u15-porexemplo', 'por exemplo', 'for example'),
          w('u15-noentanto', 'no entanto', 'nevertheless', { meaningAlt: ['however'] }),
          w('u15-portanto', 'portanto', 'therefore', { meaningAlt: ['so'] }),
          w('u15-ouseja', 'ou seja', 'in other words', { meaningAlt: ['that is'] }),
          w('u15-defato', 'de fato', 'in fact', { meaningAlt: ['indeed'] }),
          w('u15-apesarde', 'apesar de', 'despite', { meaningAlt: ['in spite of'] }),
        ],
        sentences: [
          s('u15-s-alemdissocaro', 'Além disso, é muito caro.', 'Besides, it’s very expensive.'),
          s('u15-s-porexemplometro', 'Por exemplo, eu uso o metrô.', 'For example, I take the subway.', { note: 'uso = I use' }),
          s('u15-s-apesardachuva', 'Apesar da chuva, nós saímos.', 'Despite the rain, we went out.', { note: 'da = de + a; saímos = we went out' }),
        ],
      },
    ],
    reading: {
      id: 'pt-u15-r',
      title: 'O celular quebrado · The Broken Phone',
      sentences: [
        s('r15-1', 'Na semana passada, meu celular caiu e quebrou.', 'Last week my phone fell and broke.', { note: 'caiu = fell' }),
        s('r15-2', 'Liguei para a loja e o técnico disse que podia consertar.', 'I called the shop and the technician said he could fix it.'),
        s('r15-3', 'Porém, ele avisou que ia demorar três dias.', 'However, he warned it would take three days.', { note: 'demorar = to take (time)' }),
        s('r15-4', 'Além disso, o conserto custou caro.', 'On top of that, the repair was expensive.'),
      ],
      questions: [
        { q: 'What happened to the phone?', options: ['It fell and broke', 'It was stolen', 'The battery died'], answer: 0 },
        { q: 'How long would the repair take?', options: ['One hour', 'Three days', 'A week'], answer: 1 },
        { q: 'How was the price of the repair?', options: ['Cheap', 'Free', 'Expensive'], answer: 2 },
      ],
    },
  },
]

export const ptSectionUnitsGrammar: Record<string, GrammarPoint[]> = {
  'pt-u14-l1': [
    {
      title: 'The imperfect: used to / was doing',
      explanation: 'For habits and descriptions in the past, -ar verbs take -ava (morava, brincava) and -er / -ir verbs take -ia (tinha, comia). Ser is irregular: era.',
      examples: [ex('Eu morava em São Paulo.', 'I used to live in São Paulo.'), ex('Nós comíamos juntos.', 'We used to eat together.')],
    },
    {
      title: 'Quando + imperfect',
      pattern: 'Quando + imperfect, + imperfect',
      explanation: 'Set the scene with quando (when) and describe what was usually true.',
      examples: [ex('Quando eu era pequeno, gostava de futebol.', 'When I was little, I liked football.')],
    },
  ],
  'pt-u14-l2': [
    {
      title: 'Instructions with the você command',
      explanation: 'Recipes speak to you directly: -ar verbs end in -e (corte, misture), -er / -ir verbs in -a (faça, coloque is irregular).',
      examples: [ex('Misture o açúcar e o sal.', 'Mix the sugar and the salt.'), ex('Corte o pão.', 'Cut the bread.')],
    },
  ],
  'pt-u14-l3': [
    {
      title: 'Where places are: ficar',
      pattern: 'Place + fica + location',
      explanation: 'For buildings and places, Portuguese says they “stay” somewhere: o banco fica na esquina.',
      examples: [ex('A igreja fica atrás do museu.', 'The church is behind the museum.')],
    },
    {
      title: 'Contractions: no, na, do, da',
      explanation: 'Em and de merge with o / a: no parque, na praça, perto da praça, ao lado do museu.',
      examples: [ex('Estou no parque.', 'I’m in the park.'), ex('Moro perto da ponte.', 'I live near the bridge.')],
    },
  ],
  'pt-u15-l1': [
    {
      title: 'Preterite of regular verbs',
      explanation: 'Finished actions: eu -ei / -i (baixei, comi), ele / ela -ou / -eu (quebrou, bebeu).',
      examples: [ex('Eu baixei o aplicativo.', 'I downloaded the app.'), ex('O celular quebrou.', 'The phone broke.')],
    },
  ],
  'pt-u15-l2': [
    {
      title: 'Reported speech: disse que + imperfect',
      pattern: 'Ele disse que + imperfect',
      explanation: 'When you report what someone said, the present shifts to the imperfect: “Estou cansada” → Ela disse que estava cansada.',
      examples: [ex('Ele disse que estava com fome.', 'He said he was hungry.')],
    },
    {
      title: 'Reported questions: perguntou se',
      pattern: 'perguntou se + verb',
      explanation: 'A yes / no question becomes se (if) when you report it.',
      examples: [ex('Ela perguntou se eu queria café.', 'She asked if I wanted coffee.')],
    },
  ],
  'pt-u15-l3': [
    {
      title: 'Linking words for an argument',
      explanation: 'Porém and no entanto contrast, além disso adds a point, por exemplo illustrates, and portanto concludes.',
      examples: [ex('Está chovendo, portanto vou ficar em casa.', 'It’s raining, so I’ll stay at home.')],
    },
    {
      title: 'Apesar de + noun',
      pattern: 'Apesar de + noun / infinitive',
      explanation: 'Apesar de means “despite” and merges with o / a: apesar do frio, apesar da chuva.',
      examples: [ex('Apesar do frio, fomos à praia.', 'Despite the cold, we went to the beach.')],
    },
  ],
}
