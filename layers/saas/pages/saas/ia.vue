<script setup lang="ts">
import type { KnowledgeEntry, AIAgentConfig } from '../../composables/useAI'
import { useAI } from '../../composables/useAI'
import type { PhoneMessage } from '../../components/zima/ZimaPhonePreview.vue'

definePageMeta({ layout: 'saas' })

const route = useRoute()
const router = useRouter()
const toast = useZimaToast()

const {
  agentConfig, knowledgeEntries, convFlows, automations, dashboard,
  saveAgentConfig, addKnowledgeEntry, updateKnowledgeEntry, deleteKnowledgeEntry,
  toggleAutomation, addAutomation, addConvFlow, duplicateFlow, deleteFlow,
} = useAI()

// ── Active tab ────────────────────────────────────────────────────────────────
type TabKey = 'painel' | 'agente' | 'conhecimento' | 'fluxos' | 'automacoes'
const activeTab = ref<TabKey>((route.query.tab as TabKey) || 'painel')

const tabs = [
  { key: 'painel' as const, label: 'Painel' },
  { key: 'agente' as const, label: 'Agente de IA' },
  { key: 'conhecimento' as const, label: 'Base de Conhecimento' },
  { key: 'fluxos' as const, label: 'Fluxos de Conversa' },
  { key: 'automacoes' as const, label: 'Automações do Negócio' },
]

watch(activeTab, v => {
  router.replace({ query: { tab: v !== 'painel' ? v : undefined } })
})

// ── Painel ────────────────────────────────────────────────────────────────────
const hoveredBar = ref<number | null>(null)
const heatmapDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const chartMax = computed(() => Math.max(...dashboard.dailyData.map(d => d.ai + d.human)))

// ── Agente ────────────────────────────────────────────────────────────────────
const localConfig = reactive<AIAgentConfig>({ ...agentConfig.value })
// Sync with ref
watch(agentConfig, v => { Object.assign(localConfig, v) }, { deep: true })

const toneOptions = [
  { value: 'professional', label: 'Profissional e cordial' },
  { value: 'friendly', label: 'Amigável e descontraído' },
  { value: 'casual', label: 'Casual e jovem' },
  { value: 'formal', label: 'Formal e respeitoso' },
  { value: 'custom', label: 'Personalizado' },
]

const emojiFreqOptions = [
  { value: 'low', label: 'Pouco' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'high', label: 'Bastante' },
]

const langOptions = [
  { value: 'pt-BR', label: 'Português BR' },
  { value: 'es', label: 'Espanhol' },
  { value: 'en', label: 'Inglês' },
]

const scheduleOptions = [
  { value: '24h', label: '24 horas' },
  { value: 'business', label: 'Mesmo horário do negócio' },
  { value: 'custom', label: 'Personalizado' },
]

const predefinedAvatars = [
  { id: 'av-1', icon: 'i-lucide-smile', color: '#3B82F6' },
  { id: 'av-2', icon: 'i-lucide-bot', color: '#8B5CF6' },
  { id: 'av-3', icon: 'i-lucide-star', color: '#F59E0B' },
  { id: 'av-4', icon: 'i-lucide-heart', color: '#EC4899' },
  { id: 'av-5', icon: 'i-lucide-zap', color: '#10B981' },
  { id: 'av-6', icon: 'i-lucide-sparkles', color: '#6366F1' },
  { id: 'av-7', icon: 'i-lucide-sun', color: '#F97316' },
  { id: 'av-8', icon: 'i-lucide-leaf', color: '#22C55E' },
]
const selectedAvatar = ref('av-2')

const tooltipCapKey = ref<string | null>(null)

const newTransferTopic = ref('')
const addTransferTopic = () => {
  const topic = newTransferTopic.value.trim()
  if (topic && !localConfig.alwaysTransferTopics.includes(topic)) {
    localConfig.alwaysTransferTopics.push(topic)
    newTransferTopic.value = ''
  }
}
const removeTransferTopic = (t: string) => {
  localConfig.alwaysTransferTopics = localConfig.alwaysTransferTopics.filter(x => x !== t)
}

// Preview de tom de voz (linha na UI, abaixo do select)
const tonePreviewMap = computed<Record<string, string>>(() => ({
  professional: 'Bom dia! Como posso ajudá-lo(a) hoje?',
  friendly: 'Oi! Tudo bem? Em que posso te ajudar?',
  casual: 'E aí! Bora agendar?',
  formal: 'Prezado(a), seja bem-vindo(a). Em que posso ser útil?',
  custom: localConfig.customToneInstructions || 'Tom personalizado conforme instruções.',
}))

// Resposta da IA no ZimaPhonePreview (muda conforme o tom selecionado)
const toneResponseMap = computed<Record<string, string>>(() => ({
  professional: 'O corte feminino custa R$ 80,00 com duração de 45 min. Gostaria de agendar?',
  friendly: 'Boa! O corte feminino fica R$ 80,00 e leva uns 45 minutinhos. Agendamos?',
  casual: 'É R$ 80 e demora ~45min. Bora marcar?',
  formal: 'O serviço de corte feminino tem o valor de R$ 80,00 com duração de 45 minutos. Posso efetuar o agendamento?',
  custom: localConfig.customToneInstructions
    ? '[Tom personalizado] O corte feminino custa R$ 80,00. Deseja agendar?'
    : 'O corte feminino custa R$ 80,00. Gostaria de agendar?',
}))

const previewMessages = computed<PhoneMessage[]>(() => {
  const welcome = localConfig.welcomeMessage
    .replace('{{nome_cliente}}', 'Maria')
    .replace('{{nome_negocio}}', 'Studio Beleza')
  const response = toneResponseMap.value[localConfig.tone] ?? toneResponseMap.value.friendly
  return [
    { sender: 'client', text: 'Oi, boa tarde!' },
    { sender: 'agent', text: welcome },
    { sender: 'client', text: 'Quanto custa o corte feminino?' },
    { sender: 'agent', text: response },
  ]
})

const savingAgent = ref(false)
const handleSaveAgent = async () => {
  savingAgent.value = true
  await saveAgentConfig(localConfig)
  savingAgent.value = false
}

// ── Conhecimento ──────────────────────────────────────────────────────────────
const autoInfoExpanded = ref(true)
const kbSearch = ref('')
const kbCategoryFilter = ref<string | null>(null)
const kbModalOpen = ref(false)
const kbEditingId = ref<string | null>(null)

const kbForm = reactive({
  title: '',
  category: 'FAQ' as KnowledgeEntry['category'],
  content: '',
  exampleQuestion: '',
  active: true,
})

const categoryOptions = [
  { value: 'FAQ', label: 'FAQ' },
  { value: 'Regras', label: 'Regras' },
  { value: 'Procedimentos', label: 'Procedimentos' },
  { value: 'Produtos', label: 'Produtos' },
  { value: 'Promoções', label: 'Promoções' },
  { value: 'Outro', label: 'Outro' },
]

