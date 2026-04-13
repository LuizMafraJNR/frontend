// ── Types ─────────────────────────────────────────────────────────────────────
export interface AICapability {
  key: string
  label: string
  description: string
  enabled: boolean
}

export interface KnowledgeEntry {
  id: string
  title: string
  category: 'FAQ' | 'Regras' | 'Procedimentos' | 'Produtos' | 'Promoções' | 'Outro'
  content: string
  exampleQuestion: string
  active: boolean
  createdAt: string
}

export interface ConvFlow {
  id: string
  name: string
  description: string
  trigger: string
  active: boolean
  usageCount: number
  completionRate: number
}

export interface BusinessAutomation {
  id: string
  name: string
  description: string
  triggerType: string
  triggerLabel: string
  actionType: string
  actionLabel: string
  active: boolean
  stats: { sent: number; delivered: number }
}

export interface AIAgentConfig {
  name: string
  description: string
  avatarUrl: string | null
  tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'custom'
  customToneInstructions: string
  useEmojis: boolean
  emojiFrequency: 'low' | 'moderate' | 'high'
  language: 'pt-BR' | 'es' | 'en'
  autoDetectLanguage: boolean
  welcomeMessage: string
  offHoursMessage: string
  maxMessagesBeforeTransfer: number
  alwaysTransferTopics: string[]
  aiSchedule: '24h' | 'business' | 'custom'
  capabilities: AICapability[]
}

export interface TopFAQ {
  question: string
  count: number
  percentage: number
  resolvedByAI: boolean
}

export interface UnresolvedConversation {
  id: string
  clientName: string
  transferReason: string
  transferredAt: string
}

export interface AIDashboard {
  todayConversations: number
  resolvedByAI: number
  aiResolutionRate: number
  transferredToHuman: number
  avgResponseSeconds: number
  dailyData: { day: string; ai: number; human: number }[]
  heatmapData: number[][]
  topFAQ: TopFAQ[]
  unresolved: UnresolvedConversation[]
}

// ── Singleton state ───────────────────────────────────────────────────────────
const agentConfig = ref<AIAgentConfig>({
  name: 'Lia',
  description: 'Assistente virtual do Studio Beleza & Estética',
  avatarUrl: null,
  tone: 'friendly',
  customToneInstructions: '',
  useEmojis: true,
  emojiFrequency: 'moderate',
  language: 'pt-BR',
  autoDetectLanguage: false,
  welcomeMessage: 'Olá {{nome_cliente}}! 😊 Seja bem-vinda ao {{nome_negocio}}. Como posso te ajudar hoje?',
  offHoursMessage: 'No momento estamos fechados. Nosso horário é seg-sex 08:00-18:00. Deixe sua mensagem que responderemos no próximo dia útil!',
  maxMessagesBeforeTransfer: 10,
  alwaysTransferTopics: ['reclamação', 'reembolso', 'problema', 'jurídico'],
  aiSchedule: 'business',
  capabilities: [
    { key: 'services_faq', label: 'Responder dúvidas sobre serviços e preços', description: 'IA consulta o catálogo de serviços e responde perguntas sobre preços e duração.', enabled: true },
    { key: 'schedule', label: 'Realizar agendamentos', description: 'IA verifica disponibilidade e cria agendamentos automaticamente.', enabled: true },
    { key: 'manage_schedule', label: 'Confirmar/cancelar/reagendar agendamentos', description: 'IA pode alterar agendamentos existentes mediante confirmação do cliente.', enabled: true },
    { key: 'send_catalog', label: 'Enviar catálogo de serviços', description: 'IA envia lista formatada de serviços com preços quando solicitado.', enabled: true },
    { key: 'hours', label: 'Informar horário de funcionamento', description: 'IA responde com base no horário configurado nas configurações do negócio.', enabled: true },
    { key: 'collect_data', label: 'Coletar dados de novos clientes', description: 'IA solicita nome, telefone e serviço desejado para cadastrar novos clientes.', enabled: true },
    { key: 'reminders', label: 'Enviar lembretes de agendamento', description: 'IA envia lembrete automático 24h antes do agendamento.', enabled: true },
    { key: 'transfer', label: 'Transferir para humano quando não souber', description: 'IA reconhece seus limites e transfere para atendente quando não consegue ajudar.', enabled: true },
    { key: 'satisfaction', label: 'Pesquisa de satisfação pós-atendimento', description: 'IA envia pesquisa de satisfação 24h após o atendimento ser concluído.', enabled: false },
    { key: 'promotions', label: 'Oferecer promoções e cupons ativos', description: 'IA menciona promoções vigentes quando relevante durante a conversa.', enabled: false },
    { key: 'reactivation', label: 'Recuperação de clientes inativos', description: 'IA inicia conversa com clientes que não visitam há X dias.', enabled: false },
    { key: 'order_status', label: 'Informar status de pedidos', description: 'Para pet shops e lojas: IA informa sobre pedidos e entregas.', enabled: false },
  ],
})

