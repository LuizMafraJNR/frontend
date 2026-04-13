<script setup lang="ts">
import type { Appointment } from '../../composables/useAppointments'
import { STATUS_STYLE } from '../../composables/useAppointments'

const props = defineProps<{
  appointments: Appointment[]
  date: string  // qualquer dia da semana de referência
}>()

const emit = defineEmits<{
  'click-appointment': [id: string]
  'click-day': [date: string]
}>()

const HOUR_PX = 48   // menor que no DayView para caber 7 colunas
const HOUR_START = 8
const HOUR_END = 20
const HOURS = HOUR_END - HOUR_START

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

const minutesToTop = (t: string) =>
  ((timeToMinutes(t) - HOUR_START * 60) / 60) * HOUR_PX

const minutesToHeight = (minutes: number) =>
  Math.max((minutes / 60) * HOUR_PX - 2, 16)

// ── Semana a partir da data de referência ─────────────────────────────────────
const weekDays = computed(() => {
  const ref = new Date(props.date + 'T12:00:00')
  // Encontrar segunda-feira da semana
  const day = ref.getDay() || 7
  const monday = new Date(ref)
  monday.setDate(ref.getDate() - day + 1)

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const weekLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const label = `${weekLabels[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    days.push({ iso, label, dayNum: d.getDate() })
  }
  return days
})

const todayISO = computed(() => new Date().toISOString().slice(0, 10))

// ── Agendamentos por dia ──────────────────────────────────────────────────────
const aptsByDay = computed(() => {
  const map = new Map<string, Appointment[]>()
  for (const wd of weekDays.value) map.set(wd.iso, [])
  for (const apt of props.appointments) {
    if (map.has(apt.date)) map.get(apt.date)!.push(apt)
  }
  return map
})

// ── Horas ────────────────────────────────────────────────────────────────────
const hoursRange = Array.from({ length: HOURS + 1 }, (_, i) => {
  const h = HOUR_START + i
  return `${String(h).padStart(2, '0')}:00`
})

// ── Linha AGORA ───────────────────────────────────────────────────────────────
const agora = ref(new Date())
onMounted(() => {
  const iv = setInterval(() => { agora.value = new Date() }, 60_000)
  onUnmounted(() => clearInterval(iv))
})
const agoraString = computed(() => {
  const h = agora.value.getHours(); const m = agora.value.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})
const agoraTop = computed(() => minutesToTop(agoraString.value))
const isAgoraVisible = computed(() => {
  const mins = timeToMinutes(agoraString.value)
  return mins >= HOUR_START * 60 && mins <= HOUR_END * 60
})

// Iniciais do cliente
const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
</script>

<template>
  <div class="overflow-auto">
    <div
      class="grid"
      :style="{
        gridTemplateColumns: `52px repeat(7, minmax(120px, 1fr))`,
        minWidth: `${52 + 7 * 120}px`,
      }"
    >
      <!-- ── Header: dias da semana ────────────────────────────────────── -->
      <div
        class="sticky top-0 z-10"
        :style="{
          height: '44px',
          background: 'var(--zima-bg-surface-1)',
          borderBottom: '1px solid var(--zima-border-divider)',
        }"
      />
      <button
        v-for="wd in weekDays"
        :key="wd.iso"
        class="flex flex-col items-center justify-center sticky top-0 z-10 transition-colors"
        :style="{
          height: '44px',
          background: wd.iso === todayISO ? 'rgba(59,130,246,0.06)' : 'var(--zima-bg-surface-1)',
          borderBottom: `2px solid ${wd.iso === todayISO ? 'var(--zima-blue-core)' : 'var(--zima-border-divider)'}`,
          borderLeft: '1px solid var(--zima-border-divider)',
          cursor: 'pointer',
        }"
        @click="emit('click-day', wd.iso)"
        @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'"
        @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = wd.iso === todayISO ? 'rgba(59,130,246,0.06)' : 'var(--zima-bg-surface-1)'"
      >
        <span
          class="text-xs font-semibold"
          :style="{ color: wd.iso === todayISO ? 'var(--zima-blue-light)' : 'var(--zima-text-primary)' }"
        >
          {{ wd.label }}
        </span>
        <span
          v-if="aptsByDay.get(wd.iso)?.length"
          class="text-xs"
          :style="{ color: 'var(--zima-text-muted)' }"
        >
          {{ aptsByDay.get(wd.iso)?.length }} agend.
        </span>
      </button>

      <!-- ── Coluna de horas ──────────────────────────────────────────── -->
      <div class="relative" :style="{ height: `${HOURS * HOUR_PX}px` }">
        <div
          v-for="hour in hoursRange"
          :key="hour"
          class="absolute w-full flex items-start justify-end pr-1"
          :style="{ top: `${minutesToTop(hour)}px`, height: `${HOUR_PX}px` }"
        >
          <span
            class="text-xs select-none"
            :style="{ color: '#475569', fontFamily: 'var(--zima-font-mono)', fontSize: '10px' }"
          >
            {{ hour }}
          </span>
        </div>
      </div>

      <!-- ── Colunas de dias ───────────────────────────────────────────── -->
      <div
        v-for="wd in weekDays"
        :key="wd.iso"
        class="relative"
        :style="{
          height: `${HOURS * HOUR_PX}px`,
          borderLeft: '1px solid var(--zima-border-divider)',
          background: wd.iso === todayISO ? 'rgba(59,130,246,0.015)' : 'transparent',
        }"
      >
        <!-- Grid de fundo -->
        <div
          v-for="i in HOURS * 2"
          :key="i"
          class="absolute w-full"
          :style="{
            top: `${((i - 1) / 2) * HOUR_PX}px`,
            height: `${HOUR_PX / 2}px`,
            borderBottom: `1px solid ${i % 2 === 0 ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.04)'}`,
          }"
        />

        <!-- Linha AGORA (só hoje) -->
        <div
          v-if="wd.iso === todayISO && isAgoraVisible"
          class="absolute"
          :style="{
            top: `${agoraTop}px`,
            left: 0, right: 0,
            height: '2px',
            background: '#EF4444',
            zIndex: 5,
            pointerEvents: 'none',
          }"
        />

        <!-- Cards compactos -->
        <div
          v-for="apt in aptsByDay.get(wd.iso) ?? []"
          :key="apt.id"
          class="absolute cursor-pointer select-none overflow-hidden"
          :style="{
            top: `${minutesToTop(apt.startTime)}px`,
            height: `${minutesToHeight(apt.serviceDuration)}px`,
            left: '2px',
            right: '2px',
            background: STATUS_STYLE[apt.status].bg,
            borderLeft: `3px solid ${STATUS_STYLE[apt.status].border}`,
            borderRadius: '3px',
            padding: '2px 4px',
            zIndex: 10,
          }"
          :title="`${apt.startTime} — ${apt.clientName} · ${apt.serviceName}`"
          @click.stop="emit('click-appointment', apt.id)"
        >
          <p
            class="text-xs font-bold leading-tight"
            :style="{ color: STATUS_STYLE[apt.status].border, fontSize: '10px' }"
          >
            {{ apt.startTime }}
          </p>
          <p
            class="text-xs leading-tight truncate"
            :style="{ color: 'var(--zima-text-primary)', fontSize: '10px' }"
          >
            {{ initials(apt.clientName) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
