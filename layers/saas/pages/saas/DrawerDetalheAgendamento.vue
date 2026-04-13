<script setup lang="ts">
import type { AppointmentStatus } from '../../composables/useAppointments'
import { STATUS_STYLE } from '../../composables/useAppointments'

const props = defineProps<{
  modelValue: boolean
  appointmentId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'updated': []
}>()

const { appointments, fetchAll: fetchAppointments, updateStatus, reschedule, updateInternalNotes } = useAppointments()
const toast = useZimaToast()

onMounted(() => {
  if (!appointments.value.length) fetchAppointments()
})

const appointment = computed(() =>
  props.appointmentId ? appointments.value.find(a => a.id === props.appointmentId) ?? null : null
)

const actionLoading = ref<string | null>(null)

// ── Notas internas ───────────────────────────────────────────────────────────
const internalNotesValue = ref('')
let saveDebounce: ReturnType<typeof setTimeout>

watch(() => appointment.value?.internalNotes, (v) => {
  internalNotesValue.value = v ?? ''
}, { immediate: true })

const onInternalNotesBlur = () => {
  clearTimeout(saveDebounce)
  saveDebounce = setTimeout(async () => {
    if (!props.appointmentId) return
    await updateInternalNotes(props.appointmentId, internalNotesValue.value)
  }, 600)
}

// ── Ações por status ─────────────────────────────────────────────────────────
const handleAction = async (action: string) => {
  if (!props.appointmentId || !appointment.value) return
  actionLoading.value = action

  if (action === 'confirm') {
    await updateStatus(props.appointmentId, 'CONFIRMED')
    toast.add({
      type: 'success',
      title: 'Agendamento confirmado!',
      description: appointment.value?.clientName,
      action: () => navigateTo('/saas/agenda'),
      actionLabel: 'Ver na agenda',
    })
    emit('updated')
  } else if (action === 'checkin') {
    await updateStatus(props.appointmentId, 'CHECKED_IN')
    toast.success('Check-in realizado!')
    emit('updated')
  } else if (action === 'start') {
    await updateStatus(props.appointmentId, 'IN_PROGRESS')
    toast.success('Atendimento iniciado!')
    emit('updated')
  } else if (action === 'complete') {
    await updateStatus(props.appointmentId, 'COMPLETED')
    toast.add({
      type: 'success',
      title: 'Atendimento concluído!',
      description: appointment.value?.clientName,
      action: () => navigateTo('/saas/agenda'),
      actionLabel: 'Ver na agenda',
    })
    emit('updated')
    modalConcluidoOpen.value = true
  } else if (action === 'sell') {
    emit('update:modelValue', false)
    await navigateTo('/saas/caixa')
  } else if (action === 'cancel') {
    modalCancelarOpen.value = true
  } else if (action === 'reschedule') {
    modalReagendarOpen.value = true
  }

  actionLoading.value = null
}

// ── Modal Cancelar ───────────────────────────────────────────────────────────
const modalCancelarOpen = ref(false)
const cancelReason = ref('')
const cancelLoading = ref(false)

const confirmCancel = async () => {
  if (!cancelReason.value.trim()) {
    toast.error('Informe o motivo do cancelamento.')
    return
  }
  cancelLoading.value = true
  await updateStatus(props.appointmentId!, 'CANCELLED', cancelReason.value)
  cancelLoading.value = false
  modalCancelarOpen.value = false
  toast.success('Agendamento cancelado.')
  emit('updated')
  emit('update:modelValue', false)
}

// ── Modal Reagendar ──────────────────────────────────────────────────────────
const modalReagendarOpen = ref(false)
const reagendarDate = ref('')
const reagendarTime = ref('')
const reagendarLoading = ref(false)

const availableSlots = computed(() => {
  if (!appointment.value || !reagendarDate.value) return []
  const { getAvailableSlots } = useAppointments()
  return getAvailableSlots(appointment.value.professionalId, reagendarDate.value, appointment.value.serviceDuration)
    .filter(s => s.available)
})

const confirmReschedule = async () => {
  if (!reagendarDate.value || !reagendarTime.value) {
    toast.error('Selecione data e horário.')
    return
  }
  reagendarLoading.value = true
  await reschedule(props.appointmentId!, reagendarDate.value, reagendarTime.value)
  reagendarLoading.value = false
  modalReagendarOpen.value = false
  toast.success('Agendamento reagendado!')
  emit('updated')
}

// ── Modal pós-conclusão ──────────────────────────────────────────────────────
const modalConcluidoOpen = ref(false)

// ── Formatações ──────────────────────────────────────────────────────────────
const formatDate = (isoDate: string, isoTime?: string) => {
  const d = new Date(isoDate + 'T12:00:00')
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const base = `${weekdays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`
  return isoTime ? `${base} — ${isoTime}` : base
}