const knowledgeEntries = ref<KnowledgeEntry[]>([
  {
    id: 'kb-1',
    title: 'Política de cancelamento',
    category: 'Regras',
    content: 'Cancelamentos devem ser feitos com no mínimo 2 horas de antecedência. Cancelamentos em cima da hora podem resultar em cobrança de 50% do valor do serviço. Para cancelar, o cliente pode avisar por WhatsApp, ligar ou cancelar pelo link de agendamento.',
    exampleQuestion: 'Posso cancelar meu horário?',
    active: true,
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'kb-2',
    title: 'Localização e estacionamento',
    category: 'FAQ',
    content: 'Estamos localizados na Rua das Flores, 123 — Centro. Temos estacionamento gratuito para clientes no período de atendimento. Aceitamos carros e motos. Fique à vontade para perguntar mais detalhes pela mensagem.',
    exampleQuestion: 'Onde vocês ficam? Tem estacionamento?',
    active: true,
    createdAt: '2026-01-16T10:00:00.000Z',
  },
  {
    id: 'kb-3',
    title: 'Formas de pagamento aceitas',
    category: 'FAQ',
    content: 'Aceitamos: dinheiro, cartão de crédito (parcelamos em até 3x), cartão de débito e Pix. Não aceitamos cheque. O pagamento é realizado no final do atendimento.',
    exampleQuestion: 'Vocês aceitam cartão?',
    active: true,
    createdAt: '2026-01-17T10:00:00.000Z',
  },
  {
    id: 'kb-4',
    title: 'Instruções pré-coloração',
    category: 'Procedimentos',
    content: 'Para coloração, é recomendado: não lavar o cabelo nas 24h anteriores (os óleos naturais protegem o couro cabeludo), evitar chapinha ou secador no dia anterior, e informar se usa henna ou qualquer produto natural no cabelo. Não é necessário fazer nada especial além disso.',
    exampleQuestion: 'Preciso fazer alguma preparação antes da coloração?',
    active: true,
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'kb-5',
    title: 'Cuidados pós-progressiva',
    category: 'Procedimentos',
    content: 'Após a progressiva: aguarde 3 dias antes de lavar o cabelo, não prenda o cabelo nesse período, evite suor excessivo e molhar o cabelo com chuva, use shampoo sem sulfato para prolongar o efeito.',
    exampleQuestion: 'O que devo fazer depois da progressiva?',
    active: false,
    createdAt: '2026-02-01T10:00:00.000Z',
  },
])

