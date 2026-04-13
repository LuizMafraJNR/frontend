<script setup lang="ts">
import type { ZimaSearchItem } from '../../components/zima/ZimaSearchAutocomplete.vue'
import type { ZimaStep } from '../../components/zima/ZimaStepper.vue'

const props = defineProps<{
  modelValue: boolean
  prefill?: { professionalId?: string; date?: string; startTime?: string }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': []
}>()

const { appointments, fetchAll: fetchAppointments, createAppointment, getAvailableSlots } = useAppointments()
const { servicesByCategory, fetchAll: fetchServices } = useServices()
const { professionals, fetchAll: fetchProfessionals } = useProfessionals()
const toast = useZimaToast()

onMounted(async () => {
  // Carrega dados se ainda não foram carregados (o composable cria instâncias separadas)
  if (!appointments.value.length) fetchAppointments()
  if (!servicesByCategory.value.length) fetchServices()
  if (!professionals.value.length) fetchProfessionals()
})

// ── Steps ────────────────────────────────────────────────────────────────────
const STEPS: ZimaStep[] = [
  { key: 'client',   label: 'Cliente' },
  { key: 'service',  label: 'Serviço' },
  { key: 'datetime', label: 'Data/Hora' },
  { key: 'confirm',  label: 'Confirmação' },
]

const currentStep = ref('client')
const currentStepIndex = computed(() => STEPS.findIndex(s => s.key === currentStep.value))

const nextStep = () => {
  const idx = currentStepIndex.value
  if (idx < STEPS.length - 1) currentStep.value = STEPS[idx + 1].key
}
const prevStep = () => {
  const idx = currentStepIndex.value
  if (idx > 0) currentStep.value = STEPS[idx - 1].key
}

// ── Clientes mock (substituir por useCustomers quando disponível) ─────────────
const MOCK_CLIENTS_DATA = [
  { id: 'cli-1', label: 'Maria Silva',     sublabel: '(11) 91234-5678', lastVisit: '28/03/2026', visits: 12, phone: '(11) 91234-5678', email: 'maria.silva@email.com' },
  { id: 'cli-2', label: 'João Mendes',     sublabel: '(11) 92345-6789', lastVisit: '25/03/2026', visits: 8,  phone: '(11) 92345-6789', email: 'joao.mendes@email.com' },
  { id: 'cli-3', label: 'Beatriz Souza',   sublabel: '(11) 93456-7890', lastVisit: '02/04/2026', visits: 5,  phone: '(11) 93456-7890', email: 'beatriz.souza@email.com' },
  { id: 'cli-4', label: 'Rafael Torres',   sublabel: '(11) 94567-8901', lastVisit: '15/03/2026', visits: 3,  phone: '(11) 94567-8901', email: 'rafael.torres@email.com' },
  { id: 'cli-5', label: 'Fernanda Lima',   sublabel: '(11) 95678-9012', lastVisit: '20/03/2026', visits: 7,  phone: '(11) 95678-9012', email: 'fernanda.lima@email.com' },
  { id: 'cli-6', label: 'Paulo Andrade',   sublabel: '(11) 96789-0123', lastVisit: '10/03/2026', visits: 2,  phone: '(11) 96789-0123', email: 'paulo.andrade@email.com' },
  { id: 'cli-7', label: 'Camila Ferreira', sublabel: '(11) 97890-1234', lastVisit: '18/03/2026', visits: 9,  phone: '(11) 97890-1234', email: 'camila.ferreira@email.com' },
  { id: 'cli-8', label: 'Lucas Oliveira',  sublabel: '(11) 98901-2345', lastVisit: '05/03/2026', visits: 4,  phone: '(11) 98901-2345', email: 'lucas.oliveira@email.com' },
]

// ── Step 1: Cliente ──────────────────────────────────────────────────────────
const clientSearch = ref('')
const selectedClient = ref<typeof MOCK_CLIENTS_DATA[0] | null>(null)
const filteredClients = computed((): ZimaSearchItem[] => {
  const q = clientSearch.value.toLowerCase()
  if (q.length < 2) return []
  return MOCK_CLIENTS_DATA
    .filter(c => c.label.toLowerCase().includes(q) || c.sublabel.includes(q))
    .slice(0, 8)
    .map(c => ({ id: c.id, label: c.label, sublabel: c.sublabel }))
})

const onClientSelect = (item: ZimaSearchItem) => {
  selectedClient.value = MOCK_CLIENTS_DATA.find(c => c.id === item.id) ?? null
  clientSearch.value = item.label
}