const formatPrice = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatHistoryAt = (iso: string) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

type ActionDef = { label: string; variant: 'primary' | 'ghost' | 'danger'; action: string; danger?: boolean }

const footerActions = computed((): ActionDef[] => {
  if (!appointment.value) return []
  const status = appointment.value.status
  const map: Record<AppointmentStatus, ActionDef[]> = {
    PENDING:     [{ label: 'Confirmar', variant: 'primary', action: 'confirm' }, { label: 'Reagendar', variant: 'ghost', action: 'reschedule' }, { label: 'Cancelar', variant: 'ghost', action: 'cancel', danger: true }],
    CONFIRMED:   [{ label: 'Check-in', variant: 'primary', action: 'checkin' }, { label: 'Reagendar', variant: 'ghost', action: 'reschedule' }, { label: 'Cancelar', variant: 'ghost', action: 'cancel', danger: true }],
    CHECKED_IN:  [{ label: 'Iniciar Atendimento', variant: 'primary', action: 'start' }],
    IN_PROGRESS: [{ label: 'Concluir', variant: 'primary', action: 'complete' }],
    COMPLETED:   appointment.value?.cancelReason ? [] : [{ label: 'Registrar Venda', variant: 'primary', action: 'sell' }],
    CANCELLED:   [],
  }
  return map[status] ?? []
})
</script>

