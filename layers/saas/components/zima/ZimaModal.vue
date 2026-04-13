<script setup lang="ts">
/**
 * ZimaModal — Modal/dialog do Design System Zima Blue.
 * Overlay blur, fade-in 200ms, fecha com ESC / clique fora.
 * Suporta modais empilhados.
 */

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  preventClose?: boolean
  danger?: boolean
}>(), {
  size: 'md',
  preventClose: false,
  danger: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const close = () => {
  if (props.preventClose) return
  emit('update:modelValue', false)
  emit('close')
}

// Fechar com ESC
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

watch(() => props.modelValue, (open) => {
  if (open) {
    document.addEventListener('keydown', handleKeydown)
    // Bloquear scroll do body
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

const sizeWidths: Record<string, string> = {
  sm:   '400px',
  md:   '560px',
  lg:   '720px',
  xl:   '960px',
  full: '95vw',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="zima-modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 flex items-center justify-center p-4"
        :style="{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 'var(--zima-z-modal)',
        }"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="title ? 'zima-modal-title' : undefined"
        data-testid="zima-modal"
        @click.self="close"
      >
        <!-- Modal panel -->
        <div
          :style="{
            width: '100%',
            maxWidth: sizeWidths[size],
            maxHeight: '90vh',
            background: 'var(--zima-bg-surface-3)',
            border: '1px solid var(--zima-border-modal)',
            borderRadius: 'var(--zima-radius-lg)',
            boxShadow: 'var(--zima-shadow-modal)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }"
          @click.stop
        >
          <!-- Header -->
          <div
            v-if="title || $slots.header"
            class="flex items-center justify-between shrink-0"
            :style="{
              padding: '20px 24px 16px',
              borderBottom: '1px solid var(--zima-border-divider)',
            }"
          >
            <slot name="header">
              <div class="flex-1 min-w-0">
                <h2
                  id="zima-modal-title"
                  class="text-lg font-semibold leading-tight truncate"
                  :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-display)' }"
                >
                  {{ title }}
                </h2>
                <p
                  v-if="description"
                  class="text-sm mt-1"
                  :style="{ color: 'var(--zima-text-secondary)' }"
                >
                  {{ description }}
                </p>
              </div>
            </slot>

            <button
              v-if="!preventClose"
              class="flex items-center justify-center rounded-md ml-4 shrink-0 transition-all duration-[150ms] focus-visible:outline-none focus-visible:ring-2"
              :style="{
                width: '28px',
                height: '28px',
                color: 'var(--zima-text-muted)',
                '--tw-ring-color': 'var(--zima-focus-outline)',
              }"
              aria-label="Fechar modal"
              @click="close"
              @mouseenter="(e: MouseEvent) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--zima-bg-surface-hover)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-primary)'
              }"
              @mouseleave="(e: MouseEvent) => {
                (e.currentTarget as HTMLElement).style.background = ''
                ;(e.currentTarget as HTMLElement).style.color = 'var(--zima-text-muted)'
              }"
            >
              <Icon name="i-lucide-x" style="width: 16px; height: 16px;" aria-hidden="true" />
            </button>
          </div>

          <!-- Body (scrollable) -->
          <div
            class="flex-1 overflow-y-auto"
            :style="{ padding: '24px' }"
          >
            <slot />
          </div>

          <!-- Footer -->
          <div
            v-if="$slots.footer"
            class="flex items-center justify-end gap-3 shrink-0"
            :style="{
              padding: '16px 24px',
              borderTop: '1px solid var(--zima-border-divider)',
            }"
          >
            <slot name="footer" :close="close" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.zima-modal-enter-active {
  animation: zima-fade-in 200ms ease forwards;
}
.zima-modal-enter-active > div {
  animation: zima-scale-in 200ms ease forwards;
}
.zima-modal-leave-active {
  transition: opacity 150ms ease;
}
.zima-modal-leave-to {
  opacity: 0;
}
</style>
