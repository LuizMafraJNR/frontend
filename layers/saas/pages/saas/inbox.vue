<script setup lang="ts">
import type { Conversation, InboxMessage } from '../../composables/useInbox'
import { useInbox } from '../../composables/useInbox'
import ModalNovaConversa from './ModalNovaConversa.vue'
import ModalNovoAgendamento from './ModalNovoAgendamento.vue'

definePageMeta({ layout: 'saas' })

const toast = useZimaToast()
const {
  conversations, loading, fetchAll,
  assumeConversation, returnToAI,
  sendMessage, markAsRead, totalUnread, waitingCount,
  setBlocked, getNotes, addNote: addNoteToConv, setClientTags,
} = useInbox()
const { appointments, fetchAll: fetchAppointments, updateStatus: updateAppointmentStatus } = useAppointments()
const domainEvents = useDomainEvents()

onMounted(async () => {
  await Promise.all([fetchAll(), fetchAppointments()])
})

// ── Ações do menu 3-dot do header da conversa ────────────────────────────────
const blockDialogOpen = ref(false)

const onScheduleFollowup = () => {
  if (!activeConv.value) return
  moreMenuOpen.value = false
  const in7 = new Date()
  in7.setDate(in7.getDate() + 7)
  agendamentoPrefill.value = { date: in7.toISOString().slice(0, 10), startTime: '10:00' }
  agendamentoOpen.value = true
}

const onToggleBlock = () => {
  if (!activeConv.value) return
  moreMenuOpen.value = false
  blockDialogOpen.value = true
}

const confirmToggleBlock = () => {
  if (!activeConv.value) return
  const willBlock = !activeConv.value.blocked
  setBlocked(activeConv.value.id, willBlock)
  blockDialogOpen.value = false
  toast.success(willBlock ? 'Contato bloqueado.' : 'Contato desbloqueado.')
}

const onExportConversation = () => {
  if (!activeConv.value) return
  moreMenuOpen.value = false
  const conv = activeConv.value
  const header = `Conversa: ${conv.clientName} (${conv.clientPhone})\nCanal: ${conv.channel}\nExportada em: ${new Date().toLocaleString('pt-BR')}\n\n`
  const body = conv.messages.map((m) => {
    const sender = m.sender === 'client'
      ? conv.clientName
      : m.sender === 'ai'
        ? 'IA'
        : m.senderName || 'Atendente'
    const when = new Date(m.timestamp).toLocaleString('pt-BR')
    const text = m.text || (m.type === 'image' ? '[imagem]' : m.type === 'audio' ? '[áudio]' : m.type === 'document' ? `[documento: ${m.mediaName ?? ''}]` : '')
    return `[${when}] ${sender}: ${text}`
  }).join('\n')
  const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `conversa-${conv.clientName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast.success('Conversa exportada.')
}

// ── Helpers de formatação ─────────────────────────────────────────────────────
const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h`
  if (h < 48) return 'ontem'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const isSameDay = (a: string, b: string): boolean =>
  new Date(a).toDateString() === new Date(b).toDateString()

const formatDayLabel = (iso: string): string => {
  if (isSameDay(iso, new Date().toISOString())) return 'Hoje'
  if (isSameDay(iso, new Date(Date.now() - 86400000).toISOString())) return 'Ontem'
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

// ── Responsividade ────────────────────────────────────────────────────────────
const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value < 768)
const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
type MobileView = 'list' | 'chat' | 'info'
const mobileView = ref<MobileView>('list')

// Painel de info no tablet abre como drawer
const tabletInfoOpen = ref(false)

// ── Filtros da lista ──────────────────────────────────────────────────────────
const searchQuery = ref('')
const debouncedSearch = useDebounce(searchQuery, 300)
const activeFilter = ref('Todas')
const activeChannel = ref('all')

const FILTERS = ['Todas', 'Não lidas', 'Aguardando', 'IA', 'Humano', 'Resolvidas']
const CHANNELS = [
  { key: 'all',       icon: 'i-lucide-layers',         color: '#94A3B8' },
  { key: 'whatsapp',  icon: 'i-lucide-message-circle',  color: '#25D366' },
  { key: 'instagram', icon: 'i-lucide-instagram',       color: '#E1306C' },
  { key: 'webchat',   icon: 'i-lucide-globe',           color: '#3B82F6' },
]

const filteredConversations = computed<Conversation[]>(() => {
  let result = conversations.value
  // Busca
  const q = debouncedSearch.value.toLowerCase()
  if (q) result = result.filter(c =>
    c.clientName.toLowerCase().includes(q) ||
    c.clientPhone.includes(q) ||
    c.lastMessage.toLowerCase().includes(q),
  )
  // Filtro de status
  if (activeFilter.value === 'Não lidas') result = result.filter(c => c.unreadCount > 0)
  if (activeFilter.value === 'Aguardando') result = result.filter(c => c.status === 'WAITING')
  if (activeFilter.value === 'IA') result = result.filter(c => c.status === 'AI')
  if (activeFilter.value === 'Humano') result = result.filter(c => c.status === 'HUMAN')
  if (activeFilter.value === 'Resolvidas') result = result.filter(c => c.status === 'RESOLVED')
  // Filtro de canal
  if (activeChannel.value !== 'all') result = result.filter(c => c.channel === activeChannel.value)
  // Ordem: WAITING primeiro, depois por data desc
  return [...result].sort((a, b) => {
    if (a.status === 'WAITING' && b.status !== 'WAITING') return -1
    if (b.status === 'WAITING' && a.status !== 'WAITING') return 1
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  })
})

const waitingConvs = computed(() => filteredConversations.value.filter(c => c.status === 'WAITING'))
const nonWaitingConvs = computed(() => filteredConversations.value.filter(c => c.status !== 'WAITING'))

// ── Conversa ativa ────────────────────────────────────────────────────────────
const activeConvId = ref<string | null>(null)
const activeConv = computed<Conversation | null>(() =>
  activeConvId.value ? (conversations.value.find(c => c.id === activeConvId.value) ?? null) : null,
)

const selectConversation = (id: string) => {
  activeConvId.value = id
  markAsRead(id)
  if (isMobile.value) mobileView.value = 'chat'
  nextTick(() => scrollToBottom())
}

const openClientProfile = () => {
  if (!activeConv.value?.clientId) return
  navigateTo(`/saas/clientes/${activeConv.value.clientId}`, { open: { target: '_blank' } })
}

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  AI: '#3B82F6', WAITING: '#F59E0B', HUMAN: '#10B981', RESOLVED: '#475569',
}
const STATUS_LABEL: Record<string, string> = {
  AI: 'IA respondendo', WAITING: 'Aguardando atendente', HUMAN: 'Você está atendendo', RESOLVED: 'Resolvida',
}
const STATUS_ICON: Record<string, string> = {
  AI: 'i-lucide-bot', WAITING: 'i-lucide-clock', HUMAN: 'i-lucide-user-check', RESOLVED: 'i-lucide-check-circle',
}
const CHANNEL_ICON: Record<string, { icon: string; color: string; label: string }> = {
  whatsapp:  { icon: 'i-lucide-message-circle', color: '#25D366', label: 'WhatsApp' },
  instagram: { icon: 'i-lucide-instagram',       color: '#E1306C', label: 'Instagram' },
  webchat:   { icon: 'i-lucide-globe',           color: '#3B82F6', label: 'Web Chat' },
}

