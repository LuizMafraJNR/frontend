<script setup lang="ts">
import { useReports } from '../../composables/useReports'

definePageMeta({ layout: 'saas' })

const route = useRoute()
const router = useRouter()
const toast = useZimaToast()

const {
  salesByService, salesByProfessional, salesByDay,
  dreMonthly, operationalKpi, customerSegments,
  loading, fetchAll,
} = useReports()

onMounted(() => fetchAll())

// ── Tabs ────────────────────────────────────────────────────────────────────
const tabs = [
  { key: 'vendas',      label: 'Vendas' },
  { key: 'financeiro',  label: 'Financeiro' },
  { key: 'operacional', label: 'Operacional' },
  { key: 'clientes',    label: 'Clientes' },
]
const activeTab = ref<string>((route.query.tab as string) || 'vendas')
watch(activeTab, v => router.replace({ query: { ...route.query, tab: v } }))

// ── Period filter ───────────────────────────────────────────────────────────
const period = ref<'7d' | '30d' | '90d' | 'year'>('30d')
const periodOptions = [
  { key: '7d',   label: '7 dias' },
  { key: '30d',  label: '30 dias' },
  { key: '90d',  label: '90 dias' },
  { key: 'year', label: 'Ano' },
]

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmtCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtNumber = (v: number) => v.toLocaleString('pt-BR')
const fmtPercent = (v: number) => `${v.toFixed(1).replace('.', ',')}%`

// ── KPIs — Vendas ────────────────────────────────────────────────────────────
const totalRevenueVendas = computed(() =>
  salesByDay.value.reduce((sum, d) => sum + d.revenue, 0),
)
const totalCountVendas = computed(() =>
  salesByDay.value.reduce((sum, d) => sum + d.count, 0),
)
const avgTicketVendas = computed(() =>
  totalCountVendas.value ? totalRevenueVendas.value / totalCountVendas.value : 0,
)
const bestServiceName = computed(() =>
  [...salesByService.value].sort((a, b) => b.revenue - a.revenue)[0]?.service ?? '—',
)

// ── KPIs — Financeiro ───────────────────────────────────────────────────────
const totalProfit = computed(() =>
  dreMonthly.value.reduce((sum, d) => sum + d.profit, 0),
)
const totalExpenses = computed(() =>
  dreMonthly.value.reduce((sum, d) => sum + d.expenses, 0),
)
const profitMargin = computed(() => {
  const revenue = dreMonthly.value.reduce((sum, d) => sum + d.revenue, 0)
  return revenue ? (totalProfit.value / revenue) * 100 : 0
})

