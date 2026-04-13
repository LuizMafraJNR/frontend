export type ConversationStatus = 'AI' | 'HUMAN' | 'WAITING' | 'RESOLVED'
export type MessageChannel = 'whatsapp' | 'instagram' | 'webchat'
export type MessageSender = 'client' | 'human' | 'ai' | 'system'

export interface InboxMessage {
  id: string
  conversationId: string
  sender: MessageSender
  senderName?: string
  type: 'text' | 'image' | 'audio' | 'document' | 'system' | 'internal_note'
  text?: string
  mediaUrl?: string
  mediaName?: string
  mediaSize?: string
  timestamp: string
  read: boolean
  deliveryStatus?: 'sent' | 'delivered' | 'read'
  replyTo?: { id: string; text: string; senderName: string }
}

export interface Conversation {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  clientEmail: string
  clientSince: string
  clientVisits: number
  clientTotalSpent: number
  clientTags: string[]
  channel: MessageChannel
  status: ConversationStatus
  unreadCount: number
  lastMessage: string
  lastMessageType: 'text' | 'image' | 'audio' | 'document'
  lastMessageAt: string
  attendantId?: string
  attendantName?: string
  messages: InboxMessage[]
}

// ── Helpers de data ───────────────────────────────────────────────────────────
const dt = (daysAgo: number, h: number, m: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

// ── Mock mensagens ────────────────────────────────────────────────────────────
const MSG_CONV1: InboxMessage[] = [
  { id: 'msg-1-1', conversationId: 'conv-1', sender: 'system', type: 'system', text: 'Conversa iniciada via WhatsApp', timestamp: dt(1, 9, 0), read: true },
  { id: 'msg-1-2', conversationId: 'conv-1', sender: 'client', senderName: 'Maria Silva', type: 'text', text: 'Olá! Gostaria de agendar um horário para amanhã se possível 😊', timestamp: dt(1, 9, 2), read: true },
  { id: 'msg-1-3', conversationId: 'conv-1', sender: 'ai', senderName: 'IA', type: 'text', text: 'Olá Maria! 😊 Que ótimo falar com você! Temos horários disponíveis amanhã a partir das 09:00. Qual serviço você gostaria de agendar?', timestamp: dt(1, 9, 2), read: true, deliveryStatus: 'read' },
  { id: 'msg-1-4', conversationId: 'conv-1', sender: 'client', senderName: 'Maria Silva', type: 'text', text: 'Queria fazer escova progressiva', timestamp: dt(1, 9, 5), read: true },
  { id: 'msg-1-5', conversationId: 'conv-1', sender: 'ai', senderName: 'IA', type: 'text', text: 'Perfeito! A Escova Progressiva tem duração de 2 horas. Temos disponibilidade com a Ana Costa às 09:00, 10:30 ou 14:00. Qual horário prefere?', timestamp: dt(1, 9, 5), read: true, deliveryStatus: 'read' },
  { id: 'msg-1-6', conversationId: 'conv-1', sender: 'client', senderName: 'Maria Silva', type: 'text', text: '14:00 está ótimo!', timestamp: dt(1, 9, 8), read: true },
  { id: 'msg-1-7', conversationId: 'conv-1', sender: 'system', type: 'system', text: 'Agendamento criado: Escova Progressiva · amanhã às 14:00 · Ana Costa', timestamp: dt(1, 9, 8), read: true },
  { id: 'msg-1-8', conversationId: 'conv-1', sender: 'ai', senderName: 'IA', type: 'text', text: 'Pronto! Seu agendamento está confirmado para amanhã às 14:00 com a Ana Costa. Enviaremos uma confirmação no dia. Até lá! 😊', timestamp: dt(1, 9, 9), read: true, deliveryStatus: 'read' },
  { id: 'msg-1-9', conversationId: 'conv-1', sender: 'client', senderName: 'Maria Silva', type: 'text', text: 'Ótimo! Muito obrigada 🥰', timestamp: dt(0, 8, 30), read: true },
  { id: 'msg-1-10', conversationId: 'conv-1', sender: 'client', senderName: 'Maria Silva', type: 'text', text: 'Posso confirmar meu horário de hoje?', timestamp: dt(0, 9, 10), read: false },
  { id: 'msg-1-11', conversationId: 'conv-1', sender: 'client', senderName: 'Maria Silva', type: 'text', text: 'Oi, ainda estou aguardando confirmação', timestamp: dt(0, 9, 45), read: false },
  { id: 'msg-1-12', conversationId: 'conv-1', sender: 'client', senderName: 'Maria Silva', type: 'text', text: 'Posso agendar para amanhã?', timestamp: dt(0, 10, 15), read: false },
]

const MSG_CONV2: InboxMessage[] = [
  { id: 'msg-2-1', conversationId: 'conv-2', sender: 'client', senderName: 'João Mendes', type: 'text', text: 'Boa tarde, qual o valor do corte masculino?', timestamp: dt(0, 14, 10), read: true },
  { id: 'msg-2-2', conversationId: 'conv-2', sender: 'ai', senderName: 'IA', type: 'text', text: 'Boa tarde, João! O Corte Masculino custa R$ 45,00. Posso te ajudar a agendar?', timestamp: dt(0, 14, 10), read: true, deliveryStatus: 'read' },
  { id: 'msg-2-3', conversationId: 'conv-2', sender: 'client', senderName: 'João Mendes', type: 'text', text: 'E barba?', timestamp: dt(0, 14, 12), read: true },
  { id: 'msg-2-4', conversationId: 'conv-2', sender: 'client', senderName: 'João Mendes', type: 'text', text: 'Qual o valor do corte?', timestamp: dt(0, 14, 30), read: false },
]

const MSG_CONV3: InboxMessage[] = [
  { id: 'msg-3-1', conversationId: 'conv-3', sender: 'system', type: 'system', text: 'Conversa iniciada via Instagram DM', timestamp: dt(0, 10, 0), read: true },
  { id: 'msg-3-2', conversationId: 'conv-3', sender: 'client', senderName: 'Beatriz Souza', type: 'text', text: 'Oi! Vi vocês no Instagram. Fazem hidratação capilar?', timestamp: dt(0, 10, 5), read: true },
  { id: 'msg-3-3', conversationId: 'conv-3', sender: 'ai', senderName: 'IA', type: 'text', text: 'Olá Beatriz! Sim, temos Hidratação Facial por R$ 90. Gostaria de agendar?', timestamp: dt(0, 10, 5), read: true, deliveryStatus: 'read' },
  { id: 'msg-3-4', conversationId: 'conv-3', sender: 'system', type: 'system', text: 'Ana Costa assumiu a conversa', timestamp: dt(0, 10, 15), read: true },
  { id: 'msg-3-5', conversationId: 'conv-3', sender: 'human', senderName: 'Ana Costa', type: 'text', text: 'Olá Beatriz! Aqui é a Ana. Temos horários hoje à tarde se preferir! 😊', timestamp: dt(0, 10, 16), read: true, deliveryStatus: 'read' },
  { id: 'msg-3-6', conversationId: 'conv-3', sender: 'client', senderName: 'Beatriz Souza', type: 'text', text: 'Que ótimo! Tem horário às 16h?', timestamp: dt(0, 10, 20), read: true },
]

// ── Singleton refs ────────────────────────────────────────────────────────────
const conversations = ref<Conversation[]>([])
const loading = ref(false)
const initialized = ref(false)

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1', clientId: 'cli-1', clientName: 'Maria Silva',
    clientPhone: '(11) 91234-5678', clientEmail: 'maria.silva@email.com',
    clientSince: 'jan/2024', clientVisits: 12, clientTotalSpent: 3840,
    clientTags: ['VIP', 'Aniversariante'],
    channel: 'whatsapp', status: 'AI', unreadCount: 3,
    lastMessage: 'Posso agendar para amanhã?', lastMessageType: 'text',
    lastMessageAt: dt(0, 10, 15),
    messages: MSG_CONV1,
  },
  {
    id: 'conv-2', clientId: 'cli-2', clientName: 'João Mendes',
    clientPhone: '(11) 92345-6789', clientEmail: 'joao.mendes@email.com',
    clientSince: 'mar/2024', clientVisits: 8, clientTotalSpent: 1260,
    clientTags: ['Fiel'],
    channel: 'whatsapp', status: 'WAITING', unreadCount: 1,
    lastMessage: 'Qual o valor do corte?', lastMessageType: 'text',
    lastMessageAt: dt(0, 14, 30),
    messages: MSG_CONV2,
  },
  {
    id: 'conv-3', clientId: 'cli-3', clientName: 'Beatriz Souza',
    clientPhone: '(11) 93456-7890', clientEmail: 'beatriz.souza@email.com',
    clientSince: 'fev/2024', clientVisits: 5, clientTotalSpent: 750,
    clientTags: [],
    channel: 'instagram', status: 'HUMAN', unreadCount: 0,
    attendantId: 'pro-1', attendantName: 'Ana Costa',
    lastMessage: 'Que ótimo! Tem horário às 16h?', lastMessageType: 'text',
    lastMessageAt: dt(0, 10, 20),
    messages: MSG_CONV3,
  },
  {
    id: 'conv-4', clientId: 'cli-4', clientName: 'Rafael Torres',
    clientPhone: '(11) 94567-8901', clientEmail: 'rafael.torres@email.com',
    clientSince: 'abr/2024', clientVisits: 3, clientTotalSpent: 270,
    clientTags: [],
    channel: 'whatsapp', status: 'RESOLVED', unreadCount: 0,
    lastMessage: 'Obrigado! Até lá 👍', lastMessageType: 'text',
    lastMessageAt: dt(1, 16, 0),
    messages: [
      { id: 'msg-4-1', conversationId: 'conv-4', sender: 'client', senderName: 'Rafael Torres', type: 'text', text: 'Obrigado! Até lá 👍', timestamp: dt(1, 16, 0), read: true },
    ],
  },
  {
    id: 'conv-5', clientId: 'cli-5', clientName: 'Fernanda Lima',
    clientPhone: '(11) 95678-9012', clientEmail: 'fernanda.lima@email.com',
    clientSince: 'jan/2025', clientVisits: 7, clientTotalSpent: 1890,
    clientTags: ['VIP'],
    channel: 'whatsapp', status: 'AI', unreadCount: 2,
    lastMessage: 'Quero cancelar meu horário de amanhã', lastMessageType: 'text',
    lastMessageAt: dt(0, 11, 30),
    messages: [
      { id: 'msg-5-1', conversationId: 'conv-5', sender: 'client', senderName: 'Fernanda Lima', type: 'text', text: 'Olá, preciso cancelar meu horário de amanhã', timestamp: dt(0, 11, 0), read: true },
      { id: 'msg-5-2', conversationId: 'conv-5', sender: 'ai', senderName: 'IA', type: 'text', text: 'Olá Fernanda! Entendi. Posso confirmar o cancelamento do seu agendamento de amanhã às 14:00?', timestamp: dt(0, 11, 0), read: true, deliveryStatus: 'read' },
      { id: 'msg-5-3', conversationId: 'conv-5', sender: 'client', senderName: 'Fernanda Lima', type: 'text', text: 'Quero cancelar meu horário de amanhã', timestamp: dt(0, 11, 30), read: false },
      { id: 'msg-5-4', conversationId: 'conv-5', sender: 'client', senderName: 'Fernanda Lima', type: 'text', text: 'Por favor confirme', timestamp: dt(0, 11, 31), read: false },
    ],
  },
  {
    id: 'conv-6', clientId: 'cli-6', clientName: 'Paulo Andrade',
    clientPhone: '(11) 96789-0123', clientEmail: 'paulo.andrade@email.com',
    clientSince: 'jun/2025', clientVisits: 2, clientTotalSpent: 130,
    clientTags: ['Novo'],
    channel: 'webchat', status: 'WAITING', unreadCount: 5,
    lastMessage: 'Tem alguém disponível agora?', lastMessageType: 'text',
    lastMessageAt: dt(0, 9, 55),
    messages: [
      { id: 'msg-6-1', conversationId: 'conv-6', sender: 'system', type: 'system', text: 'Conversa iniciada via Web Chat', timestamp: dt(0, 9, 40), read: true },
      { id: 'msg-6-2', conversationId: 'conv-6', sender: 'client', senderName: 'Paulo Andrade', type: 'text', text: 'Oi! Preciso de informações sobre coloração', timestamp: dt(0, 9, 41), read: true },
      { id: 'msg-6-3', conversationId: 'conv-6', sender: 'client', senderName: 'Paulo Andrade', type: 'text', text: 'Qual o preço?', timestamp: dt(0, 9, 45), read: false },
      { id: 'msg-6-4', conversationId: 'conv-6', sender: 'client', senderName: 'Paulo Andrade', type: 'text', text: 'Oi?', timestamp: dt(0, 9, 50), read: false },
      { id: 'msg-6-5', conversationId: 'conv-6', sender: 'client', senderName: 'Paulo Andrade', type: 'text', text: 'Tem alguém disponível agora?', timestamp: dt(0, 9, 55), read: false },
    ],
  },
  {
    id: 'conv-7', clientId: 'cli-7', clientName: 'Camila Ferreira',
    clientPhone: '(11) 97890-1234', clientEmail: 'camila.ferreira@email.com',
    clientSince: 'out/2024', clientVisits: 9, clientTotalSpent: 2340,
    clientTags: ['Fiel'],
    channel: 'instagram', status: 'AI', unreadCount: 0,
    lastMessage: 'Perfeito, muito obrigada!', lastMessageType: 'text',
    lastMessageAt: dt(0, 8, 0),
    messages: [
      { id: 'msg-7-1', conversationId: 'conv-7', sender: 'client', senderName: 'Camila Ferreira', type: 'text', text: 'Boa tarde! Queria saber sobre a promoção de hidratação', timestamp: dt(0, 7, 30), read: true },
      { id: 'msg-7-2', conversationId: 'conv-7', sender: 'ai', senderName: 'IA', type: 'text', text: 'Olá Camila! Temos Hidratação Facial por R$ 90. Esta semana com 10% de desconto para clientes fiéis! 🎉', timestamp: dt(0, 7, 30), read: true, deliveryStatus: 'read' },
      { id: 'msg-7-3', conversationId: 'conv-7', sender: 'client', senderName: 'Camila Ferreira', type: 'text', text: 'Perfeito, muito obrigada!', timestamp: dt(0, 8, 0), read: true },
    ],
  },
  {
    id: 'conv-8', clientId: 'cli-8', clientName: 'Lucas Oliveira',
    clientPhone: '(11) 98901-2345', clientEmail: 'lucas.oliveira@email.com',
    clientSince: 'mai/2025', clientVisits: 4, clientTotalSpent: 420,
    clientTags: [],
    channel: 'whatsapp', status: 'HUMAN', unreadCount: 0,
    attendantId: 'pro-2', attendantName: 'Carlos Lima',
    lastMessage: 'Certo, estarei lá às 15h', lastMessageType: 'text',
    lastMessageAt: dt(0, 13, 45),
    messages: [
      { id: 'msg-8-1', conversationId: 'conv-8', sender: 'client', senderName: 'Lucas Oliveira', type: 'text', text: 'Oi, quero reagendar meu horário de hoje', timestamp: dt(0, 13, 30), read: true },
      { id: 'msg-8-2', conversationId: 'conv-8', sender: 'system', type: 'system', text: 'Carlos Lima assumiu a conversa', timestamp: dt(0, 13, 35), read: true },
      { id: 'msg-8-3', conversationId: 'conv-8', sender: 'human', senderName: 'Carlos Lima', type: 'text', text: 'Olá Lucas! Posso te encaixar às 15h, como está para você?', timestamp: dt(0, 13, 36), read: true, deliveryStatus: 'read' },
      { id: 'msg-8-4', conversationId: 'conv-8', sender: 'client', senderName: 'Lucas Oliveira', type: 'text', text: 'Certo, estarei lá às 15h', timestamp: dt(0, 13, 45), read: true },
    ],
  },
]

