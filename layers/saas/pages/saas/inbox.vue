<script setup lang="ts">
import type { Conversation, InboxMessage } from '../../composables/useInbox'
import { useInbox } from '../../composables/useInbox'
import ModalNovaConversa from './ModalNovaConversa.vue'
import ModalNovoAgendamento from './ModalNovoAgendamento.vue'

definePageMeta({ layout: 'saas' })

const toast = useZimaToast()
const {
  conversations, loading, fetchAll,
  assumeConversation, returnToAI, resolveConversation,
  sendMessage, markAsRead, totalUnread, waitingCount,
} = useInbox()
const { appointments, fetchAll: fetchAppointments } = useAppointments()

onMounted(async () => {
  await Promise.all([fetchAll(), fetchAppointments()])
})

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
  nextTick(() => scrollToBottom())
}

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  AI: '#3B82F6', WAITING: '#F59E0B', HUMAN: '#10B981', RESOLVED: '#475569',
}
const STATUS_LABEL: Record<string, string> = {
  AI: '🤖 IA respondendo', WAITING: '⏳ Aguardando atendente', HUMAN: '👤 Você está atendendo', RESOLVED: '✅ Resolvida',
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
}

const messagesWithSeparators = computed<MessageOrSeparator[]>(() => {
  if (!activeConv.value) return []
  const items: MessageOrSeparator[] = []
  let lastDay = ''
  for (const msg of activeConv.value.messages) {
    const day = new Date(msg.timestamp).toDateString()
    if (day !== lastDay) {
      items.push({ type: 'separator', label: formatDayLabel(msg.timestamp) })
      lastDay = day
    }
    items.push({ type: 'message', message: msg })
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

// Modal resolver
const resolveOpen = ref(false)
const resolveReason = ref<string | null>('Atendimento concluído')
const resolveOptions = [
  { label: 'Atendimento concluído', value: 'Atendimento concluído' },
  { label: 'Agendamento realizado', value: 'Agendamento realizado' },
  { label: 'Venda efetuada', value: 'Venda efetuada' },
  { label: 'Dúvida respondida', value: 'Dúvida respondida' },
  { label: 'Spam', value: 'Spam' },
  { label: 'Outro', value: 'Outro' },
]
const resolvingLoading = ref(false)
const handleResolve = () => { resolveOpen.value = true }
const confirmResolve = async () => {
  if (!activeConvId.value || !resolveReason.value) return
  resolvingLoading.value = true
  await new Promise(r => setTimeout(r, 400))
  resolveConversation(activeConvId.value, resolveReason.value)
  resolveOpen.value = false
  resolvingLoading.value = false
  activeConvId.value = null
  toast.success('Conversa marcada como resolvida')
}

// Menu mais opções
const moreMenuOpen = ref(false)

// ── Input de mensagem ─────────────────────────────────────────────────────────
const messageInput = ref('')
const replyTo = ref<InboxMessage | null>(null)
const attachOpen = ref(false)
const quickRepliesOpen = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const QUICK_REPLIES = [
  { title: 'Horário de funcionamento', text: 'Nosso horário é de segunda a sexta, 08:00 às 18:00, e sábado, 09:00 às 14:00.' },
  { title: 'Confirmação de agendamento', text: 'Seu agendamento está confirmado! Qualquer dúvida é só nos chamar. Até lá! 😊' },
  { title: 'Preços de serviços', text: 'Nossos valores: Corte Feminino R$ 80, Corte Masculino R$ 45, Coloração a partir de R$ 150, Escova Progressiva R$ 180.' },
]

const quickReplySearch = ref('')
const filteredQuickReplies = computed(() =>
  QUICK_REPLIES.filter(r =>
    !quickReplySearch.value ||
    r.title.toLowerCase().includes(quickReplySearch.value.toLowerCase()) ||
    r.text.toLowerCase().includes(quickReplySearch.value.toLowerCase()),
  ),
)

const selectQuickReply = (text: string) => {
  messageInput.value = text
  quickRepliesOpen.value = false
  nextTick(() => textareaRef.value?.focus())
}

const ATTACH_OPTIONS = [
  { icon: 'i-lucide-image', label: 'Imagem', color: '#3B82F6' },
  { icon: 'i-lucide-paperclip', label: 'Documento', color: '#8B5CF6' },
  { icon: 'i-lucide-map-pin', label: 'Localização', color: '#EF4444' },
  { icon: 'i-lucide-layout-grid', label: 'Catálogo de serviços', color: '#F59E0B' },
  { icon: 'i-lucide-calendar', label: 'Link de agendamento', color: '#10B981' },
]

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

// Notas internas (mock local)
const internalNotes = ref<{ id: string; author: string; text: string; at: string }[]>([
  { id: 'note-1', author: 'Ana Costa', text: 'Cliente prefere atendimento pela manhã.', at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'note-2', author: 'Você', text: 'Alergias a produtos com amônia.', at: new Date(Date.now() - 86400000).toISOString() },
])
const newNoteInput = ref('')
const addNote = () => {
  if (!newNoteInput.value.trim()) return
  internalNotes.value.unshift({
    id: `note-${Date.now()}`,
    author: 'Você',
    text: newNoteInput.value.trim(),
    at: new Date().toISOString(),
  })
  newNoteInput.value = ''
}

// Tags do cliente (mock)
const clientTagsLocal = ref<string[]>([])
watch(activeConv, (conv) => {
  clientTagsLocal.value = conv ? [...conv.clientTags] : []
}, { immediate: true })

const newTagInput = ref('')
const addTag = () => {
  const tag = newTagInput.value.trim()
  if (!tag || clientTagsLocal.value.includes(tag)) return
  clientTagsLocal.value.push(tag)
  newTagInput.value = ''
}
const removeTag = (tag: string) => {
  clientTagsLocal.value = clientTagsLocal.value.filter(t => t !== tag)
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
  <!-- Full-width override — cancela o padding do layout pai -->
  <div
    style="
      display: flex;
      margin: -24px;
      height: calc(100vh - var(--zima-topbar-height));
      overflow: hidden;
    "
  >
    <!-- ══════════════════════ PAINEL ESQUERDO ══════════════════════ -->
    <div
      style="
        width: 320px; flex-shrink: 0; display: flex; flex-direction: column;
        background: #0C1017;
        border-right: 1px solid rgba(148,163,184,0.08);
        overflow: hidden;
      "
    >
      <!-- Header -->
      <div style="padding: 16px 16px 12px; flex-shrink: 0;">
        <div class="flex items-center justify-between" style="margin-bottom: 12px;">
          <div class="flex items-center gap-2">
            <span style="font-size: 16px; font-weight: 700; color: #F1F5F9;">Inbox</span>
            <span
              v-if="totalUnread > 0"
              style="
                background: #EF4444; color: #fff; border-radius: 9999px;
                font-size: 11px; font-weight: 600; padding: 1px 7px; line-height: 18px;
              "
            >{{ totalUnread }}</span>
          </div>
          <button
            style="
              width: 30px; height: 30px; border-radius: 6px; border: none;
              background: rgba(148,163,184,0.08); cursor: pointer;
              display: flex; align-items: center; justify-content: center;
              color: #94A3B8; transition: background 150ms;
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
            width: 100%; box-sizing: border-box; padding: 7px 12px;
            background: #111520; border: 1px solid rgba(148,163,184,0.1);
            border-radius: 8px; color: #94A3B8; font-size: 13px; outline: none;
          "
        />
      </div>

      <!-- Filtros de status (chips) -->
      <div
        style="
          display: flex; gap: 6px; padding: 0 12px 10px;
          overflow-x: auto; flex-shrink: 0;
        "
        class="hide-scrollbar"
      >
        <button
          v-for="f in FILTERS"
          :key="f"
          style="
            flex-shrink: 0; padding: 4px 10px; border-radius: 9999px;
            font-size: 12px; font-weight: 500; cursor: pointer; transition: all 150ms; white-space: nowrap;
          "
          :style="{
            background: activeFilter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: activeFilter === f ? '#60A5FA' : '#94A3B8',
            border: activeFilter === f ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
          }"
          @click="activeFilter = f"
        >
          {{ f }}
          <span v-if="f === 'Aguardando' && waitingCount > 0" style="margin-left: 4px; background: #F59E0B; color: #000; border-radius: 9999px; padding: 0 5px; font-size: 10px;">{{ waitingCount }}</span>
        </button>
      </div>

      <!-- Filtro de canal (ícones) -->
      <div style="display: flex; gap: 8px; padding: 0 12px 10px; flex-shrink: 0;">
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
      <div style="flex: 1; overflow-y: auto;" class="hide-scrollbar">
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
          <Icon name="i-lucide-message-circle" style="width: 40px; height: 40px; color: #334155; margin-bottom: 12px;" />
          <p style="font-size: 13px; color: #475569; margin: 0;">Nenhuma conversa encontrada</p>
        </div>

        <template v-else>
          <!-- Separador AGUARDANDO -->
          <template v-if="waitingConvs.length > 0 && activeFilter === 'Todas'">
            <div style="padding: 6px 16px; font-size: 10px; font-weight: 700; color: #F59E0B; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(245,158,11,0.05); border-bottom: 1px solid rgba(245,158,11,0.1);">
              AGUARDANDO ATENÇÃO ({{ waitingConvs.length }})
            </div>
            <div
              v-for="conv in waitingConvs"
              :key="conv.id"
              style="
                padding: 12px 14px; cursor: pointer; position: relative;
                border-bottom: 1px solid rgba(148,163,184,0.05); transition: background 150ms;
                display: flex; align-items: flex-start; gap: 10px;
              "
              :style="{
                background: activeConvId === conv.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                borderLeft: activeConvId === conv.id ? '2px solid #3B82F6' : '2px solid transparent',
              }"
              @click="selectConversation(conv.id)"
              @mouseenter="(e: MouseEvent) => { if (activeConvId !== conv.id) (e.currentTarget as HTMLElement).style.background = '#1A2030' }"
              @mouseleave="(e: MouseEvent) => { if (activeConvId !== conv.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }"
            >
              <!-- Dot status -->
              <div style="width: 8px; height: 8px; border-radius: 9999px; flex-shrink: 0; margin-top: 16px;" :style="{ background: STATUS_DOT[conv.status] }" />
              <!-- Avatar -->
              <ZimaAvatar :name="conv.clientName" size="sm" />
              <!-- Conteúdo -->
              <div style="flex: 1; min-width: 0;">
                <div class="flex items-center justify-between" style="margin-bottom: 2px;">
                  <span style="font-size: 13px; font-weight: 600; color: #F1F5F9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;">{{ conv.clientName }}</span>
                  <span style="font-size: 11px; color: #64748B; flex-shrink: 0;">{{ formatRelativeTime(conv.lastMessageAt) }}</span>
                </div>
                <p style="font-size: 12px; color: #94A3B8; margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ conv.lastMessage }}</p>
                <div class="flex items-center gap-2">
                  <Icon :name="CHANNEL_ICON[conv.channel].icon" style="width: 13px; height: 13px;" :style="{ color: CHANNEL_ICON[conv.channel].color }" />
                  <span style="font-size: 11px; padding: 1px 6px; border-radius: 4px; background: rgba(245,158,11,0.15); color: #F59E0B;">⏳ Aguardando</span>
                  <span v-if="conv.unreadCount > 0" style="margin-left: auto; background: #3B82F6; color: #fff; border-radius: 9999px; font-size: 10px; font-weight: 700; padding: 1px 6px; min-width: 18px; text-align: center;">{{ conv.unreadCount }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Resto das conversas -->
          <div
            v-for="conv in (activeFilter === 'Todas' ? nonWaitingConvs : filteredConversations)"
            :key="conv.id"
            style="
              padding: 12px 14px; cursor: pointer; position: relative;
              border-bottom: 1px solid rgba(148,163,184,0.05); transition: background 150ms;
              display: flex; align-items: flex-start; gap: 10px;
            "
            :style="{
              background: activeConvId === conv.id ? 'rgba(59,130,246,0.08)' : 'transparent',
              borderLeft: activeConvId === conv.id ? '2px solid #3B82F6' : '2px solid transparent',
            }"
            @click="selectConversation(conv.id)"
            @mouseenter="(e: MouseEvent) => { if (activeConvId !== conv.id) (e.currentTarget as HTMLElement).style.background = '#1A2030' }"
            @mouseleave="(e: MouseEvent) => { if (activeConvId !== conv.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }"
          >
            <div style="width: 8px; height: 8px; border-radius: 9999px; flex-shrink: 0; margin-top: 16px;" :style="{ background: STATUS_DOT[conv.status] }" />
            <ZimaAvatar :name="conv.clientName" size="sm" />
            <div style="flex: 1; min-width: 0;">
              <div class="flex items-center justify-between" style="margin-bottom: 2px;">
                <span style="font-size: 13px; font-weight: 600; color: #F1F5F9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;">{{ conv.clientName }}</span>
                <span style="font-size: 11px; color: #64748B; flex-shrink: 0;">{{ formatRelativeTime(conv.lastMessageAt) }}</span>
              </div>
              <p style="font-size: 12px; color: #94A3B8; margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {{ conv.lastMessageType === 'image' ? '📷 Foto' : conv.lastMessageType === 'audio' ? '🎤 Áudio' : conv.lastMessageType === 'document' ? '📎 Documento' : conv.lastMessage }}
              </p>
              <div class="flex items-center gap-2">
                <Icon :name="CHANNEL_ICON[conv.channel].icon" style="width: 13px; height: 13px;" :style="{ color: CHANNEL_ICON[conv.channel].color }" />
                <span
                  style="font-size: 11px; padding: 1px 6px; border-radius: 4px;"
                  :style="{
                    background: conv.status === 'AI' ? 'rgba(99,102,241,0.15)' : conv.status === 'HUMAN' ? 'rgba(16,185,129,0.15)' : conv.status === 'RESOLVED' ? 'rgba(71,85,105,0.2)' : 'rgba(245,158,11,0.15)',
                    color: conv.status === 'AI' ? '#818CF8' : conv.status === 'HUMAN' ? '#10B981' : conv.status === 'RESOLVED' ? '#64748B' : '#F59E0B',
                  }"
                >
                  {{ conv.status === 'AI' ? '🤖 IA' : conv.status === 'HUMAN' ? '👤 Humano' : conv.status === 'RESOLVED' ? '✅ Resolvida' : '⏳ Aguardando' }}
                </span>
                <span v-if="conv.unreadCount > 0" style="margin-left: auto; background: #3B82F6; color: #fff; border-radius: 9999px; font-size: 10px; font-weight: 700; padding: 1px 6px; min-width: 18px; text-align: center;">{{ conv.unreadCount }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ══════════════════════ PAINEL CENTRAL ══════════════════════ -->
    <div style="flex: 1; display: flex; flex-direction: column; background: #07090E; overflow: hidden; min-width: 0;">

      <!-- Empty state quando sem conversa selecionada -->
      <div v-if="!activeConv" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #334155;">
        <Icon name="i-lucide-message-square" style="width: 56px; height: 56px;" />
        <p style="font-size: 15px; font-weight: 500; margin: 0;">Selecione uma conversa</p>
        <p style="font-size: 13px; color: #1E293B; margin: 0;">Escolha uma conversa na lista ao lado para começar a atender</p>
      </div>

      <template v-else>
        <!-- ── Header da conversa ── -->
        <div
          style="
            height: 56px; flex-shrink: 0; display: flex; align-items: center;
            padding: 0 16px; gap: 12px;
            background: #0C1017; border-bottom: 1px solid rgba(148,163,184,0.08);
          "
        >
          <!-- Esquerda: info do cliente -->
          <ZimaAvatar :name="activeConv.clientName" size="sm" />
          <div style="flex: 1; min-width: 0;">
            <div class="flex items-center gap-2">
              <span style="font-size: 15px; font-weight: 600; color: #F1F5F9;">{{ activeConv.clientName }}</span>
              <Icon
                :name="CHANNEL_ICON[activeConv.channel].icon"
                style="width: 14px; height: 14px;"
                :style="{ color: CHANNEL_ICON[activeConv.channel].color }"
              />
            </div>
            <div style="font-size: 11px; color: #64748B;">
              {{ activeConv.clientPhone }} · Cliente desde {{ activeConv.clientSince }}
            </div>
          </div>

          <!-- Centro: badge de status -->
          <span
            style="font-size: 12px; padding: 3px 10px; border-radius: 9999px; font-weight: 500; white-space: nowrap;"
            :style="{
              background: activeConv.status === 'AI' ? 'rgba(99,102,241,0.15)' : activeConv.status === 'HUMAN' ? 'rgba(16,185,129,0.15)' : activeConv.status === 'RESOLVED' ? 'rgba(71,85,105,0.2)' : 'rgba(245,158,11,0.15)',
              color: activeConv.status === 'AI' ? '#818CF8' : activeConv.status === 'HUMAN' ? '#10B981' : activeConv.status === 'RESOLVED' ? '#64748B' : '#F59E0B',
            }"
          >
            {{ STATUS_LABEL[activeConv.status] }}
          </span>

          <!-- Direita: botões de ação -->
          <div class="flex items-center gap-2">
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
            <ZimaButton
              v-if="activeConv.status !== 'RESOLVED'"
              variant="ghost"
              size="sm"
              @click="handleResolve"
            >
              <template #icon-left>
                <Icon name="i-lucide-check-circle" style="width: 14px; height: 14px;" />
              </template>
              Resolver
            </ZimaButton>

            <!-- Menu mais opções -->
            <div style="position: relative;">
              <button
                style="width: 30px; height: 30px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.12); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748B;"
                @click="moreMenuOpen = !moreMenuOpen"
              >
                <Icon name="i-lucide-more-vertical" style="width: 15px; height: 15px;" />
              </button>
              <div v-if="moreMenuOpen" style="position: fixed; inset: 0; z-index: 40;" @click="moreMenuOpen = false" />
              <div
                v-if="moreMenuOpen"
                style="
                  position: absolute; right: 0; top: 36px; z-index: 50;
                  background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default);
                  border-radius: var(--zima-radius-md); padding: 4px; min-width: 200px;
                  box-shadow: var(--zima-shadow-md);
                "
              >
                <button
                  v-for="opt in [
                    { label: 'Agendar follow-up', icon: 'i-lucide-clock' },
                    { label: 'Bloquear contato', icon: 'i-lucide-ban' },
                    { label: 'Exportar conversa', icon: 'i-lucide-download' },
                  ]"
                  :key="opt.label"
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                  @click="toast.info(`${opt.label} em breve`); moreMenuOpen = false"
                >
                  <Icon :name="opt.icon" style="width: 13px; height: 13px;" />
                  {{ opt.label }}
                </button>
                <div style="height: 1px; background: var(--zima-border-divider); margin: 4px 0;" />
                <button
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-blue-core); cursor: pointer; display: flex; align-items: center; gap: 8px;"
                  @click="window.open(`/saas/clientes/${activeConv.clientId}`, '_blank'); moreMenuOpen = false"
                >
                  <Icon name="i-lucide-external-link" style="width: 13px; height: 13px;" />
                  Ver ficha do cliente
                </button>
              </div>
            </div>

            <!-- Toggle painel direito -->
            <button
              style="width: 30px; height: 30px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.12); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;"
              :style="{ color: rightPanelVisible ? '#60A5FA' : '#64748B' }"
              @click="rightPanelVisible = !rightPanelVisible"
            >
              <Icon name="i-lucide-panel-right" style="width: 15px; height: 15px;" />
            </button>
          </div>
        </div>

        <!-- ── Área de mensagens ── -->
        <div
          ref="messagesEl"
          style="flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 2px; position: relative;"
          class="hide-scrollbar"
          @scroll="onMessagesScroll"
        >
          <template v-for="item in messagesWithSeparators" :key="item.message?.id ?? item.label">
            <!-- Separador de data -->
            <div
              v-if="item.type === 'separator'"
              style="display: flex; align-items: center; justify-content: center; margin: 12px 0 8px;"
            >
              <span style="font-size: 11px; color: #475569; background: rgba(148,163,184,0.05); padding: 3px 12px; border-radius: 9999px;">
                {{ item.label }}
              </span>
            </div>

            <!-- Mensagem de sistema -->
            <div
              v-else-if="item.message?.sender === 'system'"
              style="display: flex; justify-content: center; margin: 6px 0;"
            >
              <span style="font-size: 11px; color: #475569; background: rgba(148,163,184,0.05); padding: 4px 12px; border-radius: 9999px;">
                {{ item.message.text }}
              </span>
            </div>

            <!-- Mensagem do cliente (esquerda) -->
            <div
              v-else-if="item.message?.sender === 'client'"
              style="display: flex; align-items: flex-end; gap: 8px; max-width: 65%; margin-bottom: 4px; position: relative;"
              @mouseenter="hoveredMsgId = item.message.id"
              @mouseleave="hoveredMsgId = null"
            >
              <div
                style="
                  padding: 10px 14px; border-radius: 12px 12px 12px 4px;
                  background: #161B28; max-width: 100%;
                "
              >
                <p style="font-size: 14px; color: #F1F5F9; margin: 0; word-break: break-word; white-space: pre-wrap;">{{ item.message.text }}</p>
                <div style="font-size: 10px; color: #475569; margin-top: 4px; text-align: right;">
                  {{ formatTime(item.message.timestamp) }}
                </div>
              </div>
              <!-- Ações hover -->
              <div
                v-if="hoveredMsgId === item.message.id"
                style="display: flex; gap: 4px; position: absolute; right: -64px; bottom: 8px;"
              >
                <button style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.15); background: #0C1017; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748B;" @click="copyMessage(item.message?.text)">
                  <Icon name="i-lucide-copy" style="width: 12px; height: 12px;" />
                </button>
                <button style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.15); background: #0C1017; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748B;" @click="setReply(item.message!)">
                  <Icon name="i-lucide-reply" style="width: 12px; height: 12px;" />
                </button>
              </div>
            </div>

            <!-- Mensagem da IA ou humano (direita) -->
            <div
              v-else-if="item.message"
              style="display: flex; flex-direction: column; align-items: flex-end; max-width: 65%; margin-left: auto; margin-bottom: 4px; position: relative;"
              @mouseenter="hoveredMsgId = item.message.id"
              @mouseleave="hoveredMsgId = null"
            >
              <!-- Badge IA -->
              <span
                v-if="item.message.sender === 'ai'"
                style="font-size: 10px; color: rgba(129,140,248,0.8); margin-bottom: 3px; margin-right: 4px;"
              >🤖 IA</span>
              <div
                style="padding: 10px 14px; border-radius: 12px 12px 4px 12px; max-width: 100%;"
                :style="{ background: 'rgba(59,130,246,0.12)' }"
              >
                <p style="font-size: 14px; color: #F1F5F9; margin: 0; word-break: break-word; white-space: pre-wrap;">{{ item.message.text }}</p>
                <div style="font-size: 10px; color: #475569; margin-top: 4px; text-align: right; display: flex; align-items: center; gap: 4px; justify-content: flex-end;">
                  <span>{{ item.message.senderName }} · {{ formatTime(item.message.timestamp) }}</span>
                  <span v-if="item.message.deliveryStatus === 'read'" style="color: #3B82F6;">✓✓</span>
                  <span v-else-if="item.message.deliveryStatus === 'delivered'" style="color: #64748B;">✓✓</span>
                  <span v-else-if="item.message.deliveryStatus === 'sent'" style="color: #64748B;">✓</span>
                </div>
              </div>
              <!-- Ações hover -->
              <div
                v-if="hoveredMsgId === item.message.id"
                style="display: flex; gap: 4px; position: absolute; left: -64px; bottom: 8px;"
              >
                <button style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.15); background: #0C1017; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748B;" @click="copyMessage(item.message?.text)">
                  <Icon name="i-lucide-copy" style="width: 12px; height: 12px;" />
                </button>
                <button style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(148,163,184,0.15); background: #0C1017; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748B;" @click="setReply(item.message!)">
                  <Icon name="i-lucide-reply" style="width: 12px; height: 12px;" />
                </button>
              </div>
            </div>
          </template>

          <!-- Indicador "IA está digitando" -->
          <div v-if="activeConv.status === 'AI'" style="display: flex; align-items: flex-end; gap: 8px; max-width: 65%; margin-top: 4px;">
            <div style="padding: 12px 16px; border-radius: 12px 12px 12px 4px; background: #161B28; display: flex; gap: 4px; align-items: center;">
              <div style="width: 6px; height: 6px; border-radius: 9999px; background: #475569;" :style="{ animation: 'typing-bounce 1.2s infinite', animationDelay: '0s' }" />
              <div style="width: 6px; height: 6px; border-radius: 9999px; background: #475569;" :style="{ animation: 'typing-bounce 1.2s infinite', animationDelay: '0.2s' }" />
              <div style="width: 6px; height: 6px; border-radius: 9999px; background: #475569;" :style="{ animation: 'typing-bounce 1.2s infinite', animationDelay: '0.4s' }" />
              <span style="font-size: 11px; color: #475569; margin-left: 4px;">IA está digitando...</span>
            </div>
          </div>
        </div>

        <!-- Botão "Nova mensagem" -->
        <Transition name="fade">
          <button
            v-if="userScrolled"
            style="
              position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
              background: #3B82F6; color: #fff; border: none; border-radius: 9999px;
              padding: 6px 16px; font-size: 12px; cursor: pointer; z-index: 10;
              box-shadow: 0 4px 12px rgba(59,130,246,0.4);
            "
            @click="scrollToBottom"
          >
            ↓ Nova mensagem
          </button>
        </Transition>

        <!-- ── Barra de input ── -->
        <div
          style="
            flex-shrink: 0; padding: 10px 14px;
            background: #0C1017; border-top: 1px solid rgba(148,163,184,0.08);
          "
        >
          <!-- Preview de reply -->
          <div
            v-if="replyTo"
            style="
              display: flex; align-items: center; gap-10px; padding: 6px 10px;
              background: rgba(59,130,246,0.08); border-radius: 6px; margin-bottom: 8px;
              border-left: 2px solid #3B82F6;
            "
          >
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 11px; color: #60A5FA; font-weight: 500; margin-bottom: 2px;">{{ replyTo.senderName ?? 'Cliente' }}</div>
              <div style="font-size: 12px; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ replyTo.text }}</div>
            </div>
            <button style="background: none; border: none; cursor: pointer; color: #64748B; margin-left: 8px; flex-shrink: 0;" @click="replyTo = null">
              <Icon name="i-lucide-x" style="width: 14px; height: 14px;" />
            </button>
          </div>

          <div class="flex items-end gap-2">
            <!-- Attachment -->
            <div style="position: relative;">
              <button
                style="width: 34px; height: 34px; border-radius: 8px; border: none; background: rgba(148,163,184,0.08); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748B; flex-shrink: 0;"
                @click="attachOpen = !attachOpen; quickRepliesOpen = false"
              >
                <Icon name="i-lucide-paperclip" style="width: 17px; height: 17px;" />
              </button>
              <div v-if="attachOpen" style="position: fixed; inset: 0; z-index: 40;" @click="attachOpen = false" />
              <div
                v-if="attachOpen"
                style="
                  position: absolute; bottom: 40px; left: 0; z-index: 50;
                  background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default);
                  border-radius: var(--zima-radius-md); padding: 4px; min-width: 200px;
                  box-shadow: var(--zima-shadow-md);
                "
              >
                <button
                  v-for="opt in ATTACH_OPTIONS"
                  :key="opt.label"
                  style="width: 100%; text-align: left; padding: 7px 10px; background: transparent; border: none; border-radius: 4px; font-size: 13px; color: var(--zima-text-primary); cursor: pointer; display: flex; align-items: center; gap: 10px;"
                  @click="toast.info(`${opt.label} em breve`); attachOpen = false"
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
                flex: 1; padding: 8px 12px; border-radius: 8px;
                background: rgba(148,163,184,0.06); border: 1px solid rgba(148,163,184,0.1);
                color: #F1F5F9; font-size: 14px; resize: none; outline: none;
                font-family: inherit; min-height: 36px; max-height: 160px;
                line-height: 1.4;
              "
              @keydown="handleKeydown"
              @input="resizeTextarea"
            />

            <!-- Respostas rápidas -->
            <div style="position: relative;">
              <button
                style="width: 34px; height: 34px; border-radius: 8px; border: none; background: rgba(148,163,184,0.08); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748B; flex-shrink: 0;"
                @click="quickRepliesOpen = !quickRepliesOpen; attachOpen = false"
              >
                <Icon name="i-lucide-zap" style="width: 17px; height: 17px;" />
              </button>
              <div v-if="quickRepliesOpen" style="position: fixed; inset: 0; z-index: 40;" @click="quickRepliesOpen = false" />
              <div
                v-if="quickRepliesOpen"
                style="
                  position: absolute; bottom: 40px; right: 0; z-index: 50;
                  background: var(--zima-bg-surface-2); border: 1px solid var(--zima-border-default);
                  border-radius: var(--zima-radius-md); padding: 8px; width: 300px;
                  box-shadow: var(--zima-shadow-md);
                "
              >
                <input
                  v-model="quickReplySearch"
                  placeholder="Buscar resposta rápida..."
                  style="width: 100%; box-sizing: border-box; padding: 6px 10px; background: var(--zima-bg-surface-3); border: 1px solid var(--zima-border-default); border-radius: 6px; color: var(--zima-text-primary); font-size: 12px; outline: none; margin-bottom: 6px;"
                />
                <div v-for="qr in filteredQuickReplies" :key="qr.title">
                  <button
                    style="width: 100%; text-align: left; padding: 8px 10px; background: transparent; border: none; border-radius: 6px; cursor: pointer; transition: background 150ms;"
                    @click="selectQuickReply(qr.text)"
                    @mouseenter="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-3)')"
                    @mouseleave="(e: MouseEvent) => ((e.currentTarget as HTMLElement).style.background = 'transparent')"
                  >
                    <div style="font-size: 12px; font-weight: 500; color: var(--zima-text-primary); margin-bottom: 2px;">{{ qr.title }}</div>
                    <div style="font-size: 11px; color: var(--zima-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ qr.text }}</div>
                  </button>
                </div>
                <div style="height: 1px; background: var(--zima-border-divider); margin: 6px 0;" />
                <button
                  style="width: 100%; text-align: left; padding: 6px 10px; background: transparent; border: none; font-size: 12px; color: var(--zima-blue-core); cursor: pointer;"
                  @click="toast.info('Gerenciar respostas rápidas em breve'); quickRepliesOpen = false"
                >
                  Gerenciar respostas →
                </button>
              </div>
            </div>

            <!-- Agendar -->
            <button
              style="width: 34px; height: 34px; border-radius: 8px; border: none; background: rgba(148,163,184,0.08); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748B; flex-shrink: 0;"
              title="Criar agendamento"
              @click="openAgendamento"
            >
              <Icon name="i-lucide-calendar" style="width: 17px; height: 17px;" />
            </button>

            <!-- Enviar -->
            <button
              style="width: 34px; height: 34px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 150ms;"
              :style="{
                background: messageInput.trim() ? '#3B82F6' : 'rgba(148,163,184,0.08)',
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
    </div>

    <!-- ══════════════════════ PAINEL DIREITO ══════════════════════ -->
    <div
      v-if="rightPanelVisible && activeConv"
      style="
        width: 300px; flex-shrink: 0; display: flex; flex-direction: column;
        background: #0C1017;
        border-left: 1px solid rgba(148,163,184,0.08);
        overflow-y: auto;
      "
      class="hide-scrollbar"
    >
      <!-- Perfil -->
      <div style="padding: 20px 16px; border-bottom: 1px solid rgba(148,163,184,0.08); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px;">
        <ZimaAvatar :name="activeConv.clientName" size="lg" />
        <div style="font-size: 15px; font-weight: 600; color: #F1F5F9;">{{ activeConv.clientName }}</div>
        <!-- Tags -->
        <div class="flex flex-wrap gap-1 justify-center">
          <span
            v-for="tag in clientTagsLocal"
            :key="tag"
            style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: rgba(59,130,246,0.1); color: #60A5FA; cursor: pointer;"
            @click="removeTag(tag)"
          >
            {{ tag }} ×
          </span>
        </div>
        <a :href="`tel:${activeConv.clientPhone}`" style="font-size: 12px; color: #64748B; text-decoration: none;">{{ activeConv.clientPhone }}</a>
        <a :href="`mailto:${activeConv.clientEmail}`" style="font-size: 12px; color: #64748B; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">{{ activeConv.clientEmail }}</a>
        <div style="display: flex; align-items: center; gap: 4px;">
          <Icon :name="CHANNEL_ICON[activeConv.channel].icon" style="width: 12px; height: 12px;" :style="{ color: CHANNEL_ICON[activeConv.channel].color }" />
          <span style="font-size: 11px; color: #64748B;">{{ CHANNEL_ICON[activeConv.channel].label }}</span>
        </div>
        <button
          style="font-size: 12px; color: #3B82F6; background: none; border: none; cursor: pointer; padding: 0;"
          @click="window.open(`/saas/clientes/${activeConv.clientId}`, '_blank')"
        >
          Ver ficha completa →
        </button>
      </div>

      <!-- Métricas 2x2 -->
      <div style="padding: 14px 16px; border-bottom: 1px solid rgba(148,163,184,0.08);">
        <div class="grid grid-cols-2 gap-2">
          <div style="background: rgba(148,163,184,0.05); border-radius: 8px; padding: 10px;">
            <div style="font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px;">Cliente desde</div>
            <div style="font-size: 13px; font-weight: 600; color: #94A3B8;">{{ activeConv.clientSince }}</div>
          </div>
          <div style="background: rgba(148,163,184,0.05); border-radius: 8px; padding: 10px;">
            <div style="font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px;">Visitas</div>
            <div style="font-size: 13px; font-weight: 600; color: #94A3B8;">{{ activeConv.clientVisits }}</div>
          </div>
          <div style="background: rgba(148,163,184,0.05); border-radius: 8px; padding: 10px; grid-column: span 2;">
            <div style="font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px;">Total gasto</div>
            <div style="font-size: 13px; font-weight: 600; color: #10B981;">{{ activeConv.clientTotalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</div>
          </div>
        </div>
      </div>

      <!-- Próximo agendamento -->
      <div style="padding: 14px 16px; border-bottom: 1px solid rgba(148,163,184,0.08);">
        <div style="font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;">Próximo agendamento</div>
        <div v-if="nextAppointment">
          <div style="background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.15); border-radius: 8px; padding: 10px;">
            <div style="font-size: 13px; font-weight: 500; color: #F1F5F9; margin-bottom: 2px;">{{ nextAppointment.serviceName }}</div>
            <div style="font-size: 12px; color: #64748B; margin-bottom: 6px;">{{ nextAppointment.date }} às {{ nextAppointment.startTime }} · {{ nextAppointment.professionalName }}</div>
            <div class="flex gap-2">
              <button
                v-if="nextAppointment.status === 'PENDING'"
                style="font-size: 11px; padding: 3px 8px; border-radius: 4px; background: rgba(16,185,129,0.15); color: #10B981; border: none; cursor: pointer;"
                @click="toast.success('Agendamento confirmado!')"
              >Confirmar</button>
              <button
                style="font-size: 11px; padding: 3px 8px; border-radius: 4px; background: rgba(148,163,184,0.1); color: #94A3B8; border: none; cursor: pointer;"
                @click="toast.info('Reagendar em breve')"
              >Reagendar</button>
            </div>
          </div>
        </div>
        <div v-else style="text-align: center; padding: 8px 0;">
          <p style="font-size: 12px; color: #475569; margin: 0 0 8px;">Sem agendamentos futuros</p>
          <ZimaButton variant="ghost" size="sm" @click="openAgendamento">
            <template #icon-left><Icon name="i-lucide-calendar-plus" style="width: 13px; height: 13px;" /></template>
            Agendar
          </ZimaButton>
        </div>
      </div>

      <!-- Últimos atendimentos -->
      <div style="padding: 14px 16px; border-bottom: 1px solid rgba(148,163,184,0.08);">
        <div style="font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;">Últimos atendimentos</div>
        <div v-if="recentAppointments.length === 0" style="font-size: 12px; color: #475569; text-align: center; padding: 8px 0;">Nenhum atendimento</div>
        <div
          v-for="apt in recentAppointments"
          :key="apt.id"
          style="margin-bottom: 6px; cursor: pointer;"
          @click="expandedAptId = expandedAptId === apt.id ? null : apt.id"
        >
          <div class="flex items-center justify-between" style="padding: 6px 0;">
            <div>
              <div style="font-size: 12px; color: #94A3B8;">{{ apt.serviceName }}</div>
              <div style="font-size: 11px; color: #475569;">{{ apt.date }} · R$ {{ apt.price }}</div>
            </div>
            <Icon :name="expandedAptId === apt.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" style="width: 12px; height: 12px; color: #475569;" />
          </div>
          <div v-if="expandedAptId === apt.id" style="padding: 6px 10px; background: rgba(148,163,184,0.05); border-radius: 6px; font-size: 11px; color: #64748B;">
            {{ apt.professionalName }} · {{ apt.status }}
          </div>
        </div>
      </div>

      <!-- Notas internas -->
      <div style="padding: 14px 16px; border-bottom: 1px solid rgba(148,163,184,0.08);">
        <div style="font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;">Notas internas</div>
        <div style="display: flex; gap: 6px; margin-bottom: 10px;">
          <input
            v-model="newNoteInput"
            placeholder="Adicionar nota..."
            style="flex: 1; padding: 6px 10px; background: rgba(148,163,184,0.06); border: 1px solid rgba(148,163,184,0.1); border-radius: 6px; color: #94A3B8; font-size: 12px; outline: none;"
            @keydown.enter="addNote"
          />
        </div>
        <div
          v-for="note in internalNotes"
          :key="note.id"
          style="background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.1); border-radius: 6px; padding: 8px; margin-bottom: 6px;"
        >
          <div style="font-size: 11px; color: #F59E0B; font-weight: 500; margin-bottom: 2px;">{{ note.author }}</div>
          <div style="font-size: 12px; color: #94A3B8;">{{ note.text }}</div>
        </div>
      </div>

      <!-- Tags -->
      <div style="padding: 14px 16px;">
        <div style="font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;">Tags do Cliente</div>
        <div class="flex flex-wrap gap-2" style="margin-bottom: 8px;">
          <span
            v-for="tag in clientTagsLocal"
            :key="tag"
            class="flex items-center gap-1"
            style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: rgba(59,130,246,0.1); color: #60A5FA;"
          >
            {{ tag }}
            <button style="background: none; border: none; cursor: pointer; color: #60A5FA; padding: 0; line-height: 1;" @click="removeTag(tag)">×</button>
          </span>
        </div>
        <input
          v-model="newTagInput"
          placeholder="Adicionar tag..."
          style="width: 100%; box-sizing: border-box; padding: 6px 10px; background: rgba(148,163,184,0.06); border: 1px solid rgba(148,163,184,0.1); border-radius: 6px; color: #94A3B8; font-size: 12px; outline: none;"
          @keydown.enter="addTag"
        />
      </div>
    </div>
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

  <!-- Modal resolver -->
  <ZimaModal v-model="resolveOpen" title="Resolver Conversa" size="sm">
    <div class="flex flex-col gap-4">
      <p style="font-size: 14px; color: var(--zima-text-secondary); margin: 0;">
        Marcar esta conversa como resolvida?
      </p>
      <ZimaSelect
        v-model="resolveReason"
        :options="resolveOptions"
        label="Motivo da resolução"
        placeholder="Selecione..."
      />
    </div>
    <template #footer="{ close }">
      <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
      <ZimaButton :loading="resolvingLoading" :disabled="!resolveReason" @click="confirmResolve">
        Confirmar
      </ZimaButton>
    </template>
  </ZimaModal>

  <!-- Modal nova conversa -->
  <ModalNovaConversa v-model="newConvOpen" @created="handleConvCreated" />

  <!-- Modal novo agendamento -->
  <ModalNovoAgendamento v-model="agendamentoOpen" :prefill="agendamentoPrefill" />
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.fade-enter-active, .fade-leave-active { transition: opacity 200ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
</style>
