<script setup lang="ts">
import type { Campaign, CampaignType, CampaignChannel, SegmentRule } from '../../composables/useCampaigns'
import { useCampaigns } from '../../composables/useCampaigns'
import type { PhoneMessage } from '../../components/zima/ZimaPhonePreview.vue'

definePageMeta({ layout: 'saas' })

const route = useRoute()
const router = useRouter()
const toast = useZimaToast()
const { campaigns, addCampaign, sendCampaign, scheduleCampaign, deleteCampaign } = useCampaigns()

// ── Tabs ──────────────────────────────────────────────────────────────────────
type TabKey = 'ativas' | 'rascunhos' | 'enviadas' | 'agendadas'
const activeTab = ref<TabKey>((route.query.tab as TabKey) || 'ativas')

const tabs = [
  { key: 'ativas' as const, label: 'Ativas' },
  { key: 'rascunhos' as const, label: 'Rascunhos' },
  { key: 'enviadas' as const, label: 'Enviadas' },
  { key: 'agendadas' as const, label: 'Agendadas' },
]

watch(activeTab, v => {
  router.replace({ query: { tab: v !== 'ativas' ? v : undefined } })
})

// ── Filtered rows ─────────────────────────────────────────────────────────────
const tabStatusMap: Record<TabKey, Campaign['status'][]> = {
  ativas: ['sending'],
  rascunhos: ['draft'],
  enviadas: ['sent', 'cancelled'],
  agendadas: ['scheduled'],
}

const filteredCampaigns = computed(() => campaigns.value.filter(c => tabStatusMap[activeTab.value].includes(c.status)))

// ── Status styles ─────────────────────────────────────────────────────────────
const statusMeta: Record<Campaign['status'], { label: string; variant: 'neutral' | 'blue' | 'warning' | 'success' | 'danger' }> = {
  draft:     { label: 'Rascunho', variant: 'neutral' },
  scheduled: { label: 'Agendada', variant: 'blue' },
  sending:   { label: 'Enviando', variant: 'warning' },
  sent:      { label: 'Enviada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
}

const channelMeta: Record<CampaignChannel, { icon: string; color: string; label: string }> = {
  whatsapp:  { icon: 'i-lucide-message-circle', color: '#25D366', label: 'WhatsApp' },
  instagram: { icon: 'i-lucide-instagram', color: '#E1306C', label: 'Instagram' },
  email:     { icon: 'i-lucide-mail', color: '#3B82F6', label: 'Email' },
}

const typeMeta: Record<CampaignType, { label: string; icon: string }> = {
  promotional:   { label: 'Promocional', icon: '📢' },
  reactivation:  { label: 'Reativação', icon: '🔄' },
  birthday:      { label: 'Aniversário', icon: '🎂' },
  launch:        { label: 'Lançamento', icon: '🚀' },
  informational: { label: 'Informativo', icon: '📋' },
}

// ── Table columns ─────────────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nome', label: 'Nome', },
  { key: 'canal', label: 'Canal', width: '100px', align: 'center' as const },
  { key: 'publico', label: 'Público', width: '110px', align: 'center' as const },
  { key: 'status', label: 'Status', width: '120px', align: 'center' as const },
  { key: 'agendada', label: 'Agendada para', width: '140px' },
  { key: 'metricas', label: 'Métricas', width: '200px' },
  { key: 'acoes', label: 'Ações', width: '130px', align: 'right' as const },
]

const tableRows = computed(() => filteredCampaigns.value.map(c => ({ ...c, _id: c.id })))

const formatDate = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ── Modal Nova Campanha ───────────────────────────────────────────────────────
const newCampaignOpen = ref(false)
const currentStep = ref('config')
const STEPS = [
  { key: 'config', label: 'Config' },
  { key: 'publico', label: 'Público' },
  { key: 'mensagem', label: 'Mensagem' },
  { key: 'revisao', label: 'Revisão' },
]
const STEP_KEYS = STEPS.map(s => s.key)
const nextStep = () => { const i = STEP_KEYS.indexOf(currentStep.value); if (i < STEP_KEYS.length - 1) currentStep.value = STEP_KEYS[i + 1] }
const prevStep = () => { const i = STEP_KEYS.indexOf(currentStep.value); if (i > 0) currentStep.value = STEP_KEYS[i - 1] }

