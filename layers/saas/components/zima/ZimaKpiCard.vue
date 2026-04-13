<script setup lang="ts">
/**
 * ZimaKpiCard — Card de métrica/KPI do Design System Zima Blue.
 * Label uppercase + valor mono 28px + variação percentual.
 * Sparkline mini-chart opcional.
 */

const props = withDefaults(defineProps<{
  label: string
  value: string | number
  /** Ex: '+12.4' ou '-3.2' */
  change?: string
  changeSuffix?: string
  icon?: string
  loading?: boolean
  clickable?: boolean
}>(), {
  changeSuffix: '%',
  loading: false,
  clickable: false,
})

const emit = defineEmits<{
  click: []
}>()

const isPositive = computed(() =>
  props.change !== undefined && !props.change.startsWith('-')
)
const isNegative = computed(() =>
  props.change !== undefined && props.change.startsWith('-')
)
</script>

<template>
  <div
    :class="[
      'flex flex-col gap-3',
      clickable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2',
    ]"
    :style="{
      background: 'var(--zima-bg-surface-2)',
      border: '1px solid var(--zima-border-default)',
      borderRadius: 'var(--zima-radius-md)',
      padding: '20px',
      transition: 'all 150ms ease',
    }"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    data-testid="zima-kpi-card"
    @click="clickable && emit('click')"
    @mouseenter="(e: MouseEvent) => {
      if (clickable) (e.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-hover)'
    }"
    @mouseleave="(e: MouseEvent) => {
      if (clickable) (e.currentTarget as HTMLElement).style.borderColor = 'var(--zima-border-default)'
    }"
  >
    <!-- Header: label + icon -->
    <div class="flex items-center justify-between">
      <span
        :style="{
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--zima-text-muted)',
        }"
      >
        {{ label }}
      </span>
      <div
        v-if="icon"
        class="flex items-center justify-center rounded-lg"
        :style="{
          width: '32px',
          height: '32px',
          background: 'var(--zima-blue-subtle)',
        }"
      >
        <Icon
          :name="icon"
          :style="{
            width: '16px',
            height: '16px',
            color: 'var(--zima-blue-light)',
            strokeWidth: '1.5px',
          }"
          aria-hidden="true"
        />
      </div>
    </div>

    <!-- Skeleton loading -->
    <template v-if="loading">
      <div
        :style="{
          height: '32px',
          width: '60%',
          borderRadius: 'var(--zima-radius-sm)',
          background: 'var(--zima-skeleton-base)',
          backgroundImage: 'linear-gradient(90deg, var(--zima-skeleton-base) 25%, var(--zima-skeleton-shine) 50%, var(--zima-skeleton-base) 75%)',
          backgroundSize: '800px 100%',
          animation: 'zima-shimmer 1.5s infinite linear',
        }"
      />
      <div
        :style="{
          height: '16px',
          width: '40%',
          borderRadius: 'var(--zima-radius-sm)',
          background: 'var(--zima-skeleton-base)',
          backgroundImage: 'linear-gradient(90deg, var(--zima-skeleton-base) 25%, var(--zima-skeleton-shine) 50%, var(--zima-skeleton-base) 75%)',
          backgroundSize: '800px 100%',
          animation: 'zima-shimmer 1.5s infinite linear',
        }"
      />
    </template>

    <!-- Value + change -->
    <template v-else>
      <!-- Main value -->
      <div
        class="font-bold leading-none"
        :style="{
          fontSize: '28px',
          color: 'var(--zima-text-primary)',
          fontFamily: 'var(--zima-font-mono)',
          fontWeight: '700',
        }"
      >
        {{ value }}
      </div>

      <!-- Slot for sparkline or subtitle -->
      <slot name="chart" />

      <!-- Change badge -->
      <div v-if="change !== undefined" class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1 rounded px-1.5"
          :style="{
            height: '20px',
            fontSize: '11px',
            fontWeight: '600',
            background: isPositive
              ? 'rgba(16, 185, 129, 0.1)'
              : isNegative
                ? 'rgba(239, 68, 68, 0.1)'
                : 'var(--zima-bg-surface-hover)',
            color: isPositive
              ? 'var(--zima-success)'
              : isNegative
                ? 'var(--zima-danger)'
                : 'var(--zima-text-muted)',
          }"
        >
          <Icon
            v-if="isPositive"
            name="i-lucide-trending-up"
            style="width: 11px; height: 11px;"
            aria-hidden="true"
          />
          <Icon
            v-else-if="isNegative"
            name="i-lucide-trending-down"
            style="width: 11px; height: 11px;"
            aria-hidden="true"
          />
          {{ change }}{{ changeSuffix }}
        </span>
        <slot name="change-label" />
      </div>
    </template>
  </div>
</template>
