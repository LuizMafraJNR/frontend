<script setup lang="ts">
import ModalNovoAgendamento from './ModalNovoAgendamento.vue'
import DrawerDetalheAgendamento from './DrawerDetalheAgendamento.vue'
import type { AppointmentStatus } from '../../composables/useAppointments'
import { STATUS_STYLE } from '../../composables/useAppointments'

definePageMeta({ layout: 'saas' })

const { appointments, loading, fetchAll, updateStatus, reschedule } = useAppointments()
const { professionals, fetchAll: fetchProfessionals } = useProfessionals()
const toast = useZimaToast()

onMounted(async () => {
  await Promise.all([fetchAll(), fetchProfessionals()])
})

// ── Estado da view ────────────────────────────────────────────────────────────
const viewMode = ref<'day' | 'week' | 'list'>('day')
const currentDate = ref(new Date().toISOString().slice(0, 10))
const selectedProfessionalIds = ref<string[]>([])

// ── Modal / Drawer ────────────────────────────────────────────────────────────
const modalNovoOpen = ref(false)
const drawerDetalheId = ref<string | null>(null)
const drawerOpen = computed({
  get: () => !!drawerDetalheId.value,
  set: (v) => { if (!v) drawerDetalheId.value = null },
})
const prefillData = ref<{ professionalId?: string; date?: string; startTime?: string } | undefined>()

// ── Bridge: command palette → modal ──────────────────────────────────────────
const openModalFromBridge = useState<boolean>('saas:modal:newAppointment', () => false)
watch(openModalFromBridge, (v) => {
  if (v) { modalNovoOpen.value = true; openModalFromBridge.value = false }
})

// ── Profissionais filtrados/visíveis ─────────────────────────────────────────
const visibleProfessionals = computed(() => {
  if (!selectedProfessionalIds.value.length) return professionals.value.filter(p => p.status !== 'vacation')
  return professionals.value.filter(p => selectedProfessionalIds.value.includes(p.id))
})

// ── Agendamentos da data/semana atual ─────────────────────────────────────────
const appointmentsForView = computed(() => {
  if (viewMode.value === 'week') {
    // Semana: seg a dom a partir de currentDate
    const ref = new Date(currentDate.value + 'T12:00:00')
    const day = ref.getDay() || 7
    const monday = new Date(ref)
    monday.setDate(ref.getDate() - day + 1)
    const _mondayISO = monday.toISOString().slice(0, 10)
    return appointments.value.filter(a => {
      const d = new Date(a.date + 'T12:00:00')
      const m = new Date(monday)
      const end = new Date(monday)
      end.setDate(monday.getDate() + 7)
      return d >= m && d < end
    })
  }
  return appointments.value.filter(a => a.date === currentDate.value)
})