// Form state
const form = reactive({
  name: '',
  type: 'promotional' as CampaignType,
  channel: 'whatsapp' as CampaignChannel,
  allClients: true,
  segmentRules: [] as SegmentRule[],
  message: '',
  subject: '',
  imageUrl: null as string | null,
  couponEnabled: false,
  couponCode: '',
  scheduledDate: '',
  scheduledTime: '',
})

const campaignTypes: { key: CampaignType; icon: string; label: string; desc: string }[] = [
  { key: 'promotional', icon: '📢', label: 'Promocional', desc: 'Ofertas, novidades, descontos' },
  { key: 'reactivation', icon: '🔄', label: 'Reativação', desc: 'Trazer clientes que sumiram' },
  { key: 'birthday', icon: '🎂', label: 'Aniversariantes', desc: 'Parabéns + cupom' },
  { key: 'launch', icon: '🚀', label: 'Lançamento', desc: 'Novo serviço ou produto' },
  { key: 'informational', icon: '📋', label: 'Informativo', desc: 'Avisos, mudanças, feriados' },
]

const segmentFields = [
  { value: 'status', label: 'Status' },
  { value: 'last_visit', label: 'Última visita' },
  { value: 'tag', label: 'Tag' },
  { value: 'total_spent', label: 'Total gasto' },
  { value: 'service', label: 'Serviço realizado' },
  { value: 'birthday', label: 'Aniversário' },
  { value: 'city', label: 'Cidade' },
]

const segmentOperators = [
  { value: 'equals', label: 'é igual a' },
  { value: 'contains', label: 'contém' },
  { value: 'gt', label: 'maior que' },
  { value: 'lt', label: 'menor que' },
  { value: 'includes', label: 'inclui' },
  { value: 'this_month', label: 'é neste mês' },
  { value: 'more_than', label: 'há mais de' },
]

const addSegmentRule = () => {
  form.segmentRules.push({ field: 'status', operator: 'equals', value: '' })
}

const removeSegmentRule = (i: number) => {
  form.segmentRules.splice(i, 1)
}

// Audience preview count (mock based on rules)
const audienceCount = computed(() => {
  if (form.allClients) return 156
  if (form.segmentRules.length === 0) return 0
  return Math.max(5, Math.floor(156 * (1 - form.segmentRules.length * 0.2)))
})

const viewAudienceOpen = ref(false)

const variables = ['{{nome_cliente}}', '{{nome_negocio}}', '{{link_agendamento}}', '{{codigo_cupom}}', '{{servico}}', '{{hora_agendamento}}', '{{data_agendamento}}']
const variableMenuOpen = ref(false)

const insertVariable = (v: string) => {
  form.message += v
  variableMenuOpen.value = false
}

// Preview messages for phone mockup
const previewMessages = computed<PhoneMessage[]>(() => [
  { sender: 'agent', text: form.message || 'Digite sua mensagem...' },
])

// Can advance per step
const canNext = computed(() => {
  if (currentStep.value === 'config') return !!form.name && !!form.type && !!form.channel
  if (currentStep.value === 'publico') return form.allClients || form.segmentRules.length > 0
  if (currentStep.value === 'mensagem') return form.message.trim().length > 0
  return true
})

// Sending state
const sendProgress = ref(0)
const isSending = ref(false)
const sendComplete = ref(false)
const confirmSendOpen = ref(false)
const scheduleOpen = ref(false)

const handleSendNow = async () => {
  confirmSendOpen.value = false
  const newCamp = addCampaign({
    name: form.name,
    type: form.type,
    channel: form.channel,
    status: 'sending',
    audienceSize: audienceCount.value,
    scheduledAt: null,
    sentAt: null,
    message: form.message,
    subject: form.subject || undefined,
    imageUrl: null,
    couponCode: form.couponEnabled ? form.couponCode : null,
    segmentRules: form.segmentRules,
    allClients: form.allClients,
  })
  isSending.value = true
  sendProgress.value = 0

  // Animate progress
  const interval = setInterval(() => {
    sendProgress.value += 5 + Math.floor(Math.random() * 10)
    if (sendProgress.value >= 100) {
      sendProgress.value = 100
      clearInterval(interval)
      sendComplete.value = true
      setTimeout(() => {
        isSending.value = false
        newCampaignOpen.value = false
        sendCampaign(newCamp.id)
        navigateTo(`/saas/campanhas/${newCamp.id}`)
      }, 1000)
    }
  }, 200)
}

