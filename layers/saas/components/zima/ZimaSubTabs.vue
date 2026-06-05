<script setup lang="ts">
/**
 * ZimaSubTabs — Navegação por abas inline do Design System Zima Blue.
 * Substitui o padrão duplicado de border-bottom azul em 10+ telas.
 * Suporta contador opcional em cada aba.
 */

export interface ZimaSubTab {
  key: string
  label: string
  /** Contador opcional exibido como badge */
  count?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  tabs: ZimaSubTab[]
  modelValue: string
  /** Adiciona margem inferior padrão de seção */
  spaced?: boolean
}>(), {
  spaced: true,
})

const emit = defineEmits<{
  'update:modelValue': [key: string]
}>()

const select = (tab: ZimaSubTab) => {
  if (tab.disabled) return
  emit('update:modelValue', tab.key)
}
</script>

<template>
  <div
    class="overflow-x-auto hide-scrollbar"
    :style="{
      borderBottom: '1px solid var(--zima-border-divider)',
      marginBottom: spaced ? 'var(--zima-page-gap)' : '0',
    }"
    data-testid="zima-sub-tabs"
  >
    <div class="flex items-center" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex items-center gap-2 whitespace-nowrap focus-visible:outline-none"
        :style="{
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: modelValue === tab.key ? '500' : '400',
          background: 'none',
          border: 'none',
          cursor: tab.disabled ? 'not-allowed' : 'pointer',
          borderBottom: modelValue === tab.key
            ? '2px solid var(--zima-blue-core)'
            : '2px solid transparent',
          marginBottom: '-1px',
          color: modelValue === tab.key
            ? 'var(--zima-blue-core)'
            : tab.disabled
              ? 'var(--zima-text-disabled)'
              : 'var(--zima-text-muted)',
          transition: 'color 150ms ease, border-color 150ms ease',
          opacity: tab.disabled ? '0.5' : '1',
        }"
        :role="'tab'"
        :aria-selected="modelValue === tab.key"
        :aria-disabled="tab.disabled"
        :tabindex="modelValue === tab.key ? 0 : -1"
        @click="select(tab)"
        @mouseenter="(e: MouseEvent) => {
          if (modelValue !== tab.key && !tab.disabled)
            (e.currentTarget as HTMLElement).style.color = 'var(--zima-text-secondary)'
        }"
        @mouseleave="(e: MouseEvent) => {
          if (modelValue !== tab.key && !tab.disabled)
            (e.currentTarget as HTMLElement).style.color = 'var(--zima-text-muted)'
        }"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          class="inline-flex items-center justify-center rounded-full"
          :style="{
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            fontSize: '11px',
            fontWeight: '600',
            background: modelValue === tab.key
              ? 'var(--zima-blue-subtle)'
              : 'var(--zima-bg-surface-hover)',
            color: modelValue === tab.key
              ? 'var(--zima-blue-light)'
              : 'var(--zima-text-muted)',
          }"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>
  </div>
</template>