<template>
  <ZimaDrawer
    :model-value="modelValue"
    width="480px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="appointment" #header>
      <div class="flex items-center justify-between w-full">
        <ZimaBadge :variant="STATUS_STYLE[appointment.status].variant">
          {{ STATUS_STYLE[appointment.status].label }}
        </ZimaBadge>
        <button
          class="flex items-center justify-center rounded-md transition-colors"
          :style="{ width: '32px', height: '32px', color: 'var(--zima-text-muted)' }"
          aria-label="Fechar drawer"
          @click="emit('update:modelValue', false)"
          @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
          @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
        >
          <Icon name="i-lucide-x" style="width: 16px; height: 16px;" />
        </button>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="!appointment" class="flex flex-col gap-4 p-4">
      <ZimaSkeleton preset="title" />
      <ZimaSkeleton preset="text" :lines="4" />
    </div>

    <div v-else class="flex flex-col gap-6">
      <!-- Seção 1 — Informações -->
      <div class="flex flex-col gap-3">
        <div class="flex items-start gap-3">
          <Icon name="i-lucide-calendar" style="width: 16px; height: 16px; margin-top: 2px; flex-shrink: 0;" :style="{ color: 'var(--zima-text-muted)' }" />
          <div>
            <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">
              {{ formatDate(appointment.date) }}
            </p>
            <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">
              {{ appointment.startTime }} às {{ appointment.endTime }}
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <Icon name="i-lucide-scissors" style="width: 16px; height: 16px; margin-top: 2px; flex-shrink: 0;" :style="{ color: 'var(--zima-text-muted)' }" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium" :style="{ color: 'var(--zima-text-primary)' }">
              {{ appointment.serviceName }}
            </p>
            <ZimaBadge size="sm" variant="neutral">{{ appointment.serviceDuration }}min</ZimaBadge>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <Icon name="i-lucide-dollar-sign" style="width: 16px; height: 16px; flex-shrink: 0;" :style="{ color: 'var(--zima-text-muted)' }" />
          <p
            class="text-base font-bold tabular-nums"
            :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-mono)' }"
          >
            {{ formatPrice(appointment.price) }}
          </p>
        </div>
      </div>

      <!-- Divider -->
      <div :style="{ height: '1px', background: 'var(--zima-border-divider)' }" />

      <!-- Seção 2 — Cliente -->
      <div>
        <p class="text-xs font-semibold uppercase mb-3" :style="{ color: 'var(--zima-text-muted)', letterSpacing: '0.08em' }">
          Cliente
        </p>
        <div
          class="flex flex-col gap-3 p-3 rounded-lg"
          :style="{ background: 'var(--zima-bg-surface-2)', border: '1px solid var(--zima-border-default)' }"
        >
          <div class="flex items-center gap-3">
            <ZimaAvatar :name="appointment.clientName" size="md" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate" :style="{ color: 'var(--zima-text-primary)' }">
                {{ appointment.clientName }}
              </p>
              <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">
                {{ appointment.clientPhone }}
              </p>
              <p class="text-xs truncate" :style="{ color: 'var(--zima-text-muted)' }">
                {{ appointment.clientEmail }}
              </p>
            </div>
            <div class="flex items-center gap-1">
              <NuxtLink :to="`/saas/clientes/${appointment.clientId}`">
                <button
                  class="flex items-center justify-center rounded-md transition-colors"
                  :style="{ width: '28px', height: '28px', color: 'var(--zima-text-muted)' }"
                  aria-label="Abrir ficha do cliente"
                  @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                  @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
                >
                  <Icon name="i-lucide-external-link" style="width: 14px; height: 14px;" />
                </button>
              </NuxtLink>
              <a :href="`https://wa.me/55${appointment.clientPhone.replace(/\D/g, '')}`" target="_blank" rel="noopener">
                <button
                  class="flex items-center justify-center rounded-md transition-colors"
                  :style="{ width: '28px', height: '28px', color: 'var(--zima-text-muted)' }"
                  aria-label="Abrir WhatsApp"
                  @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
                  @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
                >
                  <Icon name="i-lucide-message-circle" style="width: 14px; height: 14px;" />
                </button>
              </a>
            </div>
          </div>
          <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">
            Cliente desde {{ appointment.clientSince }} · {{ appointment.clientVisits }} visitas
          </p>
        </div>
      </div>

      <!-- Seção 3 — Profissional -->
      <div>
        <p class="text-xs font-semibold uppercase mb-3" :style="{ color: 'var(--zima-text-muted)', letterSpacing: '0.08em' }">
          Profissional
        </p>
        <div class="flex items-center gap-3">
          <ZimaAvatar :name="appointment.professionalName" size="sm" />
          <div class="flex-1">
            <NuxtLink
              :to="`/saas/equipe/${appointment.professionalId}`"
              class="text-sm font-medium"
              style="color: var(--zima-blue-core); text-decoration: none;"
              @click="emit('update:modelValue', false)"
            >
              {{ appointment.professionalName }}
            </NuxtLink>
            <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">{{ appointment.professionalRole }}</p>
          </div>
          <Icon name="i-lucide-external-link" style="width: 13px; height: 13px; color: var(--zima-text-muted);" />
        </div>
      </div>

      <!-- Divider -->
      <div :style="{ height: '1px', background: 'var(--zima-border-divider)' }" />

      <!-- Seção 4 — Observações -->
      <div>
        <p class="text-xs font-semibold uppercase mb-3" :style="{ color: 'var(--zima-text-muted)', letterSpacing: '0.08em' }">
          Observações
        </p>
        <p v-if="appointment.notes" class="text-sm mb-3" :style="{ color: 'var(--zima-text-secondary)' }">
          {{ appointment.notes }}
        </p>
        <div class="flex flex-col gap-1.5">
          <span class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">Notas internas (equipe)</span>
          <textarea
            v-model="internalNotesValue"
            rows="3"
            placeholder="Adicione notas visíveis apenas para a equipe..."
            class="resize-none text-sm rounded-md px-3 py-2 outline-none transition-all"
            :style="{
              background: 'var(--zima-bg-surface-2)',
              border: '1px solid var(--zima-border-default)',
              color: 'var(--zima-text-primary)',
              fontFamily: 'var(--zima-font-sans)',
            }"
            @blur="onInternalNotesBlur"
            @focus="(e: FocusEvent) => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--zima-blue-core)'"
          />
        </div>
      </div>

      <!-- Motivo de cancelamento -->
      <div
        v-if="appointment.status === 'CANCELLED' && appointment.cancelReason"
        class="flex items-start gap-2 p-3 rounded-lg"
        :style="{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }"
      >
        <Icon name="i-lucide-x-circle" style="width: 14px; height: 14px; margin-top: 1px; flex-shrink: 0;" :style="{ color: '#EF4444' }" />
        <div>
          <p class="text-xs font-medium" :style="{ color: '#EF4444' }">Motivo do cancelamento</p>
          <p class="text-sm" :style="{ color: 'var(--zima-text-secondary)' }">{{ appointment.cancelReason }}</p>
        </div>
      </div>

      <!-- Divider -->
      <div :style="{ height: '1px', background: 'var(--zima-border-divider)' }" />

      <!-- Seção 5 — Histórico de status -->
      <div>
        <p class="text-xs font-semibold uppercase mb-3" :style="{ color: 'var(--zima-text-muted)', letterSpacing: '0.08em' }">
          Histórico
        </p>
        <div class="flex flex-col gap-0">
          <div
            v-for="(event, idx) in appointment.statusHistory"
            :key="idx"
            class="flex items-start gap-3 relative"
          >
            <!-- Line -->
            <div
              v-if="idx < appointment.statusHistory.length - 1"
              class="absolute"
              :style="{
                left: '7px',
                top: '16px',
                width: '2px',
                bottom: '-8px',
                background: 'var(--zima-border-divider)',
              }"
            />
            <!-- Dot -->
            <div
              class="rounded-full mt-1 shrink-0 z-10"
              :style="{
                width: '16px',
                height: '16px',
                background: idx === appointment.statusHistory.length - 1 ? 'var(--zima-blue-core)' : 'var(--zima-bg-surface-3)',
                border: `2px solid ${idx === appointment.statusHistory.length - 1 ? 'var(--zima-blue-core)' : 'var(--zima-border-hover)'}`,
              }"
            />
            <div class="pb-5">
              <p class="text-xs font-medium" :style="{ color: 'var(--zima-text-primary)' }">{{ event.label }}</p>
              <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">{{ formatHistoryAt(event.at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer de ações -->
    <template v-if="appointment && footerActions.length > 0" #footer>
      <div class="flex items-center gap-2 w-full">
        <ZimaButton
          v-for="act in footerActions"
          :key="act.action"
          :variant="act.variant"
          :loading="actionLoading === act.action"
          :style="act.danger ? { color: 'var(--zima-danger)' } : {}"
          class="flex-1"
          @click="handleAction(act.action)"
        >
          {{ act.label }}
        </ZimaButton>
      </div>
    </template>

    <!-- Modal Cancelar (z-index elevado pois está dentro do drawer) -->
    <Teleport to="body">
      <ZimaModal
        v-model="modalCancelarOpen"
        title="Cancelar Agendamento"
        description="Esta ação não pode ser desfeita."
        size="sm"
      >
        <div class="flex flex-col gap-3">
          <p class="text-sm" :style="{ color: 'var(--zima-text-secondary)' }">
            Tem certeza que deseja cancelar o agendamento de
            <strong>{{ appointment?.clientName }}</strong>?
          </p>
          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-medium" :style="{ color: 'var(--zima-text-secondary)' }">Motivo *</span>
            <textarea
              v-model="cancelReason"
              rows="3"
              placeholder="Informe o motivo do cancelamento..."
              class="resize-none text-sm rounded-md px-3 py-2 outline-none"
              :style="{
                background: 'var(--zima-bg-surface-2)',
                border: '1px solid var(--zima-border-default)',
                color: 'var(--zima-text-primary)',
                fontFamily: 'var(--zima-font-sans)',
              }"
            />
          </div>
        </div>
        <template #footer>
          <ZimaButton variant="ghost" @click="modalCancelarOpen = false">Voltar</ZimaButton>
          <ZimaButton
            variant="primary"
            :loading="cancelLoading"
            :style="{ background: 'var(--zima-danger)', borderColor: 'var(--zima-danger)' }"
            @click="confirmCancel"
          >
            Cancelar Agendamento
          </ZimaButton>
        </template>
      </ZimaModal>

      <!-- Modal Reagendar -->
      <ZimaModal
        v-model="modalReagendarOpen"
        title="Reagendar"
        description="Selecione nova data e horário."
        size="sm"
      >
        <div class="flex flex-col gap-4">
          <ZimaInput
            v-model="reagendarDate"
            label="Nova data"
            type="date"
          />
          <div v-if="reagendarDate">
            <span class="text-xs font-medium mb-2 block" :style="{ color: 'var(--zima-text-secondary)' }">
              Horários disponíveis
            </span>
            <div v-if="availableSlots.length === 0" class="text-sm" :style="{ color: 'var(--zima-text-muted)' }">
              Sem horários disponíveis nesta data.
            </div>
            <div v-else class="grid grid-cols-4 gap-2">
              <button
                v-for="slot in availableSlots"
                :key="slot.time"
                class="px-2 py-1.5 rounded-md text-xs font-medium text-center transition-all"
                :style="{
                  background: reagendarTime === slot.time ? 'var(--zima-blue-core)' : 'var(--zima-bg-surface-2)',
                  color: reagendarTime === slot.time ? '#fff' : 'var(--zima-text-primary)',
                  border: `1px solid ${reagendarTime === slot.time ? 'var(--zima-blue-core)' : 'var(--zima-border-default)'}`,
                }"
                @click="reagendarTime = slot.time"
              >
                {{ slot.time }}
              </button>
            </div>
          </div>
        </div>
        <template #footer>
          <ZimaButton variant="ghost" @click="modalReagendarOpen = false">Cancelar</ZimaButton>
          <ZimaButton :loading="reagendarLoading" @click="confirmReschedule">Confirmar</ZimaButton>
        </template>
      </ZimaModal>

      <!-- Modal pós-conclusão -->
      <ZimaModal
        v-model="modalConcluidoOpen"
        title="Atendimento Concluído!"
        size="sm"
      >
        <p class="text-sm" :style="{ color: 'var(--zima-text-secondary)' }">
          Deseja registrar a venda para este atendimento?
        </p>
        <template #footer>
          <ZimaButton variant="ghost" @click="modalConcluidoOpen = false">Não, apenas concluir</ZimaButton>
          <ZimaButton @click="() => { modalConcluidoOpen = false; handleAction('sell') }">
            Sim, registrar venda
          </ZimaButton>
        </template>
      </ZimaModal>
    </Teleport>
  </ZimaDrawer>
</template>