const filteredKb = computed(() => knowledgeEntries.value.filter(e => {
  const matchSearch = !kbSearch.value || e.title.toLowerCase().includes(kbSearch.value.toLowerCase())
  const matchCat = !kbCategoryFilter.value || e.category === kbCategoryFilter.value
  return matchSearch && matchCat
}))

const kbColumns = [
  { key: 'title', label: 'Título' },
  { key: 'category', label: 'Categoria', width: '120px' },
  { key: 'status', label: 'Status', width: '100px', align: 'center' as const },
  { key: 'acoes', label: 'Ações', width: '160px', align: 'right' as const },
]

const kbRows = computed(() => filteredKb.value.map(e => ({
  ...e,
  status: e.active ? 'Ativo' : 'Inativo',
})))

const openAddKb = () => {
  kbEditingId.value = null
  Object.assign(kbForm, { title: '', category: 'FAQ', content: '', exampleQuestion: '', active: true })
  kbModalOpen.value = true
}

const openEditKb = (id: string) => {
  const entry = knowledgeEntries.value.find(e => e.id === id)
  if (!entry) return
  kbEditingId.value = id
  Object.assign(kbForm, { ...entry })
  kbModalOpen.value = true
}

const saveKb = () => {
  if (!kbForm.title.trim()) return
  if (kbEditingId.value) {
    updateKnowledgeEntry(kbEditingId.value, { ...kbForm })
  } else {
    addKnowledgeEntry({ ...kbForm })
  }
  kbModalOpen.value = false
}

const importInputRef = ref<HTMLInputElement | null>(null)
const importingDoc = ref(false)
const importedChunks = ref<string[]>([])
const importModalOpen = ref(false)

const handleImport = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  importingDoc.value = true
  setTimeout(() => {
    importedChunks.value = [
      'Chunk 1: Política de cancelamento com antecedência mínima de 2 horas...',
      'Chunk 2: Formas de pagamento aceitas no estabelecimento...',
      'Chunk 3: Horário de funcionamento e informações de localização...',
    ]
    importingDoc.value = false
    importModalOpen.value = true
  }, 1500)
}

const saveImportedChunks = () => {
  importedChunks.value.forEach((chunk, i) => {
    addKnowledgeEntry({
      title: `Importado ${i + 1}`,
      category: 'FAQ',
      content: chunk,
      exampleQuestion: '',
      active: true,
    })
  })
  importedChunks.value = []
  importModalOpen.value = false
  toast.success('Documento importado com sucesso!')
}

// ── Fluxos ────────────────────────────────────────────────────────────────────
const flowTemplates = [
  { icon: 'i-lucide-calendar',     name: 'Agendamento completo',    trigger: 'agendar, marcar, horário' },
  { icon: 'i-lucide-help-circle',  name: 'FAQ automático',          trigger: 'preço, quanto custa, valor' },
  { icon: 'i-lucide-star',         name: 'Pesquisa de satisfação',  trigger: '2h após atendimento' },
  { icon: 'i-lucide-refresh-cw',   name: 'Reativação de clientes',  trigger: '30 dias sem visita' },
  { icon: 'i-lucide-hand',         name: 'Boas-vindas',             trigger: 'Novo cliente cadastrado' },
]

const useFlowTemplate = (tpl: typeof flowTemplates[0]) => {
  addConvFlow({
    name: tpl.name,
    description: 'Criado a partir de template',
    trigger: `Quando mensagem contém: ${tpl.trigger}`,
    active: false,
  })
}

// ── Automações ────────────────────────────────────────────────────────────────
const autoModalOpen = ref(false)
const autoEditingId = ref<string | null>(null)
const autoHistoryId = ref<string | null>(null)

const autoForm = reactive({
  name: '',
  description: '',
  triggerType: 'before_appointment',
  triggerLabel: '',
  actionType: 'whatsapp',
  actionLabel: '',
  active: true,
  messageText: '',
  delayImmediate: true,
  delayAmount: 0,
  delayUnit: 'hours' as 'minutes' | 'hours' | 'days',
  conditionEnabled: false,
  conditionText: '',
})

const triggerOptions = [
  { value: 'appointment_created', label: 'Agendamento criado' },
  { value: 'appointment_confirmed', label: 'Agendamento confirmado' },
  { value: 'before_appointment', label: 'X horas/dias antes do agendamento' },
  { value: 'after_appointment', label: 'X horas/dias após atendimento' },
  { value: 'inactive', label: 'Cliente sem visita há X dias' },
  { value: 'birthday', label: 'Data de nascimento do cliente' },
  { value: 'new_client', label: 'Novo cliente cadastrado' },
  { value: 'noshow', label: 'No-show (cliente não apareceu)' },
  { value: 'low_stock', label: 'Estoque abaixo do mínimo' },
  { value: 'recurring', label: 'Agenda do dia (recorrente)' },
  { value: 'review', label: 'Avaliação recebida' },
]

const actionOptions = [
  { value: 'whatsapp', label: 'Enviar mensagem WhatsApp' },
  { value: 'instagram', label: 'Enviar mensagem Instagram' },
  { value: 'email', label: 'Enviar email' },
  { value: 'notification', label: 'Enviar notificação in-app' },
  { value: 'apply_tag', label: 'Aplicar tag ao cliente' },
  { value: 'remove_tag', label: 'Remover tag do cliente' },
  { value: 'change_status', label: 'Alterar status do cliente' },
  { value: 'create_task', label: 'Criar tarefa/lembrete' },
  { value: 'coupon', label: 'Gerar cupom personalizado' },
  { value: 'webhook', label: 'Webhook (chamar URL)' },
]

const autoTemplates = [
  { icon: 'i-lucide-bell',           name: 'Lembrete de agendamento',         triggerType: 'before_appointment',  triggerLabel: '24h antes do agendamento',                 actionType: 'whatsapp',     actionLabel: 'Lembrete: seu horário é amanhã às {{hora_agendamento}}' },
  { icon: 'i-lucide-check-circle',   name: 'Confirmação de agendamento',      triggerType: 'appointment_created', triggerLabel: 'Agendamento criado',                       actionType: 'whatsapp',     actionLabel: 'Agendamento confirmado para {{data_agendamento}} às {{hora_agendamento}}' },
  { icon: 'i-lucide-star',           name: 'Pesquisa de satisfação',          triggerType: 'after_appointment',   triggerLabel: '2h após atendimento concluído',            actionType: 'whatsapp',     actionLabel: 'Como foi seu atendimento? Responda de 1 a 5' },
  { icon: 'i-lucide-cake',           name: 'Parabéns + cupom aniversário',    triggerType: 'birthday',            triggerLabel: 'Data de nascimento do cliente',            actionType: 'whatsapp',     actionLabel: 'Feliz aniversário! Use o cupom ANIVER10 para 10% off' },
  { icon: 'i-lucide-moon',           name: 'Reativação de inativos',          triggerType: 'inactive',            triggerLabel: 'Cliente sem visita há 30 dias',            actionType: 'whatsapp',     actionLabel: 'Faz tempo que não te vemos! Que tal agendar?' },
  { icon: 'i-lucide-package',        name: 'Alerta de estoque baixo',         triggerType: 'low_stock',           triggerLabel: 'Produto atinge estoque mínimo',            actionType: 'notification', actionLabel: 'Notificação in-app + email para o gerente' },
  { icon: 'i-lucide-dollar-sign',    name: 'Resumo financeiro semanal',       triggerType: 'recurring',           triggerLabel: 'Toda segunda-feira 08:00',                 actionType: 'email',        actionLabel: 'Email para o owner com resumo da semana' },
  { icon: 'i-lucide-clipboard-list', name: 'Follow-up pós-atendimento',       triggerType: 'after_appointment',   triggerLabel: '7 dias após atendimento',                  actionType: 'whatsapp',     actionLabel: 'Tudo certo com seu {{servico}}? Precisa de algo?' },
  { icon: 'i-lucide-siren',          name: 'Alerta de no-show',               triggerType: 'noshow',              triggerLabel: 'Cliente não aparece (no-show)',            actionType: 'notification', actionLabel: 'Notificação para equipe + tag "No-show" aplicada' },
  { icon: 'i-lucide-bar-chart-3',    name: 'Comissão calculada',              triggerType: 'recurring',           triggerLabel: 'Final do mês',                             actionType: 'notification', actionLabel: 'Notificação para profissionais com comissão do mês' },
]