// ── Composable ────────────────────────────────────────────────────────────────
export const useInbox = () => {
  const fetchAll = async () => {
    if (initialized.value) return
    loading.value = true
    await new Promise(r => setTimeout(r, 350))
    conversations.value = MOCK_CONVERSATIONS.map(c => ({ ...c, messages: [...c.messages] }))
    initialized.value = true
    loading.value = false
  }

  const getConversation = (id: string): Conversation | null =>
    conversations.value.find(c => c.id === id) ?? null

  const assumeConversation = (id: string) => {
    const conv = conversations.value.find(c => c.id === id)
    if (!conv) return
    conv.status = 'HUMAN'
    conv.attendantId = 'pro-0'
    conv.attendantName = 'Você'
    conv.messages.push({
      id: `msg-sys-${Date.now()}`,
      conversationId: id,
      sender: 'system',
      type: 'system',
      text: 'Você assumiu a conversa',
      timestamp: new Date().toISOString(),
      read: true,
    })
  }

  const returnToAI = (id: string) => {
    const conv = conversations.value.find(c => c.id === id)
    if (!conv) return
    conv.status = 'AI'
    conv.attendantId = undefined
    conv.attendantName = undefined
    conv.messages.push({
      id: `msg-sys-${Date.now()}`,
      conversationId: id,
      sender: 'system',
      type: 'system',
      text: 'IA voltou a responder automaticamente',
      timestamp: new Date().toISOString(),
      read: true,
    })
  }

  const resolveConversation = (id: string, reason: string) => {
    const conv = conversations.value.find(c => c.id === id)
    if (!conv) return
    conv.status = 'RESOLVED'
    conv.unreadCount = 0
    conv.messages.push({
      id: `msg-sys-${Date.now()}`,
      conversationId: id,
      sender: 'system',
      type: 'system',
      text: `Conversa resolvida: ${reason}`,
      timestamp: new Date().toISOString(),
      read: true,
    })
  }

  const sendMessage = (convId: string, text: string, sender: MessageSender = 'human'): InboxMessage => {
    const conv = conversations.value.find(c => c.id === convId)
    const msg: InboxMessage = {
      id: `msg-${Date.now()}`,
      conversationId: convId,
      sender,
      senderName: sender === 'human' ? 'Você' : sender === 'ai' ? 'IA' : undefined,
      type: 'text',
      text,
      timestamp: new Date().toISOString(),
      read: true,
      deliveryStatus: 'sent',
    }
    if (conv) {
      conv.messages.push(msg)
      conv.lastMessage = text
      conv.lastMessageAt = msg.timestamp
      conv.lastMessageType = 'text'
    }
    return msg
  }

  const markAsRead = (convId: string) => {
    const conv = conversations.value.find(c => c.id === convId)
    if (!conv) return
    conv.messages.forEach(m => { m.read = true })
    conv.unreadCount = 0
  }

  const totalUnread = computed(() =>
    conversations.value.reduce((sum, c) => sum + c.unreadCount, 0),
  )

  const waitingCount = computed(() =>
    conversations.value.filter(c => c.status === 'WAITING').length,
  )

  return {
    conversations,
    loading,
    fetchAll,
    getConversation,
    assumeConversation,
    returnToAI,
    resolveConversation,
    sendMessage,
    markAsRead,
    totalUnread,
    waitingCount,
  }
}