const handleSchedule = () => {
  if (!form.scheduledDate || !form.scheduledTime) {
    toast.warning('Informe data e hora.')
    return
  }
  const datetime = `${form.scheduledDate}T${form.scheduledTime}:00`
  const newCamp = addCampaign({
    name: form.name,
    type: form.type,
    channel: form.channel,
    status: 'scheduled',
    audienceSize: audienceCount.value,
    scheduledAt: datetime,
    sentAt: null,
    message: form.message,
    couponCode: form.couponEnabled ? form.couponCode : null,
    segmentRules: form.segmentRules,
    allClients: form.allClients,
  })
  scheduleCampaign(newCamp.id, datetime)
  scheduleOpen.value = false
  newCampaignOpen.value = false
  activeTab.value = 'agendadas'
}

const handleSaveDraft = () => {
  addCampaign({
    name: form.name || 'Rascunho sem nome',
    type: form.type,
    channel: form.channel,
    status: 'draft',
    audienceSize: audienceCount.value,
    scheduledAt: null,
    sentAt: null,
    message: form.message,
    couponCode: form.couponEnabled ? form.couponCode : null,
    segmentRules: form.segmentRules,
    allClients: form.allClients,
  })
  newCampaignOpen.value = false
  toast.success('Rascunho salvo!')
  activeTab.value = 'rascunhos'
}

const resetForm = () => {
  currentStep.value = 'config'
  Object.assign(form, {
    name: '', type: 'promotional', channel: 'whatsapp',
    allClients: true, segmentRules: [],
    message: '', subject: '', couponEnabled: false, couponCode: '',
    scheduledDate: '', scheduledTime: '',
  })
  sendProgress.value = 0
  isSending.value = false
  sendComplete.value = false
}

