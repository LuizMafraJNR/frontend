<script setup lang="ts">
/**
 * ZimaToggle — Switch on/off do Design System Zima Blue.
 * CSS puro, sem dependências externas. Tamanhos: sm e md.
 */

const props = withDefaults(defineProps<{
  modelValue: boolean
  label?: string
  labelPosition?: 'left' | 'right'
  disabled?: boolean
  size?: 'sm' | 'md'
}>(), {
  labelPosition: 'right',
  disabled: false,
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const toggle = () => {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}

const trackWidth  = computed(() => props.size === 'sm' ? '28px' : '36px')
const trackHeight = computed(() => props.size === 'sm' ? '16px' : '20px')
const thumbSize   = computed(() => props.size === 'sm' ? '12px' : '16px')
const thumbOffset = computed(() => props.size === 'sm' ? '2px' : '2px')
const thumbTravel = computed(() => props.size === 'sm' ? '14px' : '18px')
</script>

<template>
  <label
    class="inline-flex items-center gap-2 select-none"
    :class="[
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      labelPosition === 'left' ? 'flex-row-reverse' : 'flex-row',
    ]"
    data-testid="zima-toggle"
    @click.prevent="toggle"
  >
    <!-- Track -->
    <span
      class="relative inline-flex shrink-0 rounded-full transition-colors"
      :style="{
        width: trackWidth,
        height: trackHeight,
        background: modelValue ? 'var(--zima-blue-core)' : 'var(--zima-bg-surface-hover)',
        border: modelValue
          ? '1px solid var(--zima-blue-intense)'
          : '1px solid var(--zima-border-hover)',
        transitionDuration: 'var(--zima-duration-base)',
      }"
      :aria-checked="modelValue"
      role="switch"
    >
      <!-- Thumb -->
      <span
        class="absolute rounded-full bg-white transition-transform"
        :style="{
          width: thumbSize,
          height: thumbSize,
          top: thumbOffset,
          left: thumbOffset,
          transform: modelValue ? `translateX(${thumbTravel})` : 'translateX(0)',
          transitionDuration: 'var(--zima-duration-base)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }"
      />
    </span>

    <!-- Label -->
    <span
      v-if="label"
      class="text-sm"
      :style="{ color: 'var(--zima-text-secondary)' }"
    >
      {{ label }}
    </span>
  </label>
</template>
