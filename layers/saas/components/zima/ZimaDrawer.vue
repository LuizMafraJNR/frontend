<script setup lang="ts">
/**
 * ZimaDrawer — Painel lateral deslizante do Design System Zima Blue.
 * Slide-in da direita, 480px padrão, overlay escuro, fecha com ESC/overlay.
 */

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  description?: string
  width?: string
  preventClose?: boolean
}>(), {
  width: '480px',
  preventClose: false,
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

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

watch(() => props.modelValue, (open) => {
  if (open) {
    document.addEventListener('keydown', handleKeydown)
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
</script>

<template>
  <Teleport to="body">
    <Transition name="zima-drawer">
      <div
        v-if="modelValue"
        class="fixed inset-0"
        :style="{ zIndex: 'var(--zima-z-modal)' }"
        data-testid="zima-drawer"
      >
        <!-- Overlay -->
        <div
          class="absolute inset-0"
          :style="{ background: 'rgba(0, 0, 0, 0.5)' }"
          aria-hidden="true"
          @click="close"
        />

        <!-- Drawer panel -->
        <div
          class="absolute top-0 right-0 h-full flex flex-col"
          :style="{
            width,
            maxWidth: '100vw',
            background: 'var(--zima-bg-surface-3)',
            borderLeft: '1px solid var(--zima-border-modal)',
            boxShadow: 'var(--zima-shadow-modal)',
          }"
          role="dialog"
          :aria-modal="true"
          :aria-labelledby="title ? 'zima-drawer-title' : undefined"
          @click.stop
        >
          <!-- Header -->
          <div
            v-if="title || $slots.header"
            class="flex items-start justify-between shrink-0"
            :style="{
              padding: '20px 24px 16px',
              borderBottom: '1px solid var(--zima-border-divider)',
            }"
          >
            <slot name="header">
              <div class="flex-1 min-w-0 pr-4">
                <h2
                  id="zima-drawer-title"
                  class="text-base font-semibold leading-tight"
                  :style="{ color: 'var(--zima-text-primary)', fontFamily: 'var(--zima-font-display)' }"
                >
                  {{ title }}
                </h2>
                <p
                  v-if="description"
                  class="text-sm mt-0.5"
                  :style="{ color: 'var(--zima-text-secondary)' }"
                >
                  {{ description }}
                </p>
              </div>
            </slot>

            <button
              v-if="!preventClose"
              class="flex items-center justify-center rounded-md shrink-0 transition-all duration-[150ms] focus-visible:outline-none focus-visible:ring-2"
              :style="{
                width: '28px',
                height: '28px',
                color: 'var(--zima-text-muted)',
                '--tw-ring-color': 'var(--zima-focus-outline)',
              }"
              aria-label="Fechar painel"
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

          <!-- Body (scrollável) -->
          <div
            class="flex-1 overflow-y-auto"
            :style="{ padding: '24px' }"
          >
            <slot />
          </div>

          <!-- Footer (barra fixa no bottom) -->
          <div
            v-if="$slots.footer"
            class="flex items-center gap-3 shrink-0"
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
.zima-drawer-enter-active .absolute.top-0 {
  animation: zima-drawer-in 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.zima-drawer-enter-active .absolute.inset-0 {
  animation: zima-fade-in 200ms ease forwards;
}
.zima-drawer-leave-active {
  transition: opacity 200ms ease;
}
.zima-drawer-leave-to {
  opacity: 0;
}

@keyframes zima-drawer-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
</style>