// ── Mensagens com separadores de data ─────────────────────────────────────────
interface MessageOrSeparator {
  type: 'separator' | 'message'
  label?: string
  message?: InboxMessage
  isNewGroup?: boolean
}

const messagesWithSeparators = computed<MessageOrSeparator[]>(() => {
  if (!activeConv.value) return []
  const items: MessageOrSeparator[] = []
  let lastDay = ''
  let lastSender = ''
  for (const msg of activeConv.value.messages) {
    const day = new Date(msg.timestamp).toDateString()
    if (day !== lastDay) {
      items.push({ type: 'separator', label: formatDayLabel(msg.timestamp) })
      lastDay = day
      lastSender = ''
    }
    const isNewGroup = msg.sender !== lastSender
    items.push({ type: 'message', message: msg, isNewGroup })
    lastSender = msg.sender
  }
  return items
})

// ── Scroll ────────────────────────────────────────────────────────────────────
const messagesEl = ref<HTMLElement | null>(null)
const userScrolled = ref(false)

const scrollToBottom = () => {
  if (!messagesEl.value) return
  messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  userScrolled.value = false
}

const onMessagesScroll = () => {
  if (!messagesEl.value) return
  const el = messagesEl.value
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  userScrolled.value = !atBottom
}

watch(() => activeConv.value?.messages.length, () => {
  if (!userScrolled.value) nextTick(() => scrollToBottom())
})

// ── Ações da conversa ─────────────────────────────────────────────────────────
const handleAssume = () => {
  if (!activeConvId.value || !activeConv.value) return
  assumeConversation(activeConvId.value)
  toast.success(`Você assumiu a conversa com ${activeConv.value.clientName}`)
}

// Modal devolver para IA
const returnToAiOpen = ref(false)
const handleReturnToAI = () => { returnToAiOpen.value = true }
const confirmReturnToAI = () => {
  if (!activeConvId.value) return
  returnToAI(activeConvId.value)
  returnToAiOpen.value = false
  toast.success('IA voltou a responder automaticamente')
}

// Menu mais opções — posição calculada dinamicamente para escapar do overflow:hidden
const moreMenuOpen = ref(false)
const moreMenuPos = ref({ top: 0, right: 0 })
const toggleMoreMenu = (e: MouseEvent) => {
  if (moreMenuOpen.value) { moreMenuOpen.value = false; return }
  const btn = (e.currentTarget as HTMLElement).getBoundingClientRect()
  moreMenuPos.value = {
    top: btn.bottom + 4,
    right: window.innerWidth - btn.right,
  }
  moreMenuOpen.value = true
}

// Dropdown de anexos — posição calculada dinamicamente
const attachPos = ref({ bottom: 0, left: 0 })
const toggleAttach = (e: MouseEvent) => {
  if (attachOpen.value) { attachOpen.value = false; return }
  const btn = (e.currentTarget as HTMLElement).getBoundingClientRect()
  attachPos.value = {
    bottom: window.innerHeight - btn.top + 4,
    left: btn.left,
  }
  attachOpen.value = true
}

// ── Input de mensagem ─────────────────────────────────────────────────────────
const messageInput = ref('')
const replyTo = ref<InboxMessage | null>(null)
const attachOpen = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const ATTACH_OPTIONS = [
  { icon: 'i-lucide-image', label: 'Imagem', color: '#3B82F6' },
  { icon: 'i-lucide-paperclip', label: 'Documento', color: '#8B5CF6' },
  { icon: 'i-lucide-map-pin', label: 'Localização', color: '#EF4444' },
  { icon: 'i-lucide-layout-grid', label: 'Catálogo de serviços', color: '#F59E0B' },
  { icon: 'i-lucide-calendar', label: 'Link de agendamento', color: '#10B981' },
]

const attachFileInput = ref<HTMLInputElement | null>(null)
const handleAttach = (opt: { label: string }) => {
  attachOpen.value = false
  if (opt.label === 'Imagem' || opt.label === 'Documento') {
    attachFileInput.value?.click()
    return
  }
  // Insere um conteúdo útil na mensagem (templates rápidos).
  const append = (text: string) => {
    messageInput.value = (messageInput.value ? messageInput.value + '\n' : '') + text
    nextTick(() => textareaRef.value?.focus())
  }
  if (opt.label === 'Localização') append('📍 Studio Beleza & Estética — Rua das Flores, 123. Veja no mapa: https://maps.google.com/?q=Studio+Beleza')
  else if (opt.label === 'Catálogo de serviços') append('💇 Confira nosso catálogo de serviços e preços: studiobeleza.com.br/servicos')
  else if (opt.label === 'Link de agendamento') append('📅 Agende seu horário online: studiobeleza.com.br/agendar')
}
const onAttachFileSelected = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !activeConvId.value) return
  sendMessage(activeConvId.value, `📎 ${file.name}`, 'human')
  toast.success('Anexo enviado', file.name)
  ;(e.target as HTMLInputElement).value = ''
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleSend = () => {
  if (!messageInput.value.trim() || !activeConvId.value) return
  sendMessage(activeConvId.value, messageInput.value.trim(), 'human')
  messageInput.value = ''
  replyTo.value = null
  nextTick(() => scrollToBottom())
}

// Resize textarea
const resizeTextarea = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

// Copiar mensagem
const copyMessage = (text: string | undefined) => {
  if (!text) return
  navigator.clipboard.writeText(text)
  toast.success('Copiado!')
}

// Responder mensagem
const setReply = (msg: InboxMessage) => {
  replyTo.value = msg
  nextTick(() => textareaRef.value?.focus())
}

// Hover de mensagens
const hoveredMsgId = ref<string | null>(null)

// ── Painel direito ────────────────────────────────────────────────────────────
const rightPanelVisible = ref(true)

const nextAppointment = computed(() => {
  if (!activeConv.value) return null
  const today = new Date().toISOString().split('T')[0]
  return appointments.value
    .filter(a => a.clientId === activeConv.value!.clientId && a.date >= today && a.status !== 'CANCELLED')
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
})

const recentAppointments = computed(() =>
  appointments.value
    .filter(a => a.clientId === activeConv.value?.clientId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5),
)

// Confirmar o próximo agendamento direto do inbox (PENDING → CONFIRMED).
const confirmingAppointment = ref(false)
const confirmNextAppointment = async () => {
  const apt = nextAppointment.value
  if (!apt) return
  confirmingAppointment.value = true
  try {
    await updateAppointmentStatus(apt.id, 'CONFIRMED')
    domainEvents.emit('appointment:statusChanged', {
      appointmentId: apt.id,
      clientName: apt.clientName,
      serviceName: apt.serviceName,
      professionalName: apt.professionalName,
      from: 'PENDING',
      to: 'CONFIRMED',
    })
    toast.success('Agendamento confirmado', `${apt.serviceName} — ${apt.date} às ${apt.startTime}`)
  } finally {
    confirmingAppointment.value = false
  }
}

// Reagendar abre o modal de novo agendamento pré-preenchido com os dados atuais.
const rescheduleNextAppointment = () => {
  const apt = nextAppointment.value
  if (!apt) return
  agendamentoPrefill.value = { professionalId: apt.professionalId, date: apt.date, startTime: apt.startTime }
  agendamentoOpen.value = true
}

