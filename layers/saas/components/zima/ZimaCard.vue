<script setup lang="ts">
/**
 * ZimaCard — Container principal do Design System Zima Blue.
 * Background sólido sem glassmorphism, bordas estruturais.
 */
export type ZimaCardVariant = 'default' | 'elevated' | 'ghost' | 'highlight'
export type ZimaCardPadding = 'none' | 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  variant?: ZimaCardVariant
  padding?: ZimaCardPadding
  as?: string
  hoverable?: boolean
  clickable?: boolean
}>(), {
  variant: 'default',
  padding: 'md',
  as: 'div',
  hoverable: false,
  clickable: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isHovered = ref(false)

const paddingStyle: Record<ZimaCardPadding, string> = {
  none: '0',
  sm:   '16px',
  md:   '20px',
  lg:   '24px',
}

const cardStyle = computed((): Record<string, string> => {
  const base: Record<string, string> = {
    background: 'var(--zima-bg-surface-2)',
    borderRadius: 'var(--zima-radius-md)',
    padding: paddingStyle[props.padding],
    transition: 'all 150ms ease',
  }

  switch (props.variant) {
    case 'default':
      return {
        ...base,
        border: `1px solid ${isHovered.value && props.hoverable ? 'var(--zima-border-hover)' : 'var(--zima-border-default)'}`,
        boxShadow: isHovered.value && props.hoverable ? 'var(--zima-shadow-sm)' : 'none',
      }
    case 'elevated':
      return {
        ...base,
        border: `1px solid ${isHovered.value && props.hoverable ? 'var(--zima-border-hover)' : 'var(--zima-border-default)'}`,
        boxShadow: isHovered.value && props.hoverable ? 'var(--zima-shadow-md)' : 'var(--zima-shadow-sm)',
      }
    case 'ghost':
      return {
        ...base,
        background: 'transparent',
        border: 'none',
      }
    case 'highlight':
      return {
        ...base,
        border: `1px solid var(--zima-blue-intense)`,
        boxShadow: `0 0 0 1px rgba(59,130,246,0.1), var(--zima-shadow-sm)`,
      }
    default:
      return base
  }
})
</script>

<template>
  <component
    :is="as"
    :style="cardStyle"
    :class="[
      clickable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zima-focus-outline)]',
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    data-testid="zima-card"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="clickable && emit('click', $event)"
    @keydown.enter="clickable && emit('click', $event as unknown as MouseEvent)"
  >
    <slot name="header" />
    <slot />
    <slot name="footer" />
  </component>
</template>
