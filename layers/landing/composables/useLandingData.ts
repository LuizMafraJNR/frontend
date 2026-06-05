// Dados da landing page em PT-BR e EN
// Mantidos aqui para garantir disponibilidade durante SSR/prerender
// (o lazy loading do @nuxtjs/i18n não está disponível no momento do prerender)

const PT_BR = {
  nav: { features:'Funcionalidades', pricing:'Planos', compare:'Comparar', faq:'FAQ', signin:'Entrar', start:'Entrar na lista' },
  hero: {
    eyebrow: 'Zima Plataforma · Beta fechado',
    titleA: 'Toda a operação do seu negócio.\nEm um lugar só.',
    sub: 'Agenda, clientes, financeiro, estoque, nota fiscal, IA para atendimento e campanhas — para salões, clínicas de estética, petshops e estúdios. Feito no Brasil.',
    ctaPrimary: 'Quero acesso antecipado', ctaSecondary: 'Ver como funciona',
    notice: 'Beta fechado · Vagas limitadas · Lançamento em breve',
    tabs: { agenda:'Agenda', inbox:'Atendimento IA', pdv:'PDV', dre:'Financeiro' },
  },
  trusted: 'Em breve · histórias de clientes em produção',
  problem: {
    eyebrow: 'O problema', title: 'Você ainda gerencia seu negócio assim?',
    sub: 'A maioria dos salões e clínicas opera com 5 ferramentas desconectadas. O resultado é trabalho dobrado, faturamento perdido e nenhuma visão do lucro real.',
    items: [
      { t:'Agenda no WhatsApp', d:'Sem confirmação automática. No-shows acontecem todo dia.', bad:'No-show' },
      { t:'Financeiro no caderno', d:'Você sabe quanto faturou — mas não quanto lucrou.', bad:'Sem visibilidade' },
      { t:'Estoque na cabeça', d:'Produto acabou. Cliente esperando. Cadê o fornecedor?', bad:'Falta de produto' },
      { t:'Marketing no improviso', d:'Posts soltos no Instagram, sem segmentação nem métrica.', bad:'Sem conversão' },
      { t:'Atendimento até 23h', d:'Mensagens chegando fora do horário. Você responde no sofá.', bad:'Burnout' },
      { t:'3+ sistemas que não conversam', d:'Agenda num lugar, financeiro em outro, nota em um terceiro.', bad:'Retrabalho' },
    ],
  },
  solution: {
    eyebrow: 'A solução', title: 'Uma plataforma. Catorze módulos.\nUm fluxo só.',
    sub: 'Uma venda no PDV registra automaticamente a receita, calcula a comissão, baixa o estoque, emite a nota fiscal e atualiza o DRE. Sem planilhas. Sem dupla digitação. Sem exceções.',
    flow: ['Cliente agenda online', 'IA confirma no WhatsApp', 'Profissional executa', 'PDV finaliza a venda', 'Estoque · Comissão · NFS-e · DRE'],
    footAuto: 'Automático', footDesc: 'Tudo conectado em tempo real — sem integrações externas, sem código.',
    footModules: '14 módulos integrados', footDb: '1 base de dados', footSheets: '0 planilhas',
  },
  features: {
    eyebrow: 'Funcionalidades', title: 'Tudo que você precisa.\nNada que você não precisa.',
    sub: 'Catorze módulos integrados que substituem agendamento, CRM, ERP, atendimento, marketing e fiscal — sem orquestração externa.',
    preview: 'Pré-visualização ao vivo',
    items: [
      { k:'agenda', t:'Agenda Inteligente', d:'Visualização por dia, semana ou lista. Confirmações automáticas pelo WhatsApp. Status em tempo real.' },
      { k:'ia',     t:'IA & Automação',     d:'Agente de IA configurável para atendimento 24/7. Base de conhecimento, fluxos visuais, transferência inteligente.' },
      { k:'inbox',  t:'Inbox Multi-canal',  d:'WhatsApp, Instagram e Webchat em uma única caixa de entrada. Agendamento direto do chat.' },
      { k:'pdv',    t:'PDV Integrado',      d:'Uma venda alimenta financeiro, comissão e estoque automaticamente. PIX, cartão e dinheiro.' },
      { k:'fin',    t:'Financeiro com DRE', d:'Receitas, despesas, contas a pagar/receber e DRE completo. Sempre atualizado, não só no fim do mês.' },
      { k:'stock',  t:'Gestão de Estoque',  d:'SKU, variações, fornecedores e movimentações rastreadas. Alertas de reposição automáticos.' },
      { k:'camp',   t:'Campanhas de Marketing', d:'Segmentação visual, editor com variáveis, agendamento e métricas de conversão.' },
      { k:'nf',     t:'Notas Fiscais',      d:'NFS-e e NF-e emitidas direto na plataforma. Configuração de regime tributário, envio automático.' },
    ],
  },
  diff: {
    eyebrow: 'Diferenciais', title: 'Por que Zima\ne não outra coisa',
    items: [
      { t:'IA nativa para atendimento', d:'Não é uma integração externa. O agente foi desenhado dentro da plataforma — entende seu catálogo, sua agenda, suas regras.' },
      { t:'DRE em tempo real', d:'O Demonstrativo do Resultado é recalculado a cada venda. Você abre o app à meia-noite e vê o lucro do dia.' },
      { t:'PDV → Estoque → Fiscal → Financeiro', d:'Uma operação no caixa dispara quatro atualizações. Zero configuração extra.' },
      { t:'Pensado para o Brasil', d:'NFS-e municipal, PIX nativo, WhatsApp Business API, regime tributário do Simples ao Lucro Real.' },
      { t:'Design enterprise moderno', d:'Sua equipe vai querer abrir o sistema. Seu cliente vai notar a diferença. Sua marca sobe um nível.' },
      { t:'Comando rápido (Ctrl K)', d:'Navegue o sistema inteiro sem tirar as mãos do teclado. Cada ação a um atalho.' },
    ],
  },
  compare: {
    eyebrow: 'Comparação', title: 'Zima vs. o resto do mercado',
    sub: 'Concorrentes resolvem pedaços do problema. Zima é o único que une agenda, fiscal, IA e financeiro.',
    legendYes: 'Incluído', legendBasic: 'Básico', legendNo: 'Não disponível',
    feature: 'Funcionalidade', bestChoice: 'Melhor escolha',
    rows: [
      ['Agenda online',true,true,true,true,false,true],['PDV integrado',true,false,true,true,true,false],
      ['IA para atendimento',true,false,false,false,false,false],['Inbox multi-canal',true,false,false,false,false,false],
      ['Campanhas de marketing',true,'Básico','Básico',false,false,false],['Gestão de estoque',true,false,true,true,true,false],
      ['Nota fiscal integrada',true,false,false,false,true,false],['DRE completo',true,false,false,false,true,false],
      ['Comissões automáticas',true,false,true,true,false,true],['Design moderno','★★','★',false,'★',false,false],
      ['Foco mercado BR',true,true,false,true,true,true],
    ],
  },
  testi: {
    eyebrow: 'Em breve', title: 'Histórias de clientes em produção',
    sub: 'Estamos rodando piloto com proprietárias e gestores em Joinville e região. Os primeiros depoimentos serão publicados em breve.',
    cta: 'Entrar na lista de espera', soon: 'Em breve · piloto',
  },
  pricing: {
    eyebrow: 'Planos e preços', title: 'Previsão de preços para o lançamento.',
    sub: 'Valores planejados para quando abrirmos. Inscreva-se agora para garantir condições especiais de fundador.',
    monthly: 'Mensal', yearly: 'Anual', save: 'Economize 20%',
    cta: 'Reservar vaga', ctaEnterprise: 'Falar com vendas',
    perMonth: '/mês', popular: 'Mais popular', consultation: 'Sob consulta',
    yearly_note: 'cobrado anualmente', cancel_note: 'cancele quando quiser',
    tiers: [
      { k:'starter', t:'Starter', d:'Para o profissional independente que quer profissionalizar.', price:{m:79,y:63}, popular:false, features:['Agenda inteligente','CRM de clientes (até 500)','PDV básico','1 usuário','WhatsApp manual'] },
      { k:'pro', t:'Profissional', d:'Para salões e clínicas em crescimento, com equipe.', price:{m:189,y:151}, popular:true, features:['Tudo do Starter, sem limite','Equipe ilimitada · comissões','Estoque + fornecedores','NFS-e + NF-e ilimitadas','Inbox multi-canal','Campanhas de marketing'] },
      { k:'ent', t:'Enterprise', d:'Para redes, franquias e operações multi-unidade.', price:null, popular:false, features:['Tudo do Profissional','IA & Automação 24/7','Multi-unidade consolidada','DRE por unidade','API + integrações custom','Gerente de conta dedicado'] },
    ],
  },
  integ: {
    eyebrow: 'Integrações', title: 'Conectado com tudo\nque você já usa',
    sub: 'Pagamentos, calendários, WhatsApp Business, fiscal municipal, contabilidade. Plug and play.',
  },
  faq: {
    eyebrow: 'Perguntas frequentes', title: 'Dúvidas honestas,\nrespostas honestas',
    contact: 'Falta alguma resposta? Fale com nosso time — respondemos em até 1 hora útil.',
    contactBtn: 'Falar com humano',
    items: [
      ['Quando o Zima vai lançar?','Estamos em beta fechado com um grupo seleto de parceiros. A previsão de lançamento público é para o segundo semestre de 2025. Inscreva-se na lista de espera para ser notificado em primeira mão.'],
      ['E se eu já uso outro sistema? Como migro?','Importamos clientes, agenda e catálogo de planilha ou diretamente de Booksy, Trinks, Mindbody e iGestão. Nosso time faz a migração junto com você, sem custo.'],
      ['A nota fiscal funciona na minha cidade?','NFS-e está homologada em mais de 4.500 municípios brasileiros, incluindo todas as capitais. Se sua cidade ainda não estiver, integramos em até 5 dias úteis.'],
      ['Funciona no celular?','Sim. Toda a plataforma é responsiva e há aplicativo nativo iOS e Android para você operar agenda, PDV e atendimento de qualquer lugar.'],
      ['E se minha equipe é pequena? Vale a pena?','O plano Starter foi desenhado para profissionais sozinhos. A partir de R$ 79/mês você já tem agenda profissional, CRM e PDV — mais barato que perder 1 cliente por mês por no-show.'],
      ['Como funciona a IA de atendimento?','Você configura nome, tom de voz e base de conhecimento. A IA responde no WhatsApp, agenda, confirma e transfere para humano quando necessário. Treinada com casos do setor de beleza.'],
      ['Meus dados ficam seguros?','Conformidade LGPD, criptografia em repouso e em trânsito, backups diários, certificação ISO 27001 em andamento. Você é dono dos seus dados — exportação em CSV a qualquer momento.'],
    ],
  },
  cta: { eyebrow: 'Garanta sua vaga', title: 'Seu negócio merece mais.\nSeja um dos primeiros.', sub: 'Beta fechado com acesso antecipado e preço especial para os primeiros usuários.' },
  waitlist: {
    eyebrow: 'Acesso antecipado · Beta fechado', title: 'Seja um dos primeiros\na usar o Zima.',
    sub: 'Estamos em beta fechado. Cadastre-se para entrar na fila e receber atualizações sobre o lançamento assim que estiver disponível.',
    perks: ['Acesso antes do lançamento público','Preço especial para fundadores','Onboarding guiado com a equipe Zima','Canal direto para feedbacks e sugestões'],
    counter: 'pessoas já na lista de espera', namePlaceholder: 'Seu nome', nameLabel: 'Nome completo',
    emailLabel: 'E-mail', emailPlaceholder: 'seu@email.com', whatsappLabel: 'WhatsApp',
    whatsappPlaceholder: '(47) 99999-9999', optional: 'opcional', submit: 'Entrar na lista de espera',
    privacy: 'Sem spam. Seus dados ficam só com a gente.', successTitle: 'Você está na lista!',
    successText: 'Avisaremos assim que o Zima estiver disponível para você. Fique de olho no e-mail e no WhatsApp.',
    position: 'Posição na fila:',
  },
  foot: {
    tag: 'Tudo que o seu negócio precisa. Em um lugar só.', product: 'Produto', company: 'Empresa',
    resources: 'Recursos', legal: 'Legal', rights: '© 2026 Zima Tecnologia · Feito em Joinville, SC',
    statusOnline: 'Todos os sistemas operando', tagline: 'Beleza, estética e cuidados',
    productLinks: ['Funcionalidades','Planos','Integrações','Roadmap','Mudanças'],
    companyLinks: ['Sobre','Carreiras','Blog','Imprensa','Contato'],
    resourcesLinks: ['Documentação','API','Status','Comunidade','Migração'],
    legalLinks: ['Termos','Privacidade','Segurança','LGPD','Cookies'],
  },
  themeLight: 'Mudar para claro', themeDark: 'Mudar para escuro',
}