// Notas internas (persistidas por conversa via useInbox).
const internalNotes = computed(() => activeConvId.value ? getNotes(activeConvId.value) : [])
const newNoteInput = ref('')
const addNote = () => {
  if (!newNoteInput.value.trim() || !activeConvId.value) return
  addNoteToConv(activeConvId.value, newNoteInput.value.trim())
  newNoteInput.value = ''
}

// Tags do cliente — persistem na conversa.
const clientTagsLocal = computed(() => activeConv.value ? activeConv.value.clientTags : [])
const newTagInput = ref('')
const addTag = () => {
  const tag = newTagInput.value.trim()
  if (!tag || !activeConvId.value || clientTagsLocal.value.includes(tag)) return
  setClientTags(activeConvId.value, [...clientTagsLocal.value, tag])
  newTagInput.value = ''
}
const removeTag = (tag: string) => {
  if (!activeConvId.value) return
  setClientTags(activeConvId.value, clientTagsLocal.value.filter(t => t !== tag))
}

// Expandir atendimentos
const expandedAptId = ref<string | null>(null)

// ── Modal Nova Conversa ───────────────────────────────────────────────────────
const newConvOpen = ref(false)
const handleConvCreated = (conv: Conversation) => {
  nextTick(() => selectConversation(conv.id))
}

// ── Modal Novo Agendamento ────────────────────────────────────────────────────
const agendamentoOpen = ref(false)
const agendamentoPrefill = ref<{ professionalId?: string; date?: string; startTime?: string } | undefined>()

const openAgendamento = () => {
  agendamentoPrefill.value = undefined
  agendamentoOpen.value = true
}
</script>

