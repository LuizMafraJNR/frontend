<script setup lang="ts">
import type { Appointment } from '../../composables/useAppointments'
import { STATUS_STYLE } from '../../composables/useAppointments'
import type { Professional } from '../../composables/useProfessionals'

const props = defineProps<{
  appointments: Appointment[]
  professionals: Professional[]
  date: string
}>()

const emit = defineEmits<{
  'click-appointment': [id: string]
  'click-slot': [data: { professionalId: string; startTime: string; date: string }]
  'move-appointment': [data: { id: string; professionalId: string; startTime: string }]
}>()

// ── Constantes de layout (mesmas do Dashboard) ───────────────────────────────
const HOUR_PX = 64
const HOUR_START = 8
const HOUR_END = 20
const HOURS = HOUR_END - HOUR_START   // 12

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

const minutesToTop = (t: string) =>
  ((timeToMinutes(t) - HOUR_START * 60) / 60) * HOUR_PX

const minutesToHeight = (minutes: number) =>
  Math.max((minutes / 60) * HOUR_PX - 4, 20)

// ── Horas exibidas ───────────────────────────────────────────────────────────
const hoursRange = Array.from({ length: HOURS + 1 }, (_, i) => {
  const h = HOUR_START + i
  return `${String(h).padStart(2, '0')}:00`
})

// ── Linha "AGORA" ────────────────────────────────────────────────────────────
const agora = ref(new Date())
onMounted(() => {
  const iv = setInterval(() => { agora.value = new Date() }, 60_000)
  onUnmounted(() => clearInterval(iv))
})