// ── Formatação da data no header ──────────────────────────────────────────────
const headerDateLabel = computed(() => {
  const d = new Date(currentDate.value + 'T12:00:00')
  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

  if (viewMode.value === 'week') {
    // Exibir "Semana de DD/MM a DD/MM"
    const day = d.getDay() || 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - day + 1)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return `Semana de ${monday.getDate()}/${monday.getMonth() + 1} a ${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`
  }
  return `${weekdays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
})

// ── Navegação de data ─────────────────────────────────────────────────────────
const navigate = (dir: -1 | 1) => {
  const d = new Date(currentDate.value + 'T12:00:00')
  d.setDate(d.getDate() + dir * (viewMode.value === 'week' ? 7 : 1))
  currentDate.value = d.toISOString().slice(0, 10)
}

const goToday = () => { currentDate.value = new Date().toISOString().slice(0, 10) }
const isToday = computed(() => currentDate.value === new Date().toISOString().slice(0, 10))

// ── Handlers de eventos das views ─────────────────────────────────────────────
const onClickAppointment = (id: string) => {
  drawerDetalheId.value = id
}

const onClickSlot = (data: { professionalId: string; startTime: string; date: string }) => {
  prefillData.value = { professionalId: data.professionalId, date: data.date, startTime: data.startTime }
  modalNovoOpen.value = true
}

const onClickDay = (date: string) => {
  currentDate.value = date
  viewMode.value = 'day'
}

const onMoveAppointment = async (data: { id: string; professionalId: string; startTime: string }) => {
  const pro = professionals.value.find(p => p.id === data.professionalId)
  await reschedule(data.id, currentDate.value, data.startTime, data.professionalId, pro?.name)
  toast.success('Agendamento reagendado!')
}

const onCreated = () => {
  // Lista já reativa via ref — nada a fazer
}

const onDrawerUpdated = () => {
  // Estado já atualizado no composable
}

// ── Opções do seletor de profissional ────────────────────────────────────────
const professionalOptions = computed(() => [
  { label: 'Todos os profissionais', value: 'all' },
  ...professionals.value.map(p => ({ label: p.name, value: p.id })),
])

const professionalSelectValue = ref<string>('all')
watch(professionalSelectValue, (v) => {
  selectedProfessionalIds.value = v === 'all' ? [] : [v]
})

// ── Visualização Lista ────────────────────────────────────────────────────────
const listSearch = ref('')
const listStatus = ref<AppointmentStatus | 'all'>('all')
const currentPage = ref(1)
const pageSize = ref(20)

const filteredList = computed(() => {
  let list = appointments.value
  if (listSearch.value.length >= 2) {
    const q = listSearch.value.toLowerCase()
    list = list.filter(a =>
      a.clientName.toLowerCase().includes(q) ||
      a.serviceName.toLowerCase().includes(q) ||
      a.professionalName.toLowerCase().includes(q)
    )
  }
  if (listStatus.value !== 'all') {
    list = list.filter(a => a.status === listStatus.value)
  }
  return list.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
})

const totalPages = computed(() => Math.ceil(filteredList.value.length / pageSize.value))
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const clearFilters = () => {
  listSearch.value = ''
  listStatus.value = 'all'
  currentPage.value = 1
}

const formatDate = (iso: string, time?: string) => {
  const d = new Date(iso + 'T12:00:00')
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const base = `${dd}/${mm}`
  return time ? `${base} ${time}` : base
}

const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ── Ações da lista (menu 3-dot) ───────────────────────────────────────────────
const openActionMenu = ref<string | null>(null)

const ACTION_NEXT_STATUS: Partial<Record<AppointmentStatus, { label: string; status: AppointmentStatus }>> = {
  PENDING:     { label: 'Confirmar',         status: 'CONFIRMED' },
  CONFIRMED:   { label: 'Check-in',          status: 'CHECKED_IN' },
  CHECKED_IN:  { label: 'Iniciar atendimento', status: 'IN_PROGRESS' },
  IN_PROGRESS: { label: 'Concluir',          status: 'COMPLETED' },
}

const handleQuickAction = async (aptId: string, status: AppointmentStatus) => {
  await updateStatus(aptId, status)
  openActionMenu.value = null
  toast.success(`${STATUS_STYLE[status].label}!`)
}

const statusOptions = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Pendente',        value: 'PENDING' },
  { label: 'Confirmado',      value: 'CONFIRMED' },
  { label: 'Check-in',        value: 'CHECKED_IN' },
  { label: 'Em atendimento',  value: 'IN_PROGRESS' },
  { label: 'Concluído',       value: 'COMPLETED' },
  { label: 'Cancelado',       value: 'CANCELLED' },
]

const isMobile = ref(false)
const checkMobile = () => { isMobile.value = window.innerWidth < 640 }
onMounted(() => { checkMobile(); window.addEventListener('resize', checkMobile) })
onUnmounted(() => window.removeEventListener('resize', checkMobile))

const listColumns = computed(() => [
  { key: 'datetime', label: 'Horário', width: '130px' },
  { key: 'client', label: 'Cliente' },
  { key: 'service', label: 'Serviço' },
  ...(!isMobile.value ? [{ key: 'professional', label: 'Profissional' }] : []),
  { key: 'price', label: 'Valor', width: '100px' },
  { key: 'status', label: 'Status', width: '130px' },
])
</script>

<template>
  <div class="flex flex-col gap-4 h-full" data-testid="page-agenda">
    <!-- ── Page Header ────────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <!-- Esquerda: título + data -->
      <div>
        <h1
          class="text-2xl font-semibold"
          :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-display)' }"
        >
          Agenda
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: '#94A3B8' }">
          {{ headerDateLabel }}
        </p>
      </div>

      <!-- Direita: controles -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Toggle visualização -->
        <div class="flex items-center gap-0.5 p-0.5 rounded-lg" :style="{ background: 'var(--zima-bg-surface-2)' }">
          <button
            v-for="mode in [{ key: 'day', label: 'Dia' }, { key: 'week', label: 'Semana' }, { key: 'list', label: 'Lista' }]"
            :key="mode.key"
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-all"
            :style="{
              background: viewMode === mode.key ? 'var(--zima-bg-surface-3)' : 'transparent',
              color: viewMode === mode.key ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)',
            }"
            @click="viewMode = mode.key as 'day' | 'week' | 'list'"
          >
            {{ mode.label }}
          </button>
        </div>

        <!-- Seletor de profissional -->
        <ZimaSelect
          v-if="viewMode !== 'list'"
          v-model="professionalSelectValue"
          :options="professionalOptions"
          style="width: 100%; max-width: 200px;"
        />

        <!-- Navegação de data -->
        <div class="flex items-center gap-1">
          <button
            class="flex items-center justify-center rounded-md transition-colors"
            :style="{ width: '32px', height: '32px', background: 'var(--zima-bg-surface-2)', color: 'var(--zima-text-muted)' }"
            aria-label="Anterior"
            @click="navigate(-1)"
          >
            <Icon name="i-lucide-chevron-left" style="width: 16px; height: 16px;" />
          </button>

          <ZimaButton
            v-if="!isToday"
            variant="ghost"
            size="sm"
            @click="goToday"
          >
            Hoje
          </ZimaButton>

          <button
            class="flex items-center justify-center rounded-md transition-colors"
            :style="{ width: '32px', height: '32px', background: 'var(--zima-bg-surface-2)', color: 'var(--zima-text-muted)' }"
            aria-label="Próximo"
            @click="navigate(1)"
          >
            <Icon name="i-lucide-chevron-right" style="width: 16px; height: 16px;" />
          </button>
        </div>

        <!-- Novo agendamento -->
        <ZimaButton @click="() => { prefillData = undefined; modalNovoOpen = true }">
          <template #icon-left><Icon name="i-lucide-plus" style="width: 14px; height: 14px;" /></template>
          Novo Agendamento
        </ZimaButton>
      </div>
    </div>

    <!-- ── Loading ────────────────────────────────────────────────────────── -->
    <template v-if="loading">
      <ZimaSkeleton preset="card" height="400px" />
    </template>

    <!-- ── Visualização: Dia ──────────────────────────────────────────────── -->
    <template v-else-if="viewMode === 'day'">
      <ZimaCard padding="none" class="overflow-hidden">
        <SaasAgendaDayView
          :appointments="appointmentsForView"
          :professionals="visibleProfessionals"
          :date="currentDate"
          @click-appointment="onClickAppointment"
          @click-slot="onClickSlot"
          @move-appointment="onMoveAppointment"
        />
      </ZimaCard>
    </template>

    <!-- ── Visualização: Semana ───────────────────────────────────────────── -->
    <template v-else-if="viewMode === 'week'">
      <ZimaCard padding="none" class="overflow-hidden">
        <SaasAgendaWeekView
          :appointments="appointmentsForView"
          :date="currentDate"
          @click-appointment="onClickAppointment"
          @click-day="onClickDay"
        />
      </ZimaCard>
    </template>

    <!-- ── Visualização: Lista ────────────────────────────────────────────── -->
    <template v-else>
      <!-- Filtros -->
      <div class="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        <ZimaInput
          v-model="listSearch"
          placeholder="Buscar por cliente, serviço..."
          class="w-full sm:w-60"
          @update:model-value="currentPage = 1"
        />
        <ZimaSelect
          v-model="listStatus"
          :options="statusOptions"
          class="w-full sm:w-[200px]"
          @update:model-value="currentPage = 1"
        />
        <ZimaButton
          v-if="listSearch || listStatus !== 'all'"
          variant="ghost"
          size="sm"
          @click="clearFilters"
        >
          Limpar filtros
        </ZimaButton>
      </div>

      <ZimaCard padding="none">
        <ZimaTable
          :columns="listColumns"
          :rows="pagedList"
          empty-title="Nenhum agendamento encontrado"
        >
          <template #cell-datetime="{ row }">
            <div class="flex flex-col">
              <span class="text-xs font-medium" :style="{ color: 'var(--zima-text-primary)' }">{{ formatDate(row.date) }}</span>
              <span class="text-xs" :style="{ color: 'var(--zima-text-muted)', fontFamily: 'var(--zima-font-mono)' }">
                {{ row.startTime }} – {{ row.endTime }}
              </span>
            </div>
          </template>

          <template #cell-client="{ row }">
            <div class="flex items-center gap-2">
              <ZimaAvatar :name="row.clientName" size="sm" />
              <span class="text-sm" :style="{ color: 'var(--zima-text-primary)' }">{{ row.clientName }}</span>
            </div>
          </template>

          <template #cell-service="{ row }">
            <div class="flex items-center gap-2">
              <span class="text-sm" :style="{ color: 'var(--zima-text-primary)' }">{{ row.serviceName }}</span>
              <ZimaBadge size="sm" variant="neutral">{{ row.serviceDuration }}min</ZimaBadge>
            </div>
          </template>

          <template #cell-professional="{ row }">
            <div class="flex items-center gap-2">
              <ZimaAvatar :name="row.professionalName" size="sm" />
              <span class="text-sm" :style="{ color: 'var(--zima-text-secondary)' }">{{ row.professionalName }}</span>
            </div>
          </template>

          <template #cell-price="{ row }">
            <span
              class="text-sm font-medium tabular-nums"
              :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-mono)' }"
            >
              {{ formatPrice(row.price) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <ZimaBadge :variant="STATUS_STYLE[row.status as AppointmentStatus].variant">
              {{ STATUS_STYLE[row.status as AppointmentStatus].label }}
            </ZimaBadge>
          </template>

          <template #actions="{ row }">
            <div class="relative">
              <button
                class="flex items-center justify-center rounded-md transition-colors"
                :style="{ width: '28px', height: '28px', color: 'var(--zima-text-muted)' }"
                @click.stop="openActionMenu = openActionMenu === row.id ? null : row.id"
                @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
              >
                <Icon name="i-lucide-more-horizontal" style="width: 14px; height: 14px;" />
              </button>

              <Teleport to="body">
                <div
                  v-if="openActionMenu === row.id"
                  class="fixed z-50 rounded-lg shadow-lg py-1"
                  :style="{
                    background: 'var(--zima-bg-surface-3)',
                    border: '1px solid var(--zima-border-default)',
                    minWidth: '180px',
                    right: '80px',
                    top: '50%',
                  }"
                  @mouseleave="openActionMenu = null"
                >
                  <!-- Ação rápida de status -->
                  <button
                    v-if="ACTION_NEXT_STATUS[row.status as AppointmentStatus]"
                    class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
                    :style="{ color: 'var(--zima-text-primary)' }"
                    @click="handleQuickAction(row.id, ACTION_NEXT_STATUS[row.status as AppointmentStatus]!.status)"
                    @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                    @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
                  >
                    {{ ACTION_NEXT_STATUS[row.status as AppointmentStatus]!.label }}
                  </button>

                  <div :style="{ height: '1px', background: 'var(--zima-border-divider)', margin: '4px 0' }" />

                  <button
                    class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
                    :style="{ color: 'var(--zima-text-primary)' }"
                    @click="onClickAppointment(row.id); openActionMenu = null"
                    @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                    @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
                  >
                    Ver detalhes
                  </button>
                  <NuxtLink :to="`/saas/clientes/${row.clientId}`">
                    <button
                      class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
                      :style="{ color: 'var(--zima-text-primary)' }"
                      @click="openActionMenu = null"
                      @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                      @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
                    >
                      Ver ficha do cliente
                    </button>
                  </NuxtLink>

                  <template v-if="row.status !== 'CANCELLED' && row.status !== 'COMPLETED'">
                    <div :style="{ height: '1px', background: 'var(--zima-border-divider)', margin: '4px 0' }" />
                    <button
                      class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
                      :style="{ color: 'var(--zima-danger)' }"
                      @click="handleQuickAction(row.id, 'CANCELLED'); openActionMenu = null"
                      @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'"
                      @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
                    >
                      Cancelar
                    </button>
                  </template>
                </div>
              </Teleport>
            </div>
          </template>
        </ZimaTable>

        <!-- Paginação -->
        <div
          v-if="totalPages > 1"
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3"
          :style="{ borderTop: '1px solid var(--zima-border-divider)' }"
        >
          <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">
            Mostrando {{ Math.min((currentPage - 1) * pageSize + 1, filteredList.length) }}–{{ Math.min(currentPage * pageSize, filteredList.length) }}
            de {{ filteredList.length }}
          </span>
          <div class="flex items-center gap-2">
            <ZimaSelect
              v-model="pageSize"
              :options="[{ label: '10', value: 10 }, { label: '20', value: 20 }, { label: '50', value: 50 }]"
              style="width: 70px;"
              @update:model-value="currentPage = 1"
            />
            <button
              class="flex items-center justify-center rounded-md transition-colors"
              :style="{ width: '28px', height: '28px', color: currentPage === 1 ? 'var(--zima-text-muted)' : 'var(--zima-text-primary)', opacity: currentPage === 1 ? 0.4 : 1 }"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <Icon name="i-lucide-chevron-left" style="width: 14px; height: 14px;" />
            </button>
            <button
              class="flex items-center justify-center rounded-md transition-colors"
              :style="{ width: '28px', height: '28px', color: currentPage === totalPages ? 'var(--zima-text-muted)' : 'var(--zima-text-primary)', opacity: currentPage === totalPages ? 0.4 : 1 }"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              <Icon name="i-lucide-chevron-right" style="width: 14px; height: 14px;" />
            </button>
          </div>
        </div>
      </ZimaCard>
    </template>

    <!-- ── Modais / Drawers ───────────────────────────────────────────────── -->
    <ModalNovoAgendamento
      v-model="modalNovoOpen"
      :prefill="prefillData"
      @created="onCreated"
    />

    <DrawerDetalheAgendamento
      v-model="drawerOpen"
      :appointment-id="drawerDetalheId"
      @updated="onDrawerUpdated"
    />
  </div>
</template>
