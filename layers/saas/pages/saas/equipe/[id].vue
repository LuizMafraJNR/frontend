<script setup lang="ts">
import type { WorkSchedule, Blockout } from '../../../composables/useProfessionals'

definePageMeta({ layout: 'saas' })

const route = useRoute()
const proId = route.params.id as string

const {
  professionals: _professionals, schedules: _schedules, blockouts: _blockouts, loading,
  fetchAll, getProfessional, getSchedule, getBlockouts,
  updateProfessional: _updateProfessional, updateSchedule, createBlockout, deleteBlockout,
  statusLabel, statusVariant, DAY_LABELS,
} = useProfessionals()
const { services: _services, fetchAll: fetchServices } = useServices()
const toast = useZimaToast()

onMounted(async () => {
  await Promise.all([fetchAll(), fetchServices()])
})

const professional = computed(() => getProfessional(proId))
const schedule = computed(() => getSchedule(proId))
const proBlockouts = computed(() => getBlockouts(proId))

const activeTab = ref<'schedule' | 'blockouts' | 'performance'>('schedule')

// ---- Horário ----
const localScheduleDays = ref<WorkSchedule['days']>([])
const scheduleEdited = ref(false)
const scheduleLoading = ref(false)

watch(schedule, (s) => {
  if (s) localScheduleDays.value = s.days.map(d => ({ ...d }))
}, { immediate: true })

const timeOptions = computed(() => {
  const opts = []
  for (let h = 7; h <= 22; h++) {
    for (const m of [0, 30]) {
      const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      opts.push({ label, value: label })
    }
  }
  return opts
})

const handleScheduleChange = () => { scheduleEdited.value = true }

const saveSchedule = async () => {
  scheduleLoading.value = true
  await updateSchedule(proId, localScheduleDays.value)
  scheduleEdited.value = false
  scheduleLoading.value = false
  toast.success('Horário salvo com sucesso!')
}

// ---- Bloqueios ----
const modalBloqueioBopen = ref(false)
const blockoutForm = reactive({
  startDate: '',
  endDate: '',
  reason: '',
})
const blockoutLoading = ref(false)

const saveBlockout = async () => {
  if (!blockoutForm.startDate || !blockoutForm.endDate || !blockoutForm.reason) {
    toast.error('Preencha todos os campos do bloqueio.')
    return
  }
  blockoutLoading.value = true
  await createBlockout({ ...blockoutForm, professionalId: proId })
  blockoutLoading.value = false
  modalBloqueioBopen.value = false
  Object.assign(blockoutForm, { startDate: '', endDate: '', reason: '' })
  toast.success('Período bloqueado.')
}

const removeBlockout = async (blk: Blockout) => {
  await deleteBlockout(blk.id)
  toast.success('Bloqueio removido.')
}

// ---- Responsividade ----
const isMobile = ref(false)
const checkMobile = () => { isMobile.value = window.innerWidth < 640 }
onMounted(() => { checkMobile(); window.addEventListener('resize', checkMobile) })
onUnmounted(() => window.removeEventListener('resize', checkMobile))

const blockoutColumns = computed(() => [
  { key: 'startDate', label: 'Início' },
  ...(!isMobile.value ? [{ key: 'endDate', label: 'Fim' }] : []),
  { key: 'reason', label: 'Motivo' },
  { key: 'actions', label: '', width: '60px' },
])

