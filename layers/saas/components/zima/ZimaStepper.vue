<script setup lang="ts">
/**
 * ZimaStepper — Indicador de progresso para wizards/multi-steps.
 * Apenas visual — não navegável por clique. O wizard controla o step ativo.
 */

export interface ZimaStep {
  key: string
  label: string
}

const props = defineProps<{
  steps: ZimaStep[]
  modelValue: string  // key do step atual
}>()

const currentIndex = computed(() =>
  props.steps.findIndex(s => s.key === props.modelValue)
)

const getStepState = (index: number) => {
  if (index < currentIndex.value) return 'done'
  if (index === currentIndex.value) return 'active'
  return 'upcoming'
}
</script>

<template>
  <div
    class="flex items-center"
    role="list"
    aria-label="Etapas do formulário"
    data-testid="zima-stepper"
  >
    <template v-for="(step, index) in steps" :key="step.key">
      <!-- Step item -->
      <div
        class="flex items-center gap-2 shrink-0"
        role="listitem"
        :aria-current="getStepState(index) === 'active' ? 'step' : undefined"
      >
        <!-- Circle -->
        <div
          class="flex items-center justify-center rounded-full shrink-0 transition-all"
          :style="{
            width: '28px',
            height: '28px',
            transitionDuration: 'var(--zima-duration-base)',
            ...(getStepState(index) === 'done' && {
              background: 'var(--zima-blue-core)',
              border: '1.5px solid var(--zima-blue-core)',
            }),
            ...(getStepState(index) === 'active' && {
              background: 'transparent',
              border: '2px solid var(--zima-blue-core)',
            }),
            ...(getStepState(index) === 'upcoming' && {
              background: 'transparent',
              border: '1.5px solid var(--zima-border-hover)',
            }),
          }"
        >
          <!-- Done: check icon -->
          <Icon
            v-if="getStepState(index) === 'done'"
            name="i-lucide-check"
            style="width: 14px; height: 14px; color: #fff;"
            aria-hidden="true"
          />
          <!-- Active: number -->
          <span
            v-else
            class="text-xs font-semibold"
            :style="{
              color: getStepState(index) === 'active'
                ? 'var(--zima-blue-core)'
                : 'var(--zima-text-muted)',
            }"
          >
            {{ index + 1 }}
          </span>
        </div>

        <!-- Label -->
        <span
          class="text-xs font-medium whitespace-nowrap"
          :style="{
            color: getStepState(index) === 'active'
              ? 'var(--zima-text-primary)'
              : getStepState(index) === 'done'
                ? 'var(--zima-text-secondary)'
                : 'var(--zima-text-muted)',
          }"
        >
          {{ step.label }}
        </span>
      </div>

      <!-- Connector line (entre steps) -->
      <div
        v-if="index < steps.length - 1"
        class="flex-1 mx-3 transition-colors"
        :style="{
          height: '1px',
          minWidth: '24px',
          transitionDuration: 'var(--zima-duration-slow)',
          background: index < currentIndex
            ? 'var(--zima-blue-core)'
            : 'var(--zima-border-hover)',
        }"
        aria-hidden="true"
      />
    </template>
  </div>
</template>