const canNextStep1 = computed(() => !!selectedClient.value)

// ── Step 2: Serviço ──────────────────────────────────────────────────────────
const selectedServiceId = ref<string | null>(null)
const selectedServiceName = ref('')
const selectedServiceDuration = ref(0)
const selectedServicePrice = ref(0)

const selectService = (svcId: string, svcName: string, duration: number, price: number) => {
  selectedServiceId.value = svcId
  selectedServiceName.value = svcName
  selectedServiceDuration.value = duration
  selectedServicePrice.value = price
}

const canNextStep2 = computed(() => !!selectedServiceId.value)

// ── Step 3: Profissional + Data/Hora ─────────────────────────────────────────
const selectedProfessionalId = ref(props.prefill?.professionalId ?? '')
const selectedProfessionalName = ref('')
const selectedDate = ref(props.prefill?.date ?? '')
const selectedTime = ref(props.prefill?.startTime ?? '')

// Calendar inline
const calendarBase = ref(new Date())
const calendarYear = computed(() => calendarBase.value.getFullYear())
const calendarMonth = computed(() => calendarBase.value.getMonth())

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAY_LABELS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: { day: number | null; iso: string }[] = []
  for (let i = 0; i < firstDay; i++) days.push({ day: null, iso: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ day: d, iso })
  }
  return days
})

const todayISO = computed(() => new Date().toISOString().slice(0, 10))
const isPast = (iso: string) => iso < todayISO.value

const prevMonth = () => {
  const d = new Date(calendarBase.value)
  d.setMonth(d.getMonth() - 1)
  calendarBase.value = d
}
const nextMonth = () => {
  const d = new Date(calendarBase.value)
  d.setMonth(d.getMonth() + 1)
  calendarBase.value = d
}

const selectDate = (iso: string) => {
  if (!iso || isPast(iso)) return
  selectedDate.value = iso
  selectedTime.value = ''
}

// Profissionais habilitados para o serviço selecionado
const eligibleProfessionals = computed(() =>
  professionals.value.filter(p =>
    p.status === 'active' && (!selectedServiceId.value || p.services.includes(selectedServiceId.value))
  )
)

const selectProfessional = (proId: string, proName: string) => {
  selectedProfessionalId.value = proId
  selectedProfessionalName.value = proName
  selectedTime.value = ''
}

// Slots disponíveis
const availableSlots = computed(() => {
  if (!selectedProfessionalId.value || !selectedDate.value || !selectedServiceDuration.value) return []
  return getAvailableSlots(selectedProfessionalId.value, selectedDate.value, selectedServiceDuration.value)
})

const canNextStep3 = computed(() =>
  !!selectedProfessionalId.value && !!selectedDate.value && !!selectedTime.value
)

// ── Step 4: Confirmação ──────────────────────────────────────────────────────
const notes = ref('')
const sendWhatsapp = ref(true)
const sendReminder = ref(true)
const confirmLoading = ref(false)

const formattedDateTime = computed(() => {
  if (!selectedDate.value || !selectedTime.value) return ''
  const d = new Date(selectedDate.value + 'T12:00:00')
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  const endTime = addMinutes(selectedTime.value, selectedServiceDuration.value)
  return `${weekdays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()} às ${selectedTime.value} – ${endTime}`
})

const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const confirmAppointment = async () => {
  if (!selectedClient.value || !selectedServiceId.value || !selectedProfessionalId.value) return
  confirmLoading.value = true
  const endTime = addMinutes(selectedTime.value, selectedServiceDuration.value)
  await createAppointment({
    clientId: selectedClient.value.id,
    clientName: selectedClient.value.label,
    clientPhone: selectedClient.value.phone,
    clientEmail: selectedClient.value.email,
    clientVisits: selectedClient.value.visits,
    clientSince: 'recente',
    serviceId: selectedServiceId.value,
    serviceName: selectedServiceName.value,
    serviceDuration: selectedServiceDuration.value,
    professionalId: selectedProfessionalId.value,
    professionalName: selectedProfessionalName.value,
    professionalRole: professionals.value.find(p => p.id === selectedProfessionalId.value)?.role ?? '',
    date: selectedDate.value,
    startTime: selectedTime.value,
    endTime,
    price: selectedServicePrice.value,
    status: 'PENDING',
    notes: notes.value || undefined,
  })
  confirmLoading.value = false
  toast.add({
    type: 'success',
    title: 'Agendamento criado!',
    description: `${selectedClient.value.label} · ${selectedTime.value}`,
    action: () => navigateTo('/saas/agenda'),
    actionLabel: 'Ver na agenda',
  })
  emit('created')
  closeModal()
}

