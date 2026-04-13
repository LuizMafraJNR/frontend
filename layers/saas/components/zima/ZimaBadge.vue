<script setup lang="ts">
/**
 * ZimaBadge — Badge/chip de status do Design System Zima Blue.
 * Dot + label, cores semânticas, tamanhos sm/md.
 */
export type ZimaBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'blue'
export type ZimaBadgeSize = 'sm' | 'md'

const props = withDefaults(defineProps<{
  variant?: ZimaBadgeVariant
  size?: ZimaBadgeSize
  dot?: boolean
  removable?: boolean
  uppercase?: boolean
}>(), {
  variant: 'neutral',
  size: 'md',
  dot: false,
  removable: false,
  uppercase: false,
})

const emit = defineEmits<{
  remove: []
}>()

const variantConfig: Record<ZimaBadgeVariant, { bg: string; color: string; dot: string }> = {
  success: {
    bg:    'rgba(16, 185, 129, 0.1)',
    color: 'var(--zima-success)',
    dot:   'var(--zima-success)',
  },
  warning: {
    bg:    'rgba(245, 158, 11, 0.1)',
    color: 'var(--zima-warning)',
    dot:   'var(--zima-warning)',
  },
  danger: {
    bg:    'rgba(239, 68, 68, 0.1)',
    color: 'var(--zima-danger)',
    dot:   'var(--zima-danger)',
  },
  info: {
    bg:    'rgba(99, 102, 241, 0.1)',
    color: 'var(--zima-info)',
    dot:   'var(--zima-info)',
  },
  blue: {
    bg:    'rgba(59, 130, 246, 0.15)',
    color: 'var(--zima-blue-pale)',
    dot:   'var(--zima-blue-core)',
  },
  neutral: {
    bg:    'var(--zima-bg-surface-hover)',
    color: 'var(--zima-text-secondary)',
    dot:   'var(--zima-text-muted)',
  },
}

const config = computed(() => variantConfig[props.variant])

const badgeStyle = computed((): Record<string, string> => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  background: config.value.bg,
  color: config.value.color,
  borderRadius: 'var(--zima-radius-xs)',
  fontWeight: '600',
  ...(props.size === 'sm'
    ? { height: '18px', padding: '0 6px', fontSize: '10px' }
    : { height: '20px', padding: '0 8px', fontSize: '11px' }
  ),
  ...(props.uppercase ? { textTransform: 'uppercase', letterSpacing: '0.05em' } : {}),
}))
</script>

<template>
  <span :style="badgeStyle" data-testid="zima-badge">
    <!-- Status dot -->
    <span
      v-if="dot"
      :style="{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: config.dot,
        flexShrink: '0',
      }"
      aria-hidden="true"
    />

    <slot />

    <!-- Remove button -->
    <button
      v-if="removable"
      class="flex items-center justify-center ml-0.5 rounded-full opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none"
      :aria-label="'Remover'"
      style="width: 12px; height: 12px; padding: 0;"
      @click.stop="emit('remove')"
    >
      <Icon name="i-lucide-x" style="width: 10px; height: 10px;" aria-hidden="true" />
    </button>
  </span>
</template>