<template>
  <div class="msgs-root">
    <!-- ══════════════════════ PAINEL ESQUERDO ══════════════════════ -->
    <aside
      class="msgs-sidebar"
      :class="{ 'msgs-sidebar--hidden': isMobile && mobileView !== 'list' }"
    >
      <!-- Header -->
      <div style="padding: 18px 16px 14px; flex-shrink: 0;">
        <div class="flex items-center justify-between" style="margin-bottom: 12px;">
          <div class="flex items-center gap-2">
            <span style="font-size: 16px; font-weight: 700; color: var(--zima-text-primary);">Mensagens</span>
            <span
              v-if="totalUnread > 0"
              style="
                background: var(--zima-danger); color: #fff; border-radius: 9999px;
                font-size: 11px; font-weight: 600; padding: 1px 7px; line-height: 18px;
              "
            >{{ totalUnread }}</span>
          </div>
          <button
            style="
              width: 30px; height: 30px; border-radius: 6px; border: none;
              background: rgba(148,163,184,0.08); cursor: pointer;
              display: flex; align-items: center; justify-content: center;
              color: var(--zima-text-secondary); transition: background 150ms;
            "
            title="Nova conversa"
            @click="newConvOpen = true"
            @mouseenter="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.15)')"
            @mouseleave="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.08)')"
          >
            <Icon name="i-lucide-message-square-plus" style="width: 16px; height: 16px;" />
          </button>
        </div>

        <!-- Busca -->
        <input
          v-model="searchQuery"
          placeholder="Buscar conversas..."
          style="
            width: 100%; box-sizing: border-box; padding: 9px 12px;
            background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default);
            border-radius: 8px; color: var(--zima-text-secondary); font-size: 13px; outline: none;
          "
        >
      </div>

      <!-- Filtros de status (chips) -->
      <div
        style="
          display: flex; gap: 8px; padding: 0 12px 12px;
          overflow-x: auto; flex-shrink: 0;
        "
        class="hide-scrollbar"
      >
        <button
          v-for="f in FILTERS"
          :key="f"
          style="
            flex-shrink: 0; padding: 5px 12px; border-radius: 9999px;
            font-size: 12px; font-weight: 500; cursor: pointer; transition: all 150ms; white-space: nowrap;
          "
          :style="{
            background: activeFilter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: activeFilter === f ? 'var(--zima-blue-light)' : 'var(--zima-text-secondary)',
            border: activeFilter === f ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
          }"
          @click="activeFilter = f"
        >
          {{ f }}
          <span v-if="f === 'Aguardando' && waitingCount > 0" style="margin-left: 4px; background: var(--zima-warning); color: #000; border-radius: 9999px; padding: 0 5px; font-size: 10px;">{{ waitingCount }}</span>
        </button>
      </div>

      <!-- Filtro de canal (ícones) -->
      <div style="display: flex; gap: 8px; padding: 0 12px 12px; flex-shrink: 0;">
        <button
          v-for="ch in CHANNELS"
          :key="ch.key"
          style="
            width: 30px; height: 30px; border-radius: 6px; border: none;
            display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 150ms;
          "
          :style="{
            background: activeChannel === ch.key ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.06)',
            color: activeChannel === ch.key ? ch.color : '#64748B',
          }"
          :title="ch.key === 'all' ? 'Todos os canais' : ch.key"
          @click="activeChannel = ch.key"
        >
          <Icon :name="ch.icon" style="width: 15px; height: 15px;" />
        </button>
      </div>

      <!-- Lista de conversas -->
      <div class="msgs-conv-list hide-scrollbar">
        <!-- Loading -->
        <div v-if="loading" style="padding: 20px;">
          <div v-for="i in 5" :key="i" style="margin-bottom: 8px;">
            <ZimaSkeleton style="height: 72px; border-radius: 8px;" />
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="filteredConversations.length === 0"
          style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; padding: 24px; text-align: center;"
        >
          <Icon name="i-lucide-message-circle" style="width: 40px; height: 40px; color: var(--zima-text-disabled); margin-bottom: 12px;" />
          <p style="font-size: 13px; color: var(--zima-text-disabled); margin: 0;">Nenhuma conversa encontrada</p>
        </div>

        <template v-else>
          <!-- Separador AGUARDANDO -->
          <template v-if="waitingConvs.length > 0 && activeFilter === 'Todas'">
            <div style="padding: 6px 16px; font-size: 10px; font-weight: 700; color: var(--zima-warning); letter-spacing: 0.08em; text-transform: uppercase; background: var(--zima-warning-subtle); border-bottom: 1px solid var(--zima-warning-border);">
              AGUARDANDO ATENÇÃO ({{ waitingConvs.length }})
            </div>
            <div
              v-for="conv in waitingConvs"
              :key="conv.id"
              style="
                padding: 14px 16px; cursor: pointer; position: relative;
                border-bottom: 1px solid rgba(148,163,184,0.05); transition: background 150ms;
                display: flex; align-items: flex-start; gap: 12px;
              "
              :style="{
                background: activeConvId === conv.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                borderLeft: activeConvId === conv.id ? '2px solid var(--zima-blue-core)' : '2px solid transparent',
              }"
              @click="selectConversation(conv.id)"
              @mouseenter="(e: MouseEvent) => { if (activeConvId !== conv.id) (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)' }"
              @mouseleave="(e: MouseEvent) => { if (activeConvId !== conv.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }"
            >
              <!-- Dot status -->
              <div style="width: 8px; height: 8px; border-radius: 9999px; flex-shrink: 0; margin-top: 5px;" :style="{ background: STATUS_DOT[conv.status] }" />
              <!-- Avatar -->
              <ZimaAvatar :name="conv.clientName" size="sm" />
              <!-- Conteúdo -->
              <div style="flex: 1; min-width: 0;">
                <div class="flex items-center justify-between" style="margin-bottom: 2px;">
                  <span style="font-size: 13px; font-weight: 600; color: var(--zima-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;">{{ conv.clientName }}</span>
                  <span style="font-size: 11px; color: var(--zima-text-muted); flex-shrink: 0;">{{ formatRelativeTime(conv.lastMessageAt) }}</span>
                </div>
                <p style="font-size: 12px; color: var(--zima-text-secondary); margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ conv.lastMessage }}</p>
                <div class="flex items-center gap-2">
                  <Icon :name="CHANNEL_ICON[conv.channel].icon" style="width: 13px; height: 13px;" :style="{ color: CHANNEL_ICON[conv.channel].color }" />
                  <span style="font-size: 11px; padding: 1px 6px; border-radius: 4px; background: var(--zima-warning-subtle); color: var(--zima-warning);">⏳ Aguardando</span>
                  <span v-if="conv.unreadCount > 0" style="margin-left: auto; background: var(--zima-blue-core); color: #fff; border-radius: 9999px; font-size: 10px; font-weight: 700; padding: 1px 6px; min-width: 18px; text-align: center;">{{ conv.unreadCount }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Resto das conversas -->
          <div
            v-for="conv in (activeFilter === 'Todas' ? nonWaitingConvs : filteredConversations)"
            :key="conv.id"
            style="
              padding: 14px 16px; cursor: pointer; position: relative;
              border-bottom: 1px solid rgba(148,163,184,0.05); transition: background 150ms;
              display: flex; align-items: flex-start; gap: 12px;
            "
            :style="{
              background: activeConvId === conv.id ? 'rgba(59,130,246,0.08)' : 'transparent',
              borderLeft: activeConvId === conv.id ? '2px solid #3B82F6' : '2px solid transparent',
            }"
            @click="selectConversation(conv.id)"
            @mouseenter="(e: MouseEvent) => { if (activeConvId !== conv.id) (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)' }"
            @mouseleave="(e: MouseEvent) => { if (activeConvId !== conv.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }"
          >
            <div style="width: 8px; height: 8px; border-radius: 9999px; flex-shrink: 0; margin-top: 5px;" :style="{ background: STATUS_DOT[conv.status] }" />
            <ZimaAvatar :name="conv.clientName" size="sm" />
            <div style="flex: 1; min-width: 0;">
              <div class="flex items-center justify-between" style="margin-bottom: 2px;">
                <span style="font-size: 13px; font-weight: 600; color: var(--zima-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;">{{ conv.clientName }}</span>
                <span style="font-size: 11px; color: var(--zima-text-muted); flex-shrink: 0;">{{ formatRelativeTime(conv.lastMessageAt) }}</span>
              </div>
              <p style="font-size: 12px; color: var(--zima-text-secondary); margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display:flex; align-items:center; gap:4px;">
                <template v-if="conv.lastMessageType === 'image'">
                  <Icon name="i-lucide-image" style="width:12px; height:12px;" />Foto
                </template>
                <template v-else-if="conv.lastMessageType === 'audio'">
                  <Icon name="i-lucide-mic" style="width:12px; height:12px;" />Áudio
                </template>
                <template v-else-if="conv.lastMessageType === 'document'">
                  <Icon name="i-lucide-paperclip" style="width:12px; height:12px;" />Documento
                </template>
                <template v-else>{{ conv.lastMessage }}</template>
              </p>
              <div class="flex items-center gap-2">
                <Icon :name="CHANNEL_ICON[conv.channel].icon" style="width: 13px; height: 13px;" :style="{ color: CHANNEL_ICON[conv.channel].color }" />
                <span
                  style="font-size: 11px; padding: 1px 6px; border-radius: 4px; display:inline-flex; align-items:center; gap:3px;"
                  :style="{
                    background: conv.status === 'AI' ? 'rgba(99,102,241,0.15)' : conv.status === 'HUMAN' ? 'rgba(16,185,129,0.15)' : conv.status === 'RESOLVED' ? 'rgba(71,85,105,0.2)' : 'rgba(245,158,11,0.15)',
                    color: conv.status === 'AI' ? 'var(--zima-info)' : conv.status === 'HUMAN' ? 'var(--zima-success)' : conv.status === 'RESOLVED' ? 'var(--zima-text-muted)' : 'var(--zima-warning)',
                  }"
                >
                  <Icon :name="STATUS_ICON[conv.status]" style="width:11px; height:11px;" />
                  {{ conv.status === 'AI' ? 'IA' : conv.status === 'HUMAN' ? 'Humano' : conv.status === 'RESOLVED' ? 'Resolvida' : 'Aguardando' }}
                </span>
                <span v-if="conv.unreadCount > 0" style="margin-left: auto; background: var(--zima-blue-core); color: #fff; border-radius: 9999px; font-size: 10px; font-weight: 700; padding: 1px 6px; min-width: 18px; text-align: center;">{{ conv.unreadCount }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </aside>

    <!-- ══════════════════════ PAINEL CENTRAL ══════════════════════ -->
    <main
      class="msgs-chat"
      :class="{ 'msgs-chat--hidden': isMobile && mobileView !== 'chat' }"
    >

      <!-- Empty state quando sem conversa selecionada -->
      <div v-if="!activeConv" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--zima-text-disabled);">
        <Icon name="i-lucide-message-square" style="width: 56px; height: 56px;" />
        <p style="font-size: 15px; font-weight: 500; margin: 0;">Selecione uma conversa</p>
        <p style="font-size: 13px; color: var(--zima-text-disabled); margin: 0;">Escolha uma conversa na lista ao lado para começar a atender</p>
      </div>

      <template v-else>
        <!-- ── Header da conversa ── -->
        <div class="msgs-chat-header">
          <!-- Botão voltar (só mobile) -->
          <button
            v-if="isMobile"
            style="width: 30px; height: 30px; border-radius: 6px; border: none; background: rgba(148,163,184,0.08); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--zima-text-secondary); flex-shrink: 0;"
            @click="mobileView = 'list'"
          >
            <Icon name="i-lucide-arrow-left" style="width: 16px; height: 16px;" />
          </button>
          <!-- Esquerda: info do cliente -->
          <ZimaAvatar :name="activeConv.clientName" size="sm" style="flex-shrink: 0;" />
          <div style="flex: 1; min-width: 0; overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
              <span style="font-size: 15px; font-weight: 600; color: var(--zima-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ activeConv.clientName }}</span>
              <Icon
                :name="CHANNEL_ICON[activeConv.channel].icon"
                style="width: 14px; height: 14px; flex-shrink: 0;"
                :style="{ color: CHANNEL_ICON[activeConv.channel].color }"
              />
            </div>
            <div style="font-size: 11px; color: var(--zima-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{ activeConv.clientPhone }} · Cliente desde {{ activeConv.clientSince }}
            </div>
          </div>

          <!-- Centro: badge de status -->
          <span
            style="font-size: 12px; padding: 3px 10px; border-radius: 9999px; font-weight: 500; white-space: nowrap; flex-shrink: 0;"
            :style="{
              background: activeConv.status === 'AI' ? 'rgba(99,102,241,0.15)' : activeConv.status === 'HUMAN' ? 'rgba(16,185,129,0.15)' : activeConv.status === 'RESOLVED' ? 'rgba(71,85,105,0.2)' : 'rgba(245,158,11,0.15)',
              color: activeConv.status === 'AI' ? 'var(--zima-info)' : activeConv.status === 'HUMAN' ? 'var(--zima-success)' : activeConv.status === 'RESOLVED' ? 'var(--zima-text-muted)' : 'var(--zima-warning)',
            }"
          >
            {{ STATUS_LABEL[activeConv.status] }}
          </span>

          <!-- Direita: botões de ação -->
          <div class="flex items-center gap-2" style="flex-shrink: 0;">
            <template v-if="!isMobile">
              <ZimaButton
                v-if="activeConv.status === 'AI' || activeConv.status === 'WAITING'"
                size="sm"
                @click="handleAssume"
              >
                Assumir conversa
              </ZimaButton>
              <ZimaButton
                v-if="activeConv.status === 'HUMAN'"
                variant="ghost"
                size="sm"
                @click="handleReturnToAI"
              >
                Devolver para IA
              </ZimaButton>
            </template>

            <!-- Menu mais opções -->
            <div>
              <button
                style="width: 30px; height: 30px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.12); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--zima-text-muted);"
                @click="toggleMoreMenu"
              >
                <Icon name="i-lucide-more-vertical" style="width: 15px; height: 15px;" />
              </button>
              <div v-if="moreMenuOpen" style="position: fixed; inset: 0; z-index: 40;" @click="moreMenuOpen = false" />
              <div
                v-if="moreMenuOpen"
                :style="{
                  position: 'fixed',
                  top: moreMenuPos.top + 'px',
                  right: moreMenuPos.right + 'px',
                  zIndex: 50,
                  background: 'var(--zima-bg-surface-2)',
                  border: '1px solid var(--zima-border-default)',
                  borderRadius: 'var(--zima-radius-md)',
                  padding: '4px',
                  minWidth: '200px',
                  boxShadow: 'var(--zima-shadow-md)',
                }"
              >
                <!-- Ações de status visíveis apenas em mobile (em desktop ficam nos botões do header) -->
                <template v-if="isMobile">
                  <button
                    v-if="activeConv.status === 'AI' || activeConv.status === 'WAITING'"
                    style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                    @click="handleAssume(); moreMenuOpen = false"
                  >
                    <Icon name="i-lucide-user-check" style="width: 13px; height: 13px;" />
                    Assumir conversa
                  </button>
                  <button
                    v-if="activeConv.status === 'HUMAN'"
                    style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                    @click="handleReturnToAI(); moreMenuOpen = false"
                  >
                    <Icon name="i-lucide-bot" style="width: 13px; height: 13px;" />
                    Devolver para IA
                  </button>
                  <div style="height: 1px; background: var(--zima-border-divider); margin: 4px 0;" />
                </template>
                <button
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                  @click="onScheduleFollowup"
                >
                  <Icon name="i-lucide-clock" style="width: 13px; height: 13px;" />
                  Agendar follow-up
                </button>
                <button
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                  @click="onToggleBlock"
                >
                  <Icon name="i-lucide-ban" style="width: 13px; height: 13px;" />
                  {{ activeConv?.blocked ? 'Desbloquear contato' : 'Bloquear contato' }}
                </button>
                <button
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                  @click="onExportConversation"
                >
                  <Icon name="i-lucide-download" style="width: 13px; height: 13px;" />
                  Exportar conversa
                </button>
                <div style="height: 1px; background: var(--zima-border-divider); margin: 4px 0;" />
                <button
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-blue-core); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                  @click="openClientProfile(); moreMenuOpen = false"
                >
                  <Icon name="i-lucide-external-link" style="width: 13px; height: 13px;" />
                  Ver ficha do cliente
                </button>
              </div>
            </div>

            <!-- Toggle painel direito / info mobile -->
            <button
              style="width: 30px; height: 30px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.12); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;"
              :style="{ color: (isMobile ? mobileView === 'info' : rightPanelVisible) ? 'var(--zima-blue-light)' : 'var(--zima-text-muted)' }"
              @click="isMobile ? (mobileView = 'info') : isTablet ? (tabletInfoOpen = !tabletInfoOpen) : (rightPanelVisible = !rightPanelVisible)"
            >
              <Icon name="i-lucide-panel-right" style="width: 15px; height: 15px;" />
            </button>
          </div>
        </div>

        <!-- ── Área de mensagens ── -->
        <div
          ref="messagesEl"
          class="msgs-messages hide-scrollbar"
          @scroll="onMessagesScroll"
        >
          <template v-for="item in messagesWithSeparators" :key="item.message?.id ?? item.label">
            <!-- Separador de data -->
            <div
              v-if="item.type === 'separator'"
              style="display: flex; align-items: center; justify-content: center; margin: 12px 0 8px;"
            >
              <span style="font-size: 11px; color: var(--zima-text-disabled); background: rgba(148,163,184,0.05); padding: 3px 12px; border-radius: 9999px;">
                {{ item.label }}
              </span>
            </div>

            <!-- Mensagem de sistema -->
            <div
              v-else-if="item.message?.sender === 'system'"
              style="display: flex; justify-content: center; margin: 6px 0;"
            >
              <span style="font-size: 11px; color: var(--zima-text-disabled); background: rgba(148,163,184,0.05); padding: 4px 12px; border-radius: 9999px;">
                {{ item.message.text }}
              </span>
            </div>

            <!-- Mensagem do cliente (esquerda) -->
            <div
              v-else-if="item.message?.sender === 'client'"
              style="display: flex; align-items: flex-end; gap: 8px; margin-bottom: 8px; position: relative;"
              :style="{ maxWidth: isMobile ? '88%' : '72%', marginTop: item.isNewGroup ? '14px' : '0' }"
              @mouseenter="hoveredMsgId = item.message.id"
              @mouseleave="hoveredMsgId = null"
            >
              <div
                style="
                  padding: 11px 16px; border-radius: 12px 12px 12px 4px;
                  background: var(--zima-bg-surface-3); max-width: 100%;
                "
              >
                <p style="font-size: 14px; color: var(--zima-text-primary); margin: 0; word-break: break-word; white-space: pre-wrap;">{{ item.message.text }}</p>
                <div style="font-size: 10px; color: var(--zima-text-disabled); margin-top: 4px; text-align: right;">
                  {{ formatTime(item.message.timestamp) }}
                </div>
              </div>
              <!-- Ações hover -->
              <div
                v-if="hoveredMsgId === item.message.id"
                style="display: flex; gap: 4px; position: absolute; right: -64px; bottom: 8px;"
              >
                <button style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.15); background: var(--zima-bg-surface-1); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--zima-text-muted);" @click="copyMessage(item.message?.text)">
                  <Icon name="i-lucide-copy" style="width: 12px; height: 12px;" />
                </button>
                <button style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.15); background: var(--zima-bg-surface-1); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--zima-text-muted);" @click="setReply(item.message!)">
                  <Icon name="i-lucide-reply" style="width: 12px; height: 12px;" />
                </button>
              </div>
            </div>

            <!-- Mensagem da IA ou humano (direita) -->
            <div
              v-else-if="item.message"
              style="display: flex; flex-direction: column; align-items: flex-end; margin-left: auto; margin-bottom: 8px; position: relative;"
              :style="{ maxWidth: isMobile ? '88%' : '72%', marginTop: item.isNewGroup ? '14px' : '0' }"
              @mouseenter="hoveredMsgId = item.message.id"
              @mouseleave="hoveredMsgId = null"
            >
              <!-- Badge IA -->
              <span
                v-if="item.message.sender === 'ai'"
                style="font-size: 10px; color: rgba(129,140,248,0.8); margin-bottom: 3px; margin-right: 4px; display:inline-flex; align-items:center; gap:3px;"
              ><Icon name="i-lucide-bot" style="width:10px; height:10px;" />IA</span>
              <div
                style="padding: 11px 16px; border-radius: 12px 12px 4px 12px; max-width: 100%;"
                :style="{ background: 'rgba(59,130,246,0.12)' }"
              >
                <p style="font-size: 14px; color: var(--zima-text-primary); margin: 0; word-break: break-word; white-space: pre-wrap;">{{ item.message.text }}</p>
                <div style="font-size: 10px; color: var(--zima-text-disabled); margin-top: 4px; text-align: right; display: flex; align-items: center; gap: 4px; justify-content: flex-end;">
                  <span>{{ item.message.senderName }} · {{ formatTime(item.message.timestamp) }}</span>
                  <Icon v-if="item.message.deliveryStatus === 'read'" name="i-lucide-check-check" style="width:12px; height:12px; color:#3B82F6;" />
                  <Icon v-else-if="item.message.deliveryStatus === 'delivered'" name="i-lucide-check-check" style="width:12px; height:12px; color:#64748B;" />
                  <Icon v-else-if="item.message.deliveryStatus === 'sent'" name="i-lucide-check" style="width:12px; height:12px; color:#64748B;" />
                </div>
              </div>
              <!-- Ações hover -->
              <div
                v-if="hoveredMsgId === item.message.id"
                style="display: flex; gap: 4px; position: absolute; left: -64px; bottom: 8px;"
              >
                <button style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.15); background: var(--zima-bg-surface-1); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--zima-text-muted);" @click="copyMessage(item.message?.text)">
                  <Icon name="i-lucide-copy" style="width: 12px; height: 12px;" />
                </button>
                <button style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.15); background: var(--zima-bg-surface-1); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--zima-text-muted);" @click="setReply(item.message!)">
                  <Icon name="i-lucide-reply" style="width: 12px; height: 12px;" />
                </button>
              </div>
            </div>
          </template>

          <!-- Indicador "IA está digitando" -->
          <div v-if="activeConv.status === 'AI'" style="display: flex; align-items: flex-end; gap: 8px; max-width: 72%; margin-top: 4px;">
            <div style="padding: 12px 18px; border-radius: 12px 12px 12px 4px; background: var(--zima-bg-surface-3); display: flex; gap: 4px; align-items: center;">
              <div style="width: 6px; height: 6px; border-radius: 9999px; background: var(--zima-text-disabled);" :style="{ animation: 'typing-bounce 1.2s infinite', animationDelay: '0s' }" />
              <div style="width: 6px; height: 6px; border-radius: 9999px; background: var(--zima-text-disabled);" :style="{ animation: 'typing-bounce 1.2s infinite', animationDelay: '0.2s' }" />
              <div style="width: 6px; height: 6px; border-radius: 9999px; background: var(--zima-text-disabled);" :style="{ animation: 'typing-bounce 1.2s infinite', animationDelay: '0.4s' }" />
              <span style="font-size: 11px; color: var(--zima-text-disabled); margin-left: 4px;">IA está digitando...</span>
            </div>
          </div>
        </div>

        <!-- Botão "Nova mensagem" -->
        <Transition name="fade">
          <button
            v-if="userScrolled"
            style="
              position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
              background: var(--zima-blue-core); color: #fff; border: none; border-radius: 9999px;
              padding: 6px 16px; font-size: 12px; cursor: pointer; z-index: 10;
              box-shadow: 0 4px 12px rgba(59,130,246,0.4);
            "
            @click="scrollToBottom"
          >
            ↓ Nova mensagem
          </button>
        </Transition>

        <!-- ── Barra de input ── -->
        <div class="msgs-input-bar">
          <!-- Preview de reply -->
          <div
            v-if="replyTo"
            style="
              display: flex; align-items: center; gap: 10px; padding: 6px 10px;
              background: rgba(59,130,246,0.08); border-radius: 6px; margin-bottom: 8px;
              border-left: 2px solid var(--zima-blue-core);
            "
          >
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 11px; color: var(--zima-blue-light); font-weight: 500; margin-bottom: 2px;">{{ replyTo.senderName ?? 'Cliente' }}</div>
              <div style="font-size: 12px; color: var(--zima-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ replyTo.text }}</div>
            </div>
            <button style="background: none; border: none; cursor: pointer; color: var(--zima-text-muted); margin-left: 8px; flex-shrink: 0;" @click="replyTo = null">
              <Icon name="i-lucide-x" style="width: 14px; height: 14px;" />
            </button>
          </div>

          <div class="flex items-end gap-2">
            <input ref="attachFileInput" type="file" hidden @change="onAttachFileSelected" >
            <!-- Attachment -->
            <div>
              <button
                style="width: 34px; height: 34px; border-radius: 8px; border: none; background: rgba(148,163,184,0.08); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--zima-text-muted); flex-shrink: 0;"
                @click="toggleAttach"
              >
                <Icon name="i-lucide-paperclip" style="width: 17px; height: 17px;" />
              </button>
              <div v-if="attachOpen" style="position: fixed; inset: 0; z-index: 40;" @click="attachOpen = false" />
              <div
                v-if="attachOpen"
                :style="{
                  position: 'fixed',
                  bottom: attachPos.bottom + 'px',
                  left: attachPos.left + 'px',
                  zIndex: 50,
                  background: 'var(--zima-bg-surface-2)',
                  border: '1px solid var(--zima-border-default)',
                  borderRadius: 'var(--zima-radius-md)',
                  padding: '4px',
                  minWidth: '200px',
                  boxShadow: 'var(--zima-shadow-md)',
                }"
              >
                <button
                  v-for="opt in ATTACH_OPTIONS"
                  :key="opt.label"
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-text-primary); cursor: pointer; display: flex; align-items: center; gap: 10px;"
                  @click="handleAttach(opt)"
                >
                  <Icon :name="opt.icon" style="width: 15px; height: 15px;" :style="{ color: opt.color }" />
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Textarea -->
            <textarea
              ref="textareaRef"
              v-model="messageInput"
              placeholder="Digite uma mensagem... (Enter para enviar, Shift+Enter para nova linha)"
              rows="1"
              style="
                flex: 1; padding: 10px 14px; border-radius: 8px;
                background: rgba(148,163,184,0.06); border: 1px solid rgba(148,163,184,0.1);
                color: var(--zima-text-primary); font-size: 14px; resize: none; outline: none;
                font-family: inherit; min-height: 40px; max-height: 160px;
                line-height: 1.4;
              "
              @keydown="handleKeydown"
              @input="resizeTextarea"
            />

            <!-- Agendar -->
            <button
              style="width: 34px; height: 34px; border-radius: 8px; border: none; background: rgba(148,163,184,0.08); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--zima-text-muted); flex-shrink: 0;"
              title="Criar agendamento"
              @click="openAgendamento"
            >
              <Icon name="i-lucide-calendar" style="width: 17px; height: 17px;" />
            </button>

            <!-- Enviar -->
            <button
              style="width: 34px; height: 34px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 150ms;"
              :style="{
                background: messageInput.trim() ? 'var(--zima-blue-core)' : 'rgba(148,163,184,0.08)',
                color: messageInput.trim() ? '#fff' : '#64748B',
                cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
              }"
              :disabled="!messageInput.trim()"
              @click="handleSend"
            >
              <Icon name="i-lucide-send" style="width: 17px; height: 17px;" />
            </button>
          </div>
        </div>
      </template>
    </main>

    <!-- ══════════════════════ PAINEL DIREITO ══════════════════════ -->
    <aside
      v-if="activeConv"
      class="msgs-info hide-scrollbar"
      :class="{
        'msgs-info--hidden': isMobile && mobileView !== 'info',
        'msgs-info--collapsed': !isMobile && !rightPanelVisible,
        'msgs-info--tablet-open': isTablet && (tabletInfoOpen || rightPanelVisible),
      }"
    >
      <!-- Botão voltar ao chat (só mobile) -->
      <div v-if="isMobile" style="padding: 12px 16px 8px; flex-shrink: 0;">
        <button
          style="display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: var(--zima-blue-light); font-size: 13px; padding: 0;"
          @click="mobileView = 'chat'"
        >
          <Icon name="i-lucide-arrow-left" style="width: 14px; height: 14px;" />
          Voltar ao chat
        </button>
      </div>
      <!-- Perfil -->
      <div class="msgs-info-profile">
        <ZimaAvatar :name="activeConv.clientName" size="lg" />
        <div style="font-size: 15px; font-weight: 600; color: var(--zima-text-primary);">{{ activeConv.clientName }}</div>
        <!-- Tags -->
        <div class="flex flex-wrap gap-1 justify-center">
          <span
            v-for="tag in clientTagsLocal"
            :key="tag"
            style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: var(--zima-blue-subtle); color: var(--zima-blue-light); cursor: pointer;"
            @click="removeTag(tag)"
          >
            {{ tag }} ×
          </span>
        </div>
        <a :href="`tel:${activeConv.clientPhone}`" style="font-size: 12px; color: var(--zima-text-muted); text-decoration: none;">{{ activeConv.clientPhone }}</a>
        <a :href="`mailto:${activeConv.clientEmail}`" style="font-size: 12px; color: var(--zima-text-muted); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">{{ activeConv.clientEmail }}</a>
        <div style="display: flex; align-items: center; gap: 4px;">
          <Icon :name="CHANNEL_ICON[activeConv.channel].icon" style="width: 12px; height: 12px;" :style="{ color: CHANNEL_ICON[activeConv.channel].color }" />
          <span style="font-size: 11px; color: var(--zima-text-muted);">{{ CHANNEL_ICON[activeConv.channel].label }}</span>
        </div>
        <button
          style="font-size: 12px; color: var(--zima-blue-core); background: none; border: none; cursor: pointer; padding: 0;"
          @click="openClientProfile()"
        >
          Ver ficha completa →
        </button>
      </div>

      <!-- Métricas 2x2 -->
      <div style="padding: 16px; border-bottom: 1px solid rgba(148,163,184,0.08);">
        <div class="grid grid-cols-2 gap-3">
          <div style="background: rgba(148,163,184,0.05); border-radius: 8px; padding: 12px;">
            <div style="font-size: 10px; color: var(--zima-text-disabled); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Cliente desde</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary);">{{ activeConv.clientSince }}</div>
          </div>
          <div style="background: rgba(148,163,184,0.05); border-radius: 8px; padding: 12px;">
            <div style="font-size: 10px; color: var(--zima-text-disabled); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Visitas</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--zima-text-secondary);">{{ activeConv.clientVisits }}</div>
          </div>
          <div style="background: rgba(148,163,184,0.05); border-radius: 8px; padding: 12px; grid-column: span 2;">
            <div style="font-size: 10px; color: var(--zima-text-disabled); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Total gasto</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--zima-success);">{{ activeConv.clientTotalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</div>
          </div>
        </div>
      </div>

      <!-- Próximo agendamento -->
      <div style="padding: 16px; border-bottom: 1px solid rgba(148,163,184,0.08);">
        <div style="font-size: 11px; font-weight: 600; color: var(--zima-text-disabled); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">Próximo agendamento</div>
        <div v-if="nextAppointment">
          <div style="background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.15); border-radius: 8px; padding: 10px;">
            <div style="font-size: 13px; font-weight: 500; color: var(--zima-text-primary); margin-bottom: 2px;">{{ nextAppointment.serviceName }}</div>
            <div style="font-size: 12px; color: var(--zima-text-muted); margin-bottom: 6px;">{{ nextAppointment.date }} às {{ nextAppointment.startTime }} · {{ nextAppointment.professionalName }}</div>
            <div class="flex gap-2">
              <button
                v-if="nextAppointment.status === 'PENDING'"
                :disabled="confirmingAppointment"
                style="font-size: 11px; padding: 3px 8px; border-radius: 4px; background: var(--zima-success-subtle); color: var(--zima-success); border: none; cursor: pointer;"
                @click="confirmNextAppointment"
              >Confirmar</button>
              <button
                style="font-size: 11px; padding: 3px 8px; border-radius: 4px; background: rgba(148,163,184,0.1); color: var(--zima-text-secondary); border: none; cursor: pointer;"
                @click="rescheduleNextAppointment"
              >Reagendar</button>
            </div>
          </div>
        </div>
        <div v-else style="text-align: center; padding: 8px 0;">
          <p style="font-size: 12px; color: var(--zima-text-disabled); margin: 0 0 8px;">Sem agendamentos futuros</p>
          <ZimaButton variant="ghost" size="sm" @click="openAgendamento">
            <template #icon-left><Icon name="i-lucide-calendar-plus" style="width: 13px; height: 13px;" /></template>
            Agendar
          </ZimaButton>
        </div>
      </div>

      <!-- Últimos atendimentos -->
      <div style="padding: 16px; border-bottom: 1px solid rgba(148,163,184,0.08);">
        <div style="font-size: 11px; font-weight: 600; color: var(--zima-text-disabled); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">Últimos atendimentos</div>
        <div v-if="recentAppointments.length === 0" style="font-size: 12px; color: var(--zima-text-disabled); text-align: center; padding: 8px 0;">Nenhum atendimento</div>
        <div
          v-for="apt in recentAppointments"
          :key="apt.id"
          style="margin-bottom: 6px; cursor: pointer;"
          @click="expandedAptId = expandedAptId === apt.id ? null : apt.id"
        >
          <div class="flex items-center justify-between" style="padding: 6px 0;">
            <div>
              <div style="font-size: 12px; color: var(--zima-text-secondary);">{{ apt.serviceName }}</div>
              <div style="font-size: 11px; color: var(--zima-text-disabled);">{{ apt.date }} · R$ {{ apt.price }}</div>
            </div>
            <Icon :name="expandedAptId === apt.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" style="width: 12px; height: 12px; color: var(--zima-text-disabled);" />
          </div>
          <div v-if="expandedAptId === apt.id" style="padding: 6px 10px; background: rgba(148,163,184,0.05); border-radius: 6px; font-size: 11px; color: var(--zima-text-muted);">
            {{ apt.professionalName }} · {{ apt.status }}
          </div>
        </div>
      </div>

      <!-- Notas internas -->
      <div style="padding: 16px; border-bottom: 1px solid rgba(148,163,184,0.08);">
        <div style="font-size: 11px; font-weight: 600; color: var(--zima-text-disabled); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">Notas internas</div>
        <div style="display: flex; gap: 6px; margin-bottom: 10px;">
          <input
            v-model="newNoteInput"
            placeholder="Adicionar nota..."
            style="flex: 1; padding: 6px 10px; background: rgba(148,163,184,0.06); border: 1px solid rgba(148,163,184,0.1); border-radius: 6px; color: var(--zima-text-secondary); font-size: 12px; outline: none;"
            @keydown.enter="addNote"
          >
        </div>
        <div
          v-for="note in internalNotes"
          :key="note.id"
          style="background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.1); border-radius: 6px; padding: 8px; margin-bottom: 6px;"
        >
          <div style="font-size: 11px; color: var(--zima-warning); font-weight: 500; margin-bottom: 2px;">{{ note.author }}</div>
          <div style="font-size: 12px; color: var(--zima-text-secondary);">{{ note.text }}</div>
        </div>
      </div>

      <!-- Tags -->
      <div style="padding: 16px;">
        <div style="font-size: 11px; font-weight: 600; color: var(--zima-text-disabled); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">Tags do Cliente</div>
        <div class="flex flex-wrap gap-2" style="margin-bottom: 8px;">
          <span
            v-for="tag in clientTagsLocal"
            :key="tag"
            class="flex items-center gap-1"
            style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: var(--zima-blue-subtle); color: var(--zima-blue-light);"
          >
            {{ tag }}
            <button style="background: none; border: none; cursor: pointer; color: var(--zima-blue-light); padding: 0; line-height: 1;" @click="removeTag(tag)">×</button>
          </span>
        </div>
        <input
          v-model="newTagInput"
          placeholder="Adicionar tag..."
          style="width: 100%; box-sizing: border-box; padding: 6px 10px; background: rgba(148,163,184,0.06); border: 1px solid rgba(148,163,184,0.1); border-radius: 6px; color: var(--zima-text-secondary); font-size: 12px; outline: none;"
          @keydown.enter="addTag"
        >
      </div>
    </aside>
  </div>

  <!-- Modal devolver para IA -->
  <ZimaModal v-model="returnToAiOpen" title="Devolver para IA" size="sm">
    <p style="font-size: 14px; color: var(--zima-text-secondary); margin: 0;">
      A IA voltará a responder automaticamente. Você tem certeza?
    </p>
    <template #footer="{ close }">
      <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
      <ZimaButton @click="confirmReturnToAI">Confirmar</ZimaButton>
    </template>
  </ZimaModal>

  <!-- Modal nova conversa -->
  <ModalNovaConversa v-model="newConvOpen" @created="handleConvCreated" />

  <!-- Modal novo agendamento -->
  <ModalNovoAgendamento v-model="agendamentoOpen" :prefill="agendamentoPrefill" />

  <!-- Confirmação de (des)bloqueio de contato -->
  <ZimaModal v-model="blockDialogOpen" :title="activeConv?.blocked ? 'Desbloquear contato' : 'Bloquear contato'" size="sm">
    <div style="font-size: 13px; color: var(--zima-text-primary); line-height: 1.6;">
      <p v-if="activeConv?.blocked">
        Desbloquear <strong>{{ activeConv.clientName }}</strong>? Mensagens voltarão a ser recebidas normalmente.
      </p>
      <p v-else>
        Bloquear <strong>{{ activeConv?.clientName }}</strong>? Novas mensagens desse contato serão ignoradas até você desbloquear.
      </p>
    </div>
    <template #footer>
      <ZimaButton variant="ghost" @click="blockDialogOpen = false">Cancelar</ZimaButton>
      <ZimaButton :variant="activeConv?.blocked ? 'primary' : 'danger'" @click="confirmToggleBlock">
        {{ activeConv?.blocked ? 'Desbloquear' : 'Bloquear' }}
      </ZimaButton>
    </template>
  </ZimaModal>
</template>

<style scoped>
/* ─── Layout raiz ───────────────────────────────────────────────────────────── */
.msgs-root {
  display: flex;
  /* Escapa do padding do content-wrapper (24px) e usa toda a altura disponível */
  margin: calc(-1 * var(--zima-content-padding));
  height: calc(100dvh - var(--zima-topbar-height) - 2 * var(--zima-content-padding));
  overflow: hidden;
  background: var(--zima-bg-base);
}

/* ─── Coluna A: Lista de conversas ─────────────────────────────────────────── */
.msgs-sidebar {
  width: 320px;
  min-width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--zima-bg-surface-1);
  border-right: 1px solid rgba(148, 163, 184, 0.08);
  overflow: hidden;
  transition: width 200ms ease;
}
.msgs-sidebar--hidden { display: none; }

.msgs-conv-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* ─── Coluna B: Chat ────────────────────────────────────────────────────────── */
.msgs-chat {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--zima-bg-base);
  overflow: hidden;
}
.msgs-chat--hidden { display: none; }

