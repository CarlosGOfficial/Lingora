/** Portuguese: more units inside the existing tiers — two A1, one A2, one B1. */
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

export const ptMoreUnits: Unit[] = [
  /* ---------------- A1 ---------------- */
  {
    id: 'pt-u10',
    title: 'Home & Everyday Verbs',
    level: 'A1',
    canDo: ['Describe your home', 'Say where things are', 'Use common everyday verbs'],
    lessons: [
      {
        id: 'pt-u10-l1',
        title: 'My House',
        goal: 'Name the rooms and furniture',
        items: [
          w('u10-quarto', 'quarto', 'bedroom'),
          w('u10-cozinha', 'cozinha', 'kitchen'),
          w('u10-sala', 'sala', 'living room'),
          w('u10-mesa', 'mesa', 'table'),
          w('u10-cadeira', 'cadeira', 'chair'),
          w('u10-cama', 'cama', 'bed'),
          w('u10-janela', 'janela', 'window'),
          w('u10-porta', 'porta', 'door'),
        ],
        sentences: [
          s('u10-s-doisquartos', 'Minha casa tem dois quartos.', 'My house has two bedrooms.'),
          s('u10-s-cozinhapequena', 'A cozinha é pequena.', 'The kitchen is small.'),
          s('u10-s-livronamesa', 'O livro está na mesa.', 'The book is on the table.', { note: 'livro = book; na = em + a' }),
        ],
      },
      {
        id: 'pt-u10-l2',
        title: 'Where Is It?',
        goal: 'Describe positions',
        items: [
          w('u10-emcimade', 'em cima de', 'on top of'),
          w('u10-embaixode', 'embaixo de', 'under', { alt: ['debaixo de'] }),
          w('u10-dentrode', 'dentro de', 'inside'),
          w('u10-aoladode', 'ao lado de', 'next to', { meaningAlt: ['beside'] }),
          w('u10-atrasde', 'atrás de', 'behind'),
          w('u10-nafrentede', 'na frente de', 'in front of'),
          w('u10-entre', 'entre', 'between'),
        ],
        sentences: [
          s('u10-s-gatoembaixo', 'O gato está embaixo da mesa.', 'The cat is under the table.', { note: 'gato = cat; da = de + a' }),
          s('u10-s-chavedentro', 'A chave está dentro da bolsa.', 'The key is inside the bag.', { note: 'chave = key; bolsa = bag' }),
          s('u10-s-bancoaolado', 'O banco fica ao lado do mercado.', 'The bank is next to the market.'),
        ],
      },
      {
        id: 'pt-u10-l3',
        title: 'Everyday Verbs',
        goal: 'Say what you do',
        items: [
          w('u10-falar', 'falar', 'to speak', { meaningAlt: ['to talk'] }),
          w('u10-ler', 'ler', 'to read'),
          w('u10-escrever', 'escrever', 'to write'),
          w('u10-ouvir', 'ouvir', 'to listen', { meaningAlt: ['to hear'] }),
          w('u10-ver', 'ver', 'to see', { meaningAlt: ['to watch'] }),
          w('u10-abrir', 'abrir', 'to open'),
          w('u10-fechar', 'fechar', 'to close'),
          w('u10-morar', 'morar', 'to live'),
        ],
        sentences: [
          s('u10-s-moroemsaopaulo', 'Eu moro em São Paulo.', 'I live in São Paulo.'),
          s('u10-s-falaingles', 'Você fala inglês?', 'Do you speak English?', { note: 'inglês = English' }),
          s('u10-s-gostadeler', 'Ela gosta de ler.', 'She likes to read.'),
        ],
      },
    ],
    reading: {
      id: 'pt-u10-r',
      title: 'Minha casa · My House',
      sentences: [
        s('r10-1', 'Eu moro numa casa pequena.', 'I live in a small house.', { note: 'numa = em + uma' }),
        s('r10-2', 'A casa tem uma cozinha, uma sala e dois quartos.', 'The house has a kitchen, a living room and two bedrooms.'),
        s('r10-3', 'No meu quarto tem uma cama e uma mesa.', 'In my bedroom there’s a bed and a table.'),
        s('r10-4', 'O meu gato dorme embaixo da cama.', 'My cat sleeps under the bed.'),
      ],
      questions: [
        { q: 'How many bedrooms are there?', options: ['One', 'Two', 'Three'], answer: 1 },
        { q: 'What is in the writer’s bedroom?', options: ['A bed and a table', 'A sofa', 'A kitchen'], answer: 0 },
        { q: 'Where does the cat sleep?', options: ['On the table', 'In the kitchen', 'Under the bed'], answer: 2 },
      ],
    },
  },
  {
    id: 'pt-u11',
    title: 'Questions & Food Shopping',
    level: 'A1',
    canDo: ['Ask who, which, why and how many', 'Say what you can, know and need to do', 'Buy food by weight'],
    lessons: [
      {
        id: 'pt-u11-l1',
        title: 'Question Words',
        goal: 'Ask all kinds of questions',
        items: [
          w('u11-quem', 'quem', 'who'),
          w('u11-qual', 'qual', 'which', { meaningAlt: ['what'] }),
          w('u11-porque-q', 'por que', 'why'),
          w('u11-oque', 'o que', 'what'),
          w('u11-quantos', 'quantos', 'how many', { alt: ['quantas'] }),
          w('u11-dequem', 'de quem', 'whose'),
          w('u11-paraonde', 'para onde', 'where to'),
        ],
        sentences: [
          s('u11-s-quemeela', 'Quem é ela?', 'Who is she?'),
          s('u11-s-qualonome', 'Qual é o seu nome?', 'What’s your name?', { note: 'seu = your' }),
          s('u11-s-quantosanos', 'Quantos anos você tem?', 'How old are you?', { note: 'Literally “How many years do you have?”' }),
        ],
      },
      {
        id: 'pt-u11-l2',
        title: 'Can, Know & Need',
        goal: 'Talk about abilities and needs',
        items: [
          w('u11-posso', 'posso', 'I can', { meaningAlt: ['may I'] }),
          w('u11-pode', 'pode', 'can (you / he / she)'),
          w('u11-sei', 'sei', 'I know (how to)'),
          w('u11-conheco', 'conheço', 'I know (a person / place)'),
          w('u11-preciso', 'preciso', 'I need'),
          w('u11-tenhoque', 'tenho que', 'I have to', { meaningAlt: ['I must'] }),
          w('u11-ajudar', 'ajudar', 'to help'),
        ],
        sentences: [
          s('u11-s-seinadar', 'Eu sei nadar.', 'I can swim.', { note: 'nadar = to swim' }),
          s('u11-s-podemeajudar', 'Você pode me ajudar?', 'Can you help me?'),
          s('u11-s-tenhoquetrabalhar', 'Eu tenho que trabalhar amanhã.', 'I have to work tomorrow.'),
        ],
      },
      {
        id: 'pt-u11-l3',
        title: 'At the Market',
        goal: 'Buy fruit, meat and fish',
        items: [
          w('u11-frutas', 'frutas', 'fruit', { alt: ['fruta'] }),
          w('u11-maca', 'maçã', 'apple'),
          w('u11-banana', 'banana', 'banana'),
          w('u11-carne', 'carne', 'meat'),
          w('u11-peixe', 'peixe', 'fish'),
          w('u11-ovo', 'ovo', 'egg'),
          w('u11-queijo', 'queijo', 'cheese'),
          w('u11-quilo', 'quilo', 'kilo', { meaningAlt: ['kilogram'] }),
        ],
        sentences: [
          s('u11-s-umquilodemacas', 'Eu quero um quilo de maçãs.', 'I want a kilo of apples.'),
          s('u11-s-peixefresco', 'O peixe está fresco.', 'The fish is fresh.', { note: 'fresco = fresh' }),
          s('u11-s-naocomocarne', 'Eu não como carne.', 'I don’t eat meat.'),
        ],
      },
    ],
    reading: {
      id: 'pt-u11-r',
      title: 'Na feira · At the Street Market',
      sentences: [
        s('r11-1', 'A Ana vai à feira no sábado.', 'Ana goes to the street market on Saturday.', { note: 'feira = open-air market' }),
        s('r11-2', 'Ela compra frutas: maçãs e bananas.', 'She buys fruit: apples and bananas.'),
        s('r11-3', 'Ela não come carne, mas gosta de peixe.', 'She doesn’t eat meat, but she likes fish.'),
        s('r11-4', 'Ela também compra queijo para o café da manhã.', 'She also buys cheese for breakfast.', { note: 'café da manhã = breakfast' }),
      ],
      questions: [
        { q: 'When does Ana go to the market?', options: ['On Saturday', 'On Monday', 'Every day'], answer: 0 },
        { q: 'What doesn’t Ana eat?', options: ['Fish', 'Meat', 'Cheese'], answer: 1 },
        { q: 'Why does she buy cheese?', options: ['For lunch', 'For a party', 'For breakfast'], answer: 2 },
      ],
    },
  },

  /* ---------------- A2 ---------------- */
  {
    id: 'pt-u12',
    title: 'Body & Health',
    level: 'A2',
    canDo: ['Name parts of the body', 'Explain symptoms to a doctor', 'Talk about staying healthy'],
    lessons: [
      {
        id: 'pt-u12-l1',
        title: 'The Body',
        goal: 'Name parts of the body',
        items: [
          w('u12-cabeca', 'cabeça', 'head'),
          w('u12-braco', 'braço', 'arm'),
          w('u12-perna', 'perna', 'leg'),
          w('u12-mao', 'mão', 'hand'),
          w('u12-pe', 'pé', 'foot'),
          w('u12-olho', 'olho', 'eye'),
          w('u12-boca', 'boca', 'mouth'),
          w('u12-dente', 'dente', 'tooth'),
        ],
        sentences: [
          s('u12-s-cabecadoi', 'Minha cabeça dói.', 'My head hurts.', { note: 'dói = hurts (from doer)' }),
          s('u12-s-lavoasmaos', 'Eu lavo as mãos.', 'I wash my hands.', { note: 'lavar = to wash' }),
          s('u12-s-quebrouaperna', 'Ele quebrou a perna.', 'He broke his leg.', { note: 'quebrar = to break' }),
        ],
      },
      {
        id: 'pt-u12-l2',
        title: 'At the Doctor',
        goal: 'Describe symptoms',
        items: [
          w('u12-medico', 'médico', 'doctor', { alt: ['médica'] }),
          w('u12-remedio', 'remédio', 'medicine'),
          w('u12-febre', 'febre', 'fever'),
          w('u12-gripe', 'gripe', 'flu'),
          w('u12-dor', 'dor', 'pain', { meaningAlt: ['ache'] }),
          w('u12-doente', 'doente', 'sick', { meaningAlt: ['ill'] }),
          w('u12-consulta', 'consulta', 'appointment', { meaningAlt: ['consultation'] }),
          w('u12-farmacia', 'farmácia', 'pharmacy', { meaningAlt: ['chemist'] }),
        ],
        sentences: [
          s('u12-s-estoucomfebre', 'Estou com febre.', 'I have a fever.'),
          s('u12-s-precisoiraomedico', 'Preciso ir ao médico.', 'I need to go to the doctor.'),
          s('u12-s-tomeesteremedio', 'Tome este remédio.', 'Take this medicine.', { note: 'tome = take (command)' }),
        ],
      },
      {
        id: 'pt-u12-l3',
        title: 'Getting Better',
        goal: 'Talk about recovering and staying healthy',
        items: [
          w('u12-descansar', 'descansar', 'to rest'),
          w('u12-melhorar', 'melhorar', 'to get better', { meaningAlt: ['to improve'] }),
          w('u12-saudavel', 'saudável', 'healthy'),
          w('u12-exercicio', 'exercício', 'exercise'),
          w('u12-dormir', 'dormir', 'to sleep'),
          w('u12-cuidar', 'cuidar', 'to take care', { meaningAlt: ['to look after'] }),
          w('u12-sentir', 'sentir', 'to feel'),
        ],
        sentences: [
          s('u12-s-melhoras', 'Melhoras!', 'Get well soon!'),
          s('u12-s-mesintomelhor', 'Eu me sinto melhor.', 'I feel better.', { note: 'sentir-se = to feel (yourself)' }),
          s('u12-s-cuidese', 'Cuide-se!', 'Take care of yourself!'),
        ],
      },
    ],
    reading: {
      id: 'pt-u12-r',
      title: 'Uma gripe · A Flu',
      sentences: [
        s('r12-1', 'Na semana passada eu fiquei doente.', 'Last week I got sick.', { note: 'semana passada = last week' }),
        s('r12-2', 'Eu estava com febre e dor de cabeça.', 'I had a fever and a headache.'),
        s('r12-3', 'Fui ao médico e ele me deu um remédio.', 'I went to the doctor and he gave me some medicine.', { note: 'deu = gave' }),
        s('r12-4', 'Agora eu me sinto melhor.', 'Now I feel better.'),
      ],
      questions: [
        { q: 'What symptoms did the writer have?', options: ['A fever and a headache', 'A broken leg', 'A toothache'], answer: 0 },
        { q: 'Where did the writer go?', options: ['To the pharmacy', 'To the doctor', 'To work'], answer: 1 },
        { q: 'How does the writer feel now?', options: ['Worse', 'The same', 'Better'], answer: 2 },
      ],
    },
  },

  /* ---------------- B1 ---------------- */
  {
    id: 'pt-u13',
    title: 'Society & What-Ifs',
    level: 'B1',
    canDo: ['Discuss environmental issues', 'Report and react to the news', 'Talk about hypothetical situations'],
    lessons: [
      {
        id: 'pt-u13-l1',
        title: 'The Environment',
        goal: 'Discuss environmental problems',
        items: [
          w('u13-meioambiente', 'meio ambiente', 'environment'),
          w('u13-natureza', 'natureza', 'nature'),
          w('u13-poluicao', 'poluição', 'pollution'),
          w('u13-reciclar', 'reciclar', 'to recycle'),
          w('u13-lixo', 'lixo', 'rubbish', { meaningAlt: ['trash', 'garbage'] }),
          w('u13-proteger', 'proteger', 'to protect'),
          w('u13-floresta', 'floresta', 'forest'),
          w('u13-aquecimento', 'aquecimento global', 'global warming'),
        ],
        sentences: [
          s('u13-s-protegeranatureza', 'Precisamos proteger a natureza.', 'We need to protect nature.'),
          s('u13-s-reciclolixo', 'Eu reciclo o lixo.', 'I recycle my rubbish.'),
          s('u13-s-poluicaoproblema', 'A poluição é um grande problema.', 'Pollution is a big problem.'),
        ],
      },
      {
        id: 'pt-u13-l2',
        title: 'In the News',
        goal: 'Report and react to news',
        items: [
          w('u13-noticia', 'notícia', 'news', { meaningAlt: ['piece of news'] }),
          w('u13-jornal', 'jornal', 'newspaper'),
          w('u13-segundo', 'segundo', 'according to', { meaningAlt: ['second'] }),
          w('u13-parece', 'parece', 'it seems'),
          w('u13-aumentar', 'aumentar', 'to increase'),
          w('u13-diminuir', 'diminuir', 'to decrease'),
          w('u13-governo', 'governo', 'government'),
          w('u13-populacao', 'população', 'population'),
        ],
        sentences: [
          s('u13-s-segundoojornal', 'Segundo o jornal, vai chover.', 'According to the newspaper, it’s going to rain.'),
          s('u13-s-parecequeapopulacao', 'Parece que a população está aumentando.', 'It seems the population is growing.'),
          s('u13-s-governoagir', 'O governo precisa agir.', 'The government needs to act.', { note: 'agir = to act' }),
        ],
      },
      {
        id: 'pt-u13-l3',
        title: 'What If…?',
        goal: 'Talk about hypotheticals',
        items: [
          w('u13-se', 'se', 'if'),
          w('u13-fosse', 'fosse', 'were (if I were)'),
          w('u13-tivesse', 'tivesse', 'had (if I had)'),
          w('u13-faria', 'faria', 'would do', { meaningAlt: ['would make'] }),
          w('u13-gostaria', 'gostaria', 'would like'),
          w('u13-ganhar', 'ganhar', 'to win', { meaningAlt: ['to earn'] }),
          w('u13-sorte', 'sorte', 'luck'),
          w('u13-loteria', 'loteria', 'lottery'),
        ],
        sentences: [
          s('u13-s-seeuganhasse', 'Se eu ganhasse na loteria, eu viajaria.', 'If I won the lottery, I would travel.'),
          s('u13-s-seeufossevoce', 'Se eu fosse você, eu estudaria mais.', 'If I were you, I’d study more.'),
          s('u13-s-quesorte', 'Que sorte!', 'What luck!'),
        ],
      },
    ],
    reading: {
      id: 'pt-u13-r',
      title: 'Um sonho · A Dream',
      sentences: [
        s('r13-1', 'Se eu tivesse mais tempo, eu aprenderia japonês.', 'If I had more time, I would learn Japanese.', { note: 'aprender = to learn' }),
        s('r13-2', 'Eu gostaria de morar no Japão por um ano.', 'I would like to live in Japan for a year.'),
        s('r13-3', 'Mas eu tenho que trabalhar.', 'But I have to work.'),
        s('r13-4', 'Então eu estudo um pouco todos os dias.', 'So I study a little every day.', { note: 'um pouco = a little' }),
      ],
      questions: [
        { q: 'What would the writer learn with more time?', options: ['Japanese', 'Chinese', 'English'], answer: 0 },
        { q: 'Where would the writer like to live?', options: ['In Brazil', 'In Japan', 'In Portugal'], answer: 1 },
        { q: 'What does the writer do now?', options: ['Nothing', 'Lives in Japan', 'Studies a little every day'], answer: 2 },
      ],
    },
  },
]

