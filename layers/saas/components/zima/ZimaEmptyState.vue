<script setup lang="ts">
/**
 * ZimaEmptyState — Estado vazio do Design System Zima Blue.
 * Ícone 48px + título + descrição + CTA slot.
 */
const props = withDefaults(defineProps<{
  icon?: string
  title: string
  description?: string
  compact?: boolean
}>(), {
  icon: 'i-lucide-inbox',
  compact: false,
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center"
    :style="{ padding: compact ? '32px 24px' : '64px 24px' }"
    data-testid="zima-empty-state"
  >
    <!-- Icon container -->
    <div
      class="flex items-center justify-center rounded-xl mb-4"
      :style="{
        width: compact ? '48px' : '64px',
        height: compact ? '48px' : '64px',
        background: 'var(--zima-bg-surface-hover)',
      }"
    >
      <Icon
        :name="icon"
        :style="{
          width: compact ? '24px' : '32px',
          height: compact ? '24px' : '32px',
          color: 'var(--zima-text-muted)',
          strokeWidth: '1.5px',
        }"
        aria-hidden="true"
      />
    </div>

    <!-- Text -->
    <h3
      class="font-semibold mb-1"
      :style="{
        fontSize: compact ? '14px' : '16px',
        color: 'var(--zima-text-primary)',
        fontFamily: 'var(--zima-font-display)',
      }"
    >
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="max-w-sm"
      :style="{
        fontSize: '13px',
        color: 'var(--zima-text-muted)',
        lineHeight: '1.5',
      }"
    >
      {{ description }}
    </p>

    <!-- CTA slot -->
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>
