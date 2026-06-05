<script setup lang="ts">
/**
 * ZimaAlert — Mensagem de alerta contextual inline do Design System Zima Blue.
 * Uso: dentro de cards, modais, drawers — nunca como toast (usar useZimaToast()).
 * Variantes semânticas com ícone, borda colorida e fundo sutil.
 */

const props = withDefaults(defineProps<{
  variant?: 'info' | 'success' | 'warning' | 'danger'
  message?: string
  /** Mostrar ícone à esquerda */
  icon?: boolean
  /** Permite fechar o alerta */
  dismissible?: boolean
}>(), {
  variant: 'info',
  icon: true,
  dismissible: false,
})

const emit = defineEmits<{
  dismiss: []
}>()

const visible = ref(true)

const CONFIG = {
  info:    { color: 'var(--zima-info)',    subtle: 'var(--zima-info-subtle)',    border: 'var(--zima-info-border)',    icon: 'i-lucide-info' },
  success: { color: 'var(--zima-success)', subtle: 'var(--zima-success-subtle)', border: 'var(--zima-success-border)', icon: 'i-lucide-circle-check' },
  warning: { color: 'var(--zima-warning)', subtle: 'var(--zima-warning-subtle)', border: 'var(--zima-warning-border)', icon: 'i-lucide-triangle-alert' },
  danger:  { color: 'var(--zima-danger)',  subtle: 'var(--zima-danger-subtle)',  border: 'var(--zima-danger-border)',  icon: 'i-lucide-circle-x' },
}

const cfg = computed(() => CONFIG[props.variant])

const dismiss = () => {
  visible.value = false
  emit('dismiss')
}
</script>

<template>
  <Transition name="zima-fade">
    <div
      v-if="visible"
      class="flex items-start gap-3"
      :style="{
        padding: '12px 14px',
        borderRadius: 'var(--zima-radius-md)',
        background: cfg.subtle,
        border: `1px solid ${cfg.border}`,
      }"
      role="alert"
      data-testid="zima-alert"
    >
      <!-- Ícone -->
      <Icon
        v-if="icon"
        :name="cfg.icon"
        class="shrink-0 mt-0.5"
        :style="{
          width: '15px',
          height: '15px',
          color: cfg.color,
        }"
        aria-hidden="true"
      />

      <!-- Conteúdo -->
      <div class="flex-1 min-w-0">
        <slot>
          <p
            v-if="message"
            class="text-sm leading-snug"
            :style="{ color: 'var(--zima-text-secondary)', margin: '0' }"
          >
            {{ message }}
          </p>
        </slot>
      </div>

      <!-- Fechar -->
      <button
        v-if="dismissible"
        class="shrink-0 flex items-center justify-center rounded transition-colors"
        :style="{
          width: '20px',
          height: '20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--zima-text-muted)',
        }"
        aria-label="Fechar alerta"
        @click="dismiss"
        @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.1)'"
        @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'transparent'"
      >
        <Icon name="i-lucide-x" style="width: 12px; height: 12px;" aria-hidden="true" />
      </button>
    </div>
  </Transition>
</template>
