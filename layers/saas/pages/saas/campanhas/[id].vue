<script setup lang="ts">
import type { Campaign, CampaignChannel } from '../../../composables/useCampaigns'
import { useCampaigns } from '../../../composables/useCampaigns'

definePageMeta({ layout: 'saas' })

const route = useRoute()
const { getCampaign } = useCampaigns()

const campaign = computed(() => getCampaign(route.params.id as string))

const channelMeta: Record<CampaignChannel, { icon: string; color: string; label: string }> = {
  whatsapp:  { icon: 'i-lucide-message-circle', color: '#25D366', label: 'WhatsApp' },
  instagram: { icon: 'i-lucide-instagram', color: '#E1306C', label: 'Instagram' },
  email:     { icon: 'i-lucide-mail', color: '#3B82F6', label: 'Email' },
}

const statusMeta: Record<Campaign['status'], { label: string; variant: 'neutral' | 'blue' | 'warning' | 'success' | 'danger' }> = {
  draft:     { label: 'Rascunho', variant: 'neutral' },
  scheduled: { label: 'Agendada', variant: 'blue' },
  sending:   { label: 'Enviando', variant: 'warning' },
  sent:      { label: 'Enviada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
}

const formatDate = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Funnel data
const funnelSteps = computed(() => {
  if (!campaign.value) return []
  const { sent, delivered, read, replied, converted } = campaign.value.metrics
  return [
    { label: 'Enviadas', value: sent, color: '#3B82F6' },
    { label: 'Entregues', value: delivered, color: '#6366F1' },
    { label: 'Lidas', value: read, color: '#8B5CF6' },
    { label: 'Responderam', value: replied, color: '#EC4899' },
    { label: 'Converteram', value: converted, color: '#10B981' },
  ]
})

const funnelMax = computed(() => funnelSteps.value[0]?.value || 1)

const dropOff = (current: number, prev: number) => {
  if (!prev) return 0
  return Math.round(((prev - current) / prev) * 100)
}

// Line chart mock data (readings over time)
const lineData = computed(() => {
  if (!campaign.value || campaign.value.metrics.read === 0) return []
  const total = campaign.value.metrics.read
  return [0, 0.05, 0.15, 0.3, 0.55, 0.72, 0.82, 0.9, 0.95, 0.97, 0.98, 1].map((v, i) => ({
    h: i,
    value: Math.round(v * total),
  }))
})

const svgW = 400
const svgH = 80
const linePoints = computed(() => {
  if (!lineData.value.length) return ''
  const max = lineData.value[lineData.value.length - 1].value || 1
  return lineData.value
    .map((d, i) => `${(i / (lineData.value.length - 1)) * svgW},${svgH - (d.value / max) * (svgH - 10) - 5}`)
    .join(' ')
})

// Table mock rows
const tableRows = computed(() => {
  if (!campaign.value) return []
  const names = ['Maria Silva', 'João Santos', 'Ana Costa', 'Carlos Lima', 'Beatriz Ferreira', 'Roberto Alves', 'Fernanda Oliveira', 'Lucas Pereira', 'Camila Rocha', 'Eduardo Martins']
  const { delivered, read, replied, converted } = campaign.value.metrics
  const total = campaign.value.metrics.sent
  return names.slice(0, Math.min(10, total)).map((name, i) => ({
    id: `cli-${i + 1}`,
    name,
    status: i < total ? 'Enviado' : 'Falhou',
    sent: i < total,
    delivered: i < delivered,
    readTime: i < read ? `${8 + i}:${String(30 + i * 3 % 30).padStart(2, '0')}` : null,
    replied: i < replied ? `"${['Quero agendar', 'Me interessa!', 'Obrigada', 'Que desconto?', 'Ótimo!'][i % 5]}"` : null,
    converted: i < converted,
    convId: `conv-${i + 1}`,
  }))
})

const tableColumns = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'delivered', label: 'Entregue', width: '90px', align: 'center' as const },
  { key: 'read', label: 'Lido', width: '90px', align: 'center' as const },
  { key: 'replied', label: 'Respondeu', width: '160px' },
  { key: 'converted', label: 'Converteu', width: '100px', align: 'center' as const },
]
</script>