const openAddAuto = () => {
  autoEditingId.value = null
  Object.assign(autoForm, { name: '', description: '', triggerType: 'before_appointment', triggerLabel: '', actionType: 'whatsapp', actionLabel: '', active: true, messageText: '', delayImmediate: true, delayAmount: 0, delayUnit: 'hours', conditionEnabled: false, conditionText: '' })
  autoModalOpen.value = true
}

const openEditAuto = (auto: typeof automations.value[0]) => {
  autoEditingId.value = auto.id
  Object.assign(autoForm, { name: auto.name, description: auto.description, triggerType: auto.triggerType, triggerLabel: auto.triggerLabel, actionType: auto.actionType, actionLabel: auto.actionLabel, active: auto.active, messageText: '', delayImmediate: true, delayAmount: 0, delayUnit: 'hours', conditionEnabled: false, conditionText: '' })
  autoModalOpen.value = true
}

const useAutoTemplate = (tpl: typeof autoTemplates[0]) => {
  addAutomation({
    name: tpl.name,
    description: '',
    triggerType: tpl.triggerType,
    triggerLabel: tpl.triggerLabel,
    actionType: tpl.actionType,
    actionLabel: tpl.actionLabel,
    active: false,
  })
}

const saveAuto = () => {
  if (!autoForm.name.trim()) return
  const triggerOption = triggerOptions.find(o => o.value === autoForm.triggerType)
  const actionOption = actionOptions.find(o => o.value === autoForm.actionType)
  if (autoEditingId.value) {
    const idx = automations.value.findIndex(a => a.id === autoEditingId.value)
    if (idx !== -1) {
      automations.value[idx] = {
        ...automations.value[idx],
        name: autoForm.name,
        description: autoForm.description,
        triggerType: autoForm.triggerType,
        triggerLabel: triggerOption?.label ?? autoForm.triggerType,
        actionType: autoForm.actionType,
        actionLabel: actionOption?.label ?? autoForm.actionType,
        active: autoForm.active,
      }
      toast.success('Automação atualizada!')
    }
  } else {
    addAutomation({
      name: autoForm.name,
      description: autoForm.description,
      triggerType: autoForm.triggerType,
      triggerLabel: triggerOption?.label ?? autoForm.triggerType,
      actionType: autoForm.actionType,
      actionLabel: actionOption?.label ?? autoForm.actionType,
      active: autoForm.active,
    })
  }
  autoModalOpen.value = false
}

const variablesExpanded = ref(false)

