<script setup lang="ts">
type Size = 'sm' | 'md' | 'lg'

interface Props {
  /** Texto de acessibilidade */
  label?: string
  /** Tamanho do spinner */
  size?: Size
}

const { label = 'Carregando...', size = 'md' } = defineProps<Props>()

const sizeClasses: Record<Size, string> = {
  sm: 'size-4 border-2',
  md: 'size-8 border-2',
  lg: 'size-12 border-4',
}
</script>

<template>
  <div role="status" class="flex items-center justify-center">
    <span
      :class="['animate-spin rounded-full border-primary-200 border-t-primary-500', sizeClasses[size]]"
      aria-hidden="true"
    />
    <span class="sr-only">{{ label }}</span>
  </div>
</template>
