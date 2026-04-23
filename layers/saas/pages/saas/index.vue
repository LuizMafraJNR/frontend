<script setup lang="ts">
import DrawerDetalheAgendamento from './DrawerDetalheAgendamento.vue'
import ModalNovoAgendamento from './ModalNovoAgendamento.vue'
import ModalCliente from './ModalCliente.vue'
import { STATUS_STYLE } from '../../composables/useAppointments'

definePageMeta({ layout: 'saas' })

const toast = useZimaToast()

// ── Agendamentos do dia (via composable) ──────────────────────────────────────
const { appointments, fetchAll: fetchAppointments } = useAppointments()
onMounted(() => fetchAppointments())

// ── Modais disparados pelas ações rápidas do header ───────────────────────────
const showAgendamentoModal = ref(false)
const showClienteModal = ref(false)

const today = new Date().toISOString().slice(0, 10)
const agendaDeHoje = computed(() =>
  appointments.value
    .filter(a => a.date === today && a.status !== 'CANCELLED')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
)

// Drawer de detalhes
const drawerDetalheId = ref<string | null>(null)
const drawerOpen = computed({
  get: () => !!drawerDetalheId.value,
  set: (v) => { if (!v) drawerDetalheId.value = null },
})

// ── Período ─────────────────────────────────────────────────────────────────
const periodos = [
  { key: 'hoje',   label: 'Hoje' },
  { key: '7d',     label: '7 dias' },
  { key: '30d',    label: '30 dias' },
  { key: 'mes',    label: 'Mês' },
  { key: 'custom', label: 'Personalizado' },
] as const

type PeriodoKey = typeof periodos[number]['key']
const periodoAtivo = ref<PeriodoKey>('30d')
const isLoading    = ref(false)

// Date-range picker (popover "Personalizado")
const customRangeOpen = ref(false)
const customRangeStart = ref('')
const customRangeEnd = ref('')
const customRangeAnchor = ref<HTMLElement | null>(null)

const setPeriodo = (key: PeriodoKey, ev?: MouseEvent) => {
  if (key === 'custom') {
    customRangeAnchor.value = ev?.currentTarget as HTMLElement | null
    customRangeOpen.value = !customRangeOpen.value
    return
  }
  periodoAtivo.value = key
  customRangeOpen.value = false
  isLoading.value = true
  setTimeout(() => { isLoading.value = false }, 600)
}

const applyCustomRange = () => {
  if (!customRangeStart.value || !customRangeEnd.value) {
    toast.info('Selecione data inicial e final.')
    return
  }
  if (customRangeEnd.value < customRangeStart.value) {
    toast.info('Data final deve ser maior ou igual à inicial.')
    return
  }
  periodoAtivo.value = 'custom'
  customRangeOpen.value = false
  isLoading.value = true
  setTimeout(() => { isLoading.value = false }, 600)
}

// Fecha o popover ao clicar fora
const onDocumentClickCustomRange = (e: MouseEvent) => {
  if (!customRangeOpen.value) return
  const target = e.target as Node
  if (customRangeAnchor.value && customRangeAnchor.value.contains(target)) return
  const popover = document.getElementById('dashboard-custom-range-popover')
  if (popover && popover.contains(target)) return
  customRangeOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocumentClickCustomRange))
onUnmounted(() => document.removeEventListener('click', onDocumentClickCustomRange))

// ── Saudação dinâmica ────────────────────────────────────────────────────────
const saudacao = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
})