const convFlows = ref<ConvFlow[]>([
  {
    id: 'flow-1',
    name: 'Agendamento Completo',
    description: 'Guia o cliente do primeiro contato até o agendamento confirmado',
    trigger: 'Quando mensagem contém: agendar, marcar, horário, corte',
    active: true,
    usageCount: 234,
    completionRate: 89,
  },
  {
    id: 'flow-2',
    name: 'FAQ Automático',
    description: 'Responde perguntas frequentes e escala quando necessário',
    trigger: 'Quando mensagem contém: preço, quanto custa, valor',
    active: true,
    usageCount: 187,
    completionRate: 94,
  },
  {
    id: 'flow-3',
    name: 'Pesquisa de Satisfação',
    description: 'Coleta avaliação após atendimento concluído',
    trigger: '2 horas após atendimento concluído',
    active: false,
    usageCount: 45,
    completionRate: 76,
  },
])

const automations = ref<BusinessAutomation[]>([
  {
    id: 'auto-1',
    name: 'Lembrete 24h antes do agendamento',
    description: 'Envia lembrete automático para reduzir no-shows',
    triggerType: 'before_appointment',
    triggerLabel: '24 horas antes de um agendamento',
    actionType: 'whatsapp',
    actionLabel: 'Enviar WhatsApp com confirmação do horário',
    active: true,
    stats: { sent: 156, delivered: 144 },
  },
  {
    id: 'auto-2',
    name: 'Parabéns no aniversário',
    description: 'Mensagem personalizada no dia do aniversário com cupom',
    triggerType: 'birthday',
    triggerLabel: 'Data de nascimento do cliente',
    actionType: 'whatsapp',
    actionLabel: 'Enviar WhatsApp com felicitação + cupom 10% off',
    active: true,
    stats: { sent: 12, delivered: 11 },
  },
  {
    id: 'auto-3',
    name: 'Reativação de clientes inativos',
    description: 'Recupera clientes que não visitam há mais de 30 dias',
    triggerType: 'inactive',
    triggerLabel: 'Cliente sem visita há 30+ dias',
    actionType: 'whatsapp',
    actionLabel: 'Enviar WhatsApp "Sentimos sua falta" + promoção',
    active: false,
    stats: { sent: 0, delivered: 0 },
  },
])

// ── Dashboard mock data ───────────────────────────────────────────────────────
const generateDailyData = () => {
  const data: { day: string; ai: number; human: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const total = Math.floor(Math.random() * 40) + 15
    const ai = Math.floor(total * (0.65 + Math.random() * 0.25))
    data.push({
      day: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      ai,
      human: total - ai,
    })
  }
  return data
}

const generateHeatmap = () => {
  const days = 7
  const hours = 24
  const data: number[][] = []
  for (let d = 0; d < days; d++) {
    const row: number[] = []
    for (let h = 0; h < hours; h++) {
      // Peak hours: 8-12, 14-18
      const isPeak = (h >= 8 && h <= 12) || (h >= 14 && h <= 18)
      const isWeekend = d >= 5
      const base = isPeak ? 0.4 : 0.05
      const weekendMultiplier = isWeekend ? 0.3 : 1
      row.push(Math.random() * base * weekendMultiplier + (isPeak && !isWeekend ? 0.2 : 0))
    }
    data.push(row)
  }
  return data
}