// ── Sparkline helper (last 30d vendas) ──────────────────────────────────────
const buildSparklinePath = (data: number[], w = 640, h = 120) => {
  if (!data.length) return ''
  const pad = 4
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M${pts.join(' L')}`
}

const vendasSparkline = computed(() =>
  buildSparklinePath(salesByDay.value.map(d => d.revenue)),
)
const dreRevenueSparkline = computed(() =>
  buildSparklinePath(dreMonthly.value.map(d => d.revenue)),
)

// ── Bars (daily revenue) ────────────────────────────────────────────────────
const maxDailyRevenue = computed(() =>
  Math.max(1, ...salesByDay.value.map(d => d.revenue)),
)

// ── Export CSV (por tab) ────────────────────────────────────────────────────
const escapeCSV = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[";,\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const downloadCSV = (filename: string, header: string[], rows: unknown[][]) => {
  const lines = [header.join(',')]
  for (const r of rows) lines.push(r.map(escapeCSV).join(','))
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const exportCurrent = () => {
  const today = new Date().toISOString().slice(0, 10)
  if (activeTab.value === 'vendas') {
    downloadCSV(
      `vendas-por-servico-${today}.csv`,
      ['Serviço', 'Quantidade', 'Receita (R$)', 'Ticket médio (R$)'],
      salesByService.value.map(r => [r.service, r.quantity, r.revenue.toFixed(2).replace('.', ','), r.avgTicket.toFixed(2).replace('.', ',')]),
    )
  } else if (activeTab.value === 'financeiro') {
    downloadCSV(
      `dre-${today}.csv`,
      ['Mês', 'Receita (R$)', 'Despesa (R$)', 'Lucro (R$)'],
      dreMonthly.value.map(r => [r.label, r.revenue, r.expenses, r.profit]),
    )
  } else if (activeTab.value === 'operacional') {
    downloadCSV(
      `operacional-${today}.csv`,
      ['Métrica', 'Valor'],
      [
        ['Taxa de ocupação (%)', operationalKpi.value.occupancyRate],
        ['Taxa de no-show (%)', operationalKpi.value.noShowRate],
        ['Duração média serviço (min)', operationalKpi.value.avgServiceDuration],
        ['Agendamentos totais', operationalKpi.value.totalAppointments],
        ['Serviços realizados', operationalKpi.value.totalServicesDone],
      ],
    )
  } else {
    downloadCSV(
      `clientes-por-segmento-${today}.csv`,
      ['Segmento', 'Clientes', 'Ticket médio (R$)', 'Receita total (R$)'],
      customerSegments.value.map(r => [r.segment, r.count, r.avgTicket, r.totalRevenue]),
    )
  }
  toast.success('Relatório exportado.')
}
</script>

<template>
  <div>
    <!-- ── Header ───────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 style="font-size: 24px; font-weight: 700; color: var(--zima-text-primary); margin: 0;">Relatórios</h1>
        <p style="font-size: 13px; color: var(--zima-text-muted); margin-top: 2px;">
          Vendas, financeiro, operacional e clientes.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div
          class="inline-flex rounded-md overflow-hidden hide-scrollbar"
          :style="{ background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)' }"
        >
          <button
            v-for="p in periodOptions"
            :key="p.key"
            class="px-3 py-1.5 text-xs font-medium transition-colors"
            :style="{
              color: period === p.key ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)',
              background: period === p.key ? 'var(--zima-blue-subtle)' : 'transparent',
            }"
            @click="period = p.key as typeof period"
          >
            {{ p.label }}
          </button>
        </div>

        <ZimaButton size="sm" variant="ghost" @click="exportCurrent">
          <template #icon-left><Icon name="i-lucide-download" style="width:14px;height:14px;" /></template>
          Exportar
        </ZimaButton>
      </div>
    </div>

    <!-- ── Sub-tabs ─────────────────────────────────────────────────────── -->
    <div style="border-bottom: 1px solid var(--zima-border-divider); display: flex; gap: 4px; margin-bottom: 24px; overflow-x: auto;" class="hide-scrollbar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        style="padding: 10px 16px; font-size: 13px; font-weight: 500; background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 150ms; white-space: nowrap;"
        :style="{
          color: activeTab === tab.key ? 'var(--zima-blue-core)' : 'var(--zima-text-muted)',
          borderBottomColor: activeTab === tab.key ? 'var(--zima-blue-core)' : 'transparent',
          marginBottom: '-1px',
        }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ── Loading ──────────────────────────────────────────────────────── -->
    <template v-if="loading">
      <ZimaSkeleton preset="card" height="400px" />
    </template>

    <!-- ── TAB: Vendas ──────────────────────────────────────────────────── -->
    <template v-else-if="activeTab === 'vendas'">
      <!-- KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <ZimaKpiCard label="Receita total" :value="fmtCurrency(totalRevenueVendas)" icon="i-lucide-dollar-sign" />
        <ZimaKpiCard label="Vendas" :value="fmtNumber(totalCountVendas)" icon="i-lucide-shopping-bag" />
        <ZimaKpiCard label="Ticket médio" :value="fmtCurrency(avgTicketVendas)" icon="i-lucide-receipt" />
        <ZimaKpiCard label="Serviço campeão" :value="bestServiceName" icon="i-lucide-award" />
      </div>

      <!-- Receita diária -->
      <ZimaCard class="mb-6">
        <template #header>
          <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">Receita por dia — últimos 30 dias</span>
        </template>
        <svg viewBox="0 0 640 160" width="100%" height="160" style="display: block;">
          <g
            v-for="(d, idx) in salesByDay"
            :key="d.date"
          >
            <rect
              :x="idx * (640 / salesByDay.length) + 2"
              :y="160 - (d.revenue / maxDailyRevenue) * 140"
              :width="(640 / salesByDay.length) - 4"
              :height="(d.revenue / maxDailyRevenue) * 140"
              :style="{ fill: 'var(--zima-blue-core)', opacity: 0.75, rx: '2px' }"
            />
          </g>
          <path :d="vendasSparkline" fill="none" stroke="var(--zima-blue-light)" stroke-width="1.5" />
        </svg>
      </ZimaCard>

      <!-- Grid: por serviço + por profissional -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ZimaCard>
          <template #header>
            <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">Top serviços por receita</span>
          </template>
          <div class="flex flex-col gap-2">
            <div
              v-for="row in [...salesByService].sort((a, b) => b.revenue - a.revenue)"
              :key="row.service"
              class="flex items-center gap-3"
            >
              <span class="text-sm flex-1" :style="{ color: 'var(--zima-text-primary)' }">{{ row.service }}</span>
              <span class="text-xs tabular-nums" :style="{ color: 'var(--zima-text-muted)' }">{{ row.quantity }}×</span>
              <span class="text-sm font-semibold tabular-nums" style="min-width: 110px; text-align: right; font-family: 'Geist Mono', monospace;" :style="{ color: 'var(--zima-text-primary)' }">
                {{ fmtCurrency(row.revenue) }}
              </span>
            </div>
          </div>
        </ZimaCard>

        <ZimaCard>
          <template #header>
            <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">Receita por profissional</span>
          </template>
          <div class="flex flex-col gap-2">
            <div
              v-for="row in [...salesByProfessional].sort((a, b) => b.revenue - a.revenue)"
              :key="row.professional"
              class="flex items-center gap-3"
            >
              <span class="text-sm flex-1" :style="{ color: 'var(--zima-text-primary)' }">{{ row.professional }}</span>
              <span class="text-xs tabular-nums" :style="{ color: 'var(--zima-text-muted)' }">{{ row.appointments }} ag.</span>
              <span class="text-sm font-semibold tabular-nums" style="min-width: 110px; text-align: right; font-family: 'Geist Mono', monospace;" :style="{ color: 'var(--zima-text-primary)' }">
                {{ fmtCurrency(row.revenue) }}
              </span>
            </div>
          </div>
        </ZimaCard>
      </div>
    </template>

    <!-- ── TAB: Financeiro ──────────────────────────────────────────────── -->
    <template v-else-if="activeTab === 'financeiro'">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <ZimaKpiCard label="Lucro acumulado" :value="fmtCurrency(totalProfit)" icon="i-lucide-trending-up" />
        <ZimaKpiCard label="Despesas acumuladas" :value="fmtCurrency(totalExpenses)" icon="i-lucide-trending-down" />
        <ZimaKpiCard label="Margem de lucro" :value="fmtPercent(profitMargin)" icon="i-lucide-percent" />
      </div>

      <ZimaCard class="mb-6">
        <template #header>
          <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">DRE mensal</span>
        </template>
        <svg viewBox="0 0 640 180" width="100%" height="180" style="display: block;">
          <path :d="dreRevenueSparkline" fill="none" stroke="var(--zima-blue-core)" stroke-width="2" />
        </svg>
        <div class="mt-4 grid grid-cols-3 gap-0 text-xs" :style="{ color: 'var(--zima-text-muted)' }">
          <div>Mês</div>
          <div style="text-align:right;">Receita</div>
          <div style="text-align:right;">Lucro</div>
        </div>
        <div
          v-for="row in dreMonthly"
          :key="row.label"
          class="grid grid-cols-3 gap-0 py-2 text-sm"
          :style="{ borderTop: '1px solid var(--zima-border-divider)' }"
        >
          <div :style="{ color: 'var(--zima-text-primary)' }">{{ row.label }}</div>
          <div class="tabular-nums" style="text-align:right;" :style="{ color: 'var(--zima-text-primary)' }">{{ fmtCurrency(row.revenue) }}</div>
          <div class="tabular-nums" style="text-align:right;" :style="{ color: row.profit > 0 ? 'var(--zima-success)' : 'var(--zima-danger)' }">{{ fmtCurrency(row.profit) }}</div>
        </div>
      </ZimaCard>
    </template>

    <!-- ── TAB: Operacional ─────────────────────────────────────────────── -->
    <template v-else-if="activeTab === 'operacional'">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <ZimaKpiCard label="Taxa de ocupação" :value="fmtPercent(operationalKpi.occupancyRate)" icon="i-lucide-calendar-check" />
        <ZimaKpiCard label="No-show" :value="fmtPercent(operationalKpi.noShowRate)" icon="i-lucide-calendar-x" />
        <ZimaKpiCard label="Agendamentos" :value="fmtNumber(operationalKpi.totalAppointments)" icon="i-lucide-calendar" />
        <ZimaKpiCard label="Duração média" :value="`${operationalKpi.avgServiceDuration} min`" icon="i-lucide-clock" />
      </div>

      <ZimaCard>
        <template #header>
          <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">Resumo operacional</span>
        </template>
        <div class="flex flex-col gap-3 text-sm">
          <div class="flex items-center justify-between">
            <span :style="{ color: 'var(--zima-text-muted)' }">Serviços realizados no período</span>
            <span class="tabular-nums font-semibold" :style="{ color: 'var(--zima-text-primary)' }">{{ fmtNumber(operationalKpi.totalServicesDone) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span :style="{ color: 'var(--zima-text-muted)' }">Agendamentos que viraram serviço</span>
            <span class="tabular-nums font-semibold" :style="{ color: 'var(--zima-text-primary)' }">
              {{ fmtPercent((operationalKpi.totalServicesDone / operationalKpi.totalAppointments) * 100) }}
            </span>
          </div>
        </div>
      </ZimaCard>
    </template>

    <!-- ── TAB: Clientes ────────────────────────────────────────────────── -->
    <template v-else>
      <ZimaCard>
        <template #header>
          <span style="font-size: 14px; font-weight: 600; color: var(--zima-text-primary);">Clientes por segmento</span>
        </template>
        <div class="grid grid-cols-4 gap-0 text-xs pb-2" :style="{ color: 'var(--zima-text-muted)', borderBottom: '1px solid var(--zima-border-divider)' }">
          <div>Segmento</div>
          <div style="text-align:right;">Clientes</div>
          <div style="text-align:right;">Ticket médio</div>
          <div style="text-align:right;">Receita total</div>
        </div>
        <div
          v-for="row in customerSegments"
          :key="row.segment"
          class="grid grid-cols-4 gap-0 py-3 text-sm"
          :style="{ borderBottom: '1px solid var(--zima-border-divider)' }"
        >
          <div :style="{ color: 'var(--zima-text-primary)' }">{{ row.segment }}</div>
          <div class="tabular-nums" style="text-align:right;" :style="{ color: 'var(--zima-text-primary)' }">{{ fmtNumber(row.count) }}</div>
          <div class="tabular-nums" style="text-align:right;" :style="{ color: 'var(--zima-text-muted)' }">{{ fmtCurrency(row.avgTicket) }}</div>
          <div class="tabular-nums" style="text-align:right;" :style="{ color: 'var(--zima-text-primary)' }">{{ fmtCurrency(row.totalRevenue) }}</div>
        </div>
      </ZimaCard>
    </template>
  </div>
</template>
