// ── Types ─────────────────────────────────────────────────────────────────────
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
export type CampaignChannel = 'whatsapp' | 'instagram' | 'email'
export type CampaignType = 'promotional' | 'reactivation' | 'birthday' | 'launch' | 'informational'

export interface SegmentRule {
  field: string
  operator: string
  value: string
}

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  channel: CampaignChannel
  status: CampaignStatus
  audienceSize: number
  scheduledAt: string | null
  sentAt: string | null
  message: string
  subject?: string
  imageUrl?: string | null
  couponCode?: string | null
  segmentRules: SegmentRule[]
  allClients: boolean
  metrics: {
    sent: number
    delivered: number
    read: number
    replied: number
    converted: number
  }
  createdAt: string
}

// ── Singleton state ───────────────────────────────────────────────────────────
const dt = (daysAgo: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

const campaigns = ref<Campaign[]>([
  {
    id: 'camp-1',
    name: 'Promoção de Abril — Coloração',
    type: 'promotional',
    channel: 'whatsapp',
    status: 'sent',
    audienceSize: 47,
    scheduledAt: dt(3),
    sentAt: dt(3),
    message: 'Olá {{nome_cliente}}! 🎨 Em abril, coloração completa com desconto de 20%! Use o cupom ABRIL20. Agende já: {{link_agendamento}}',
    couponCode: 'ABRIL20',
    segmentRules: [{ field: 'Serviço realizado', operator: 'inclui', value: 'Coloração' }],
    allClients: false,
    metrics: { sent: 47, delivered: 45, read: 38, replied: 12, converted: 5 },
    createdAt: dt(5),
  },
  {
    id: 'camp-2',
    name: 'Reativação — Clientes inativos',
    type: 'reactivation',
    channel: 'whatsapp',
    status: 'sent',
    audienceSize: 23,
    scheduledAt: dt(7),
    sentAt: dt(7),
    message: 'Olá {{nome_cliente}}! 😊 Faz tempo que não te vemos! Sentimos sua falta. Que tal agendar? Temos horários disponíveis esta semana.',
    couponCode: null,
    segmentRules: [{ field: 'Última visita', operator: 'há mais de', value: '45 dias' }],
    allClients: false,
    metrics: { sent: 23, delivered: 21, read: 15, replied: 6, converted: 2 },
    createdAt: dt(10),
  },
  {
    id: 'camp-3',
    name: 'Aniversariantes de Abril',
    type: 'birthday',
    channel: 'whatsapp',
    status: 'scheduled',
    audienceSize: 8,
    scheduledAt: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    sentAt: null,
    message: 'Feliz aniversário, {{nome_cliente}}! 🎉🎂 Este mês é seu! Use o cupom ANIVER10 e ganhe 10% de desconto em qualquer serviço. Validade: até o final do mês.',
    couponCode: 'ANIVER10',
    segmentRules: [{ field: 'Aniversário', operator: 'é neste mês', value: '' }],
    allClients: false,
    metrics: { sent: 0, delivered: 0, read: 0, replied: 0, converted: 0 },
    createdAt: dt(2),
  },
  {
    id: 'camp-4',
    name: 'Lançamento: Tratamento Capilar Premium',
    type: 'launch',
    channel: 'whatsapp',
    status: 'draft',
    audienceSize: 156,
    scheduledAt: null,
    sentAt: null,
    message: 'Olá {{nome_cliente}}! 🌟 Novidade no Studio: apresentamos nosso Tratamento Capilar Premium, com produtos exclusivos importados. Agende uma avaliação gratuita!',
    couponCode: null,
    segmentRules: [],
    allClients: true,
    metrics: { sent: 0, delivered: 0, read: 0, replied: 0, converted: 0 },
    createdAt: dt(1),
  },
  {
    id: 'camp-5',
    name: 'Aviso: Feriado — Studio fechado',
    type: 'informational',
    channel: 'whatsapp',
    status: 'draft',
    audienceSize: 156,
    scheduledAt: null,
    sentAt: null,
    message: 'Olá {{nome_cliente}}! Informamos que estaremos fechados nos dias 18 e 19/04 devido ao feriado de Páscoa. Voltamos na segunda, 21/04! Agradecemos a compreensão. 🐣',
    couponCode: null,
    segmentRules: [],
    allClients: true,
    metrics: { sent: 0, delivered: 0, read: 0, replied: 0, converted: 0 },
    createdAt: dt(0),
  },
  {
    id: 'camp-6',
    name: 'Black Friday Beauty — Nov 2025',
    type: 'promotional',
    channel: 'email',
    status: 'sent',
    audienceSize: 89,
    scheduledAt: dt(150),
    sentAt: dt(150),
    subject: 'Black Friday no Studio: até 30% off em serviços selecionados!',
    message: 'Aproveite nossas ofertas exclusivas de Black Friday! Serviços com até 30% de desconto somente nesta sexta. Vagas limitadas.',
    couponCode: 'BLACK30',
    segmentRules: [],
    allClients: true,
    metrics: { sent: 89, delivered: 87, read: 52, replied: 18, converted: 14 },
    createdAt: dt(155),
  },
  {
    id: 'camp-7',
    name: 'Dia das Mães 2025',
    type: 'promotional',
    channel: 'whatsapp',
    status: 'sent',
    audienceSize: 62,
    scheduledAt: dt(330),
    sentAt: dt(330),
    message: 'Feliz Dia das Mães! 🌸 Presenteie quem você ama com beleza. Agende agora e ganhe um brinde especial.',
    couponCode: null,
    segmentRules: [],
    allClients: true,
    metrics: { sent: 62, delivered: 60, read: 48, replied: 22, converted: 18 },
    createdAt: dt(335),
  },
  {
    id: 'camp-8',
    name: 'Campanha Instagram — Progressiva',
    type: 'promotional',
    channel: 'instagram',
    status: 'cancelled',
    audienceSize: 0,
    scheduledAt: dt(60),
    sentAt: null,
    message: 'Progressiva com resultado garantido! 💆‍♀️ Agende já e transforme seu cabelo.',
    couponCode: null,
    segmentRules: [],
    allClients: true,
    metrics: { sent: 0, delivered: 0, read: 0, replied: 0, converted: 0 },
    createdAt: dt(62),
  },
])

// ── Composable ────────────────────────────────────────────────────────────────
export const useCampaigns = () => {
  const toast = useZimaToast()

  const addCampaign = (camp: Omit<Campaign, 'id' | 'createdAt' | 'metrics'>): Campaign => {
    const newCamp: Campaign = {
      ...camp,
      id: `camp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      metrics: { sent: 0, delivered: 0, read: 0, replied: 0, converted: 0 },
    }
    campaigns.value.unshift(newCamp)
    return newCamp
  }

  const sendCampaign = async (id: string): Promise<void> => {
    const camp = campaigns.value.find(c => c.id === id)
    if (!camp) return
    camp.status = 'sending'
    await new Promise(r => setTimeout(r, 2000))
    camp.status = 'sent'
    camp.sentAt = new Date().toISOString()
    camp.metrics.sent = camp.audienceSize
    camp.metrics.delivered = Math.floor(camp.audienceSize * 0.96)
    toast.add({
      type: 'success',
      title: `Campanha "${camp.name}" enviada!`,
      description: `${camp.metrics.sent} mensagens enviadas.`,
      action: () => navigateTo(`/saas/campanhas/${camp.id}`),
      actionLabel: 'Ver relatório',
    })
  }

  const scheduleCampaign = (id: string, datetime: string): void => {
    const camp = campaigns.value.find(c => c.id === id)
    if (!camp) return
    camp.status = 'scheduled'
    camp.scheduledAt = datetime
    toast.success(`Campanha agendada para ${new Date(datetime).toLocaleString('pt-BR')}`)
  }

  const deleteCampaign = (id: string): void => {
    campaigns.value = campaigns.value.filter(c => c.id !== id)
    toast.success('Campanha removida.')
  }

  const updateCampaign = (id: string, patch: Partial<Campaign>): Campaign | undefined => {
    const camp = campaigns.value.find(c => c.id === id)
    if (!camp) return undefined
    Object.assign(camp, patch)
    return camp
  }

  const getCampaign = (id: string): Campaign | undefined => {
    return campaigns.value.find(c => c.id === id)
  }

  return { campaigns, addCampaign, sendCampaign, scheduleCampaign, updateCampaign, deleteCampaign, getCampaign }
}
