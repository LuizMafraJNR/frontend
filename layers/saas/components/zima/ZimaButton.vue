<script setup lang="ts">
/**
 * ZimaButton — Botão primário do Design System Zima Blue.
 * Variantes: primary | secondary | ghost | danger
 * Segue a paleta enterprise com transições de 150ms.
 */
export type ZimaButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ZimaButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  variant?: ZimaButtonVariant
  size?: ZimaButtonSize
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  as?: 'button' | 'a'
  iconOnly?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  as: 'button',
  iconOnly: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isDisabled = computed(() => props.disabled || props.loading)

const sizeClasses: Record<ZimaButtonSize, string> = {
  xs: 'h-6 px-2 text-xs gap-1',
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
}

const iconOnlySizeClasses: Record<ZimaButtonSize, string> = {
  xs: 'h-6 w-6 px-0',
  sm: 'h-8 w-8 px-0',
  md: 'h-9 w-9 px-0',
  lg: 'h-10 w-10 px-0',
}

// Estilos inline para manter fidelidade exata aos tokens Zima
const variantStyle = computed((): Record<string, string> => {
  const base = { transition: 'all 150ms ease', borderRadius: 'var(--zima-radius-sm)' }
  switch (props.variant) {
    case 'primary':
      return {
        ...base,
        background: isDisabled.value ? 'var(--zima-blue-core)' : 'var(--zima-blue-core)',
        color: '#fff',
        border: 'none',
      }
    case 'secondary':
      return {
        ...base,
        background: 'transparent',
        color: 'var(--zima-text-secondary)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
      }
    case 'ghost':
      return {
        ...base,
        background: 'transparent',
        color: 'var(--zima-text-secondary)',
        border: 'none',
      }
    case 'danger':
      return {
        ...base,
        background: 'var(--zima-danger-subtle)',
        color: 'var(--zima-danger)',
        border: '1px solid var(--zima-danger-border)',
      }
    default:
      return base
  }
})

const hoverStyle = (el: HTMLElement) => {
  if (isDisabled.value) return
  switch (props.variant) {
    case 'primary':   el.style.background = 'var(--zima-blue-intense)'; break
    case 'secondary': el.style.background = 'var(--zima-bg-surface-hover)'; break
    case 'ghost':     el.style.background = 'var(--zima-bg-surface-hover)'; break
    case 'danger':    el.style.background = 'rgba(239,68,68,0.15)'; break
  }
}

const leaveStyle = (el: HTMLElement) => {
  if (isDisabled.value) return
  switch (props.variant) {
    case 'primary':   el.style.background = 'var(--zima-blue-core)'; break
    case 'secondary': el.style.background = 'transparent'; break
    case 'ghost':     el.style.background = 'transparent'; break
    case 'danger':    el.style.background = 'var(--zima-danger-subtle)'; break
  }
}

const activeStyle = (el: HTMLElement) => {
  if (isDisabled.value) return
  if (props.variant === 'primary') el.style.background = '#1D4ED8'
}

const classes = computed(() => [
  'inline-flex items-center justify-center font-medium',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[var(--zima-focus-outline)] focus-visible:ring-offset-1',
  props.iconOnly
    ? iconOnlySizeClasses[props.size]
    : sizeClasses[props.size],
  isDisabled.value && 'opacity-40 cursor-not-allowed pointer-events-none',
])
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? type : undefined"
    :disabled="isDisabled"
    :aria-disabled="isDisabled"
    :aria-label="iconOnly ? $attrs['aria-label'] : undefined"
    :class="classes"
    :style="variantStyle"
    data-testid="zima-button"
    @click="!isDisabled && emit('click', $event)"
    @mouseenter="(e: MouseEvent) => hoverStyle(e.currentTarget as HTMLElement)"
    @mouseleave="(e: MouseEvent) => leaveStyle(e.currentTarget as HTMLElement)"
    @mousedown="(e: MouseEvent) => activeStyle(e.currentTarget as HTMLElement)"
    @mouseup="(e: MouseEvent) => hoverStyle(e.currentTarget as HTMLElement)"
  >
    <!-- Loading spinner -->
    <span
      v-if="loading"
      class="inline-block rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
      :style="{ width: size === 'lg' ? '16px' : '14px', height: size === 'lg' ? '16px' : '14px' }"
      aria-hidden="true"
    />
    <slot v-if="!loading" name="icon-left" />
    <slot v-if="!iconOnly" />
    <slot v-if="iconOnly && !loading" name="icon" />
    <slot name="icon-right" />
  </component>
</template>