const autoHistoryRows = [
  { datetime: '05/04 14:32', client: 'Maria Silva', status: 'Executado', details: 'Lembrete enviado com sucesso' },
  { datetime: '05/04 13:15', client: 'João Mendes', status: 'Executado', details: 'Lembrete enviado com sucesso' },
  { datetime: '05/04 11:00', client: 'Ana Costa', status: 'Falhou', details: 'Número inválido' },
  { datetime: '04/04 15:20', client: 'Carlos Lima', status: 'Executado', details: 'Lembrete enviado com sucesso' },
  { datetime: '04/04 09:45', client: 'Fernanda Oliveira', status: 'Executado', details: 'Lembrete enviado com sucesso' },
]

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h atrás`
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div>
    <!-- Header -->
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: 700; color: var(--zima-text-primary); margin: 0 0 4px;">IA & Automação</h1>
      <p style="font-size: 14px; color: var(--zima-text-muted); margin: 0;">Configure seu assistente virtual e automatize processos do seu negócio</p>
    </div>

    <!-- Tabs -->
    <div style="display:flex; gap:0; border-bottom:1px solid var(--zima-border-divider); margin-bottom:28px; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none;">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        style="padding:10px 20px; background:none; border:none; cursor:pointer; font-size:14px; font-weight:500; white-space:nowrap; border-bottom:2px solid transparent; transition:all 150ms; margin-bottom:-1px;"
        :style="{
          color: activeTab === tab.key ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
          borderBottomColor: activeTab === tab.key ? 'var(--zima-blue-core)' : 'transparent',
        }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ── TAB: PAINEL ──────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'painel'">
      <!-- KPI Cards -->
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px;">
        <ZimaKpiCard label="Conversas Hoje" :value="dashboard.todayConversations" change="+12" icon="i-lucide-message-circle" />
        <div style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);">
          <div style="font-size:11px; font-weight:600; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">Resolvidas pela IA</div>
          <div style="display:flex; align-items:center; gap:12px;">
            <svg viewBox="0 0 36 36" style="width:64px;height:64px;flex-shrink:0;">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(16,185,129,0.12)" stroke-width="3"/>
              <circle
cx="18" cy="18" r="15.9" fill="none" :stroke="dashboard.aiResolutionRate >= 70 ? '#10B981' : dashboard.aiResolutionRate >= 50 ? '#F59E0B' : '#EF4444'" stroke-width="3"
                :stroke-dasharray="`${dashboard.aiResolutionRate} ${100 - dashboard.aiResolutionRate}`" stroke-linecap="round"
                transform="rotate(-90 18 18)"/>
              <text x="18" y="22" text-anchor="middle" style="font-size:8px;font-weight:700;" :fill="dashboard.aiResolutionRate >= 70 ? '#10B981' : '#F59E0B'">{{ dashboard.aiResolutionRate }}%</text>
            </svg>
            <div>
              <div style="font-size:28px; font-weight:700; color:var(--zima-text-primary);">{{ dashboard.resolvedByAI }}</div>
              <div style="font-size:12px; color:var(--zima-text-muted);">de {{ dashboard.todayConversations }}</div>
            </div>
          </div>
        </div>
        <ZimaKpiCard label="Transferidas p/ Humano" :value="`${dashboard.transferredToHuman} (${100 - dashboard.aiResolutionRate}%)`" icon="i-lucide-user-check" />
        <ZimaKpiCard label="Tempo Médio de Resposta" :value="`${dashboard.avgResponseSeconds} seg`" change="-3" icon="i-lucide-zap" />
      </div>

      <!-- Charts -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:28px;">
        <!-- Bar chart -->
        <div style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);">
          <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px;">Conversas por dia (30 dias)</div>
          <div style="display:flex; align-items:flex-end; gap:2px; height:120px; position:relative;">
            <div
              v-for="(d, i) in dashboard.dailyData"
              :key="i"
              style="flex:1; display:flex; flex-direction:column; align-items:center; cursor:pointer;"
              @mouseover="hoveredBar = i"
              @mouseleave="hoveredBar = null"
            >
              <div style="width:100%; position:relative;">
                <!-- Tooltip -->
                <div v-if="hoveredBar === i" style="position:absolute; bottom:100%; left:50%; transform:translateX(-50%); background:#1E2535; border:1px solid rgba(148,163,184,0.15); border-radius:6px; padding:6px 8px; font-size:11px; color:var(--zima-text-secondary); white-space:nowrap; z-index:10; pointer-events:none; margin-bottom:4px;">
                  <div>{{ d.day }}</div>
                  <div style="color:#3B82F6;">IA: {{ d.ai }}</div>
                  <div style="color:#F97316;">Humano: {{ d.human }}</div>
                </div>
                <!-- Human bar -->
                <div :style="{ height: `${(d.human / chartMax) * 80}px`, background: '#F97316', opacity: 0.7, borderRadius:'2px 2px 0 0' }" />
                <!-- AI bar -->
                <div :style="{ height: `${(d.ai / chartMax) * 80}px`, background: '#3B82F6', opacity: hoveredBar === i ? 1 : 0.6, borderRadius:'2px 2px 0 0' }" />
              </div>
            </div>
          </div>
          <div style="display:flex; gap:12px; margin-top:8px;">
            <div style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--zima-text-muted);">
              <div style="width:8px;height:8px;border-radius:2px;background:#3B82F6;"/> IA
            </div>
            <div style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--zima-text-muted);">
              <div style="width:8px;height:8px;border-radius:2px;background:#F97316;"/> Humano
            </div>
          </div>
        </div>

        <!-- Heatmap -->
        <div style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);">
          <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px;">Horários de pico semanal</div>
          <div style="display:flex; gap:6px; align-items:flex-start;">
            <div style="display:flex; flex-direction:column; gap:2px; flex-shrink:0;">
              <div v-for="day in heatmapDays" :key="day" style="height:12px; font-size:9px; color:var(--zima-text-muted); line-height:12px; width:24px; text-align:right; padding-right:4px;">{{ day }}</div>
            </div>
            <div style="flex:1; overflow:hidden;">
              <div v-for="(row, di) in dashboard.heatmapData" :key="di" style="display:grid; grid-template-columns:repeat(24,1fr); gap:1px; margin-bottom:2px;">
                <div
                  v-for="(val, hi) in row"
                  :key="hi"
                  :title="`${heatmapDays[di]} ${hi}h: ${Math.round(val * 100)}%`"
                  style="height:12px; border-radius:1px;"
                  :style="{ background: val > 0.01 ? `rgba(59,130,246,${Math.min(val + 0.05, 0.85)})` : 'rgba(148,163,184,0.04)' }"
                />
              </div>
              <!-- Hour labels -->
              <div style="display:grid; grid-template-columns:repeat(24,1fr); gap:1px; margin-top:3px;">
                <div v-for="h in 24" :key="h" style="font-size:8px; color:var(--zima-text-muted); text-align:center;">
                  {{ h % 6 === 1 ? (h - 1) + 'h' : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top FAQ -->
      <div style="margin-bottom:28px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--zima-border-divider);">
          <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary);">Perguntas mais frequentes (Top 10)</div>
        </div>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:rgba(148,163,184,0.04);">
              <th style="padding:10px 20px; text-align:left; font-size:11px; font-weight:600; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.05em;">Pergunta</th>
              <th style="padding:10px 16px; text-align:right; font-size:11px; font-weight:600; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.05em; width:80px;">Vezes</th>
              <th style="padding:10px 16px; text-align:right; font-size:11px; font-weight:600; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.05em; width:80px;">%</th>
              <th style="padding:10px 16px; text-align:center; font-size:11px; font-weight:600; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.05em; width:100px;">IA resolve</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="faq in dashboard.topFAQ"
              :key="faq.question"
              style="cursor:pointer; border-top:1px solid rgba(148,163,184,0.06); transition:background 100ms;"
              @click="toast.info('Filtrando: ' + faq.question + '…')"
              @mouseover="($event.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.03)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
            >
              <td style="padding:12px 20px; font-size:13px; color:var(--zima-text-secondary);">{{ faq.question }}</td>
              <td style="padding:12px 16px; text-align:right; font-size:13px; font-weight:500; color:var(--zima-text-primary);">{{ faq.count }}</td>
              <td style="padding:12px 16px; text-align:right; font-size:13px; color:var(--zima-text-muted);">{{ faq.percentage }}%</td>
              <td style="padding:12px 16px; text-align:center;">
                <Icon
                  :name="faq.resolvedByAI ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'"
                  style="width:16px; height:16px;"
                  :style="{ color: faq.resolvedByAI ? '#10B981' : '#64748B' }"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Últimas não resolvidas -->
      <div style="background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--zima-border-divider);">
          <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary);">Últimas conversas não resolvidas pela IA</div>
        </div>
        <div style="padding:8px 0;">
          <div
            v-for="conv in dashboard.unresolved"
            :key="conv.id"
            style="display:flex; align-items:center; gap:12px; padding:12px 20px; border-bottom:1px solid rgba(148,163,184,0.04);"
          >
            <ZimaAvatar :name="conv.clientName" size="sm" />
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:500; color:var(--zima-text-primary);">{{ conv.clientName }}</div>
              <div style="font-size:12px; color:var(--zima-text-muted);">{{ conv.transferReason }} • {{ formatRelative(conv.transferredAt) }}</div>
            </div>
            <ZimaButton size="sm" variant="ghost" @click="navigateTo(`/saas/inbox?conv=${conv.id}`)">Revisar</ZimaButton>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TAB: AGENTE ──────────────────────────────────────────────────────── -->
    <div v-else-if="activeTab === 'agente'">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:32px; align-items:start;">
        <!-- Coluna esquerda: formulário -->
        <div class="flex flex-col gap-6">
          <!-- Identidade -->
          <div style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);">
            <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px;">Identidade do Agente</div>
            <div class="flex flex-col gap-4">
              <ZimaInput v-model="localConfig.name" label="Nome do assistente" placeholder="Como seu assistente se chama?" />
              <div>
                <div style="font-size:13px; font-weight:500; color:var(--zima-text-secondary); margin-bottom:8px;">Avatar</div>
                <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">
                  <div
                    v-for="av in predefinedAvatars"
                    :key="av.id"
                    style="aspect-ratio:1; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 150ms; border:2px solid transparent;"
                    :style="{
                      background: `${av.color}20`,
                      borderColor: selectedAvatar === av.id ? av.color : 'transparent',
                      boxShadow: selectedAvatar === av.id ? `0 0 0 2px ${av.color}40` : 'none',
                    }"
                    @click="selectedAvatar = av.id"
                  >
                    <Icon :name="av.icon" style="width:24px; height:24px;" :style="{ color: av.color }" />
                  </div>
                </div>
              </div>
              <ZimaInput v-model="localConfig.description" label="Descrição curta" placeholder="Ex: Assistente virtual do Studio Maria" />
            </div>
          </div>

          <!-- Personalidade -->
          <div style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);">
            <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px;">Personalidade e Tom de Voz</div>
            <div class="flex flex-col gap-4">
              <ZimaSelect v-model="localConfig.tone" :options="toneOptions" label="Tom de comunicação" />
              <div v-if="localConfig.tone !== 'custom'" style="padding:10px 14px; background:rgba(59,130,246,0.06); border-radius:var(--zima-radius-md); border:1px solid rgba(59,130,246,0.12);">
                <div style="font-size:12px; color:var(--zima-text-muted); margin-bottom:4px;">Preview:</div>
                <div style="font-size:13px; color:var(--zima-text-secondary);">"{{ tonePreviewMap[localConfig.tone] }}"</div>
              </div>
              <div v-if="localConfig.tone === 'custom'">
                <div style="font-size:13px; font-weight:500; color:var(--zima-text-secondary); margin-bottom:6px;">Instruções de tom</div>
                <textarea v-model="localConfig.customToneInstructions" rows="3" placeholder="Descreva como o assistente deve se comunicar..." style="width:100%;padding:10px 12px;background:var(--zima-bg-surface-3,#111520);border:1px solid var(--zima-border-default);border-radius:var(--zima-radius-md);color:var(--zima-text-primary);font-size:13px;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box;" />
              </div>
              <div style="display:flex; align-items:center; gap:12px;">
                <ZimaToggle v-model="localConfig.useEmojis" label="Usar emojis nas respostas" />
                <ZimaSelect v-if="localConfig.useEmojis" v-model="localConfig.emojiFrequency" :options="emojiFreqOptions" style="width:140px;" />
              </div>
              <div style="display:flex; gap:12px; align-items:flex-end;">
                <div style="flex:1;"><ZimaSelect v-model="localConfig.language" :options="langOptions" label="Idioma" /></div>
                <ZimaToggle v-model="localConfig.autoDetectLanguage" label="Detectar auto" />
              </div>
              <div>
                <div style="font-size:13px; font-weight:500; color:var(--zima-text-secondary); margin-bottom:6px;">Mensagem de boas-vindas</div>
                <textarea v-model="localConfig.welcomeMessage" rows="3" style="width:100%;padding:10px 12px;background:var(--zima-bg-surface-3,#111520);border:1px solid var(--zima-border-default);border-radius:var(--zima-radius-md);color:var(--zima-text-primary);font-size:13px;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box;" />
                <div style="font-size:11px; color:var(--zima-text-muted); margin-top:4px;">Variáveis: <code style="font-size:10px; color:var(--zima-blue-core);">{{nome_cliente}}</code> <code style="font-size:10px; color:var(--zima-blue-core);">{{nome_negocio}}</code></div>
              </div>
              <div>
                <div style="font-size:13px; font-weight:500; color:var(--zima-text-secondary); margin-bottom:6px;">Mensagem fora do horário</div>
                <textarea v-model="localConfig.offHoursMessage" rows="3" style="width:100%;padding:10px 12px;background:var(--zima-bg-surface-3,#111520);border:1px solid var(--zima-border-default);border-radius:var(--zima-radius-md);color:var(--zima-text-primary);font-size:13px;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box;" />
              </div>
            </div>
          </div>

          <!-- Capacidades -->
          <div style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);">
            <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:4px;">Capacidades</div>
            <div style="font-size:12px; color:var(--zima-text-muted); margin-bottom:16px;">Habilite ou desabilite o que o assistente pode fazer</div>
            <div style="display:flex; flex-direction:column; gap:0;">
              <div
                v-for="cap in localConfig.capabilities"
                :key="cap.key"
                style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid rgba(148,163,184,0.06);"
              >
                <div style="display:flex; align-items:center; gap:6px; flex:1; min-width:0;">
                  <span style="font-size:13px; color:var(--zima-text-secondary);">{{ cap.label }}</span>
                  <div style="position:relative; flex-shrink:0;">
                    <button
                      style="width:16px;height:16px;border-radius:50%;background:rgba(148,163,184,0.12);border:none;cursor:pointer;font-size:9px;color:var(--zima-text-muted);display:flex;align-items:center;justify-content:center;flex-shrink:0;"
                      @mouseenter="tooltipCapKey = cap.key"
                      @mouseleave="tooltipCapKey = null"
                    >?</button>
                    <div v-if="tooltipCapKey === cap.key" style="position:absolute;left:20px;top:50%;transform:translateY(-50%);background:#1E2535;border:1px solid rgba(148,163,184,0.15);border-radius:6px;padding:6px 10px;font-size:11px;color:var(--zima-text-secondary);white-space:nowrap;z-index:10;max-width:220px;white-space:normal;">
                      {{ cap.description }}
                    </div>
                  </div>
                </div>
                <ZimaToggle v-model="cap.enabled" size="sm" />
              </div>
            </div>
          </div>

          <!-- Limites e Segurança -->
          <div style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);">
            <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px;">Limites e Segurança</div>
            <div class="flex flex-col gap-4">
              <ZimaInput v-model="localConfig.maxMessagesBeforeTransfer" type="number" label="Máximo de mensagens antes de transferir para humano" hint="Se a IA trocar mais de N mensagens sem resolver, transfere automaticamente." />
              <div>
                <div style="font-size:13px; font-weight:500; color:var(--zima-text-secondary); margin-bottom:8px;">Assuntos que SEMPRE transferem para humano</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                  <span
                    v-for="topic in localConfig.alwaysTransferTopics"
                    :key="topic"
                    style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:12px; font-size:12px; color:#FCA5A5;"
                  >
                    {{ topic }}
                    <button style="background:none;border:none;cursor:pointer;color:#FCA5A5;padding:0;display:flex;" @click="removeTransferTopic(topic)">
                      <Icon name="i-lucide-x" style="width:10px;height:10px;" />
                    </button>
                  </span>
                </div>
                <div style="display:flex; gap:8px;">
                  <ZimaInput v-model="newTransferTopic" placeholder="Ex: reclamação" style="flex:1;" @keydown.enter="addTransferTopic" />
                  <ZimaButton variant="ghost" size="sm" @click="addTransferTopic">Adicionar</ZimaButton>
                </div>
              </div>
              <ZimaSelect v-model="localConfig.aiSchedule" :options="scheduleOptions" label="Horário de atendimento da IA" />
            </div>
          </div>

          <!-- Save button -->
          <div style="display:flex; justify-content:flex-end;">
            <ZimaButton :loading="savingAgent" @click="handleSaveAgent">Salvar Configurações</ZimaButton>
          </div>
        </div>

        <!-- Coluna direita: Preview iPhone (sticky) -->
        <div style="position:sticky; top:80px;">
          <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px; text-align:center;">Preview em tempo real</div>
          <ZimaPhonePreview :agent-name="localConfig.name" :messages="previewMessages" />
          <div style="margin-top:16px; padding:12px; background:rgba(59,130,246,0.06); border-radius:var(--zima-radius-md); border:1px solid rgba(59,130,246,0.12);">
            <div style="font-size:12px; color:var(--zima-text-muted);">Este preview usa dados de exemplo. A mensagem de boas-vindas é atualizada em tempo real conforme você edita.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TAB: CONHECIMENTO ───────────────────────────────────────────────── -->
    <div v-else-if="activeTab === 'conhecimento'">
      <!-- Info automática -->
      <div style="margin-bottom:20px; border-radius:var(--zima-radius-lg); overflow:hidden; border:1px solid rgba(16,185,129,0.2);">
        <button
          style="width:100%; display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:rgba(16,185,129,0.06); border:none; cursor:pointer;"
          @click="autoInfoExpanded = !autoInfoExpanded"
        >
          <div style="display:flex; align-items:center; gap:8px;">
            <Icon name="i-lucide-info" style="width:16px;height:16px;color:#10B981;" />
            <span style="font-size:13px; font-weight:600; color:#10B981;">A IA já tem acesso automático a informações do seu negócio</span>
          </div>
          <Icon :name="autoInfoExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" style="width:16px;height:16px;color:#10B981;" />
        </button>
        <div v-if="autoInfoExpanded" style="padding:16px 20px; background:rgba(16,185,129,0.03);">
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div v-for="item in ['Catálogo de serviços — atualizado automaticamente', 'Horário de funcionamento — atualizado automaticamente', 'Profissionais e suas agendas — atualizado automaticamente', 'Dados dos clientes (nome, histórico) — acesso automático']" :key="item" style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--zima-text-secondary);">
              <Icon name="i-lucide-check-circle-2" style="width:14px;height:14px;color:#10B981;flex-shrink:0;" />
              {{ item }}
            </div>
          </div>
        </div>
      </div>

      <!-- Header actions -->
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px;">
        <div style="display:flex; align-items:center; gap:8px; flex:1;">
          <ZimaInput v-model="kbSearch" placeholder="Buscar conhecimentos..." style="max-width:280px;" />
          <ZimaSelect v-model="kbCategoryFilter" :options="[{label:'Todas categorias',value:''}, ...categoryOptions]" style="width:160px;" />
        </div>
        <div style="display:flex; gap:8px;">
          <ZimaButton variant="ghost" @click="importInputRef?.click()">
            <template #icon-left><Icon name="i-lucide-upload" style="width:14px;height:14px;" /></template>
            Importar documento
          </ZimaButton>
          <input ref="importInputRef" type="file" accept=".pdf,.docx,.txt" style="display:none;" @change="handleImport" >
          <ZimaButton @click="openAddKb">
            <template #icon-left><Icon name="i-lucide-plus" style="width:14px;height:14px;" /></template>
            Adicionar Conhecimento
          </ZimaButton>
        </div>
      </div>

      <!-- Table -->
      <ZimaTable :columns="kbColumns" :rows="kbRows" empty-title="Nenhum conhecimento encontrado" empty-icon="i-lucide-book-open">
        <template #cell-category="{ row }">
          <ZimaBadge variant="neutral" size="sm">{{ row.category }}</ZimaBadge>
        </template>
        <template #cell-status="{ row }">
          <ZimaBadge :variant="row.active ? 'success' : 'neutral'" size="sm">{{ row.status }}</ZimaBadge>
        </template>
        <template #cell-acoes="{ row }">
          <div style="display:flex; gap:6px; justify-content:flex-end;">
            <ZimaButton size="sm" variant="ghost" @click="openEditKb(row.id)">Editar</ZimaButton>
            <ZimaButton size="sm" variant="ghost" @click="updateKnowledgeEntry(row.id, { active: !row.active })">
              {{ row.active ? 'Desativar' : 'Ativar' }}
            </ZimaButton>
            <ZimaButton size="sm" variant="ghost" @click="deleteKnowledgeEntry(row.id)">
              <Icon name="i-lucide-trash-2" style="width:13px;height:13px;color:var(--zima-danger);" />
            </ZimaButton>
          </div>
        </template>
      </ZimaTable>

      <!-- Modal Adicionar/Editar -->
      <ZimaModal v-model="kbModalOpen" :title="kbEditingId ? 'Editar Conhecimento' : 'Novo Conhecimento'" size="lg">
        <div class="flex flex-col gap-4">
          <ZimaInput v-model="kbForm.title" label="Título" placeholder="Ex: Política de cancelamento" required />
          <ZimaSelect v-model="kbForm.category" :options="categoryOptions" label="Categoria" />
          <div>
            <div style="font-size:13px; font-weight:500; color:var(--zima-text-secondary); margin-bottom:6px;">Conteúdo</div>
            <textarea v-model="kbForm.content" rows="6" placeholder="Descreva a informação que a IA deve saber..." style="width:100%;padding:10px 12px;background:var(--zima-bg-surface-3,#111520);border:1px solid var(--zima-border-default);border-radius:var(--zima-radius-md);color:var(--zima-text-primary);font-size:13px;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box;min-height:120px;" />
          </div>
          <ZimaInput v-model="kbForm.exampleQuestion" label="Exemplo de pergunta" placeholder="Como um cliente perguntaria sobre isso?" hint='Ex: "Posso cancelar meu horário?"' />
          <ZimaToggle v-model="kbForm.active" label="Ativo" />
        </div>
        <template #footer="{ close }">
          <div class="flex items-center justify-between w-full">
            <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
            <ZimaButton :disabled="!kbForm.title.trim()" @click="saveKb">Salvar</ZimaButton>
          </div>
        </template>
      </ZimaModal>

      <!-- Modal importar chunks -->
      <ZimaModal v-model="importModalOpen" title="Importar documento" description="Revise os trechos extraídos antes de salvar" size="lg">
        <div v-if="importingDoc" class="flex items-center justify-center" style="padding:40px;">
          <Icon name="i-lucide-loader-2" style="width:24px;height:24px;animation:spin 1s linear infinite;color:var(--zima-blue-core);" />
          <span style="margin-left:12px;color:var(--zima-text-muted);">Processando documento...</span>
        </div>
        <div v-else class="flex flex-col gap-3">
          <div v-for="(chunk, i) in importedChunks" :key="i" style="padding:12px; background:var(--zima-bg-surface-3,#111520); border-radius:var(--zima-radius-md); border:1px solid var(--zima-border-default);">
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px;">
              <div style="font-size:13px; color:var(--zima-text-secondary); flex:1;">{{ chunk }}</div>
              <button style="background:none;border:none;cursor:pointer;color:var(--zima-text-muted);" @click="importedChunks.splice(i,1)">
                <Icon name="i-lucide-x" style="width:14px;height:14px;" />
              </button>
            </div>
          </div>
        </div>
        <template #footer="{ close }">
          <div class="flex items-center justify-between w-full">
            <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
            <ZimaButton @click="saveImportedChunks">Salvar {{ importedChunks.length }} trechos</ZimaButton>
          </div>
        </template>
      </ZimaModal>
    </div>

    <!-- ── TAB: FLUXOS ─────────────────────────────────────────────────────── -->
    <div v-else-if="activeTab === 'fluxos'">
      <div style="margin-bottom:16px; padding:14px 16px; background:rgba(59,130,246,0.05); border-radius:var(--zima-radius-md); border:1px solid rgba(59,130,246,0.1);">
        <div style="font-size:13px; color:var(--zima-text-secondary);">Crie fluxos visuais para guiar conversas com seus clientes. Use quando precisar de um roteiro específico — agendamento, qualificação de leads, pesquisa de satisfação.</div>
      </div>

      <div style="display:flex; align-items:center; justify-content:flex-end; margin-bottom:20px;">
        <ZimaButton @click="addConvFlow({ name: 'Novo Fluxo', description: '', trigger: '', active: false })">
          <template #icon-left><Icon name="i-lucide-plus" style="width:14px;height:14px;" /></template>
          Novo Fluxo
        </ZimaButton>
      </div>

      <!-- Lista de fluxos -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:32px;">
        <div
          v-for="flow in convFlows"
          :key="flow.id"
          style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);"
        >
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px;">
            <div style="flex:1;">
              <div style="font-size:15px; font-weight:600; color:var(--zima-text-primary); margin-bottom:4px;">{{ flow.name }}</div>
              <div style="font-size:12px; color:var(--zima-text-muted);">{{ flow.description }}</div>
            </div>
            <ZimaToggle v-model="flow.active" size="sm" />
          </div>
          <div style="padding:8px 10px; background:rgba(148,163,184,0.06); border-radius:var(--zima-radius-sm); margin-bottom:12px;">
            <div style="font-size:11px; color:var(--zima-text-muted); margin-bottom:2px;">Gatilho:</div>
            <div style="font-size:12px; color:var(--zima-text-secondary);">{{ flow.trigger || 'Não configurado' }}</div>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="font-size:12px; color:var(--zima-text-muted);">{{ flow.usageCount }} usos · {{ flow.completionRate }}% completado</div>
            <div style="display:flex; gap:6px;">
              <ZimaButton size="sm" variant="ghost" @click="navigateTo(`/saas/ia/fluxos/${flow.id}`)">Editar</ZimaButton>
              <ZimaButton size="sm" variant="ghost" @click="duplicateFlow(flow.id)">Duplicar</ZimaButton>
              <ZimaButton size="sm" variant="ghost" @click="deleteFlow(flow.id)">
                <Icon name="i-lucide-trash-2" style="width:13px;height:13px;color:var(--zima-danger);" />
              </ZimaButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Templates -->
      <div>
        <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px;">Começar com um template</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style="gap:12px;">
          <div
            v-for="tpl in flowTemplates"
            :key="tpl.name"
            style="padding:16px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default); cursor:pointer; transition:border-color 150ms;"
            @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'"
          >
            <Icon :name="tpl.icon" style="width:24px; height:24px; color:var(--zima-blue-core); margin-bottom:8px;" />
            <div style="font-size:13px; font-weight:600; color:var(--zima-text-primary); margin-bottom:4px;">{{ tpl.name }}</div>
            <div style="font-size:12px; color:var(--zima-text-muted); margin-bottom:12px;">Gatilho: {{ tpl.trigger }}</div>
            <ZimaButton size="sm" variant="ghost" style="width:100%;" @click.stop="useFlowTemplate(tpl)">Usar template</ZimaButton>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TAB: AUTOMAÇÕES ────────────────────────────────────────────────── -->
    <div v-else-if="activeTab === 'automacoes'">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:20px;">
        <div style="font-size:13px; color:var(--zima-text-secondary); max-width:600px;">Automações que trabalham por você. Configure ações automáticas baseadas em eventos do seu negócio — lembretes, follow-ups, alertas e mais.</div>
        <ZimaButton @click="openAddAuto">
          <template #icon-left><Icon name="i-lucide-plus" style="width:14px;height:14px;" /></template>
          Nova Automação
        </ZimaButton>
      </div>

      <!-- Lista de automações -->
      <div class="flex flex-col gap-3 mb-8">
        <div
          v-for="auto in automations"
          :key="auto.id"
          style="padding:16px 20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);"
        >
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px;">
            <div style="flex:1;">
              <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:6px;">{{ auto.name }}</div>
              <div style="font-size:12px; color:var(--zima-text-muted); margin-bottom:4px;">
                <span style="color:var(--zima-text-secondary);">Quando:</span> {{ auto.triggerLabel }}
              </div>
              <div style="font-size:12px; color:var(--zima-text-muted); margin-bottom:8px;">
                <span style="color:var(--zima-text-secondary);">Ação:</span> {{ auto.actionLabel }}
              </div>
              <div v-if="auto.active && auto.stats.sent > 0" style="font-size:12px; color:var(--zima-text-muted);">
                Últimos 30 dias: <span style="color:var(--zima-text-secondary);">{{ auto.stats.sent }} enviados</span> · <span style="color:var(--zima-text-secondary);">{{ Math.round((auto.stats.delivered / auto.stats.sent) * 100) }}% entregues</span>
              </div>
              <div v-else-if="!auto.active" style="font-size:12px; color:var(--zima-text-muted);">Pausada</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <ZimaToggle v-model="auto.active" size="sm" @update:model-value="toggleAutomation(auto.id)" />
            </div>
          </div>
          <div style="display:flex; gap:6px; margin-top:12px; padding-top:12px; border-top:1px solid rgba(148,163,184,0.06);">
            <ZimaButton size="sm" variant="ghost" @click="openEditAuto(auto)">Editar</ZimaButton>
            <ZimaButton size="sm" variant="ghost" @click="autoHistoryId = auto.id">Ver histórico</ZimaButton>
            <ZimaButton size="sm" variant="ghost" @click="toggleAutomation(auto.id)">
              {{ auto.active ? 'Pausar' : 'Ativar' }}
            </ZimaButton>
          </div>
        </div>
      </div>

      <!-- Templates de automações -->
      <div>
        <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px;">Templates de automações</div>
        <div class="grid grid-cols-1 md:grid-cols-2" style="gap:12px;">
          <div
            v-for="tpl in autoTemplates"
            :key="tpl.name"
            style="padding:14px 16px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default); display:flex; align-items:flex-start; gap:12px;"
          >
            <Icon :name="tpl.icon" style="width:20px; height:20px; color:var(--zima-blue-core); flex-shrink:0;" />
            <div style="flex:1; min-width:0;">
              <div style="font-size:13px; font-weight:600; color:var(--zima-text-primary); margin-bottom:2px;">{{ tpl.name }}</div>
              <div style="font-size:11px; color:var(--zima-text-muted); margin-bottom:8px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ tpl.triggerLabel }}</div>
              <ZimaButton size="sm" variant="ghost" @click="useAutoTemplate(tpl)">Usar</ZimaButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Nova/Editar Automação -->
      <ZimaModal v-model="autoModalOpen" :title="autoEditingId ? 'Editar Automação' : 'Nova Automação'" size="lg">
        <div class="flex flex-col gap-5">
          <!-- Seção 1 -->
          <div>
            <div style="font-size:12px; font-weight:600; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">Configuração básica</div>
            <div class="flex flex-col gap-4">
              <ZimaInput v-model="autoForm.name" label="Nome da automação" placeholder="Ex: Lembrete de agendamento" required />
              <ZimaInput v-model="autoForm.description" label="Descrição" placeholder="O que esta automação faz?" />
              <ZimaToggle v-model="autoForm.active" label="Ativar automação" />
            </div>
          </div>

          <div style="height:1px; background:var(--zima-border-divider);" />

          <!-- Seção 2: Trigger -->
          <div>
            <div style="font-size:12px; font-weight:600; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">Quando acontece (trigger)</div>
            <ZimaSelect v-model="autoForm.triggerType" :options="triggerOptions" label="Tipo de gatilho" />
          </div>

          <div style="height:1px; background:var(--zima-border-divider);" />

          <!-- Seção 3: Ação -->
          <div>
            <div style="font-size:12px; font-weight:600; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">O que fazer (ação)</div>
            <div class="flex flex-col gap-4">
              <ZimaSelect v-model="autoForm.actionType" :options="actionOptions" label="Tipo de ação" />
              <div v-if="['whatsapp', 'instagram', 'email'].includes(autoForm.actionType)">
                <div style="font-size:13px; font-weight:500; color:var(--zima-text-secondary); margin-bottom:6px;">Mensagem</div>
                <textarea v-model="autoForm.messageText" rows="4" placeholder="Olá {{nome_cliente}}! ..." style="width:100%;padding:10px 12px;background:var(--zima-bg-surface-3,#111520);border:1px solid var(--zima-border-default);border-radius:var(--zima-radius-md);color:var(--zima-text-primary);font-size:13px;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box;" />
              </div>
            </div>
          </div>

          <!-- Variáveis -->
          <div style="border-radius:var(--zima-radius-md); border:1px solid var(--zima-border-default); overflow:hidden;">
            <button style="width:100%; display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(148,163,184,0.04); border:none; cursor:pointer;" @click="variablesExpanded = !variablesExpanded">
              <span style="font-size:12px; font-weight:600; color:var(--zima-text-muted);">Variáveis disponíveis</span>
              <Icon :name="variablesExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" style="width:14px;height:14px;color:var(--zima-text-muted);" />
            </button>
            <div v-if="variablesExpanded" style="padding:12px 14px; background:rgba(0,0,0,0.2);">
              <pre v-pre style="font-size:11px; color:var(--zima-text-muted); margin:0; line-height:1.8;">{{nome_cliente}}        — Nome do cliente
{{telefone_cliente}}    — Telefone
{{nome_negocio}}        — Nome do negócio
{{servico}}             — Nome do serviço
{{profissional}}        — Nome do profissional
{{data_agendamento}}    — Data do agendamento
{{hora_agendamento}}    — Hora do agendamento
{{valor_servico}}       — Valor do serviço
{{dias_sem_visita}}     — Dias desde última visita
{{link_agendamento}}    — Link de agendamento
{{codigo_cupom}}        — Código do cupom</pre>
            </div>
          </div>

          <!-- Delay -->
          <div>
            <div style="font-size:12px; font-weight:600; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">Delay</div>
            <ZimaToggle v-model="autoForm.delayImmediate" label="Executar imediatamente" />
            <div v-if="!autoForm.delayImmediate" style="display:flex; gap:8px; margin-top:8px;">
              <ZimaInput v-model="autoForm.delayAmount" type="number" label="Quantidade" style="flex:1;" />
              <ZimaSelect v-model="autoForm.delayUnit" :options="[{value:'minutes',label:'Minutos'},{value:'hours',label:'Horas'},{value:'days',label:'Dias'}]" label="Unidade" style="flex:1;" />
            </div>
          </div>

          <!-- Condição adicional -->
          <div>
            <ZimaToggle v-model="autoForm.conditionEnabled" label="Executar apenas se..." />
            <ZimaInput v-if="autoForm.conditionEnabled" v-model="autoForm.conditionText" placeholder='Ex: "cliente tem tag VIP"' style="margin-top:8px;" />
          </div>
        </div>

        <template #footer="{ close }">
          <div class="flex items-center justify-between w-full">
            <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
            <ZimaButton :disabled="!autoForm.name.trim()" @click="saveAuto">Salvar Automação</ZimaButton>
          </div>
        </template>
      </ZimaModal>

      <!-- Modal histórico -->
      <ZimaModal :model-value="!!autoHistoryId" title="Histórico de Execução" size="lg" @update:model-value="autoHistoryId = null">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:8px 12px; text-align:left; font-size:11px; color:var(--zima-text-muted); font-weight:600; text-transform:uppercase; border-bottom:1px solid var(--zima-border-divider);">Data/Hora</th>
              <th style="padding:8px 12px; text-align:left; font-size:11px; color:var(--zima-text-muted); font-weight:600; text-transform:uppercase; border-bottom:1px solid var(--zima-border-divider);">Cliente</th>
              <th style="padding:8px 12px; text-align:left; font-size:11px; color:var(--zima-text-muted); font-weight:600; text-transform:uppercase; border-bottom:1px solid var(--zima-border-divider);">Status</th>
              <th style="padding:8px 12px; text-align:left; font-size:11px; color:var(--zima-text-muted); font-weight:600; text-transform:uppercase; border-bottom:1px solid var(--zima-border-divider);">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(h, i) in autoHistoryRows" :key="i" style="border-bottom:1px solid rgba(148,163,184,0.04);">
              <td style="padding:10px 12px; font-size:12px; color:var(--zima-text-muted);">{{ h.datetime }}</td>
              <td style="padding:10px 12px; font-size:13px; color:var(--zima-text-secondary);">{{ h.client }}</td>
              <td style="padding:10px 12px;">
                <ZimaBadge :variant="h.status === 'Executado' ? 'success' : h.status === 'Falhou' ? 'danger' : 'blue'" size="sm">{{ h.status }}</ZimaBadge>
              </td>
              <td style="padding:10px 12px; font-size:12px; color:var(--zima-text-muted);">{{ h.details }}</td>
            </tr>
          </tbody>
        </table>
        <template #footer="{ close }">
          <ZimaButton variant="ghost" @click="close">Fechar</ZimaButton>
        </template>
      </ZimaModal>
    </div>
  </div>
</template>