const dataFormatada = computed(() => {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

// ── KPI Cards ────────────────────────────────────────────────────────────────
const kpis = [
  {
    key:      'faturamento',
    label:    'Faturamento',
    value:    'R$ 12.847,90',
    change:   '+12.4',
    subinfo:  null,
    to:       '/saas/financeiro',
    icon:     'i-lucide-trending-up',
    sparkline: [4200, 5800, 4900, 7200, 6100, 8400, 9100, 7800, 10200, 11400, 10900, 12847],
  },
  {
    key:     'agendamentos',
    label:   'Agendamentos',
    value:   '23',
    change:  '+3',
    changeSuffix: '',
    subinfo: '8 hoje • 87% ocupação',
    to:      '/saas/agenda',
    icon:    'i-lucide-calendar',
    sparkline: [12, 18, 15, 22, 19, 25, 21, 28, 24, 20, 26, 23],
  },
  {
    key:     'clientes',
    label:   'Novos Clientes',
    value:   '7',
    change:  '+2',
    changeSuffix: '',
    subinfo: '68% via WhatsApp',
    to:      '/saas/clientes?sortBy=createdAt&sortDir=desc',
    icon:    'i-lucide-users',
    sparkline: [3, 5, 4, 6, 5, 8, 7, 9, 8, 6, 9, 7],
  },
  {
    key:     'ticket',
    label:   'Ticket Médio',
    value:   'R$ 87,50',
    change:  '-2.1',
    subinfo: null,
    to:      '/saas/relatorios',
    icon:    'i-lucide-receipt',
    sparkline: [92, 88, 95, 91, 87, 93, 89, 84, 90, 86, 88, 87],
  },
]

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
const buildSparklinePath = (data: number[]): string => {
  const w = 80, h = 32, pad = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M${pts.join(' L')}`
}

const buildSparklineArea = (data: number[]): string => {
  const w = 80, h = 32, pad = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const lastX = (80 - 2).toFixed(1)
  const firstX = (2).toFixed(1)
  return `M${pts.join(' L')} L${lastX},${(32 - 2).toFixed(1)} L${firstX},${(32 - 2).toFixed(1)} Z`
}

// ── Timeline — calcular posição por horário ───────────────────────────────────
const HOUR_PX = 64   // 60min = 64px, então 30min = 32px, etc.
const HOUR_START = 8 // 08:00

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

const minutesToTop = (t: string) =>
  ((timeToMinutes(t) - HOUR_START * 60) / 60) * HOUR_PX

const hoursRange = computed(() => Array.from({ length: 13 }, (_, i) => {
  const h = HOUR_START + i
  return `${String(h).padStart(2, '0')}:00`
}))

// Hora atual (atualizada a cada minuto)
const agora = ref(new Date())
onMounted(() => {
  const interval = setInterval(() => { agora.value = new Date() }, 60_000)
  onUnmounted(() => clearInterval(interval))
})

const agoraString = computed(() => {
  const h = agora.value.getHours()
  const m = agora.value.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

const agoraTop = computed(() => minutesToTop(agoraString.value))
const isAgoraDentroExpediente = computed(() => {
  const mins = timeToMinutes(agoraString.value)
  return mins >= HOUR_START * 60 && mins <= (HOUR_START + 12) * 60
})

// ── Atividade recente (via composable) ───────────────────────────────────────
const { activity: atividades, fetchAll: fetchActivity } = useDashboardActivity()
onMounted(() => fetchActivity())

// ── Alertas inteligentes ──────────────────────────────────────────────────────
interface Alerta {
  id:     string
  tipo:   'warning' | 'info' | 'danger'
  icon:   string
  msg:    string
  acao:   string
  to:     string
}

const alertasDismissed = ref<string[]>([])

const alertas: Alerta[] = [
  { id: 'a1', tipo: 'warning', icon: 'i-lucide-package',      msg: 'Estoque de Hidratação L\'Oréal abaixo do mínimo (2 unidades)',  acao: 'Repor estoque',  to: '/saas/estoque?tab=produtos&status=low' },
  { id: 'a2', tipo: 'info',    icon: 'i-lucide-cake',         msg: '5 clientes fazem aniversário esta semana',                      acao: 'Ver lista',      to: '/saas/clientes?birthdayThisWeek=true' },
  { id: 'a3', tipo: 'danger',  icon: 'i-lucide-alert-circle', msg: '3 contas a receber vencidas — total R$ 450,00',                acao: 'Ver cobranças',  to: '/saas/financeiro?tab=receivables&status=OVERDUE' },
]

const alertasVisiveis = computed(() =>
  alertas.filter(a => !alertasDismissed.value.includes(a.id))
)

const ALERTA_COLOR: Record<string, string> = {
  warning: 'var(--zima-warning)',
  info:    'var(--zima-info)',
  danger:  'var(--zima-danger)',
}

const dismissAlerta = (id: string) => {
  alertasDismissed.value.push(id)
}

const isMobile = ref(false)
const checkMobile = () => { isMobile.value = window.innerWidth < 1024 }
onMounted(() => { checkMobile(); window.addEventListener('resize', checkMobile) })
onUnmounted(() => window.removeEventListener('resize', checkMobile))
</script>

<template>
  <div data-testid="dashboard-page">

    <!-- ── 1.1 Header ──────────────────────────────────────────────────────── -->
    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
      <!-- Saudação + data -->
      <div>
        <h1
          style="font-size: 24px; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em;"
          :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-display)' }"
        >
          {{ saudacao }}, Luiz.
        </h1>
        <p
          class="mt-1 capitalize"
          style="font-size: 14px;"
          :style="{ color: 'var(--zima-text-muted)' }"
        >
          {{ dataFormatada }}
        </p>
      </div>

      <!-- Direita: período + ações rápidas -->
      <div class="relative flex flex-wrap items-center gap-2 sm:gap-3">
        <!-- Seletor de período -->
        <div
          class="flex items-center rounded-lg p-1 gap-0.5"
          :style="{
            background: 'var(--zima-bg-surface-2)',
            border: '1px solid var(--zima-border-default)',
          }"
          role="group"
          aria-label="Selecionar período"
        >
          <button
            v-for="p in periodos"
            :key="p.key"
            class="px-3 py-1 rounded-md text-sm font-medium transition-all"
            :style="{
              transitionDuration: 'var(--zima-duration-base)',
              background: periodoAtivo === p.key ? 'var(--zima-blue-core)' : 'transparent',
              color: periodoAtivo === p.key
                ? '#fff'
                : 'var(--zima-text-secondary)',
              fontSize: '12px',
            }"
            :aria-pressed="periodoAtivo === p.key"
            @click="(e) => setPeriodo(p.key as PeriodoKey, e)"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Popover de período personalizado -->
        <div
          v-if="customRangeOpen"
          id="dashboard-custom-range-popover"
          class="flex flex-col gap-3"
          :style="{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '8px',
            zIndex: 60,
            background: 'var(--zima-bg-surface-3)',
            border: '1px solid var(--zima-border-modal)',
            borderRadius: 'var(--zima-radius-md)',
            boxShadow: 'var(--zima-shadow-dropdown)',
            padding: '16px',
            minWidth: '280px',
            maxWidth: 'min(280px, calc(100vw - 32px))',
          }"
          @click.stop
        >
          <div class="flex flex-col gap-2">
            <label class="text-xs font-medium" :style="{ color: 'var(--zima-text-secondary)' }">Data inicial</label>
            <input
              v-model="customRangeStart"
              type="date"
              class="px-3 text-sm rounded-md outline-none"
              :style="{
                height: '34px',
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                color: 'var(--zima-text-primary)',
              }"
            >
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-medium" :style="{ color: 'var(--zima-text-secondary)' }">Data final</label>
            <input
              v-model="customRangeEnd"
              type="date"
              class="px-3 text-sm rounded-md outline-none"
              :style="{
                height: '34px',
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                color: 'var(--zima-text-primary)',
              }"
            >
          </div>
          <div class="flex items-center justify-end gap-2 mt-1">
            <ZimaButton variant="ghost" size="sm" @click="customRangeOpen = false">Cancelar</ZimaButton>
            <ZimaButton variant="primary" size="sm" @click="applyCustomRange">Aplicar</ZimaButton>
          </div>
        </div>

        <!-- Quick actions -->
        <ZimaButton variant="secondary" size="sm" @click="showAgendamentoModal = true">
          <template #icon-left>
            <Icon name="i-lucide-calendar-plus" style="width: 14px; height: 14px;" />
          </template>
          + Agendamento
        </ZimaButton>

        <ZimaButton variant="secondary" size="sm" @click="navigateTo('/saas/caixa')">
          <template #icon-left>
            <Icon name="i-lucide-shopping-cart" style="width: 14px; height: 14px;" />
          </template>
          + Venda
        </ZimaButton>

        <ZimaButton variant="primary" size="sm" @click="showClienteModal = true">
          <template #icon-left>
            <Icon name="i-lucide-user-plus" style="width: 14px; height: 14px;" />
          </template>
          + Cliente
        </ZimaButton>
      </div>
    </div>

    <!-- ── 1.2 KPI Cards ──────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <template v-if="isLoading">
        <ZimaSkeleton v-for="i in 4" :key="i" preset="card" height="120px" />
      </template>
      <template v-else>
        <ZimaKpiCard
          v-for="kpi in kpis"
          :key="kpi.key"
          :label="kpi.label"
          :value="kpi.value"
          :change="kpi.change"
          :change-suffix="kpi.changeSuffix ?? '%'"
          :icon="kpi.icon"
          clickable
          @click="navigateTo(kpi.to)"
        >
          <!-- Sparkline SVG -->
          <template #chart>
            <div class="flex items-end justify-end" style="height: 32px; margin-bottom: -4px;">
              <svg
                width="80"
                height="32"
                viewBox="0 0 80 32"
                fill="none"
                aria-hidden="true"
                style="overflow: visible;"
              >
                <!-- Area fill -->
                <path
                  :d="buildSparklineArea(kpi.sparkline)"
                  fill="rgba(59,130,246,0.10)"
                />
                <!-- Line -->
                <path
                  :d="buildSparklinePath(kpi.sparkline)"
                  stroke="#3B82F6"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </template>

          <!-- Sub-info -->
          <template v-if="kpi.subinfo" #change-label>
            <span style="font-size: 11px;" :style="{ color: 'var(--zima-text-muted)' }">
              {{ kpi.subinfo }}
            </span>
          </template>
        </ZimaKpiCard>
      </template>
    </div>

    <!-- ── 1.5 Alertas inteligentes ──────────────────────────────────────── -->
    <TransitionGroup
      name="alerta"
      tag="div"
      class="flex flex-col gap-2 mb-6"
    >
      <div
        v-for="alerta in alertasVisiveis"
        :key="alerta.id"
        class="flex items-center gap-3 px-4 rounded-lg"
        :style="{
          height: '44px',
          background: 'var(--zima-bg-surface-2)',
          border: '1px solid var(--zima-border-default)',
          borderLeftWidth: '3px',
          borderLeftColor: ALERTA_COLOR[alerta.tipo],
          borderLeftStyle: 'solid',
        }"
      >
        <Icon
          :name="alerta.icon"
          style="width: 15px; height: 15px; flex-shrink: 0;"
          :style="{ color: ALERTA_COLOR[alerta.tipo] }"
          aria-hidden="true"
        />
        <span
          class="flex-1 truncate"
          style="font-size: 13px;"
          :style="{ color: 'var(--zima-text-secondary)' }"
        >
          {{ alerta.msg }}
        </span>
        <button
          class="text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80"
          :style="{ color: ALERTA_COLOR[alerta.tipo] }"
          @click="navigateTo(alerta.to)"
        >
          {{ alerta.acao }} →
        </button>
        <button
          class="flex items-center justify-center rounded-md shrink-0 transition-colors"
          :style="{
            width: '24px',
            height: '24px',
            color: 'var(--zima-text-muted)',
          }"
          :aria-label="`Dispensar alerta: ${alerta.msg}`"
          @click="dismissAlerta(alerta.id)"
          @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
          @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
        >
          <Icon name="i-lucide-x" style="width: 12px; height: 12px;" aria-hidden="true" />
        </button>
      </div>
    </TransitionGroup>

    <!-- ── 1.4 Seção inferior: Agenda + Atividade ─────────────────────────── -->
    <div class="grid gap-4 grid-cols-1 xl:[grid-template-columns:7fr_5fr]">

      <!-- Agenda de Hoje ──────────────────────────────────────── -->
      <ZimaCard padding="none">
        <template #header>
          <div
            class="flex items-center justify-between px-5 py-4"
            :style="{ borderBottom: '1px solid var(--zima-border-divider)' }"
          >
            <div class="flex items-center gap-2">
              <span
                style="font-size: 14px; font-weight: 600;"
                :style="{ color: 'var(--zima-text-primary)' }"
              >
                Agenda de Hoje
              </span>
              <ZimaBadge variant="blue" size="sm">{{ agendaDeHoje.length }} agendamentos</ZimaBadge>
            </div>
            <button
              class="text-xs font-medium transition-opacity hover:opacity-70"
              :style="{ color: 'var(--zima-blue-light)' }"
              @click="navigateTo('/saas/agenda')"
            >
              Ver agenda completa →
            </button>
          </div>
        </template>

        <!-- Mobile: lista de cards empilhados -->
        <div v-if="isMobile" class="flex flex-col divide-y" :style="{ borderColor: 'var(--zima-border-divider)' }">
          <div v-if="agendaDeHoje.length === 0" class="flex flex-col items-center py-8 gap-2">
            <Icon name="i-lucide-calendar-x" style="width: 28px; height: 28px;" :style="{ color: 'var(--zima-text-muted)' }" />
            <p class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">Nenhum agendamento hoje.</p>
          </div>
          <div
            v-for="apt in agendaDeHoje"
            :key="apt.id"
            class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
            :style="{ borderLeft: `3px solid ${STATUS_STYLE[apt.status].border}` }"
            @click="drawerDetalheId = apt.id"
            @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
            @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
          >
            <div class="flex flex-col shrink-0 items-end" style="min-width: 44px;">
              <span class="text-xs font-medium" :style="{ color: 'var(--zima-text-muted)', fontFamily: 'var(--zima-font-mono)' }">
                {{ apt.startTime }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate" :style="{ color: 'var(--zima-text-primary)' }">{{ apt.clientName }}</p>
              <p class="text-xs truncate" :style="{ color: 'var(--zima-text-muted)' }">{{ apt.serviceName }}</p>
            </div>
            <ZimaBadge :variant="STATUS_STYLE[apt.status].variant" size="sm">
              {{ STATUS_STYLE[apt.status].label }}
            </ZimaBadge>
          </div>
        </div>

        <!-- Desktop: timeline posicionada por horário -->
        <div
          v-else
          class="relative overflow-y-auto"
          style="max-height: 460px;"
        >
          <div
            class="relative"
            :style="{ height: `${hoursRange.length * HOUR_PX}px` }"
          >
            <!-- Linhas de hora -->
            <div
              v-for="(hora, idx) in hoursRange"
              :key="hora"
              class="absolute w-full flex items-start"
              :style="{ top: `${idx * HOUR_PX}px` }"
            >
              <!-- Label da hora -->
              <span
                class="shrink-0 select-none"
                :style="{
                  width: '52px',
                  paddingLeft: '16px',
                  paddingTop: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--zima-font-mono)',
                  color: 'var(--zima-text-muted)',
                }"
              >
                {{ hora }}
              </span>
              <!-- Linha horizontal -->
              <div
                class="flex-1"
                :style="{
                  height: '1px',
                  marginTop: '9px',
                  background: 'var(--zima-border-divider)',
                }"
              />
            </div>

            <!-- Linha "AGORA" -->
            <div
              v-if="isAgoraDentroExpediente"
              class="absolute w-full flex items-center pointer-events-none"
              :style="{ top: `${agoraTop}px`, zIndex: 10 }"
            >
              <span
                class="shrink-0 select-none"
                :style="{
                  width: '52px',
                  paddingLeft: '4px',
                  fontSize: '10px',
                  fontFamily: 'var(--zima-font-mono)',
                  color: '#EF4444',
                  fontWeight: '600',
                }"
              >
                {{ agoraString }}
              </span>
              <div
                class="flex-1"
                :style="{
                  height: '2px',
                  background: '#EF4444',
                  opacity: 0.8,
                }"
              />
              <div
                class="shrink-0 rounded-full"
                :style="{
                  width: '8px',
                  height: '8px',
                  background: '#EF4444',
                  marginRight: '12px',
                }"
              />
            </div>

            <!-- Cards de agendamento -->
            <div
              v-for="apt in agendaDeHoje"
              :key="apt.id"
              class="absolute rounded cursor-pointer transition-all"
              :style="{
                left: '60px',
                right: '12px',
                top: `${minutesToTop(apt.startTime) + 2}px`,
                height: `${(apt.serviceDuration / 60) * HOUR_PX - 4}px`,
                background: STATUS_STYLE[apt.status].bg,
                borderLeft: `3px solid ${STATUS_STYLE[apt.status].border}`,
                borderRadius: 'var(--zima-radius-xs)',
                padding: '4px 8px',
                opacity: apt.status === 'CANCELLED' ? 0.5 : 1,
                overflow: 'hidden',
                zIndex: 5,
              }"
              :aria-label="`${apt.startTime} - ${apt.clientName} - ${apt.serviceName}`"
              @click="drawerDetalheId = apt.id"
              @mouseenter="(e: MouseEvent) => {
                (e.currentTarget as HTMLElement).style.filter = 'brightness(1.15)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--zima-shadow-sm)'
              }"
              @mouseleave="(e: MouseEvent) => {
                (e.currentTarget as HTMLElement).style.filter = ''
                ;(e.currentTarget as HTMLElement).style.boxShadow = ''
              }"
            >
              <div class="flex items-start justify-between gap-1 h-full">
                <div class="min-w-0 flex-1">
                  <p
                    class="font-medium truncate leading-tight"
                    style="font-size: 11px;"
                    :style="{
                      color: 'var(--zima-text-primary)',
                      fontFamily: 'var(--zima-font-mono)',
                    }"
                  >
                    {{ apt.startTime }}–{{ apt.endTime }}
                  </p>
                  <p
                    class="truncate leading-tight mt-0.5"
                    style="font-size: 11px; font-weight: 500;"
                    :style="{ color: 'var(--zima-text-primary)' }"
                  >
                    {{ apt.clientName }}
                  </p>
                  <p
                    v-if="apt.serviceDuration >= 45"
                    class="truncate leading-tight"
                    style="font-size: 10px;"
                    :style="{ color: 'var(--zima-text-muted)' }"
                  >
                    {{ apt.serviceName }}
                  </p>
                </div>
                <!-- Avatar do profissional -->
                <ZimaAvatar
                  :name="apt.professionalName"
                  size="xs"
                  class="shrink-0 mt-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      </ZimaCard>

      <!-- Atividade Recente ───────────────────────────────────── -->
      <ZimaCard padding="none">
        <template #header>
          <div
            class="flex items-center justify-between px-5 py-4"
            :style="{ borderBottom: '1px solid var(--zima-border-divider)' }"
          >
            <span
              style="font-size: 14px; font-weight: 600;"
              :style="{ color: 'var(--zima-text-primary)' }"
            >
              Atividade Recente
            </span>
          </div>
        </template>

        <div>
          <div
            v-for="(item, idx) in atividades"
            :key="idx"
            class="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
            :style="{
              borderBottom: idx < atividades.length - 1
                ? '1px solid rgba(148,163,184,0.06)'
                : 'none',
            }"
            @click="navigateTo(item.to)"
            @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
            @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
          >
            <!-- Ícone contextual -->
            <div
              class="flex items-center justify-center rounded-lg shrink-0 mt-0.5"
              :style="{
                width: '28px',
                height: '28px',
                background: 'var(--zima-bg-surface-hover)',
              }"
            >
              <Icon
                :name="item.icon"
                style="width: 13px; height: 13px;"
                :style="{ color: item.color }"
                aria-hidden="true"
              />
            </div>

            <!-- Texto + timestamp -->
            <div class="flex-1 min-w-0">
              <p
                class="leading-snug"
                style="font-size: 13px;"
                :style="{ color: 'var(--zima-text-primary)' }"
              >
                {{ item.description }}
              </p>
              <p
                class="mt-0.5"
                style="font-size: 11px;"
                :style="{ color: 'var(--zima-text-muted)' }"
              >
                {{ item.timeLabel }}
              </p>
            </div>
          </div>
        </div>
      </ZimaCard>
    </div>

    <!-- Drawer de detalhes do agendamento -->
    <DrawerDetalheAgendamento
      v-model="drawerOpen"
      :appointment-id="drawerDetalheId"
    />

    <!-- Modais das ações rápidas -->
    <ModalNovoAgendamento
      v-model="showAgendamentoModal"
      @created="fetchAppointments()"
    />
    <ModalCliente
      v-model="showClienteModal"
    />
  </div>
</template>

<style scoped>
.alerta-enter-active,
.alerta-leave-active {
  transition: all 250ms ease;
}
.alerta-enter-from,
.alerta-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.alerta-enter-to,
.alerta-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 60px;
}
</style>