watch(newCampaignOpen, v => { if (!v) resetForm() })
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 style="font-size:24px;font-weight:700;color:var(--zima-text-primary);margin:0;">Campanhas</h1>
      <ZimaButton @click="newCampaignOpen = true">
        <template #icon-left><Icon name="i-lucide-plus" style="width:14px;height:14px;" /></template>
        Nova Campanha
      </ZimaButton>
    </div>

    <!-- Tabs -->
    <div style="display:flex; gap:0; border-bottom:1px solid var(--zima-border-divider); margin-bottom:24px;">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        style="padding:10px 20px; background:none; border:none; cursor:pointer; font-size:14px; font-weight:500; border-bottom:2px solid transparent; transition:all 150ms; margin-bottom:-1px;"
        :style="{
          color: activeTab === tab.key ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
          borderBottomColor: activeTab === tab.key ? 'var(--zima-blue-core)' : 'transparent',
        }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="campaigns.filter(c => tabStatusMap[tab.key].includes(c.status)).length" style="margin-left:6px;font-size:11px;background:rgba(148,163,184,0.1);border-radius:10px;padding:1px 6px;color:var(--zima-text-muted);">
          {{ campaigns.filter(c => tabStatusMap[tab.key].includes(c.status)).length }}
        </span>
      </button>
    </div>

    <!-- Table -->
    <ZimaTable
      :columns="tableColumns"
      :rows="tableRows"
      row-clickable
      empty-title="Nenhuma campanha encontrada"
      empty-icon="i-lucide-megaphone"
      :empty-description="`Ainda não há campanhas ${activeTab === 'ativas' ? 'ativas' : activeTab === 'rascunhos' ? 'em rascunho' : activeTab === 'enviadas' ? 'enviadas' : 'agendadas'}.`"
      @row-click="row => navigateTo(`/saas/campanhas/${row.id}`)"
    >
      <template #cell-nome="{ row }">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:2px;">
            <span style="font-size:15px;">{{ typeMeta[row.type as CampaignType].icon }}</span>
            <span style="font-size:13px;font-weight:500;color:var(--zima-text-primary);">{{ row.name }}</span>
          </div>
          <ZimaBadge variant="neutral" size="sm">{{ typeMeta[row.type as CampaignType].label }}</ZimaBadge>
        </div>
      </template>

      <template #cell-canal="{ row }">
        <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
          <Icon :name="channelMeta[row.channel as CampaignChannel].icon" style="width:16px;height:16px;" :style="{ color: channelMeta[row.channel as CampaignChannel].color }" />
          <span style="font-size:12px; color:var(--zima-text-muted);">{{ channelMeta[row.channel as CampaignChannel].label }}</span>
        </div>
      </template>

      <template #cell-publico="{ row }">
        <div style="text-align:center; font-size:13px; color:var(--zima-text-secondary);">{{ row.audienceSize }} clientes</div>
      </template>

      <template #cell-status="{ row }">
        <div style="display:flex; justify-content:center;">
          <ZimaBadge :variant="statusMeta[row.status as Campaign['status']].variant" size="sm" :dot="row.status === 'sending'">
            {{ statusMeta[row.status as Campaign['status']].label }}
          </ZimaBadge>
        </div>
      </template>

      <template #cell-agendada="{ row }">
        <span style="font-size:12px; color:var(--zima-text-muted);">{{ formatDate(row.scheduledAt) }}</span>
      </template>

      <template #cell-metricas="{ row }">
        <div v-if="row.status === 'sent' && row.metrics.sent > 0" style="font-size:11px; color:var(--zima-text-muted); display:flex; gap:8px;">
          <span>{{ row.metrics.sent }} env.</span>
          <span>{{ row.metrics.delivered }} entr.</span>
          <span>{{ row.metrics.read }} lidas</span>
          <span>{{ row.metrics.replied }} resp.</span>
        </div>
        <span v-else style="font-size:12px; color:var(--zima-text-muted);">—</span>
      </template>

      <template #cell-acoes="{ row }">
        <div style="display:flex; gap:4px; justify-content:flex-end;" @click.stop>
          <ZimaButton v-if="row.status === 'sent'" size="sm" variant="ghost" @click="navigateTo(`/saas/campanhas/${row.id}`)">
            Relatório
          </ZimaButton>
          <ZimaButton size="sm" variant="ghost" @click="deleteCampaign(row.id)">
            <Icon name="i-lucide-trash-2" style="width:13px;height:13px;color:var(--zima-danger);" />
          </ZimaButton>
        </div>
      </template>
    </ZimaTable>

    <!-- ── MODAL NOVA CAMPANHA ─────────────────────────────────────────────── -->
    <ZimaModal v-model="newCampaignOpen" title="Nova Campanha" size="xl" :prevent-close="isSending">
      <div v-if="!isSending">
        <ZimaStepper :steps="STEPS" :model-value="currentStep" style="margin-bottom: 24px;" />

        <!-- Step 1: Config -->
        <div v-if="currentStep === 'config'" class="flex flex-col gap-5">
          <ZimaInput v-model="form.name" label="Nome da campanha" placeholder="Ex: Promoção de Maio — Coloração" required />

          <div>
            <div style="font-size:13px; font-weight:500; color:var(--zima-text-secondary); margin-bottom:10px;">Tipo de campanha</div>
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;">
              <div
                v-for="t in campaignTypes"
                :key="t.key"
                style="padding:12px; border-radius:var(--zima-radius-md); cursor:pointer; text-align:center; transition:all 150ms; border:1.5px solid;"
                :style="{
                  background: form.type === t.key ? 'rgba(59,130,246,0.06)' : 'var(--zima-bg-surface-2)',
                  borderColor: form.type === t.key ? 'var(--zima-blue-core)' : 'var(--zima-border-default)',
                }"
                @click="form.type = t.key"
              >
                <div style="font-size:22px; margin-bottom:4px;">{{ t.icon }}</div>
                <div style="font-size:12px; font-weight:600; color:var(--zima-text-primary);">{{ t.label }}</div>
                <div style="font-size:11px; color:var(--zima-text-muted); margin-top:2px;">{{ t.desc }}</div>
              </div>
            </div>
          </div>

          <ZimaSelect v-model="form.channel" :options="[{value:'whatsapp',label:'WhatsApp'},{value:'instagram',label:'Instagram'},{value:'email',label:'Email'}]" label="Canal de envio" />
        </div>

        <!-- Step 2: Público -->
        <div v-else-if="currentStep === 'publico'" class="flex flex-col gap-4">
          <div style="display:flex; gap:12px;">
            <div
              style="flex:1; padding:14px; border-radius:var(--zima-radius-md); cursor:pointer; transition:all 150ms; border:1.5px solid;"
              :style="{ background: form.allClients ? 'rgba(59,130,246,0.06)' : 'var(--zima-bg-surface-2)', borderColor: form.allClients ? 'var(--zima-blue-core)' : 'var(--zima-border-default)' }"
              @click="form.allClients = true"
            >
              <div style="font-size:13px; font-weight:600; color:var(--zima-text-primary); margin-bottom:2px;">Todos os clientes</div>
              <div style="font-size:12px; color:var(--zima-text-muted);">Envia para toda a base (156 clientes)</div>
            </div>
            <div
              style="flex:1; padding:14px; border-radius:var(--zima-radius-md); cursor:pointer; transition:all 150ms; border:1.5px solid;"
              :style="{ background: !form.allClients ? 'rgba(59,130,246,0.06)' : 'var(--zima-bg-surface-2)', borderColor: !form.allClients ? 'var(--zima-blue-core)' : 'var(--zima-border-default)' }"
              @click="form.allClients = false"
            >
              <div style="font-size:13px; font-weight:600; color:var(--zima-text-primary); margin-bottom:2px;">Segmentar</div>
              <div style="font-size:12px; color:var(--zima-text-muted);">Filtrar por critérios específicos</div>
            </div>
          </div>

          <div v-if="!form.allClients" class="flex flex-col gap-3">
            <div v-for="(rule, i) in form.segmentRules" :key="i" style="display:flex; align-items:center; gap:8px;">
              <ZimaSelect v-model="rule.field" :options="segmentFields" style="flex:1;" />
              <ZimaSelect v-model="rule.operator" :options="segmentOperators" style="flex:1;" />
              <ZimaInput v-model="rule.value" placeholder="Valor" style="flex:1;" />
              <button style="background:none;border:none;cursor:pointer;color:var(--zima-text-muted);flex-shrink:0;" @click="removeSegmentRule(i)">
                <Icon name="i-lucide-x" style="width:14px;height:14px;" />
              </button>
            </div>
            <ZimaButton variant="ghost" size="sm" style="align-self:flex-start;" @click="addSegmentRule">
              <template #icon-left><Icon name="i-lucide-plus" style="width:12px;height:12px;" /></template>
              Adicionar regra
            </ZimaButton>
          </div>

          <!-- Preview counter -->
          <div style="padding:14px 16px; background:rgba(59,130,246,0.06); border-radius:var(--zima-radius-md); border:1px solid rgba(59,130,246,0.12); display:flex; align-items:center; justify-content:space-between;">
            <div style="font-size:13px; color:var(--zima-text-secondary);">
              Esta campanha será enviada para <strong style="color:var(--zima-blue-core);">{{ audienceCount }} clientes</strong>
            </div>
            <ZimaButton size="sm" variant="ghost" @click="viewAudienceOpen = true">Ver lista</ZimaButton>
          </div>
        </div>

        <!-- Step 3: Mensagem -->
        <div v-else-if="currentStep === 'mensagem'">
          <div style="display:grid; grid-template-columns:1fr 280px; gap:24px;">
            <div class="flex flex-col gap-4">
              <!-- Subject for email -->
              <ZimaInput v-if="form.channel === 'email'" v-model="form.subject" label="Assunto do email" placeholder="Ex: Oferta especial para você!" />

              <div>
                <div style="font-size:13px; font-weight:500; color:var(--zima-text-secondary); margin-bottom:8px;">Mensagem</div>
                <!-- Toolbar -->
                <div style="display:flex; align-items:center; gap:4px; padding:6px 8px; background:var(--zima-bg-surface-2); border-radius:6px 6px 0 0; border:1px solid var(--zima-border-default); border-bottom:none;">
                  <button style="padding:4px 8px; background:none; border:none; cursor:pointer; color:var(--zima-text-muted); font-size:13px; font-weight:700; border-radius:4px;" @click="form.message += '*texto*'" title="Negrito">B</button>
                  <button style="padding:4px 8px; background:none; border:none; cursor:pointer; color:var(--zima-text-muted); font-size:13px; font-style:italic; border-radius:4px;" @click="form.message += '_texto_'" title="Itálico">I</button>
                  <div style="width:1px; height:16px; background:rgba(148,163,184,0.12); margin:0 4px;" />
                  <div style="position:relative;">
                    <button style="padding:4px 8px; background:none; border:none; cursor:pointer; color:var(--zima-text-muted); font-size:12px; border-radius:4px;" @click="variableMenuOpen = !variableMenuOpen">
                      Inserir variável ▾
                    </button>
                    <div v-if="variableMenuOpen" style="position:absolute; top:100%; left:0; background:#1E2535; border:1px solid rgba(148,163,184,0.15); border-radius:6px; padding:4px; z-index:20; min-width:180px; box-shadow:0 8px 24px rgba(0,0,0,0.3);">
                      <button
                        v-for="v in variables"
                        :key="v"
                        style="display:block; width:100%; text-align:left; padding:6px 10px; background:none; border:none; cursor:pointer; font-size:12px; color:var(--zima-blue-core); font-family:monospace; border-radius:4px;"
                        @click="insertVariable(v)"
                        @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.08)'"
                        @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
                      >{{ v }}</button>
                    </div>
                  </div>
                </div>
                <textarea
                  v-model="form.message"
                  rows="6"
                  placeholder="Olá {{nome_cliente}}! ..."
                  style="width:100%;padding:10px 12px;background:var(--zima-bg-surface-2);border:1px solid var(--zima-border-default);border-radius:0 0 6px 6px;color:var(--zima-text-primary);font-size:13px;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box;"
                />
              </div>

              <!-- WhatsApp warning -->
              <div v-if="form.channel === 'whatsapp'" style="padding:10px 14px; background:rgba(245,158,11,0.08); border-radius:var(--zima-radius-md); border:1px solid rgba(245,158,11,0.2);">
                <div style="font-size:12px; color:#F59E0B;">⚠️ Mensagens para clientes que não interagiram nas últimas 24h devem usar um template aprovado pela Meta.</div>
              </div>

              <!-- Coupon -->
              <div style="padding:14px 16px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-md); border:1px solid var(--zima-border-default);">
                <ZimaToggle v-model="form.couponEnabled" label="Incluir cupom na mensagem" />
                <ZimaInput v-if="form.couponEnabled" v-model="form.couponCode" label="Código do cupom" placeholder="Ex: PROMO20" style="margin-top:12px;" />
              </div>
            </div>

            <!-- Phone preview -->
            <div>
              <div style="font-size:12px; font-weight:500; color:var(--zima-text-muted); margin-bottom:8px; text-align:center;">Preview</div>
              <ZimaPhonePreview agent-name="Studio Beleza" :messages="previewMessages" />
            </div>
          </div>
        </div>

        <!-- Step 4: Revisão -->
        <div v-else-if="currentStep === 'revisao'" class="flex flex-col gap-4">
          <div style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);">
            <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px;">Resumo da campanha</div>
            <div class="flex flex-col gap-3">
              <div style="display:flex; justify-content:space-between; font-size:13px;">
                <span style="color:var(--zima-text-muted);">Nome:</span>
                <span style="color:var(--zima-text-primary); font-weight:500;">{{ form.name }}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:13px;">
                <span style="color:var(--zima-text-muted);">Tipo:</span>
                <span style="color:var(--zima-text-secondary);">{{ typeMeta[form.type].icon }} {{ typeMeta[form.type].label }}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:13px;">
                <span style="color:var(--zima-text-muted);">Canal:</span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <Icon :name="channelMeta[form.channel].icon" style="width:14px;height:14px;" :style="{ color: channelMeta[form.channel].color }" />
                  <span style="color:var(--zima-text-secondary);">{{ channelMeta[form.channel].label }}</span>
                </div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:13px;">
                <span style="color:var(--zima-text-muted);">Público:</span>
                <span style="color:var(--zima-blue-core); font-weight:600;">{{ audienceCount }} clientes</span>
              </div>
              <div v-if="form.couponEnabled && form.couponCode" style="display:flex; justify-content:space-between; font-size:13px;">
                <span style="color:var(--zima-text-muted);">Cupom:</span>
                <code style="font-size:12px; color:var(--zima-blue-core); background:rgba(59,130,246,0.08); padding:2px 6px; border-radius:4px;">{{ form.couponCode }}</code>
              </div>
            </div>
            <div style="margin-top:16px; padding:12px; background:rgba(148,163,184,0.04); border-radius:8px; border:1px solid rgba(148,163,184,0.08);">
              <div style="font-size:11px; color:var(--zima-text-muted); margin-bottom:4px;">Mensagem:</div>
              <div style="font-size:13px; color:var(--zima-text-secondary);">{{ form.message }}</div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:8px;">
            <ZimaButton style="width:100%;" @click="confirmSendOpen = true">
              <template #icon-left><Icon name="i-lucide-send" style="width:14px;height:14px;" /></template>
              Enviar agora
            </ZimaButton>
            <ZimaButton variant="ghost" style="width:100%;" @click="scheduleOpen = true">
              <template #icon-left><Icon name="i-lucide-calendar-clock" style="width:14px;height:14px;" /></template>
              Agendar
            </ZimaButton>
            <ZimaButton variant="ghost" style="width:100%;" @click="handleSaveDraft">
              <template #icon-left><Icon name="i-lucide-file" style="width:14px;height:14px;" /></template>
              Salvar como rascunho
            </ZimaButton>
          </div>
        </div>
      </div>

      <!-- Sending progress -->
      <div v-else style="padding:40px; text-align:center;">
        <div v-if="!sendComplete">
          <div style="font-size:15px; font-weight:600; color:var(--zima-text-primary); margin-bottom:20px;">
            Enviando... {{ Math.min(sendProgress, 100) }}/{{ audienceCount }} ({{ Math.min(sendProgress, 100) }}%)
          </div>
          <div style="background:rgba(148,163,184,0.08); border-radius:99px; height:8px; overflow:hidden; margin-bottom:12px;">
            <div style="height:100%; border-radius:99px; background:var(--zima-blue-core); transition:width 200ms;" :style="{ width: `${Math.min(sendProgress, 100)}%` }" />
          </div>
          <div style="font-size:13px; color:var(--zima-text-muted);">Aguarde, estamos enviando as mensagens...</div>
        </div>
        <div v-else>
          <Icon name="i-lucide-check-circle-2" style="width:48px;height:48px;color:#10B981;margin-bottom:12px;" />
          <div style="font-size:15px; font-weight:600; color:#10B981;">Campanha enviada com sucesso para {{ audienceCount }} clientes!</div>
        </div>
      </div>

      <template #footer="{ close }">
        <div v-if="!isSending" class="flex items-center justify-between w-full">
          <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
          <div class="flex items-center gap-2">
            <ZimaButton v-if="currentStep !== 'config'" variant="ghost" @click="prevStep">Voltar</ZimaButton>
            <ZimaButton v-if="currentStep !== 'revisao'" :disabled="!canNext" @click="nextStep">Próximo</ZimaButton>
          </div>
        </div>
      </template>
    </ZimaModal>

    <!-- Confirm send modal -->
    <ZimaModal v-model="confirmSendOpen" title="Confirmar envio" size="sm" danger>
      <div style="font-size:14px; color:var(--zima-text-secondary); text-align:center; padding:8px 0;">
        Enviar para <strong style="color:var(--zima-text-primary);">{{ audienceCount }} clientes</strong> agora?<br />
        <span style="font-size:12px; color:var(--zima-text-muted); margin-top:4px; display:block;">Esta ação não pode ser desfeita.</span>
      </div>
      <template #footer="{ close }">
        <div class="flex items-center justify-between w-full">
          <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
          <ZimaButton @click="handleSendNow">Enviar Campanha</ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- Schedule modal -->
    <ZimaModal v-model="scheduleOpen" title="Agendar campanha" size="sm">
      <div class="flex flex-col gap-4">
        <ZimaInput v-model="form.scheduledDate" type="date" label="Data" />
        <ZimaInput v-model="form.scheduledTime" type="time" label="Hora" />
      </div>
      <template #footer="{ close }">
        <div class="flex items-center justify-between w-full">
          <ZimaButton variant="ghost" @click="close">Cancelar</ZimaButton>
          <ZimaButton @click="handleSchedule">Agendar Campanha</ZimaButton>
        </div>
      </template>
    </ZimaModal>

    <!-- View audience modal -->
    <ZimaModal v-model="viewAudienceOpen" title="Público da campanha" size="md">
      <div class="flex flex-col gap-2">
        <div v-for="i in Math.min(audienceCount, 10)" :key="i" style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid rgba(148,163,184,0.06);">
          <ZimaAvatar :name="`Cliente ${i}`" size="sm" />
          <span style="font-size:13px; color:var(--zima-text-secondary);">Cliente {{ i }}</span>
        </div>
        <div v-if="audienceCount > 10" style="font-size:12px; color:var(--zima-text-muted); text-align:center; padding:8px 0;">
          +{{ audienceCount - 10 }} clientes
        </div>
      </div>
      <template #footer="{ close }">
        <ZimaButton variant="ghost" @click="close">Fechar</ZimaButton>
      </template>
    </ZimaModal>
  </div>
</template>
