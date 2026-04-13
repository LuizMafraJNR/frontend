<script setup lang="ts">
/**
 * ZimaToast — Sistema de notificações toast do Design System Zima Blue.
 * Canto superior direito. Auto-dismiss em 4s para sucesso/info.
 * Persistente para erros. Slide-in da direita.
 *
 * Uso: useZimaToast().add({ type: 'success', title: 'Salvo!' })
 */

export interface ZimaToastItem {
  id: string
  type: 'success' | 'warning' | 'danger' | 'info'
  title: string
  description?: string
  duration?: number // ms — 0 = persistente
  action?: () => void
  actionLabel?: string
}

interface Props {
  toasts: ZimaToastItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const typeConfig: Record<ZimaToastItem['type'], { icon: string; color: string }> = {
  success: { icon: 'i-lucide-circle-check', color: 'var(--zima-success)' },
  warning: { icon: 'i-lucide-triangle-alert', color: 'var(--zima-warning)' },
  danger:  { icon: 'i-lucide-circle-x',    color: 'var(--zima-danger)' },
  info:    { icon: 'i-lucide-info',          color: 'var(--zima-info)' },
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 flex flex-col gap-2 pointer-events-none"
      :style="{ zIndex: 'var(--zima-z-toast)', width: '380px' }"
      aria-live="polite"
      aria-atomic="false"
      data-testid="zima-toast-container"
    >
      <TransitionGroup name="zima-toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 rounded-lg pointer-events-auto"
          :style="{
            background: 'var(--zima-bg-surface-3)',
            border: '1px solid var(--zima-border-modal)',
            borderLeft: `3px solid ${typeConfig[toast.type].color}`,
            boxShadow: 'var(--zima-shadow-lg)',
            padding: '12px 14px',
          }"
          role="alert"
          :aria-label="`${toast.type}: ${toast.title}`"
        >
          <!-- Icon -->
          <Icon
            :name="typeConfig[toast.type].icon"
            style="width: 16px; height: 16px; shrink: 0; margin-top: 2px;"
            :style="{ color: typeConfig[toast.type].color, flexShrink: '0', marginTop: '2px' }"
            aria-hidden="true"
          />

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium"
              :style="{ color: 'var(--zima-text-primary)' }"
            >
              {{ toast.title }}
            </p>
            <p
              v-if="toast.description"
              class="text-xs mt-0.5"
              :style="{ color: 'var(--zima-text-secondary)' }"
            >
              {{ toast.description }}
            </p>
            <button
              v-if="toast.action && toast.actionLabel"
              style="
                margin-top: 6px; font-size: 12px; font-weight: 500;
                color: var(--zima-blue-core); background: none; border: none;
                cursor: pointer; padding: 0; display: block;
              "
              @click="toast.action(); emit('dismiss', toast.id)"
            >
              {{ toast.actionLabel }} →
            </button>
          </div>

          <!-- Dismiss button -->
          <button
            class="flex items-center justify-center rounded-md shrink-0 transition-colors duration-[150ms] focus-visible:outline-none"
            :style="{
              width: '20px',
              height: '20px',
              color: 'var(--zima-text-muted)',
            }"
            :aria-label="`Fechar notificação: ${toast.title}`"
            @click="emit('dismiss', toast.id)"
            @mouseenter="(e: MouseEvent) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--zima-text-primary)'
            }"
            @mouseleave="(e: MouseEvent) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--zima-text-muted)'
            }"
          >
            <Icon name="i-lucide-x" style="width: 12px; height: 12px;" aria-hidden="true" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.zima-toast-enter-active {
  animation: zima-slide-in-right 200ms ease forwards;
}
.zima-toast-leave-active {
  animation: zima-slide-out-right 150ms ease forwards;
}
.zima-toast-move {
  transition: transform 200ms ease;
}
</style>
