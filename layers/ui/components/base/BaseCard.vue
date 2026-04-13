<script setup lang="ts">
type Padding = 'none' | 'sm' | 'md' | 'lg'

interface Props {
  /** Padding interno */
  padding?: Padding
}

const { padding = 'md' } = defineProps<Props>()

const paddingClasses: Record<Padding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}
</script>

<template>
  <div
    class="rounded-lg bg-white shadow-card border border-neutral-100"
    :class="paddingClasses[padding]"
  >
    <slot />
  </div>
</template>
