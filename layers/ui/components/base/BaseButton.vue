<script setup lang="ts">
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  /** Variante visual do botão */
  variant?: ButtonVariant
  /** Tamanho do botão */
  size?: ButtonSize
  /** Estado de carregamento — desabilita e mostra spinner */
  loading?: boolean
  /** Desabilitar o botão */
  disabled?: boolean
  /** Tipo HTML do botão */
  type?: 'button' | 'submit' | 'reset'
  /** Elemento a renderizar — útil para links */
  as?: 'button' | 'a'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  as: 'button',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500',
  secondary: 'bg-secondary-500 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500',
  ghost:     'bg-transparent text-primary-500 hover:bg-primary-50 focus-visible:ring-primary-500',
  danger:    'bg-danger-500 text-white hover:bg-danger-700 focus-visible:ring-danger-500',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
}

const classes = computed(() => [
  'inline-flex items-center justify-center font-medium rounded-md',
  'transition-colors duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  variantClasses[props.variant],
  sizeClasses[props.size],
])
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? type : undefined"
    :disabled="disabled || loading"
    :class="classes"
    @click="emit('click', $event)"
  >
    <span
      v-if="loading"
      class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>