.msgs-chat-header {
  flex-shrink: 0;
  min-height: 56px;
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 10px;
  background: var(--zima-bg-surface-1);
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  overflow: hidden;
}

.msgs-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.msgs-input-bar {
  flex-shrink: 0;
  padding: 14px 18px;
  background: var(--zima-bg-surface-1);
  border-top: 1px solid rgba(148, 163, 184, 0.08);
}

/* ─── Coluna C: Painel de info ──────────────────────────────────────────────── */
.msgs-info {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--zima-bg-surface-1);
  border-left: 1px solid rgba(148, 163, 184, 0.08);
  overflow-y: auto;
  transition: width 200ms ease, opacity 200ms ease;
}
.msgs-info--hidden   { display: none; }
.msgs-info--collapsed { width: 0; overflow: hidden; opacity: 0; pointer-events: none; }

.msgs-info-profile {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

/* ─── Breakpoints responsivos ───────────────────────────────────────────────── */

/* Tablet: 768px–1023px — 2 colunas (lista + chat), info some por padrão */
@media (max-width: 1023px) {
  .msgs-sidebar { width: 260px; min-width: 220px; }
  .msgs-info:not(.msgs-info--tablet-open) { display: none; }
  .msgs-chat-header { padding: 8px 12px; }
  .msgs-messages    { padding: 16px 16px; }
  .msgs-input-bar   { padding: 12px 12px; }
}

/* Mobile: <768px — uma coluna visível por vez */
@media (max-width: 767px) {
  .msgs-root { position: relative; }

  .msgs-sidebar {
    position: absolute;
    inset: 0;
    width: 100%;
    z-index: 1;
  }

  .msgs-chat {
    position: absolute;
    inset: 0;
    z-index: 2;
  }

  .msgs-info {
    position: absolute;
    inset: 0;
    width: 100%;
    z-index: 3;
  }

  .msgs-chat-header { padding: 8px 12px; }
  .msgs-messages    { padding: 16px 14px; }
  .msgs-input-bar   { padding: 12px 14px; }
}

/* ─── Utilitários ───────────────────────────────────────────────────────────── */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.fade-enter-active, .fade-leave-active { transition: opacity 200ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
</style>