<template>
  <div>
    <div v-if="!campaign" class="flex items-center justify-center" style="padding:60px;">
      <div style="text-align:center; color:var(--zima-text-muted);">
        <Icon name="i-lucide-megaphone" style="width:40px;height:40px;margin-bottom:12px;opacity:0.4;" />
        <div>Campanha não encontrada</div>
        <NuxtLink to="/saas/campanhas" style="color:var(--zima-blue-core); font-size:13px;">← Voltar para campanhas</NuxtLink>
      </div>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <NuxtLink to="/saas/campanhas" style="color:var(--zima-text-muted); font-size:13px; text-decoration:none; display:flex; align-items:center; gap:4px;">
              <Icon name="i-lucide-arrow-left" style="width:14px;height:14px;" />
              Campanhas
            </NuxtLink>
            <span style="color:var(--zima-text-muted);">/</span>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <h1 style="font-size:22px; font-weight:700; color:var(--zima-text-primary); margin:0;">{{ campaign.name }}</h1>
            <ZimaBadge :variant="statusMeta[campaign.status].variant" size="sm">{{ statusMeta[campaign.status].label }}</ZimaBadge>
          </div>
          <div style="margin-top:6px; display:flex; align-items:center; gap:12px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <Icon :name="channelMeta[campaign.channel].icon" style="width:14px;height:14px;" :style="{ color: channelMeta[campaign.channel].color }" />
              <span style="font-size:13px; color:var(--zima-text-muted);">{{ channelMeta[campaign.channel].label }}</span>
            </div>
            <span style="font-size:13px; color:var(--zima-text-muted);">Enviada: {{ formatDate(campaign.sentAt) }}</span>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:28px;">
        <div
          v-for="(step, i) in funnelSteps"
          :key="i"
          style="padding:16px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default); text-align:center;"
        >
          <div style="font-size:11px; font-weight:600; color:var(--zima-text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px;">{{ step.label }}</div>
          <div style="font-size:26px; font-weight:700; color:var(--zima-text-primary);">{{ step.value }}</div>
          <div style="font-size:12px; color:var(--zima-text-muted); margin-top:2px;">
            {{ step.value === campaign.metrics.sent ? '100%' : `${Math.round((step.value / campaign.metrics.sent) * 100)}%` }}
          </div>
          <!-- Mini progress bar -->
          <div style="height:3px; background:rgba(148,163,184,0.08); border-radius:99px; margin-top:8px;">
            <div style="height:100%; border-radius:99px; transition:width 500ms;" :style="{ width: `${Math.round((step.value / funnelMax) * 100)}%`, background: step.color }" />
          </div>
        </div>
      </div>

      <!-- Charts row -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:28px;">
        <!-- Funnel -->
        <div style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);">
          <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px;">Funil de conversão</div>
          <div class="flex flex-col gap-3">
            <div v-for="(step, i) in funnelSteps" :key="i">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                <span style="font-size:12px; color:var(--zima-text-secondary);">{{ step.label }}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:12px; font-weight:600; color:var(--zima-text-primary);">{{ step.value }}</span>
                  <span v-if="i > 0" style="font-size:11px; color:#EF4444;">-{{ dropOff(step.value, funnelSteps[i-1].value) }}%</span>
                </div>
              </div>
              <div style="height:20px; background:rgba(148,163,184,0.06); border-radius:4px; overflow:hidden;">
                <div
                  style="height:100%; border-radius:4px; transition:width 500ms; display:flex; align-items:center; padding:0 8px;"
                  :style="{ width: `${Math.round((step.value / funnelMax) * 100)}%`, background: `${step.color}30`, border: `1px solid ${step.color}40` }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Line chart -->
        <div style="padding:20px; background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default);">
          <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary); margin-bottom:16px;">Leituras ao longo do tempo</div>
          <div v-if="lineData.length > 0">
            <svg :viewBox="`0 0 ${svgW} ${svgH}`" style="width:100%; height:80px; overflow:visible;">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.2" />
                  <stop offset="100%" stop-color="#3B82F6" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polyline
                :points="linePoints"
                fill="none"
                stroke="#3B82F6"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                v-for="(d, i) in lineData"
                :key="i"
                :cx="(i / (lineData.length - 1)) * svgW"
                :cy="svgH - (d.value / (lineData[lineData.length-1].value || 1)) * (svgH - 10) - 5"
                r="3"
                fill="#3B82F6"
              />
            </svg>
            <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--zima-text-muted); margin-top:4px;">
              <span>00h</span><span>03h</span><span>06h</span><span>09h</span><span>12h</span>
            </div>
          </div>
          <div v-else style="display:flex; align-items:center; justify-content:center; height:80px; color:var(--zima-text-muted); font-size:13px;">Sem dados de leitura</div>
        </div>
      </div>

      <!-- Detail table -->
      <div style="background:var(--zima-bg-surface-2); border-radius:var(--zima-radius-lg); border:1px solid var(--zima-border-default); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--zima-border-divider);">
          <div style="font-size:14px; font-weight:600; color:var(--zima-text-primary);">Detalhamento por cliente</div>
        </div>
        <ZimaTable :columns="tableColumns" :rows="tableRows" empty-title="Sem dados" empty-icon="i-lucide-users">
          <template #cell-cliente="{ row }">
            <NuxtLink :to="`/saas/clientes/${row.id}`" style="color:var(--zima-blue-core); font-size:13px; font-weight:500; text-decoration:none;">
              {{ row.name }}
            </NuxtLink>
          </template>
          <template #cell-status="{ row }">
            <span style="display:inline-flex; align-items:center; gap:4px; font-size:12px;" :style="{ color: row.sent ? '#10B981' : '#EF4444' }">
              <Icon :name="row.sent ? 'i-lucide-check' : 'i-lucide-x'" style="width:12px; height:12px;" />{{ row.status }}
            </span>
          </template>
          <template #cell-delivered="{ row }">
            <div style="display:flex; justify-content:center;">
              <Icon :name="row.delivered ? 'i-lucide-check' : 'i-lucide-x'" style="width:14px;height:14px;" :style="{ color: row.delivered ? '#10B981' : '#64748B' }" />
            </div>
          </template>
          <template #cell-read="{ row }">
            <div style="display:flex; justify-content:center; font-size:12px; color:var(--zima-text-muted);">
              {{ row.readTime || '—' }}
            </div>
          </template>
          <template #cell-replied="{ row }">
            <NuxtLink v-if="row.replied" :to="`/saas/inbox?conv=${row.convId}`" style="font-size:12px; color:var(--zima-blue-core); text-decoration:none; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block;">
              {{ row.replied }}
            </NuxtLink>
            <span v-else style="font-size:12px; color:var(--zima-text-muted);">—</span>
          </template>
          <template #cell-converted="{ row }">
            <div style="display:flex; justify-content:center;">
              <Icon v-if="row.converted" name="i-lucide-check-circle-2" style="width:16px;height:16px;color:#10B981;" />
              <span v-else style="font-size:12px; color:var(--zima-text-muted);">—</span>
            </div>
          </template>
        </ZimaTable>
      </div>
    </template>
  </div>
</template>