const closeModal = () => {
  emit('update:modelValue', false)
  currentStep.value = 'client'
  clientSearch.value = ''
  selectedClient.value = null
  selectedServiceId.value = null
  selectedProfessionalId.value = props.prefill?.professionalId ?? ''
  selectedDate.value = props.prefill?.date ?? ''
  selectedTime.value = props.prefill?.startTime ?? ''
  notes.value = ''
}

// Sincronizar prefill quando o prop muda
watch(() => props.prefill, (pf) => {
  if (pf?.professionalId) selectedProfessionalId.value = pf.professionalId
  if (pf?.date) selectedDate.value = pf.date
  if (pf?.startTime) selectedTime.value = pf.startTime
}, { immediate: true })

// Inicializar nome do profissional quando ID é pré-preenchido
watch([selectedProfessionalId, professionals], ([id, pros]) => {
  if (id) {
    const pro = pros.find(p => p.id === id)
    if (pro) selectedProfessionalName.value = pro.name
  }
}, { immediate: true })
</script>

<template>
  <ZimaModal
    :model-value="modelValue"
    title="Novo Agendamento"
    size="lg"
    :prevent-close="confirmLoading"
    @update:model-value="closeModal"
  >
    <template #default>
      <!-- Stepper -->
      <div class="mb-6">
        <ZimaStepper :steps="STEPS" :model-value="currentStep" />
      </div>

      <!-- Step 1: Cliente -->
      <div v-if="currentStep === 'client'" class="flex flex-col gap-4">
        <ZimaSearchAutocomplete
          v-model="clientSearch"
          label="Cliente"
          placeholder="Buscar por nome ou telefone..."
          :items="filteredClients"
          :min-chars="2"
          @select="onClientSelect"
        />

        <!-- Mini-card do cliente selecionado -->
        <div
          v-if="selectedClient"
          class="flex items-center gap-3 p-3 rounded-lg"
          :style="{ background: 'var(--zima-blue-subtle)', border: '1px solid rgba(59,130,246,0.2)' }"
        >
          <ZimaAvatar :name="selectedClient.label" size="md" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold" :style="{ color: 'var(--zima-text-primary)' }">{{ selectedClient.label }}</p>
            <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">{{ selectedClient.phone }}</p>
            <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">
              Última visita: {{ selectedClient.lastVisit }} · {{ selectedClient.visits }} visitas
            </p>
          </div>
          <button
            class="flex items-center justify-center rounded-md"
            :style="{ width: '24px', height: '24px', color: 'var(--zima-text-muted)' }"
            @click="selectedClient = null; clientSearch = ''"
          >
            <Icon name="i-lucide-x" style="width: 12px; height: 12px;" />
          </button>
        </div>

        <button
          class="text-sm self-start"
          :style="{ color: 'var(--zima-blue-light)' }"
          @click="toast.info('Cadastro de cliente disponível em breve.')"
        >
          + Cadastrar novo cliente
        </button>
      </div>

      <!-- Step 2: Serviço -->
      <div v-else-if="currentStep === 'service'" class="flex flex-col gap-4 max-h-96 overflow-y-auto pr-1">
        <div
          v-for="group in servicesByCategory"
          :key="group.category.id"
        >
          <p
            class="text-xs font-semibold uppercase mb-2"
            :style="{ color: 'var(--zima-text-muted)', letterSpacing: '0.08em' }"
          >
            {{ group.category.name }}
          </p>
          <div class="flex flex-col gap-2">
            <button
              v-for="svc in group.services.filter(s => s.active)"
              :key="svc.id"
              class="flex items-center gap-3 p-3 rounded-lg text-left transition-all"
              :style="{
                background: selectedServiceId === svc.id ? 'rgba(59,130,246,0.10)' : 'var(--zima-bg-surface-2)',
                border: `1px solid ${selectedServiceId === svc.id ? 'rgba(59,130,246,0.3)' : 'var(--zima-border-default)'}`,
              }"
              @click="selectService(svc.id, svc.name, svc.duration, svc.price)"
            >
              <div class="flex-1">
                <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">{{ svc.name }}</p>
              </div>
              <ZimaBadge size="sm" variant="neutral">{{ svc.duration }}min</ZimaBadge>
              <span
                class="text-sm font-semibold tabular-nums"
                :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-mono)', minWidth: '60px', textAlign: 'right' }"
              >
                {{ formatPrice(svc.price) }}
              </span>
              <div
                v-if="selectedServiceId === svc.id"
                class="flex items-center justify-center rounded-full"
                :style="{ width: '20px', height: '20px', background: 'var(--zima-blue-core)', flexShrink: 0 }"
              >
                <Icon name="i-lucide-check" style="width: 11px; height: 11px; color: white;" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: Profissional + Data/Hora -->
      <div v-else-if="currentStep === 'datetime'" class="flex flex-col gap-5">
        <!-- Profissionais -->
        <div>
          <p class="text-xs font-semibold uppercase mb-3" :style="{ color: 'var(--zima-text-muted)', letterSpacing: '0.08em' }">
            Profissional
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="pro in eligibleProfessionals"
              :key="pro.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              :style="{
                background: selectedProfessionalId === pro.id ? 'rgba(59,130,246,0.10)' : 'var(--zima-bg-surface-2)',
                border: `1px solid ${selectedProfessionalId === pro.id ? 'rgba(59,130,246,0.3)' : 'var(--zima-border-default)'}`,
              }"
              @click="selectProfessional(pro.id, pro.name)"
            >
              <ZimaAvatar :name="pro.name" size="sm" />
              <div class="text-left">
                <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">{{ pro.name }}</p>
                <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">{{ pro.role }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Calendar inline -->
        <div v-if="selectedProfessionalId">
          <p class="text-xs font-semibold uppercase mb-3" :style="{ color: 'var(--zima-text-muted)', letterSpacing: '0.08em' }">
            Data
          </p>
          <div
            class="rounded-lg p-3"
            :style="{ background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)' }"
          >
            <!-- Header do calendário -->
            <div class="flex items-center justify-between mb-3">
              <button
                class="flex items-center justify-center rounded-md transition-colors"
                :style="{ width: '28px', height: '28px', color: 'var(--zima-text-muted)' }"
                @click="prevMonth"
                @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
              >
                <Icon name="i-lucide-chevron-left" style="width: 14px; height: 14px;" />
              </button>
              <span class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">
                {{ MONTH_NAMES[calendarMonth] }} {{ calendarYear }}
              </span>
              <button
                class="flex items-center justify-center rounded-md transition-colors"
                :style="{ width: '28px', height: '28px', color: 'var(--zima-text-muted)' }"
                @click="nextMonth"
                @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
              >
                <Icon name="i-lucide-chevron-right" style="width: 14px; height: 14px;" />
              </button>
            </div>

            <!-- Dias da semana -->
            <div class="grid grid-cols-7 mb-1">
              <div
                v-for="dl in DAY_LABELS"
                :key="dl"
                class="text-center text-xs py-1"
                :style="{ color: 'var(--zima-text-muted)' }"
              >
                {{ dl }}
              </div>
            </div>

            <!-- Dias do mês -->
            <div class="grid grid-cols-7 gap-0.5">
              <div
                v-for="(cell, i) in calendarDays"
                :key="i"
              >
                <button
                  v-if="cell.day"
                  class="w-full aspect-square flex items-center justify-center text-xs rounded-full transition-all"
                  :disabled="isPast(cell.iso)"
                  :style="{
                    background: selectedDate === cell.iso
                      ? 'var(--zima-blue-core)'
                      : cell.iso === todayISO
                        ? 'rgba(59,130,246,0.12)'
                        : 'transparent',
                    color: selectedDate === cell.iso
                      ? '#fff'
                      : isPast(cell.iso)
                        ? 'var(--zima-text-muted)'
                        : 'var(--zima-text-primary)',
                    opacity: isPast(cell.iso) ? 0.4 : 1,
                    cursor: isPast(cell.iso) ? 'not-allowed' : 'pointer',
                  }"
                  @click="selectDate(cell.iso)"
                >
                  {{ cell.day }}
                </button>
                <div v-else />
              </div>
            </div>
          </div>
        </div>

        <!-- Time slots -->
        <div v-if="selectedDate">
          <p class="text-xs font-semibold uppercase mb-3" :style="{ color: 'var(--zima-text-muted)', letterSpacing: '0.08em' }">
            Horário disponível
          </p>
          <div v-if="availableSlots.filter(s => s.available).length === 0" class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">
            Sem horários disponíveis para esta data. Tente outra data ou profissional.
          </div>
          <div v-else class="grid grid-cols-5 gap-2">
            <button
              v-for="slot in availableSlots.filter(s => s.available)"
              :key="slot.time"
              class="px-2 py-2 rounded-lg text-xs font-medium text-center transition-all"
              :style="{
                background: selectedTime === slot.time ? 'var(--zima-blue-core)' : 'var(--zima-bg-surface-2)',
                color: selectedTime === slot.time ? '#fff' : 'var(--zima-text-primary)',
                border: `1px solid ${selectedTime === slot.time ? 'var(--zima-blue-core)' : 'rgba(148,163,184,0.08)'}`,
              }"
              @click="selectedTime = slot.time"
            >
              {{ slot.time }}
            </button>
          </div>
        </div>
      </div>

      <!-- Step 4: Confirmação -->
      <div v-else class="flex flex-col gap-4">
        <!-- Resumo -->
        <div
          class="flex flex-col gap-3 p-4 rounded-lg"
          :style="{ background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)' }"
        >
          <div class="flex items-center gap-3">
            <Icon name="i-lucide-user" style="width: 14px; height: 14px;" :style="{ color: 'var(--zima-text-muted)' }" />
            <div>
              <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Cliente</span>
              <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">
                {{ selectedClient?.label }} · {{ selectedClient?.phone }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Icon name="i-lucide-scissors" style="width: 14px; height: 14px;" :style="{ color: 'var(--zima-text-muted)' }" />
            <div>
              <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Serviço</span>
              <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">
                {{ selectedServiceName }} · {{ selectedServiceDuration }}min
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Icon name="i-lucide-user-check" style="width: 14px; height: 14px;" :style="{ color: 'var(--zima-text-muted)' }" />
            <div>
              <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Profissional</span>
              <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">{{ selectedProfessionalName }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Icon name="i-lucide-calendar" style="width: 14px; height: 14px;" :style="{ color: 'var(--zima-text-muted)' }" />
            <div>
              <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Data/Hora</span>
              <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">{{ formattedDateTime }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Icon name="i-lucide-dollar-sign" style="width: 14px; height: 14px;" :style="{ color: 'var(--zima-text-muted)' }" />
            <div>
              <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Valor</span>
              <p class="text-sm font-bold tabular-nums" :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-mono)' }">
                {{ formatPrice(selectedServicePrice) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Observações -->
        <div class="flex flex-col gap-1.5">
          <span class="text-xs font-medium" :style="{ color: 'var(--zima-text-secondary)' }">Observações (opcional)</span>
          <textarea
            v-model="notes"
            rows="3"
            placeholder="Adicione observações para este agendamento..."
            class="resize-none text-sm rounded-md px-3 py-2 outline-none transition-all"
            :style="{
              background: 'var(--zima-bg-surface-2)',
              border: '1px solid var(--zima-border-default)',
              color: 'var(--zima-text-primary)',
              fontFamily: 'var(--zima-font-sans)',
            }"
          />
        </div>

        <!-- Toggles -->
        <div class="flex flex-col gap-3">
          <ZimaToggle v-model="sendWhatsapp" label="Enviar confirmação por WhatsApp" size="sm" />
          <ZimaToggle v-model="sendReminder" label="Agendar lembrete automático (24h antes)" size="sm" />
        </div>
      </div>
    </template>

    <template #footer>
      <!-- Botão Voltar -->
      <ZimaButton
        v-if="currentStepIndex > 0"
        variant="ghost"
        @click="prevStep"
      >
        <template #icon-left><Icon name="i-lucide-arrow-left" style="width: 14px; height: 14px;" /></template>
        Anterior
      </ZimaButton>
      <ZimaButton
        v-else
        variant="ghost"
        @click="closeModal"
      >
        Cancelar
      </ZimaButton>

      <!-- Botão Próximo / Confirmar -->
      <ZimaButton
        v-if="currentStep !== 'confirm'"
        :disabled="
          (currentStep === 'client' && !canNextStep1) ||
          (currentStep === 'service' && !canNextStep2) ||
          (currentStep === 'datetime' && !canNextStep3)
        "
        @click="nextStep"
      >
        Próximo
        <template #icon-right><Icon name="i-lucide-arrow-right" style="width: 14px; height: 14px;" /></template>
      </ZimaButton>
      <ZimaButton
        v-else
        :loading="confirmLoading"
        @click="confirmAppointment"
      >
        <template #icon-left><Icon name="i-lucide-check" style="width: 14px; height: 14px;" /></template>
        Confirmar Agendamento
      </ZimaButton>
    </template>
  </ZimaModal>
</template>