// ---- Performance (mock) ----
const MOCK_RATINGS = [
  { client: 'Maria Silva', rating: 5, comment: 'Excelente atendimento, amei o resultado!', date: '2026-03-28' },
  { client: 'João Mendes', rating: 4, comment: 'Muito bom, voltarei com certeza.', date: '2026-03-25' },
  { client: 'Carla Souza', rating: 5, comment: 'Profissional incrível!', date: '2026-03-20' },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

const formatRevenue = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
</script>

<template>
  <div data-testid="page-equipe-id">
    <!-- Breadcrumb / back -->
    <NuxtLink
      to="/saas/equipe"
      class="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
      :style="{ color: 'var(--zima-text-muted)' }"
    >
      <Icon name="i-lucide-arrow-left" style="width: 14px; height: 14px;" />
      Voltar para Equipe
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col lg:flex-row gap-6">
      <ZimaSkeleton preset="card" class="w-full lg:w-[280px] lg:shrink-0" style="min-height: 400px;" />
      <div class="flex-1 flex flex-col gap-4">
        <ZimaSkeleton preset="card" height="48px" />
        <ZimaSkeleton preset="card" height="300px" />
      </div>
    </div>

    <!-- Not found -->
    <div
      v-else-if="!professional"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <Icon name="i-lucide-user-x" style="width: 40px; height: 40px;" :style="{ color: 'var(--zima-text-muted)' }" />
      <p class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">Profissional não encontrado.</p>
      <NuxtLink to="/saas/equipe">
        <ZimaButton variant="ghost" size="sm">Voltar para a lista</ZimaButton>
      </NuxtLink>
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col lg:flex-row gap-6 lg:items-start">
      <!-- Sidebar do profissional -->
      <div class="w-full lg:w-[280px] lg:shrink-0 flex flex-col gap-4">
        <ZimaCard>
          <div class="flex flex-col items-center gap-3 text-center">
            <ZimaAvatar :src="professional.avatar" :name="professional.name" size="xl" />
            <div>
              <h2
                class="text-base font-semibold"
                :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-display)' }"
              >
                {{ professional.name }}
              </h2>
              <p class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">
                {{ professional.role }}
              </p>
            </div>
            <ZimaBadge :variant="statusVariant(professional.status)">
              {{ statusLabel(professional.status) }}
            </ZimaBadge>
          </div>

          <!-- Divider -->
          <div class="my-4" :style="{ height: '1px', background: 'var(--zima-border-divider)' }" />

          <!-- Contato -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <Icon name="i-lucide-phone" class="shrink-0" style="width: 14px; height: 14px;" :style="{ color: 'var(--zima-text-muted)' }" />
              <span class="text-sm" :style="{ color: 'var(--zima-text-secondary)' }">{{ professional.phone }}</span>
            </div>
            <div class="flex items-center gap-2 min-w-0">
              <Icon name="i-lucide-mail" class="shrink-0" style="width: 14px; height: 14px;" :style="{ color: 'var(--zima-text-muted)' }" />
              <span class="text-sm truncate" :style="{ color: 'var(--zima-text-secondary)' }">{{ professional.email }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="i-lucide-calendar" class="shrink-0" style="width: 14px; height: 14px;" :style="{ color: 'var(--zima-text-muted)' }" />
              <span class="text-sm" :style="{ color: 'var(--zima-text-secondary)' }">Desde {{ formatDate(professional.joinedAt) }}</span>
            </div>
          </div>

          <!-- Divider -->
          <div class="my-4" :style="{ height: '1px', background: 'var(--zima-border-divider)' }" />

          <!-- KPIs -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Agend./mês</span>
              <span class="text-sm font-bold tabular-nums" :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-mono)' }">
                {{ professional.appointmentsThisMonth }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Receita/mês</span>
              <span class="text-sm font-bold tabular-nums" :style="{ color: 'var(--zima-blue-light)', fontFamily: 'var(--zima-font-mono)' }">
                {{ formatRevenue(professional.revenueThisMonth) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Comissão</span>
              <span class="text-sm font-bold" :style="{ color: 'var(--zima-text-secondary)' }">
                {{ professional.commissionRate }}%
              </span>
            </div>
          </div>
        </ZimaCard>
      </div>

      <!-- Área principal com tabs -->
      <div class="flex-1 min-w-0 flex flex-col gap-4">
        <!-- Tabs -->
        <div class="flex items-center gap-1 p-1 rounded-lg w-full sm:w-fit overflow-x-auto hide-scrollbar" :style="{ background: 'var(--zima-bg-surface-2)' }">
          <button
            v-for="tab in [
              { key: 'schedule', label: 'Horário' },
              { key: 'blockouts', label: 'Bloqueios' },
              { key: 'performance', label: 'Desempenho' },
            ]"
            :key="tab.key"
            class="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
            :style="{
              background: activeTab === tab.key ? 'var(--zima-bg-surface-3)' : 'transparent',
              color: activeTab === tab.key ? 'var(--zima-text-primary)' : 'var(--zima-text-muted)',
              boxShadow: activeTab === tab.key ? 'var(--zima-shadow-sm)' : 'none',
            }"
            @click="activeTab = tab.key as typeof activeTab"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab: Horário -->
        <template v-if="activeTab === 'schedule'">
          <ZimaCard>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold" :style="{ color: 'var(--zima-text-primary)' }">
                Horário de Trabalho
              </h3>
              <ZimaButton
                v-if="scheduleEdited"
                size="sm"
                :loading="scheduleLoading"
                @click="saveSchedule"
              >
                Salvar Horário
              </ZimaButton>
            </div>

            <div class="flex flex-col">
              <div
                v-for="day in localScheduleDays"
                :key="day.day"
                class="flex items-center gap-3 py-3"
                :style="{ borderBottom: '1px solid var(--zima-border-divider)' }"
              >
                <!-- Nome do dia fixo -->
                <div class="w-12 shrink-0">
                  <span class="text-sm font-medium" :style="{ color: 'var(--zima-text-secondary)' }">
                    {{ DAY_LABELS[day.day] }}
                  </span>
                </div>

                <!-- Toggle -->
                <ZimaToggle
                  :model-value="day.active"
                  size="sm"
                  class="shrink-0"
                  @update:model-value="day.active = $event; handleScheduleChange()"
                />

                <!-- Selects preenchem o restante ou "Folga" -->
                <template v-if="day.active">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <ZimaSelect
                      :model-value="day.startTime"
                      :options="timeOptions"
                      class="flex-1 min-w-0"
                      @update:model-value="day.startTime = String($event); handleScheduleChange()"
                    />
                    <span class="text-xs shrink-0" :style="{ color: 'var(--zima-text-muted)' }">–</span>
                    <ZimaSelect
                      :model-value="day.endTime"
                      :options="timeOptions"
                      class="flex-1 min-w-0"
                      @update:model-value="day.endTime = String($event); handleScheduleChange()"
                    />
                  </div>
                </template>
                <span
                  v-else
                  class="text-sm flex-1"
                  :style="{ color: 'var(--zima-text-muted)' }"
                >
                  Folga
                </span>
              </div>
            </div>
          </ZimaCard>
        </template>

        <!-- Tab: Bloqueios -->
        <template v-else-if="activeTab === 'blockouts'">
          <ZimaCard>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 class="text-sm font-semibold" :style="{ color: 'var(--zima-text-primary)' }">
                Períodos Bloqueados
              </h3>
              <ZimaButton size="sm" class="self-start sm:self-auto" @click="modalBloqueioBopen = true">
                <template #icon-left><Icon name="i-lucide-plus" style="width: 14px; height: 14px;" /></template>
                Novo Bloqueio
              </ZimaButton>
            </div>

            <div
              v-if="proBlockouts.length === 0"
              class="flex flex-col items-center py-8 gap-2"
            >
              <Icon name="i-lucide-calendar-off" style="width: 32px; height: 32px;" :style="{ color: 'var(--zima-text-muted)' }" />
              <p class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">Nenhum período bloqueado.</p>
            </div>

            <ZimaTable
              v-else
              :columns="blockoutColumns"
              :rows="proBlockouts"
            >
              <template #cell-startDate="{ row }">
                <span class="text-sm" :style="{ color: 'var(--zima-text-secondary)' }">
                  {{ formatDate(row.startDate) }}
                </span>
              </template>
              <template #cell-endDate="{ row }">
                <span class="text-sm" :style="{ color: 'var(--zima-text-secondary)' }">
                  {{ formatDate(row.endDate) }}
                </span>
              </template>
              <template #cell-reason="{ row }">
                <span class="text-sm" :style="{ color: 'var(--zima-text-primary)' }">
                  {{ row.reason }}
                </span>
              </template>
              <template #cell-actions="{ row }">
                <button
                  class="flex items-center justify-center rounded-md transition-colors"
                  :style="{ width: '28px', height: '28px', color: 'var(--zima-text-muted)' }"
                  aria-label="Remover bloqueio"
                  @click="removeBlockout(row)"
                  @mouseenter="(e: MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-danger)'
                  }"
                  @mouseleave="(e: MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.background = ''
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-muted)'
                  }"
                >
                  <Icon name="i-lucide-trash-2" style="width: 14px; height: 14px;" />
                </button>
              </template>
            </ZimaTable>
          </ZimaCard>

          <!-- Modal Novo Bloqueio (inline) -->
          <ZimaModal
            v-model="modalBloqueioBopen"
            title="Novo Período Bloqueado"
            description="Defina o intervalo e o motivo do bloqueio."
            size="sm"
          >
            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ZimaInput
                  v-model="blockoutForm.startDate"
                  label="Data início"
                  type="date"
                />
                <ZimaInput
                  v-model="blockoutForm.endDate"
                  label="Data fim"
                  type="date"
                />
              </div>
              <ZimaInput
                v-model="blockoutForm.reason"
                label="Motivo"
                placeholder="Ex: Férias, consulta médica..."
              />
            </div>
            <template #footer>
              <ZimaButton variant="ghost" @click="modalBloqueioBopen = false">Cancelar</ZimaButton>
              <ZimaButton :loading="blockoutLoading" @click="saveBlockout">Bloquear Período</ZimaButton>
            </template>
          </ZimaModal>
        </template>

        <!-- Tab: Desempenho -->
        <template v-else>
          <!-- KPI Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ZimaCard