const dashboard: AIDashboard = {
  todayConversations: 34,
  resolvedByAI: 28,
  aiResolutionRate: 82,
  transferredToHuman: 6,
  avgResponseSeconds: 12,
  dailyData: generateDailyData(),
  heatmapData: generateHeatmap(),
  topFAQ: [
    { question: 'Preço do corte feminino', count: 45, percentage: 13, resolvedByAI: true },
    { question: 'Disponibilidade para hoje', count: 38, percentage: 11, resolvedByAI: true },
    { question: 'Quanto tempo dura a progressiva?', count: 31, percentage: 9, resolvedByAI: true },
    { question: 'Aceita cartão de crédito?', count: 28, percentage: 8, resolvedByAI: true },
    { question: 'Horário de funcionamento', count: 24, percentage: 7, resolvedByAI: true },
    { question: 'Como cancelar agendamento', count: 21, percentage: 6, resolvedByAI: true },
    { question: 'Preço da hidratação', count: 18, percentage: 5, resolvedByAI: false },
    { question: 'Tem estacionamento?', count: 16, percentage: 5, resolvedByAI: true },
    { question: 'Reembolso por cancelamento', count: 12, percentage: 4, resolvedByAI: false },
    { question: 'Produtos utilizados na coloração', count: 10, percentage: 3, resolvedByAI: false },
  ],
  unresolved: [
    { id: 'conv-3', clientName: 'Ana Costa', transferReason: 'Pedido de reembolso', transferredAt: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'conv-5', clientName: 'Carlos Lima', transferReason: 'Reclamação sobre serviço', transferredAt: new Date(Date.now() - 45 * 60000).toISOString() },
    { id: 'conv-7', clientName: 'Beatriz Santos', transferReason: 'Dúvida sobre produto específico', transferredAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'conv-9', clientName: 'Roberto Alves', transferReason: 'Negociação de valor', transferredAt: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: 'conv-11', clientName: 'Fernanda Oliveira', transferReason: 'Agendamento especial (noiva)', transferredAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  ],
}

// ── Composable ────────────────────────────────────────────────────────────────
export const useAI = () => {
  const toast = useZimaToast()

  const saveAgentConfig = async (config: AIAgentConfig): Promise<void> => {
    await new Promise(r => setTimeout(r, 600))
    agentConfig.value = { ...config }
    toast.success('Configurações do agente salvas com sucesso!')
  }

  const addKnowledgeEntry = (entry: Omit<KnowledgeEntry, 'id' | 'createdAt'>): void => {
    knowledgeEntries.value.unshift({
      ...entry,
      id: `kb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    })
    toast.success('Conhecimento adicionado com sucesso!')
  }

  const updateKnowledgeEntry = (id: string, updates: Partial<KnowledgeEntry>): void => {
    const idx = knowledgeEntries.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      knowledgeEntries.value[idx] = { ...knowledgeEntries.value[idx], ...updates }
      toast.success('Conhecimento atualizado!')
    }
  }

  const deleteKnowledgeEntry = (id: string): void => {
    knowledgeEntries.value = knowledgeEntries.value.filter(e => e.id !== id)
    toast.success('Conhecimento removido.')
  }

  const toggleAutomation = (id: string): void => {
    const auto = automations.value.find(a => a.id === id)
    if (auto) {
      auto.active = !auto.active
      toast.success(auto.active ? `Automação "${auto.name}" ativada!` : `Automação "${auto.name}" pausada.`)
    }
  }

  const addAutomation = (auto: Omit<BusinessAutomation, 'id' | 'stats'>): void => {
    automations.value.unshift({
      ...auto,
      id: `auto-${Date.now()}`,
      stats: { sent: 0, delivered: 0 },
    })
    toast.success('Automação criada com sucesso!')
  }

  const addConvFlow = (flow: Omit<ConvFlow, 'id' | 'usageCount' | 'completionRate'>): void => {
    convFlows.value.unshift({
      ...flow,
      id: `flow-${Date.now()}`,
      usageCount: 0,
      completionRate: 0,
    })
    toast.success(`Fluxo "${flow.name}" criado!`)
  }

  const duplicateFlow = (id: string): void => {
    const flow = convFlows.value.find(f => f.id === id)
    if (flow) {
      convFlows.value.unshift({
        ...flow,
        id: `flow-${Date.now()}`,
        name: `${flow.name} (cópia)`,
        active: false,
        usageCount: 0,
        completionRate: 0,
      })
      toast.success('Fluxo duplicado!')
    }
  }

  const deleteFlow = (id: string): void => {
    convFlows.value = convFlows.value.filter(f => f.id !== id)
    toast.success('Fluxo removido.')
  }

  return {
    agentConfig,
    knowledgeEntries,
    convFlows,
    automations,
    dashboard,
    saveAgentConfig,
    addKnowledgeEntry,
    updateKnowledgeEntry,
    deleteKnowledgeEntry,
    toggleAutomation,
    addAutomation,
    addConvFlow,
    duplicateFlow,
    deleteFlow,
  }
}