const agoraString = computed(() => {
  const h = agora.value.getHours()
  const m = agora.value.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

const agoraTop = computed(() => minutesToTop(agoraString.value))
const isAgoraVisible = computed(() => {
  const mins = timeToMinutes(agoraString.value)
  return mins >= HOUR_START * 60 && mins <= HOUR_END * 60
})

const isToday = computed(() => props.date === new Date().toISOString().slice(0, 10))

// ── Agendamentos por profissional ─────────────────────────────────────────────
const aptsByPro = computed(() => {
  const map = new Map<string, Appointment[]>()
  for (const pro of props.professionals) map.set(pro.id, [])
  for (const apt of props.appointments) {
    if (map.has(apt.professionalId)) map.get(apt.professionalId)!.push(apt)
  }
  return map
})

// ── Ocupação por profissional ─────────────────────────────────────────────────
const occupancyByPro = computed(() => {
  const map = new Map<string, number>()
  for (const pro of props.professionals) {
    const apts = aptsByPro.value.get(pro.id) ?? []
    const occupied = apts
      .filter(a => a.status !== 'CANCELLED')
      .reduce((acc, a) => acc + a.serviceDuration, 0)
    const totalMins = HOURS * 60
    map.set(pro.id, Math.round((occupied / totalMins) * 100))
  }
  return map
})

// ── Click em slot vazio ───────────────────────────────────────────────────────
const onClickGridCell = (professionalId: string, halfHour: number) => {
  const h = HOUR_START + Math.floor(halfHour / 2)
  const m = halfHour % 2 === 0 ? 0 : 30
  const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  emit('click-slot', { professionalId, startTime, date: props.date })
}

// ── Drag & Drop nativo HTML5 ─────────────────────────────────────────────────
const draggingId = ref<string | null>(null)
const dragOverCell = ref<{ proId: string; halfHour: number } | null>(null)

// Modal de confirmação de reagendamento
const moveConfirm = ref<{ id: string; proId: string; halfHour: number } | null>(null)

const onDragStart = (e: DragEvent, id: string) => {
  draggingId.value = id
  e.dataTransfer?.setData('text/plain', id)
}

const onDragOver = (e: DragEvent, proId: string, halfHour: number) => {
  e.preventDefault()
  dragOverCell.value = { proId, halfHour }
}

const onDrop = (e: DragEvent, proId: string, halfHour: number) => {
  e.preventDefault()
  const id = e.dataTransfer?.getData('text/plain') ?? draggingId.value
  if (!id) return
  moveConfirm.value = { id, proId, halfHour }
  draggingId.value = null
  dragOverCell.value = null
}

const onDragEnd = () => {
  draggingId.value = null
  dragOverCell.value = null
}

const confirmMove = () => {
  if (!moveConfirm.value) return
  const { id, proId, halfHour } = moveConfirm.value
  const h = HOUR_START + Math.floor(halfHour / 2)
  const m = halfHour % 2 === 0 ? 0 : 30
  const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  emit('move-appointment', { id, professionalId: proId, startTime })
  moveConfirm.value = null
}

const moveApt = computed(() =>
  moveConfirm.value ? props.appointments.find(a => a.id === moveConfirm.value?.id) : null
)
const movePro = computed(() =>
  moveConfirm.value ? props.professionals.find(p => p.id === moveConfirm.value?.proId) : null
)
const moveTimeLabel = computed(() => {
  if (!moveConfirm.value) return ''
  const { halfHour } = moveConfirm.value
  const h = HOUR_START + Math.floor(halfHour / 2)
  const m = halfHour % 2 === 0 ? 0 : 30
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

// Grid de células (para drop targets e click)
const halfHours = Array.from({ length: HOURS * 2 }, (_, i) => i)
</script>

<template>
  <div class="relative overflow-auto" :style="{ minHeight: `${HOURS * HOUR_PX}px` }">
    <!-- Grid: coluna de horas + colunas de profissionais -->
    <div
      class="grid"
      :style="{
        gridTemplateColumns: `60px repeat(${professionals.length}, minmax(160px, 1fr))`,
        minWidth: `${60 + professionals.length * 160}px`,
      }"
    >
      <!-- ── Linha de header ──────────────────────────────────────────────── -->
      <!-- Célula vazia (canto superior esquerdo) -->
      <div
        class="sticky top-0 z-10"
        :style="{
          height: '52px',
          background: 'var(--zima-bg-surface-1)',
          borderBottom: '1px solid var(--zima-border-divider)',
        }"
      />
      <!-- Headers dos profissionais -->
      <div
        v-for="pro in professionals"
        :key="pro.id"
        class="flex items-center gap-2 px-3 sticky top-0 z-10"
        :style="{
          height: '52px',
          background: 'var(--zima-bg-surface-1)',
          borderBottom: '1px solid var(--zima-border-divider)',
          borderLeft: '1px solid var(--zima-border-divider)',
        }"
      >
        <ZimaAvatar :name="pro.name" size="sm" />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold truncate" :style="{ color: 'var(--zima-text-primary)' }">{{ pro.name }}</p>
          <p class="text-xs" :style="{ color: 'var(--zima-text-muted)' }">{{ occupancyByPro.get(pro.id) ?? 0 }}% ocupado</p>
        </div>
      </div>

      <!-- ── Coluna de horas ─────────────────────────────────────────────── -->
      <div class="relative" :style="{ height: `${HOURS * HOUR_PX}px` }">
        <div
          v-for="hour in hoursRange"
          :key="hour"
          class="absolute w-full flex items-start justify-end pr-2"
          :style="{
            top: `${minutesToTop(hour)}px`,
            height: `${HOUR_PX}px`,
          }"
        >
          <span
            class="text-xs select-none"
            :style="{ color: '#475569', fontFamily: 'var(--zima-font-mono)' }"
          >
            {{ hour }}
          </span>
        </div>
      </div>

      <!-- ── Colunas de profissionais ────────────────────────────────────── -->
      <div
        v-for="pro in professionals"
        :key="pro.id"
        class="relative"
        :style="{
          height: `${HOURS * HOUR_PX}px`,
          borderLeft: '1px solid var(--zima-border-divider)',
        }"
      >
        <!-- Grid de fundo: células de 30min para click e drag-drop -->
        <div
          v-for="half in halfHours"
          :key="half"
          class="absolute w-full"
          :style="{
            top: `${(half / 2) * HOUR_PX}px`,
            height: `${HOUR_PX / 2}px`,
            borderBottom: `1px solid ${half % 2 === 1 ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.04)'}`,
            background: dragOverCell?.proId === pro.id && dragOverCell?.halfHour === half
              ? 'rgba(59,130,246,0.06)'
              : 'transparent',
          }"
          @click="onClickGridCell(pro.id, half)"
          @dragover="onDragOver($event, pro.id, half)"
          @drop="onDrop($event, pro.id, half)"
        />

        <!-- Linha "AGORA" (só hoje) -->
        <div
          v-if="isToday && isAgoraVisible"
          class="absolute"
          :style="{
            top: `${agoraTop}px`,
            left: 0,
            right: 0,
            height: '2px',
            background: '#EF4444',
            zIndex: 5,
            pointerEvents: 'none',
          }"
        >
          <span
            class="absolute text-xs font-bold px-1"
            :style="{
              left: '4px',
              top: '-9px',
              color: '#EF4444',
              fontFamily: 'var(--zima-font-mono)',
              background: 'var(--zima-bg-surface-1)',
              borderRadius: '2px',
            }"
          >
            {{ agoraString }}
          </span>
        </div>

        <!-- Cards de agendamento -->
        <div
          v-for="apt in aptsByPro.get(pro.id) ?? []"
          :key="apt.id"
          :draggable="apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED'"
          class="absolute cursor-pointer select-none"
          :style="{
            top: `${minutesToTop(apt.startTime)}px`,
            height: `${minutesToHeight(apt.serviceDuration)}px`,
            left: '4px',
            right: '4px',
            background: STATUS_STYLE[apt.status].bg,
            borderLeft: `3px solid ${STATUS_STYLE[apt.status].border}`,
            borderRadius: '4px',
            padding: '4px 6px',
            zIndex: draggingId === apt.id ? 20 : 10,
            opacity: draggingId === apt.id ? 0.5 : 1,
            boxShadow: draggingId === apt.id ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
            transition: 'box-shadow 150ms, opacity 150ms',
          }"
          :title="`${apt.clientName} — ${apt.serviceName} (${apt.serviceDuration}min)`"
          @click.stop="emit('click-appointment', apt.id)"
          @dragstart="onDragStart($event, apt.id)"
          @dragend="onDragEnd"
        >
          <p
            class="text-xs font-bold truncate leading-tight"
            :style="{ color: STATUS_STYLE[apt.status].border }"
          >
            {{ apt.startTime }}
          </p>
          <p
            class="text-xs font-medium truncate leading-tight"
            :style="{ color: 'var(--zima-text-primary)' }"
          >
            {{ apt.clientName }}
          </p>
          <p
            class="text-xs truncate leading-tight"
            :style="{ color: 'var(--zima-text-secondary)' }"
          >
            {{ apt.serviceName }}
          </p>
          <p
            v-if="apt.serviceDuration >= 60"
            class="text-xs truncate leading-tight"
            :style="{ color: 'var(--zima-text-muted)' }"
          >
            {{ apt.clientPhone }}
          </p>
        </div>
      </div>
    </div>

    <!-- Modal de confirmação de reagendamento -->
    <Teleport to="body">
      <ZimaModal
        :model-value="!!moveConfirm"
        title="Reagendar Agendamento"
        size="sm"
        @update:model-value="moveConfirm = null"
      >
        <p class="text-sm" :style="{ color: 'var(--zima-text-secondary)' }">
          Mover agendamento de <strong>{{ moveApt?.clientName }}</strong>
          para <strong>{{ moveTimeLabel }}</strong>
          com <strong>{{ movePro?.name }}</strong>?
        </p>
        <template #footer>
          <ZimaButton variant="ghost" @click="moveConfirm = null">Cancelar</ZimaButton>
          <ZimaButton @click="confirmMove">Confirmar</ZimaButton>
        </template>
      </ZimaModal>
    </Teleport>
  </div>
</template>