v-for="kpi in [
              { label: 'Agendamentos no mês', value: String(professional.appointmentsThisMonth), icon: 'i-lucide-calendar-check' },
              { label: 'Receita gerada', value: formatRevenue(professional.revenueThisMonth), icon: 'i-lucide-trending-up' },
              { label: 'Comissão a pagar', value: formatRevenue(professional.revenueThisMonth * professional.commissionRate / 100), icon: 'i-lucide-banknote' },
            ]" :key="kpi.label">
              <div class="flex items-start gap-3">
                <div
                  class="flex items-center justify-center rounded-lg shrink-0"
                  :style="{
                    width: '36px',
                    height: '36px',
                    background: 'var(--zima-blue-subtle)',
                  }"
                >
                  <Icon :name="kpi.icon" style="width: 16px; height: 16px;" :style="{ color: 'var(--zima-blue-light)' }" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">{{ kpi.label }}</p>
                  <p
                    class="text-lg font-bold tabular-nums mt-0.5"
                    :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-mono)' }"
                  >
                    {{ kpi.value }}
                  </p>
                </div>
              </div>
            </ZimaCard>
          </div>

          <!-- Avaliações -->
          <ZimaCard>
            <h3 class="text-sm font-semibold mb-4" :style="{ color: 'var(--zima-text-primary)' }">
              Últimas Avaliações
            </h3>
            <div class="flex flex-col gap-4">
              <div
                v-for="r in MOCK_RATINGS"
                :key="r.client"
                class="flex flex-col gap-1.5 pb-4"
                :style="{ borderBottom: '1px solid var(--zima-border-divider)' }"
              >
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">
                    {{ r.client }}
                  </span>
                  <div class="flex items-center gap-1 shrink-0">
                    <Icon
                      v-for="i in 5"
                      :key="i"
                      name="i-lucide-star"
                      style="width: 12px; height: 12px;"
                      :style="{ color: i <= r.rating ? '#F59E0B' : 'var(--zima-border-hover)' }"
                    />
                    <span class="text-xs ml-1 hidden sm:inline" :style="{ color: 'var(--zima-text-muted)' }">
                      {{ formatDate(r.date) }}
                    </span>
                  </div>
                </div>
                <span class="text-xs sm:hidden" :style="{ color: 'var(--zima-text-muted)' }">
                  {{ formatDate(r.date) }}
                </span>
                <p class="text-sm" :style="{ color: 'var(--zima-text-secondary)' }">
                  "{{ r.comment }}"
                </p>
              </div>
            </div>
          </ZimaCard>
        </template>
      </div>
    </div>
  </div>
</template>