const EN = {
  nav: { features:'Features', pricing:'Pricing', compare:'Compare', faq:'FAQ', signin:'Sign in', start:'Join waitlist' },
  hero: {
    eyebrow: 'Zima Platform · Closed beta',
    titleA: 'Your entire operation.\nIn one place.',
    sub: 'Scheduling, clients, finance, inventory, invoicing, AI support and marketing campaigns — for salons, aesthetics clinics, pet shops and studios. Built in Brazil.',
    ctaPrimary: 'Get early access', ctaSecondary: 'See how it works',
    notice: 'Closed beta · Limited spots · Launching soon',
    tabs: { agenda:'Calendar', inbox:'AI Support', pdv:'POS', dre:'Finance' },
  },
  trusted: 'Coming soon · customer stories in production',
  problem: {
    eyebrow: 'The problem', title: 'Is this how you still run your business?',
    sub: 'Most salons and clinics operate with 5 disconnected tools. The result is double work, lost revenue and zero visibility on real profit.',
    items: [
      { t:'Bookings on WhatsApp', d:'No auto-confirm. No-shows happen every day.', bad:'No-show' },
      { t:'Cash on paper', d:'You know what came in — not what you actually made.', bad:'No visibility' },
      { t:'Stock in your head', d:"Product is out. Client is waiting. Where's the supplier?", bad:'Stockout' },
      { t:'Improvised marketing', d:'Random Instagram posts, no segmentation, no metrics.', bad:'No conversion' },
      { t:'Support until 11pm', d:'Messages outside hours. You reply from the couch.', bad:'Burnout' },
      { t:"3+ systems that don't talk", d:'Calendar one place, finance another, invoice a third.', bad:'Rework' },
    ],
  },
  solution: {
    eyebrow: 'The solution', title: 'One platform. Fourteen modules.\nOne single flow.',
    sub: 'A POS sale automatically records revenue, calculates commission, updates inventory, issues the invoice and refreshes the P&L. No spreadsheets. No double entry. No exceptions.',
    flow: ['Client books online', 'AI confirms on WhatsApp', 'Pro performs service', 'POS closes sale', 'Stock · Commission · Invoice · P&L'],
    footAuto: 'Automatic', footDesc: 'Everything connected in real time — no external integrations, no code.',
    footModules: '14 integrated modules', footDb: '1 database', footSheets: '0 spreadsheets',
  },
  features: {
    eyebrow: 'Features', title: 'Everything you need.\nNothing you don\'t.',
    sub: 'Fourteen integrated modules that replace scheduling, CRM, ERP, support, marketing and tax — with zero external orchestration.',
    preview: 'Live preview',
    items: [
      { k:'agenda', t:'Smart Calendar', d:'Day, week or list views. Auto-confirmations via WhatsApp. Real-time status.' },
      { k:'ia', t:'AI & Automation', d:'Configurable AI agent for 24/7 support. Knowledge base, visual flows, smart handoff.' },
      { k:'inbox', t:'Multi-channel Inbox', d:'WhatsApp, Instagram and Webchat in a single inbox. Book directly from chat.' },
      { k:'pdv', t:'Integrated POS', d:'One sale feeds finance, commission and stock automatically. PIX, card, cash.' },
      { k:'fin', t:'Finance with P&L', d:'Revenue, expenses, AP/AR and a full P&L. Always live, not just month-end.' },
      { k:'stock', t:'Inventory', d:'SKU, variants, suppliers and tracked movements. Auto-reorder alerts.' },
      { k:'camp', t:'Marketing Campaigns', d:'Visual segmentation, variable editor, scheduling and conversion metrics.' },
      { k:'nf', t:'Invoicing', d:'NFS-e and NF-e issued in-platform. Tax regime setup, automatic delivery.' },
    ],
  },
  diff: {
    eyebrow: 'Differentiators', title: 'Why Zima\nand not the rest',
    items: [
      { t:'Native support AI', d:'Not a third-party integration. The agent was designed inside the platform — it knows your catalog, your calendar, your rules.' },
      { t:'Real-time P&L', d:"The income statement is recalculated with every sale. Open the app at midnight and see today's profit." },
      { t:'POS → Stock → Tax → Finance', d:'One register operation triggers four updates. Zero extra config.' },
      { t:'Built for Brazil', d:'Municipal NFS-e, native PIX, WhatsApp Business API, every tax regime from Simples to Lucro Real.' },
      { t:'Modern enterprise design', d:'Your team will want to open the app. Your client will notice. Your brand levels up.' },
      { t:'Command palette (Ctrl K)', d:'Run the whole system without leaving the keyboard. Every action a shortcut away.' },
    ],
  },
  compare: {
    eyebrow: 'Comparison', title: 'Zima vs. the rest of the market',
    sub: 'Competitors solve parts of the problem. Zima is the only one that unifies calendar, tax, AI and finance.',
    legendYes: 'Included', legendBasic: 'Basic', legendNo: 'Not available',
    feature: 'Feature', bestChoice: 'Best choice',
    rows: [
      ['Online booking',true,true,true,true,false,true],['Integrated POS',true,false,true,true,true,false],
      ['AI for support',true,false,false,false,false,false],['Multi-channel inbox',true,false,false,false,false,false],
      ['Marketing campaigns',true,'Basic','Basic',false,false,false],['Inventory',true,false,true,true,true,false],
      ['Integrated invoicing',true,false,false,false,true,false],['Full P&L',true,false,false,false,true,false],
      ['Auto commissions',true,false,true,true,false,true],['Modern design','★★','★',false,'★',false,false],
      ['BR market focus',true,true,false,true,true,true],
    ],
  },
  testi: {
    eyebrow: 'Coming soon', title: 'Customer stories in production',
    sub: 'We\'re piloting with owners and managers in Joinville and the region. First testimonials will be published soon.',
    cta: 'Join the waitlist', soon: 'Coming soon · pilot',
  },
  pricing: {
    eyebrow: 'Pricing', title: 'Preview pricing for launch.',
    sub: 'Planned prices for when we open. Sign up now to lock in special founder pricing.',
    monthly: 'Monthly', yearly: 'Annual', save: 'Save 20%',
    cta: 'Reserve founder spot', ctaEnterprise: 'Talk to sales',
    perMonth: '/mo', popular: 'Most popular', consultation: 'Custom pricing',
    yearly_note: 'billed annually', cancel_note: 'cancel anytime',
    tiers: [
      { k:'starter', t:'Starter', d:'For solo professionals leveling up.', price:{m:79,y:63}, popular:false, features:['Smart calendar','CRM (up to 500)','Basic POS','1 user','Manual WhatsApp'] },
      { k:'pro', t:'Professional', d:'For salons and clinics growing with a team.', price:{m:189,y:151}, popular:true, features:['Everything in Starter, unlimited','Unlimited team · commissions','Inventory + suppliers','Unlimited NFS-e + NF-e','Multi-channel inbox','Marketing campaigns'] },
      { k:'ent', t:'Enterprise', d:'For chains, franchises and multi-location ops.', price:null, popular:false, features:['Everything in Professional','24/7 AI & Automation','Multi-location consolidated','P&L per location','API + custom integrations','Dedicated account manager'] },
    ],
  },
  integ: {
    eyebrow: 'Integrations', title: 'Connected with everything\nyou already use',
    sub: 'Payments, calendars, WhatsApp Business, municipal tax, accounting. Plug and play.',
  },
  faq: {
    eyebrow: 'FAQ', title: 'Honest questions,\nhonest answers',
    contact: 'Missing an answer? Talk to our team — we reply within 1 business hour.',
    contactBtn: 'Talk to a human',
    items: [
      ["Do I need a credit card to try?","No. Create an account with email, pick your business type and you're in within 5 minutes. We only charge if you decide to continue after the 14 days."],
      ["What if I already use another system? How do I migrate?","We import clients, schedule and catalog from spreadsheet or directly from Booksy, Trinks, Mindbody and iGestão. Our team does the migration with you, at no cost."],
      ["Does invoicing work in my city?","NFS-e is certified in over 4,500 Brazilian municipalities, including every capital. If yours isn't yet, we integrate within 5 business days."],
      ["Does it work on mobile?","Yes. The whole platform is responsive and there are native iOS and Android apps for calendar, POS and support on the go."],
      ["What if my team is small? Is it worth it?","The Starter plan was designed for solo pros. From R$ 79/mo you get a professional calendar, CRM and POS — cheaper than losing 1 client per month to a no-show."],
      ["How does the support AI work?","You configure name, tone and knowledge base. The AI answers on WhatsApp, schedules, confirms and hands off to a human when needed. Trained on beauty industry cases."],
      ["Is my data safe?","LGPD compliance, encryption at rest and in transit, daily backups, ISO 27001 certification underway. You own your data — CSV export anytime."],
    ],
  },
  cta: { eyebrow: 'Reserve your spot', title: 'Your business deserves more.\nBe among the first.', sub: 'Closed beta with early access and special founder pricing.' },
  waitlist: {
    eyebrow: 'Early access · Closed beta', title: 'Be among the first\nto use Zima.',
    sub: "We're in closed beta. Register to join the queue and receive launch updates as soon as they're available.",
    perks: ['Access before public launch','Special founder pricing','Guided onboarding with the Zima team','Direct channel for feedback and suggestions'],
    counter: 'people already on the waitlist', namePlaceholder: 'Your name', nameLabel: 'Full name',
    emailLabel: 'Email', emailPlaceholder: 'you@email.com', whatsappLabel: 'WhatsApp',
    whatsappPlaceholder: '(47) 99999-9999', optional: 'optional', submit: 'Join the waitlist',
    privacy: 'No spam. Your data stays with us.', successTitle: "You're on the list!",
    successText: "We'll notify you as soon as Zima is available for you. Keep an eye on your email and WhatsApp.",
    position: 'Queue position:',
  },
  foot: {
    tag: 'Everything your business needs. In one place.', product: 'Product', company: 'Company',
    resources: 'Resources', legal: 'Legal', rights: '© 2026 Zima Tecnologia · Made in Joinville, SC, Brazil',
    statusOnline: 'All systems operating', tagline: 'Beauty, aesthetics and care',
    productLinks: ['Features','Pricing','Integrations','Roadmap','Changelog'],
    companyLinks: ['About','Careers','Blog','Press','Contact'],
    resourcesLinks: ['Docs','API','Status','Community','Migration'],
    legalLinks: ['Terms','Privacy','Security','LGPD','Cookies'],
  },
  themeLight: 'Switch to light', themeDark: 'Switch to dark',
}

export type LandingData = typeof PT_BR

export function useLandingData() {
  // Usar useRoute() para detectar locale via URL prefix (/en/...)
  // Funciona tanto no SSR quanto no cliente
  const route = useRoute()
  const isEn = computed(() => route.path.startsWith('/en') || route.path === '/en')
  const data = computed<LandingData>(() => isEn.value ? EN as LandingData : PT_BR)
  return { data, PT_BR, EN }
}