export const ptMoreUnitsGrammar: Record<string, GrammarPoint[]> = {
  'pt-u10-l1': [
    {
      title: 'There is / there are: tem',
      explanation: 'In Brazil, tem (from ter) is the everyday way to say “there is” or “there are”. Há is more formal.',
      examples: [ex('Na cozinha tem uma mesa.', 'There’s a table in the kitchen.')],
    },
    {
      title: 'Rooms have genders',
      explanation: 'o quarto, a cozinha, a sala: learn each word with its article.',
      examples: [ex('o quarto e a sala', 'the bedroom and the living room')],
    },
  ],
  'pt-u10-l2': [
    {
      title: 'Positions with de + article',
      explanation: 'Position phrases end in de, which merges with the article: embaixo da mesa, ao lado do banco.',
      examples: [ex('ao lado da janela', 'next to the window'), ex('em cima do sofá', 'on top of the sofa')],
    },
    {
      title: 'Where things are: estar',
      explanation: 'Use estar for where movable things are, and ficar for buildings and places.',
      examples: [ex('A chave está na mesa.', 'The key is on the table.')],
    },
  ],
  'pt-u10-l3': [
    {
      title: 'Present tense for “I”',
      explanation: 'Most verbs end in -o for “I”: falar → falo, escrever → escrevo, abrir → abro. ler is irregular: leio.',
      examples: [ex('Eu falo português.', 'I speak Portuguese.'), ex('Eu leio o jornal.', 'I read the newspaper.')],
    },
    {
      title: 'Living somewhere: morar em',
      explanation: 'morar takes em, which merges with the article: no Brasil, na Itália.',
      examples: [ex('Eu moro no Brasil.', 'I live in Brazil.')],
    },
  ],
  'pt-u11-l1': [
    {
      title: 'Qual or o que?',
      explanation: 'Use qual (“which”) to pick from options and for names and numbers. Use o que for general “what”.',
      examples: [ex('Qual é o seu telefone?', 'What’s your phone number?'), ex('O que você quer?', 'What do you want?')],
    },
    {
      title: 'Spoken questions with é que',
      explanation: 'In conversation, Brazilians often add é que after the question word.',
      examples: [ex('Onde é que você mora?', 'Where do you live?')],
    },
  ],
  'pt-u11-l2': [
    {
      title: 'Saber or conhecer?',
      explanation: 'saber is knowing facts or how to do something. conhecer is knowing people and places.',
      examples: [ex('Eu sei falar inglês.', 'I can speak English.'), ex('Eu conheço o Rio.', 'I know Rio. (I’ve been there.)')],
    },
    {
      title: 'Have to: ter que + infinitive',
      explanation: 'ter que + an infinitive expresses obligation.',
      examples: [ex('Tenho que estudar.', 'I have to study.')],
    },
  ],
  'pt-u11-l3': [
    {
      title: 'Quantities with de',
      explanation: 'Quantity words take de before the food: um quilo de, uma dúzia de, um pacote de.',
      examples: [ex('uma dúzia de ovos', 'a dozen eggs')],
    },
    {
      title: 'Plurals of -ão words',
      explanation: '-ão words have irregular plurals that you learn word by word: pão → pães, mão → mãos, limão → limões.',
      examples: [ex('dois pães', 'two bread rolls')],
    },
  ],
  'pt-u12-l1': [
    {
      title: 'Saying what hurts: dói / doem',
      explanation: 'doer agrees with the body part: dói for one, doem for more than one.',
      examples: [ex('Meus pés doem.', 'My feet hurt.')],
    },
    {
      title: 'Body parts take the article',
      explanation: 'Portuguese usually says “the hands”, not “my hands”, when it’s obvious whose they are.',
      examples: [ex('Eu escovo os dentes.', 'I brush my teeth.')],
    },
  ],
  'pt-u12-l2': [
    {
      title: 'Symptoms: estar com',
      explanation: 'estar com + a noun describes how you are right now: com febre, com gripe, com dor de cabeça.',
      examples: [ex('Estou com gripe.', 'I have the flu.')],
    },
    {
      title: 'Advice as commands',
      explanation: 'Doctors give instructions with the formal command form: tome, descanse, beba.',
      examples: [ex('Beba muita água.', 'Drink lots of water.')],
    },
  ],
  'pt-u12-l3': [
    {
      title: 'Reflexive verbs: me / se',
      explanation: 'Some verbs act on yourself: sentir-se (to feel), cuidar-se (to look after yourself). In Brazil the pronoun usually comes first: eu me sinto.',
      examples: [ex('Eu me sinto bem.', 'I feel good.')],
    },
    {
      title: 'Every day: todos os dias',
      explanation: 'todos os dias means “every day”. todo dia is a common spoken alternative.',
      examples: [ex('Eu corro todos os dias.', 'I run every day.')],
    },
  ],
  'pt-u13-l1': [
    {
      title: 'We need to: precisamos + infinitive',
      explanation: 'precisamos (we need) + an infinitive is a typical way to make an argument.',
      examples: [ex('Precisamos reciclar mais.', 'We need to recycle more.')],
    },
    {
      title: 'Words in -ção are feminine',
      explanation: 'Nouns ending in -ção are always feminine: a poluição, a população, a informação.',
      examples: [ex('a poluição do ar', 'air pollution')],
    },
  ],
  'pt-u13-l2': [
    {
      title: 'According to: segundo / de acordo com',
      explanation: 'Both introduce a source. segundo is shorter and very common in the news.',
      examples: [ex('De acordo com a notícia, o preço vai subir.', 'According to the news, the price will go up.')],
    },
    {
      title: 'It seems: parece que',
      explanation: 'parece que + a normal sentence softens a statement.',
      examples: [ex('Parece que vai chover.', 'It looks like it’s going to rain.')],
    },
  ],
  'pt-u13-l3': [
    {
      title: 'Unreal “if”: se + imperfect subjunctive',
      pattern: 'se + tivesse / fosse / ganhasse…, eu + -ia',
      explanation: 'For imaginary situations, put the if-clause in the imperfect subjunctive and the result in the conditional (-ia).',
      examples: [ex('Se eu tivesse dinheiro, eu viajaria.', 'If I had money, I would travel.')],
    },
    {
      title: 'Exclamations: Que + noun!',
      explanation: 'Que + a noun or adjective makes an exclamation.',
      examples: [ex('Que pena!', 'What a shame!'), ex('Que bom!', 'How nice!')],
    },
  ],
}
